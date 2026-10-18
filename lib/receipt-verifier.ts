/**
 * AI Receipt Verifier with Resilient Multi-Key & Waterfall Model Pool.
 * Pool: Gemini 3.8 -> 3.7 -> 3.6 -> 3.5 -> 3.1 Flash Lite (500 RPD) x 2 API Keys.
 * Mendukung parsing angka rupiah, validasi toleransi nominal, dan anti-fraud.
 */

const FALLBACK_MODELS = [
  "gemini-3.8-flash",
  "gemini-3.7-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-3.1-flash-lite",
  "gemini-3.5-flash-lite",
];

export interface ReceiptVerifyParams {
  imageBase64: string;
  mimeType: string;
  expectedAmount: number;
  expectedBaseAmount?: number;
}

export interface ReceiptVerifyResult {
  valid: boolean;
  amount?: number;
  transactionId?: string;
  recipient?: string;
  modelUsed?: string;
  error?: string;
}

function getApiKeys(): string[] {
  return [process.env.GEMINI_API_KEY, process.env.GEMINI_API_KEY_2]
    .map((k) => k?.trim())
    .filter((k): k is string => Boolean(k && k.length > 10));
}

export async function verifyReceiptWithAI(params: ReceiptVerifyParams): Promise<ReceiptVerifyResult> {
  const keys = getApiKeys();
  if (keys.length === 0) {
    return { valid: false, error: "Kredensial Gemini API belum dikonfigurasi di server." };
  }

  const prompt = `Ekstrak data bukti transaksi pembayaran (struk transfer bank, e-wallet, atau QRIS) dari gambar ini ke format JSON.

PANDUAN PEMBACAAN:
1. Nominal (amount):
   - Ambil angka total pembayaran atau nominal transfer bersih yang ditujukan ke penerima.
   - Format Indonesia: titik (.) adalah pemisah ribuan (contoh: 25.143 dibaca 25143, 100 dibaca 100). Koma (,) adalah desimal sen, abaikan digit di belakang koma.
   - PENTING: Jangan tertukar dengan nomor rekening, nomor ponsel tujuan (misal 0812... / 3901...), nomor referensi transaksi, biaya admin, atau sisa saldo pengirim.
2. Status (isSuccess):
   - Bernilai true HANYA jika status tertulis "Berhasil", "Sukses", "Selesai", atau ada ikon centang hijau berhasil.
   - Bernilai false jika transaksi bertuliskan "Menunggu", "Pending", "Dalam Proses", "Kedaluwarsa", atau "Gagal".
3. Nomor Transaksi (transactionId):
   - Ambil string ID Transaksi, No. Referensi, Ref ID, atau Order ID jika tertera. Jika tidak ada, isi string kosong "".
4. Penerima (recipient):
   - Ambil nama pemilik rekening atau merchant tujuan yang tertera (contoh: "Dhani", "TokoAI").
5. Validitas Dokumen:
   - Jika gambar bukan bukti transfer atau teks tidak terbaca/buram, set amount: 0 dan isSuccess: false.

Format JSON:
{
  "amount": 25143,
  "transactionId": "DN2026101899123",
  "isSuccess": true,
  "recipient": "Dhani"
}
Kembalikan HANYA objek JSON tanpa pembungkus markdown dan tanpa teks pembuka/penutup.`;

  const cleanBase64 = params.imageBase64.replace(/^data:[^;]+;base64,/, "").trim();
  const mime = params.mimeType || "image/jpeg";
  const payload = JSON.stringify({
    contents: [
      {
        parts: [
          { inlineData: { mimeType: mime, data: cleanBase64 } },
          { text: prompt },
        ],
      },
    ],
    generationConfig: { responseMimeType: "application/json", temperature: 0.1 },
  });

  let lastStatus = 0;
  let lastErrorText = "";

  for (const model of FALLBACK_MODELS) {
    for (const key of keys) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
        });

        lastStatus = res.status;
        if (!res.ok) {
          lastErrorText = await res.text().catch(() => "");
          if (res.status === 429 || res.status === 503) {
            await new Promise((r) => setTimeout(r, 350));
            continue;
          }
          continue;
        }

        const data = await res.json();
        const rawJson = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawJson) continue;

        const parsed = JSON.parse(rawJson);
        const extractedAmount = Number(parsed.amount);

        if (!parsed.isSuccess) {
          return { valid: false, error: "Status transaksi pada bukti belum berhasil/selesai." };
        }

        if (isNaN(extractedAmount) || extractedAmount <= 0) {
          return { valid: false, error: "Nominal pembayaran tidak terbaca dengan jelas pada bukti transfer." };
        }

        // Cek penerima jika terdeteksi (nama QRIS resmi = 'Dhani')
        const rec = String(parsed.recipient || "").toLowerCase();
        if (rec && !rec.includes("dhani") && !rec.includes("tokoai") && !rec.includes("qris") && !rec.includes("dana")) {
          return {
            valid: false,
            amount: extractedAmount,
            recipient: parsed.recipient,
            error: `Penerima pada bukti transfer (${parsed.recipient}) tidak cocok dengan merchant resmi (Dhani).`,
          };
        }

        // Validasi nominal cerdas: cocok dengan tagihan unik ATAU harga dasar paket
        const baseAmount = params.expectedBaseAmount || params.expectedAmount;
        const matchesExact = extractedAmount === params.expectedAmount;
        const matchesBase = extractedAmount === baseAmount;
        const withinTolerance = extractedAmount >= baseAmount && extractedAmount <= params.expectedAmount + 50;

        if (!matchesExact && !matchesBase && !withinTolerance) {
          if (extractedAmount < baseAmount) {
            return {
              valid: false,
              amount: extractedAmount,
              error: `Nominal pada struk (Rp ${extractedAmount.toLocaleString("id-ID")}) kurang dari harga paket (Rp ${baseAmount.toLocaleString("id-ID")}).`,
            };
          }
          return {
            valid: false,
            amount: extractedAmount,
            error: `Nominal pada struk (Rp ${extractedAmount.toLocaleString("id-ID")}) tidak cocok dengan tagihan (Rp ${params.expectedAmount.toLocaleString("id-ID")}).`,
          };
        }

        return {
          valid: true,
          amount: extractedAmount,
          transactionId: parsed.transactionId || "",
          recipient: parsed.recipient || "",
          modelUsed: model,
        };
      } catch {
        continue;
      }
    }
  }

  if (lastStatus === 429 || lastStatus === 503) {
    return {
      valid: false,
      error: "Antrean verifikasi AI sedang padat. Coba klik tombol verifikasi sekali lagi atau gunakan tombol 'Saya sudah bayar'.",
    };
  }

  return { valid: false, error: `Gagal menganalisis bukti transfer (${lastErrorText.slice(0, 80) || "Upstream Error"}).` };
}
