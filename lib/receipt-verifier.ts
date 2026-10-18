/**
 * AI Receipt Verifier with Resilient Multi-Key & Waterfall Model Pool.
 * Pool: Gemini 3.8 -> 3.7 -> 3.6 -> 3.5 -> 3.1 Flash Lite (500 RPD) x 2 API Keys.
 * Menjamin ketersediaan tinggi saat banyak user checkout bersamaan.
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

  const prompt = `Anda adalah sistem audit keuangan cerdas (OCR Receipt Validator).
Tugas Anda adalah memverifikasi bukti struk transfer/pembayaran QRIS atau e-wallet (DANA, BCA, GoPay, OVO, dll).
Ekstrak data transaksi dengan teliti dalam format JSON murni:
{
  "amount": <angka bulat integer total nominal rupiah yang ditransfer/dibayar, tanpa titik atau Rp, contoh 25143>,
  "transactionId": "<nomor referensi / ID transaksi / No. Transaksi jika tertera>",
  "isSuccess": <boolean true jika status transaksi sukses/berhasil/selesai, false jika gagal/pending>,
  "recipient": "<nama penerima atau nama toko penerima jika ada>"
}
Jawab HANYA objek JSON tersebut tanpa pembungkus markdown dan tanpa komentar tambahan.`;

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

  // Waterfall: loop through model hierarchy and dual keys pool
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
          // Jika terkena limit (429/503), lanjut ke key berikutnya atau model berikutnya
          if (res.status === 429 || res.status === 503) {
            await new Promise((r) => setTimeout(r, 400));
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
          modelUsed: model,
        };
      } catch {
        continue;
      }
    }
  }

  // Jika seluruh pool model & keys limit karena lonjakan bersamaan
  if (lastStatus === 429 || lastStatus === 503) {
    return {
      valid: false,
      error: "Antrean verifikasi AI sedang padat (lonjakan request bersamaan). Coba klik tombol unggah sekali lagi, atau gunakan tombol 'Saya sudah bayar'.",
    };
  }

  return { valid: false, error: `Gagal menganalisis bukti transfer (${lastErrorText.slice(0, 80) || "Upstream Error"}).` };
}
