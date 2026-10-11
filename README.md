# KiosAI ⚡

> **Gateway API & Pasar Token AI Lokal** — Beli kuota model AI via QRIS, dapatkan API key OpenAI-compatible, dan gunakan di Cursor, Cline, Claude Code, Python, atau REST API.

---

## 🌟 Fitur Utama

- **OpenAI-Compatible Proxy (`/v1/chat/completions`)**: Mendukung streaming (SSE) dan JSON completion. Kompatibel dengan semua official OpenAI SDKs.
- **Dynamic Model Discovery (`/v1/models`)**: Sinkronisasi otomatis dengan upstream 9Router dan anotasi tier akses model.
- **TiDB Cloud Serverless**: Database MySQL-compatible berbasis HTTP fetch via `@tidbcloud/serverless`. Skalabel tanpa limit koneksi pool di serverless/Vercel.
- **Model Gating Per Tier**: Pembatasan model otomatis berdasarkan level paket (Bronze untuk model cepat/gratis, Silver untuk GPT/Sonnet, Gold untuk seluruh model).
- **Model Multiplier Pricing**: Pembobotan pemotongan token sesuai kompleksitas model (1.0x Bronze/Flash, 2.0x Silver/Sonnet, 4.0x Gold/Opus).
- **Low-Balance Alert**: Header otomatis `X-Quota-Warning: low_balance` dan peringatan di UI jika saldo < 20.000 token.
- **Riwayat Transaksi & Invoice**: Endpoint `GET /api/orders` dan tabel riwayat order QRIS di antarmuka web.
- **Manajemen API Key Aman**: Kunci format `kios-<hash32>` di-hash dengan SHA-256. Mendukung pembatasan model dan rate limiting per kunci.
- **Rate Limiting Engine**: Menggunakan algoritma sliding-window per menit, mengembalikan header standar `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`.
- **Autentikasi Pengguna**: Registrasi & login mandiri dengan keamanan `scrypt` hashing dan bonus uji coba 100.000 token otomatis.
- **Payment Webhook & Idempotensi**: Menerima callback QRIS/VA dari payment gateway dengan pencegahan double-spending secara otomatis.
- **Statistik & Log Penggunaan**: Visualisasi riwayat pemakaian token, total request, rata-rata latensi, dan breakdown per model AI.
- **Pemotongan Saldo Otomatis**: Setiap request AI otomatis memotong saldo token pengguna di database TiDB secara real-time.
- **Top-Up Token (QRIS)**: Sistem paket token (Bronze, Silver, Gold) dengan simulasi pembayaran instan.
- **Live AI Playground**: Antarmuka dashboard untuk menguji endpoint dan streaming model AI secara langsung.
- **Billing Total**: Token ditagih dari `usage` upstream (prompt + completion) x multiplier, baik stream maupun non-stream. Overhead prompt upstream ikut ditagih (lihat PRD §9).

---

## 🏗️ Arsitektur Sistem

```
[Client / SDK / Cursor / Python]
             │
             │ Authorization: Bearer kios-xxxx
             ▼
[KiosAI Gateway (Next.js 15)]
  ├── 1. Validasi API Key (SHA-256)
  ├── 2. Cek Rate Limit & Quota (TiDB Serverless)
  ├── 3. Validasi Hak Akses Model Tier
  ├── 4. Forward Request ke Upstream
             ▼
[9Router Engine (localhost:20128 / Cloudflare Tunnel)]
  ├── Auto-fallback & Combo routing
  └── Provider upstream (Codex, Qoder, Kilo, Claude, Gemini)
             │
             ▼
[AI Response Stream] ──> [Potong Saldo TiDB via Multiplier] ──> [Client]
```

---

## 🚀 Panduan Memulai

### 1. Prasyarat
- Node.js 18+ (disarankan Node.js 22)
- 9Router aktif (`http://127.0.0.1:20128`)
- Database TiDB Cloud Serverless

### 2. Konfigurasi Lingkungan (`.env`)
Salin atau buat file `.env`:

```env
DATABASE_URL=mysql://<user>:<password>@<host>:4000/kiosai
TIDB_HOST=<host>
TIDB_PORT=4000
TIDB_USER=<user>
TIDB_PASSWORD=<password>
TIDB_DATABASE=kiosai

NINEROUTER_URL=http://127.0.0.1:20128
NINEROUTER_API_KEY=sk-...
```

### 3. Migrasi Database
Jalankan migrasi skema tabel ke TiDB:
```bash
npm run migrate
```

### 4. Menjalankan Server
```bash
npm run dev
```
Buka dashboard di [http://localhost:3000](http://localhost:3000).

---

## 💻 Integrasi SDK

### cURL
```bash
curl http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer kios-your-api-key" \
  -d '{
    "model": "tokenharbor/deepseek-v4.1-flash:free",
    "messages": [{"role": "user", "content": "Halo KiosAI"}],
    "stream": true
  }'
```

### Python
```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:3000/v1",
    api_key="kios-your-api-key"
)

response = client.chat.completions.create(
    model="tokenharbor/deepseek-v4.1-flash:free",
    messages=[{"role": "user", "content": "Halo KiosAI!"}]
)
print(response.choices[0].message.content)
```

---

## 📦 Paket Token & Pembobotan Model

| Paket | Harga | Jumlah Token | Rate Limit | Akses Model & Multiplier |
|---|---|---|---|---|
| **Bronze Starter** | Rp 50.000 | 1.000.000 Token | 60 req/min | Model Standard (Gemini Flash, DeepSeek Flash) — **1.0x** |
| **Silver Pro** | Rp 150.000 | 3.500.000 Token | 300 req/min | Termasuk GPT-4o, GPT-5, Claude Sonnet 4.5 — **2.0x** |
| **Gold Enterprise** | Rp 400.000 | 10.000.000 Token | 1.000 req/min | Seluruh Model AI, Opus & Custom Combos — **4.0x** |

---

## 🌐 Deploy ke Vercel

1. Buka [Vercel Dashboard](https://vercel.com) dan impor repository `Dhani078/KiosAI`.
2. Masukkan Environment Variables di Vercel:
   - `DATABASE_URL`: Connection string TiDB Cloud Serverless
   - `NINEROUTER_URL`: Cloudflare Tunnel URL 9Router Anda (misal `https://xxx.trycloudflare.com`)
   - `NINEROUTER_API_KEY`: Key 9Router Anda
3. Klik **Deploy**. KiosAI akan otomatis berjalan di region Tokyo (`hnd1`).

---

## 📄 Lisensi
MIT License. Dikembangkan oleh [Dhani078](https://github.com/Dhani078).
