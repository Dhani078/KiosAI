# KiosAI ⚡

> **Gateway API & Pasar Token AI Lokal** — Beli kuota model AI via QRIS, dapatkan API key OpenAI-compatible, dan gunakan di Cursor, Cline, Claude Code, Python, atau REST API.

---

## 🌟 Fitur Utama

- **OpenAI-Compatible Proxy (`/v1/chat/completions`)**: Mendukung streaming (SSE) dan JSON completion. Kompatibel dengan semua official OpenAI SDKs.
- **TiDB Cloud Serverless**: Database MySQL-compatible berbasis HTTP fetch via `@tidbcloud/serverless`. Skalabel tanpa limit koneksi pool di serverless/Vercel.
- **Manajemen API Key Aman**: Kunci format `kios-<hash32>` di-hash dengan SHA-256. Mendukung pembatasan model dan rate limiting per kunci.
- **Pemotongan Saldo Otomatis**: Setiap request AI otomatis memotong saldo token pengguna di database TiDB secara real-time.
- **Top-Up Token (QRIS)**: Sistem paket token (Bronze, Silver, Gold) dengan simulasi pembayaran instan.
- **Live AI Playground**: Antarmuka dashboard untuk menguji endpoint dan streaming model AI secara langsung.

---

## 🏗️ Arsitektur Sistem

```
[Client / SDK / Cursor / Python]
             │
             │ Authorization: Bearer kios-xxxx
             ▼
[KiosAI Gateway (Next.js 15)]
  ├── 1. Validasi API Key (SHA-256)
  ├── 2. Cek Saldo & Izin Model (TiDB Serverless)
  ├── 3. Forward Request ke Upstream
             ▼
[9Router Engine (localhost:20128 / Cloudflare Tunnel)]
  ├── Auto-fallback & Combo routing
  └── Provider upstream (Codex, Qoder, Kilo, Claude, Gemini)
             │
             ▼
[AI Response Stream] ──> [Potong Saldo TiDB] ──> [Client]
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
    "model": "ag/gemini-3.8-flash-high",
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
    model="ag/gemini-3.8-flash-high",
    messages=[{"role": "user", "content": "Halo KiosAI!"}]
)
print(response.choices[0].message.content)
```

---

## 📦 Paket Token

| Paket | Harga | Jumlah Token | Rate Limit |
|---|---|---|---|
| **Bronze Starter** | Rp 50.000 | 1.000.000 Token | 60 req/min |
| **Silver Pro** | Rp 150.000 | 3.500.000 Token | 300 req/min |
| **Gold Enterprise** | Rp 400.000 | 10.000.000 Token | 1.000 req/min |

---

## 📄 Lisensi
MIT License. Dikembangkan oleh [Dhani078](https://github.com/Dhani078).
