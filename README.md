# TokoAI ⚡

[![CI](https://github.com/Dhani078/KiosAI/actions/workflows/ci.yml/badge.svg)](https://github.com/Dhani078/KiosAI/actions)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![React](https://img.shields.io/badge/React-19-blue)
![TiDB](https://img.shields.io/badge/TiDB-Serverless-orange)

> **Gateway API & Pasar Token AI Lokal** — Beli kuota model AI via QRIS, dapatkan API key OpenAI-compatible, dan gunakan di Cursor, Cline, Claude Code, Python, atau REST API.

---

## 🌟 Fitur Utama

- **Domain Resmi Kustom (`https://tokoai.my.id`)**: Live di edge Cloudflare dengan sertifikat SSL otomatis dan perutean instan.
- **OpenAI-Compatible Proxy (`/v1/chat/completions`)**: Mendukung streaming (SSE) dan JSON completion. Kompatibel dengan semua official OpenAI SDKs.
- **Dynamic Model Discovery (`/v1/models`)**: Sinkronisasi otomatis dengan upstream 9Router dan anotasi tier akses untuk 71 model terverifikasi (5 Free Tier termasuk OpenCode & Atria, 66 Pro Tier).
- **TiDB Cloud Serverless**: Database MySQL-compatible berbasis HTTP fetch via `@tidbcloud/serverless`. Skalabel tanpa limit koneksi pool di serverless/Worker.
- **Model Gating 2 Tier**: Dua tier — `free` (Atria Dawn + keluarga OpenCode) dan `pro` (seluruh model AI termasuk Google Gemini, DeepSeek Flash, Claude, GPT). Model Pro ditolak HTTP 403 `tier_restricted` untuk akun Free.
- **Tarif Token Transparan ($/1M)**: Tidak ada multiplier tersembunyi. Kartu model menampilkan tarif `Input / Output ($ / 1M tokens)` apa adanya; rasio pemotongan saldo diturunkan dari angka yang sama via `getCostRatio()` di `lib/model-pricing.ts` (baseline DeepSeek Flash = 1.0).
- **Low-Balance Alert & Webhook**: Peringatan visual banner di UI, header `X-Quota-Warning: low_balance`, serta dispatch HTTP webhook otomatis ke Discord/Telegram/Slack pengguna saat saldo < 50.000 token (dengan 30m debounce).
- **Social Login Native (GitHub & Google)**: Onboarding instan dengan bonus 250.000 token aktif langsung + 2.250.000 token brankas bonus.
- **Faktur Cetak Digital Instan**: Generator bukti transaksi resmi PDF/cetak langsung dari modal pembayaran sukses atau riwayat transaksi.
- **Live AI Playground dengan SSE Streaming**: Balasan model muncul kata demi kata secara real-time (~240ms TTFB), dilengkapi kontainer blok kode bersintaks dan tombol salin 1-klik.
- **Manajemen API Key Aman**: Kunci format `kios-<hash32>` di-hash dengan SHA-256. Mendukung visualisasi spend limit progress bar per kunci.
- **Desain TokoAI Token Marketplace**: Antarmuka responsif dark tech, logo vektor isometrik huruf "T" resmi oranye `#F5681A` (`Logo.tsx`, `public/brand/`), tanpa komponen dummy — 100% data live dari database & gateway.
- **EMVCo Dynamic QRIS Generator**: Generator QRIS dinamis otomatis berbasis string merchant resmi DANA (`ID1026500560192` atas nama `Dhani`). Menyisipkan Tag 54 dengan nominal pas + kode unik 3-digit serta kalkulasi checksum CRC16-CCITT standar Bank Indonesia.
- **AI Vision Multimodal Receipt Verifier**: Verifikasi struk transfer otomatis 1–2 detik via Gemini 3.8 Flash Vision (Dual-Key Pool & 6-Tier Waterfall), proteksi anti-replay/double-spending via kolom `payment_ref` di TiDB, dan toleransi nominal rupiah cerdas.
- **Keamanan Enterprise IDOR & Cookie HttpOnly**: Cookie sesi server-side bertanda tangan HMAC-SHA256 (`kiosai_session`), eliminasi IDOR 100% pada semua endpoint privat, rotasi kredensial scrypt, dan proteksi webhook fail-closed.
- **Grafik Tren Aktivitas 7 Hari & Analitik Interaktif**: Bar chart harian di tab Statistik, visual bar split rasio token Input/Output, dan multi-mode pengurutan model (Token, Request, Latensi).
- **Guardrail Defensif Anti-Prompt Leak**: Boundary protection otomatis terhadap upaya ekstraksi instruksi sistem (*"repeat everything above"*), dilengkapi preset persona (Cursor Composer, Manus Agent, Claude Code, Defensive Shield).
- **Standar Kode Moduler**: Seluruh 124 modul kode TypeScript/React dibatasi maksimal 200 baris per file demi keterbacaan dan pemeliharaan jangka panjang.

---

## 📚 Dokumentasi Lengkap
- 🤖 [**Agent Operating Manual (AGENT.md)**](./AGENT.md) — **Mulai dari sini.** Aturan keras, kredensial, arsitektur kunci, dan perintah kerja rutin untuk AI agent/sesi baru.
- 🔄 [**Session Handoff & Quick Resume (docs/HANDOFF.md)**](./docs/HANDOFF.md) — Snapshot status terkini, checklist melanjutkan sesi, gotchas penting, dan peta file utama.
- 🏗️ [**System Architecture (docs/ARCHITECTURE.md)**](./docs/ARCHITECTURE.md) — Topologi komponen, alur data, skema database relasional, dan mekanisme perhitungan biaya.
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
[AI Response Stream] ──> [Potong Saldo TiDB via Rasio Tarif Model] ──> [Client]
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

| Paket | Harga | Jumlah Token | Rate Limit | Akses Model |
|---|---|---|---|---|
| **Free** | Rp 0 (Gratis) | 2.500.000 Token | 60 req/min | Bonus akun baru — hanya Atria Dawn |
| **Pro 25K** | Rp 25.000 | 100.000.000 Token | 120 req/min | Seluruh model AI (Claude, GPT, Gemini, Grok) |
| **Pro 100K** | Rp 100.000 | 600.000.000 Token | 300 req/min | Seluruh model AI termasuk flagship |
| **Pro 150K** | Rp 150.000 | 1.000.000.000 Token | 1.000 req/min | Seluruh model AI & combo flagship |

> **Catatan tarif**: tidak ada pengali `1.0x / 2.0x / 4.0x`. Setiap model menampilkan tarif **Input / Output ($ / 1M tokens)** di kartu model. Pemakaian nyata request dikonversi ke tarif tersebut (baseline DeepSeek Flash = 1.0), jadi model murah hemat saldo dan model flagship memakai lebih banyak.

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
