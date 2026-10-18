/**
 * AI Receipt Verifier (Multimodal OCR Engine).
 * Memeriksa bukti transfer/struk pembayaran QRIS secara otomatis
 * menggunakan Gemini 3.8 Flash Vision dengan output JSON terstruktur.
 */

export interface ReceiptVerifyParams {
  imageBase64: string;
  mimeType: string;
  expectedAmount: number;
}

export interface ReceiptVerifyResult {
  valid: boolean;
  amount?: number;
  transactionId?: string;
  recipient?: string;
  error?: string;
}

export async function verifyReceiptWithAI(params: ReceiptVerifyParams): Promise<ReceiptVerifyResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { valid: false, error: "GEMINI_API_KEY belum dikonfigurasi di server." };
  }

  const prompt = `Anda adalah sistem audit keuangan cerdas (OCR Receipt Validator).
Tugas Anda adalah memverifikasi bukti struk transfer/pembayaran QRIS atau e-wallet (DANA, BCA, GoPay, OVO, dll).
Ekstrak data transaksi dengan teliti dalam format JSON murni:
{
  "amount": <angka bulat integer total nominal rupiah yang ditransfer/dibayar, tanpa titik atau Rp, contoh 25143>,
  "transactionId": "<nomor referensi / ID transaksi / No. Transaksi jika tertera>",
  "isSuccess": <boolean true jika status transaksi sukses/berhasil/selesai, false jika gagal/pending>,
  "recipient": "<nama penerima atau nama toko penerima jika ada>",
  "rawTextSnippet": "<potongan teks penting seperti waktu dan nominal>"
}
Jawab HANYA objek JSON tersebut tanpa pembungkus markdown dan tanpa komentar tambahan.`;

  try {
    const cleanBase64 = params.imageBase64.replace(/^data:[^;]+;base64,/, "").trim();
    const mime = params.mimeType || "image/jpeg";

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`;

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { inlineData: { mimeType: mime, data: cleanBase64 } },
              { text: prompt },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.1,
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return { valid: false, error: `Gagal memproses gambar ke AI Vision (HTTP ${res.status}): ${errText.slice(0, 100)}` };
    }

    const data = await res.json();
    const rawJson = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawJson) {
      return { valid: false, error: "AI tidak dapat membaca data teks pada gambar." };
    }

    const parsed = JSON.parse(rawJson);
    const extractedAmount = Number(parsed.amount);

    if (!parsed.isSuccess) {
      return { valid: false, error: "Status transaksi pada bukti belum berhasil/selesai." };
    }

    if (isNaN(extractedAmount) || extractedAmount <= 0) {
      return { valid: false, error: "Nominal pembayaran tidak terbaca dengan jelas pada bukti transfer." };
    }

    if (extractedAmount !== params.expectedAmount) {
      return {
        valid: false,
        amount: extractedAmount,
        error: `Nominal pada struk (Rp ${extractedAmount.toLocaleString("id-ID")}) tidak cocok dengan tagihan (Rp ${params.expectedAmount.toLocaleString("id-ID")}). Pastikan transfer tepat sampai digit kode unik.`,
      };
    }

    return {
      valid: true,
      amount: extractedAmount,
      transactionId: parsed.transactionId || "",
      recipient: parsed.recipient || "",
    };
  } catch (err: any) {
    return { valid: false, error: `Gagal menganalisis bukti: ${err.message}` };
  }
}
