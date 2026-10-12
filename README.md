# KiosAI ⚡

[![CI](https://github.com/Dhani078/KiosAI/actions/workflows/ci.yml/badge.svg)](https://github.com/Dhani078/KiosAI/actions)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![React](https://img.shields.io/badge/React-19-blue)
![TiDB](https://img.shields.io/badge/TiDB-Serverless-orange)

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
- **Gerbang Dashboard (`/dashboard`)**: Halaman dashboard dilindungi `AuthGuard` — pengguna anonim otomatis diarahkan ke landing page dan diminta login. Login mendukung email (user biasa) maupun username (admin).
- **Payment Webhook & Idempotensi**: Menerima callback QRIS/VA dari payment gateway dengan pencegahan double-spending secara otomatis.
- **Statistik & Log Penggunaan**: Visualisasi riwayat pemakaian token, total request, rata-rata latensi, dan breakdown per model AI.
- **Pemotongan Saldo Otomatis**: Setiap request AI otomatis memotong saldo token pengguna di database TiDB secara real-time.
- **Top-Up Token (QRIS)**: Sistem paket token (Bronze, Silver, Gold) dengan simulasi pembayaran instan.
- **Live AI Playground**: Antarmuka dashboard untuk menguji endpoint dan streaming model AI secara langsung.
- **Billing Total**: Token ditagih dari `usage` upstream (prompt + completion) x multiplier, baik stream maupun non-stream. Overhead prompt upstream ikut ditagih (lihat PRD §9).
- **Desain KiosAI Token Marketplace**: Antarmuka responsif (Desktop Sidebar + Mobile Bottom Nav), tema oranye hangat (`#F28C38`), tanpa komponen dummy — 100% data live dari TiDB & gateway.
- **Katalog Model Publik**: Halaman muka menampilkan showcase model AI unggulan (DeepSeek, Claude, GPT, Gemini, Llama) dengan informasi tier akses, multiplier, context window, dan filter provider interaktif.
- **Standar Kode Moduler**: Seluruh modul kode TypeScript/React dibatasi maksimal 200 baris per file demi keterbacaan dan pemeliharaan jangka panjang.

---

## 📚 Dokumentasi Lengkap
- 🤖 [**Agent Operating Manual (AGENT.md)**](./AGENT.md) — **Mulai dari sini.** Aturan keras, kredensial, arsitektur kunci, dan perintah kerja rutin untuk AI agent/sesi baru.
- 🔄 [**Session Handoff & Quick Resume (docs/HANDOFF.md)**](./docs/HANDOFF.md) — Snapshot status terkini, checklist melanjutkan sesi, gotchas penting, dan peta file utama.
- 🏗️ [**System Architecture (docs/ARCHITECTURE.md)**](./docs/ARCHITECTURE.md) — Topologi komponen, alur data, skema database relasional, dan mekanisme multiplier.
- 📖 [**API Reference (API.md)**](./API.md) — Spesifikasi lengkap seluruh endpoint REST, OpenAI Proxy, status codes, dan format error.
- 🚀 [**Deployment Guide (DEPLOYMENT.md)**](./DEPLOYMENT.md) — Panduan deploy produksi Cloudflare Workers + Cloudflare Tunnel ke 9Router + TiDB.
- 🛡️ [**Security Architecture (SECURITY.md)**](./SECURITY.md) — Standar enkripsi API key SHA-256, scrypt password hashing, sliding-window rate limit, dan mitigasi risiko.
- 📋 [**Product Requirements Document (PRD.md)**](./PRD.md) — Spesifikasi teknis, arsitektur database, dan aturan engineering KiosAI.
- 🔧 [**Troubleshooting Worker (docs/TROUBLESHOOTING-WORKER.md)**](./docs/TROUBLESHOOTING-WORKER.md) — Diagnosis env Worker kosong, error 1003, dan sinkronisasi tunnel 9Router.
- 📊 [**Project State Log (STATE.md)**](./STATE.md) — Catatan riwayat implementasi, pengujian, dan status siklus pengembangan.
- 🗓️ [**Changelog (CHANGELOG.md)**](./CHANGELOG.md) — Riwayat perubahan terperinci per commit (apa ditambah, diperbaiki, diubah).
- ✅ [**Task Checklist (tasks/todo.md)**](./tasks/todo.md) & [**Implementation Plan (tasks/plan.md)**](./tasks/plan.md) — Progres 18 fase pengembangan.

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
Buka dashboard di [http://localhost:3000/dashboard](http://localhost:3000/dashboard).
Landing page publik di [http://localhost:3000](http://localhost:3000).

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
| **Free Bansos** | Rp 0 (Gratis) | 2.500.000 Token | 60 req/min | Bonus Akun Baru (Atria-Dawn-Preview Bansos, DeepSeek) — **1.0x** |
| **Starter** | Rp 5.000 | 15.000.000 Token | 60 req/min | Model Standard (Gemini Flash, DeepSeek Flash) — **1.0x** |
| **Bronze** | Rp 25.000 | 100.000.000 Token | 60 req/min | Model Standard (Gemini Flash, DeepSeek Flash) — **1.0x** |
| **Silver** | Rp 100.000 | 600.000.000 Token | 300 req/min | Termasuk GPT-4o, GPT-5, Claude Sonnet 4.5 — **2.0x** |
| **Gold** | Rp 150.000 | 1.000.000.000 Token | 1.000 req/min | Seluruh Model AI, Opus & Custom Combos — **4.0x** |

---

## 🌐 Deploy ke Cloudflare Workers

KiosAI dideploy sebagai Cloudflare Worker (`kiosai.dhanisepeda.workers.dev`), bukan Vercel.

### 1. Secret Worker (wajib)

Worker **tidak** membaca `.env`. Kalau secret kosong, login akan gagal dengan
`DATABASE_URL environment variable is not defined`.

```bash
npm run secrets:sync     # dorong DATABASE_URL, NINEROUTER_URL, NINEROUTER_API_KEY_2
npx wrangler secret list --name kiosai   # verifikasi
```

### 2. Tunnel ke 9Router (wajib)

Worker berjalan di edge Cloudflare, jadi `http://127.0.0.1:20128` tidak bisa dijangkau
(Cloudflare balas **error 1003**). Jalankan:

```bash
npm run tunnel           # start cloudflared + set NINEROUTER_URL di Worker otomatis
```

> Quick tunnel berganti URL setiap restart — jalankan `npm run tunnel` lagi setelah reboot.
> Untuk URL permanen pakai Named Tunnel + domain sendiri (lihat `DEPLOYMENT.md`).

### 3. Deploy

```bash
npm run build
npx wrangler deploy --name kiosai
```

### 4. Verifikasi

```bash
npm run verify           # env, TiDB, 9Router, batas baris, secret Worker
curl https://kiosai.dhanisepeda.workers.dev/api/health
```

Panduan lengkap + troubleshooting: [**DEPLOYMENT.md**](./DEPLOYMENT.md)

---

## 📄 Lisensi
MIT License. Dikembangkan oleh [Dhani078](https://github.com/Dhani078).
