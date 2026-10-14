# PRD & Technical Spec: KiosAI

## 1. Executive Summary
- **Problem**: Pengembang Indonesia kesulitan beli kuota model AI global (Claude, GPT, Gemini) akibat kendala kartu kredit internasional dan rate-limit rumit.
- **Solusi**: KiosAI — Gateway API & Pasar Token AI lokal. Beli token via QRIS/VA, dapat API key standar OpenAI, langsung pakai.
- **Target**: Indie dev, startup, mahasiswa AI.
- **Revenue**: Margin 20-30% per tier token.

## 2. Tech Stack & Environment
- **Framework**: Next.js 15 (App Router, React 19, TypeScript)
- **Styling**: Tailwind CSS, shadcn/ui style components
- **Database**: TiDB Serverless (MySQL-compatible, region Tokyo/Singapore, driver `@tidbcloud/serverless`)
- **Upstream Router**: 9Router (`http://127.0.0.1:20128` dev, Cloudflare Tunnel prod)
- **Deployment**: Cloudflare Workers (`kiosai.dhanisepeda.workers.dev`, OpenNext adapter) + Cloudflare Tunnel ke 9Router
- **Repository**: `https://github.com/Dhani078/KiosAI`

## 3. Capability Map & Modules

| Module ID | Tanggung Jawab | Status |
|---|---|---|
| `core-db` | Schema DDL, HTTP connection pool TiDB, seed data | Selesai |
| `auth` | Registrasi user (`/api/auth/register`), login (`/api/auth/login`), trial token | Selesai |
| `key-mgmt` | Generate key (`kios-xxxx`), SHA256 hash, validasi izin model & tier | Selesai |
| `proxy-engine` | Endpoint `/v1/chat/completions`, SSE streaming, rate limiting, tier gating 2 tier, rasio tarif $/1M, low-balance alert | Selesai |
| `catalog-sync` | Dynamic model discovery `/v1/models` sinkron dengan upstream 9Router dan anotasi tier | Selesai |
| `analytics` | Agregasi metrik penggunaan per model, latensi, dan log request (`/api/analytics`) | Selesai |
| `billing` | Paket token 2 Tier (Free & Pro 25K/100K/150K), order flow, order history (`/api/orders`), webhook pembayaran & idempotensi | Selesai |
| `dashboard-ui` | UI toko, panel saldo, generator key, analytics charts, dynamic model picker, riwayat order, live playground | Selesai |
| `landing` | Landing page publik (`/`) dengan hero, fitur, katalog model, pricing, code sandbox, FAQ | Selesai |
| `admin-auth` | Admin login via username, user biasa via email, seed script | Selesai |
| `models-tab` | Tab eksplorasi model AI di dashboard dan menu sidebar | Selesai |
| `session-key` | HMAC playground session key untuk pemotongan saldo real di web | Selesai |

## 4. Database Schema (TiDB DDL)

```sql
CREATE DATABASE IF NOT EXISTS kiosai;
USE kiosai;

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(64) NULL, -- NULL untuk user biasa; diisi untuk admin (login pakai username)
  password_hash VARCHAR(255) NULL,
  full_name VARCHAR(100),
  tier ENUM('free', 'pro') DEFAULT 'free',
  balance_tokens BIGINT DEFAULT 2500000, -- Free 2.5M bonus akun baru
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE INDEX idx_username (username),
  INDEX idx_email (email)
);

CREATE TABLE IF NOT EXISTS api_keys (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  key_hash VARCHAR(64) UNIQUE NOT NULL,
  key_prefix VARCHAR(16) NOT NULL, -- kios-xxxx
  name VARCHAR(100) DEFAULT 'Default Key',
  rate_limit_per_min INT DEFAULT 60,
  allowed_models JSON,             -- NULL = all, or ["model-a", "model-b"]
  is_active BOOLEAN DEFAULT TRUE,
  last_used_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_key_hash (key_hash),
  INDEX idx_user (user_id)
);

CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  amount_idr INT NOT NULL,
  tokens_purchased BIGINT NOT NULL,
  package_tier ENUM('free', 'pro') NOT NULL,
  payment_method VARCHAR(32) DEFAULT 'qris',
  status ENUM('pending', 'paid', 'expired', 'failed') DEFAULT 'pending',
  paid_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_status (status)
);

CREATE TABLE IF NOT EXISTS usage_logs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  api_key_id VARCHAR(64) NOT NULL,
  user_id VARCHAR(64) NOT NULL,
  model VARCHAR(100) NOT NULL,
  prompt_tokens INT DEFAULT 0,
  completion_tokens INT DEFAULT 0,
  total_tokens INT DEFAULT 0,
  latency_ms INT DEFAULT 0,
  status_code INT DEFAULT 200,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_time (user_id, created_at)
);
```

## 5. API Contracts

### 5.1 Main AI Proxy: `POST /v1/chat/completions`
- **Auth**: `Authorization: Bearer kios-<token>`
- **Header**: Standard OpenAI client headers + Rate Limit Headers (`X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`) + `X-Quota-Warning` (jika saldo < 20k token)
- **Validasi**:
  1. Hash key -> cek `api_keys` & `users`
  2. Rate limit sliding window (maks per menit) -> Return 429 jika overload
  3. Cek `is_active == true` & `balance_tokens > 0`
  4. Cek `allowed_models` cocok dengan `body.model`
  5. Cek Tier Gating: Free hanya model gratis (Atria Dawn), Pro membuka seluruh model.
- **Tarif Token (rasio dari harga $ / 1M)**:
  - Tarif model diambil dari `lib/model-pricing.ts` (Input + Output $ / 1M).
  - Rasio pemotongan = (Input + Output) / 1.37, baseline DeepSeek Flash ($0.27 + $1.10).
- **Forwarding**:
  - URL: `${NINEROUTER_URL}/v1/chat/completions`
  - Auth: Master `NINEROUTER_KEY`
- **Stream**: SSE passthrough ke client
- **Token Deduction**: Potong `balance_tokens` dan rekam ke `usage_logs`.

### 5.2 Model Discovery: `GET /v1/models`
- Mengembalikan daftar model aktif dari 9Router, dianotasi dengan `required_tier` ("free", "pro") dan ketersediaan akses sesuai tier pengguna.

### 5.3 Key Management:
- `POST /api/keys`: Buat key baru, return plaintext key sekali saja.
- `GET /api/keys`: List key user (prefix saja terungkap).
- `DELETE /api/keys/:id`: Revoke key.

### 5.4 Billing & Orders:
- Free: Rp 0 -> 2.500.000 Token (Bonus akun baru, Model: Atria Dawn)
- Pro 25K: Rp 25.000 -> 100.000.000 Token (Seluruh model AI)
- Pro 100K: Rp 100.000 -> 600.000.000 Token
- Pro 150K: Rp 150.000 -> 1.000.000.000 Token
- `GET /api/orders?userId=...`: Riwayat transaksi dan invoice pesanan pengguna.
- `POST /api/payment/webhook`: Webhook callback dengan validasi idempotensi & HMAC signature.

### 5.5 Analytics:
- `GET /api/analytics?userId=...`: Ringkasan total request, total token, rata-rata latensi, breakdown per model, riwayat request log.

## 6. Engineering Constraints

- **Batas ukuran file: maks 200 baris per file** (`.ts`, `.tsx`, `.mjs`). Jika lebih, pecah ke modul terpisah (hooks, komponen per tab, helper `lib/`) sebelum commit.
- Komponen UI dipisah per tab di `app/components/`. State & fetch di `app/hooks/`. Konteks dibagi lewat `app/hooks/KiosContext.tsx`.
- Helper HTTP proxy di `lib/proxy-http.ts` (konstanta upstream, `errorResponse`).
- Upstream 9Router memakai key `NINEROUTER_API_KEY_2` (prioritas), fallback ke `NINEROUTER_API_KEY`. Keduanya dibiarkan di `.env`.

## 7. Model Policy & Risiko Upstream

- Model `ag/*` (Antigravity/Gemini) memakai akun OAuth pribadi di 9Router. Hanya untuk test internal, jangan dijual atau dibagikan.
- Default demo: `tokenharbor/deepseek-v4.1-flash:free` (pool gratis pihak ketiga, kuota bisa habis atau dicabut).
- Sebelum launch publik, pilih upstream yang secara eksplisit mengizinkan reseller. Baca ToS provider dulu.
- Overhead prompt upstream ~2.600–2.900 token per request (belum dipastikan sumbernya). Billing saat ini memakai total token. Keputusan billing tertunda.

## 8. QA Log: Browser Audit

Diuji Playwright (Chromium headless) di `http://127.0.0.1:3000/`.

| Viewport | Tab | scrollWidth vs clientWidth | Konten tab |
|---|---|---|---|
| 390x844 (mobile) | 5 tab | OK (no overflow) | OK |
| 1366x768 (desktop) | 5 tab | OK (no overflow) | OK |

Console error: 0. Belum dicek: Safari iOS, Android Chrome, tampilan QRIS pada layar kecil.

## 9. Billing: Tagih Total (Final)

Keputusan: tagih total token upstream (`prompt_tokens + completion_tokens`) x rasio tarif model (`getCostRatio`, diturunkan dari harga $/1M yang tampil di kartu). Paling umum, sama dengan OpenAI/OpenRouter.

- Non-stream: pakai `usage` dari response upstream.
- Stream: request ke upstream dengan `stream_options.include_usage = true`, baca `usage` dari chunk terakhir, tagih sama dengan non-stream.
- Fallback jika upstream tidak kirim usage: `prompt=15`, `completion=jumlah delta`. ponytail: tokenizer belum dipakai.
- Overhead prompt upstream (~2.300–2.900 token per request) tetap ditagih. Tercatat di dokumen sebagai harga.

Tes (2026-10-11, key demo, model deepseek): non-stream ditagih 2.329, stream ditagih 851, keduanya HTTP 200.

## 10. Desain & Zero Dummy Data Integration (KiosAI Token Marketplace Design)

Desain prototype dari `KiosAI Token Marketplace Design` diterapkan sepenuhnya pada aplikasi live:
- **Palette (Warm Anti-Slop Orange)**:
  - Canvas: `#120F0C`, Surface: `#1C1714`, Border: `#2E2722`
  - Text Primary: `#F5EFEA`, Text Muted: `#A29487`
  - Primary / CTA: `#F28C38`, Primary Hover: `#D9742A`
  - Tiers: Bronze `#C08A5B`, Silver `#B9C4CC`, Gold `#E6C36A`
  - Warning: `#F5C542`, Error: `#E5533D`, Success: `#4FBF7A`
- **Zero Dummy Data (Semua Live Database & Gateway)**:
  - **Saldo & Akun**: Live dari tabel TiDB `kiosai.users` (`balance_tokens`, `tier`, `full_name`, `email`).
  - **API Keys**: Live dari tabel TiDB `kiosai.api_keys` via `POST /api/keys` & `DELETE /api/keys/:id`.
  - **Orders & QRIS**: Live dari tabel TiDB `kiosai.orders` via `POST /api/orders` & pembayaran live `POST /api/orders/pay`.
  - **Playground**: Panggilan live `POST /v1/chat/completions` ke 9Router dengan pemotongan saldo nyata di TiDB.
  - **Statistik**: Log konsumsi live dari tabel TiDB `kiosai.usage_logs`.
  - **Models**: Live discovery dari endpoint `GET /v1/models`.
- **Engineering Constraint**: 100% file `.ts`, `.tsx`, `.mjs` berukuran <= 200 baris. Modul dipecah menjadi komponen mandiri di `app/components/`.

## 11. Health Diagnostics & Key Rate Limit Customization

- **Health Endpoint (`GET /api/health`)**: Memeriksa konektivitas dan latensi real-time database TiDB (`SELECT 1`) dan upstream 9Router (`/v1/models`). Mengembalikan status `healthy` (HTTP 200) atau `degraded` jika ada latensi/kegagalan.
- **Status Indicator UI**: Header status dot menampilkan status live beserta tooltip latensi ms untuk TiDB dan 9Router yang diperbarui otomatis setiap 30 detik.
- **Konfigurasi Rate Limit per Key**: Form pembuatan API key (`KeyModal`) mendukung pemilihan rate limit per menit (30 testing, 60 standar, 120 production) yang tersimpan di kolom `kiosai.api_keys.rate_limit_per_min`.

## 12. Routing & Admin Auth

- **Route `/`**: Landing Page publik (SEO, hero, pricing, code sandbox, FAQ). Server Component (metadata export).
- **Route `/dashboard`**: Dashboard workspace pengguna (client component, session-based).
- **Route `/landing`**: Redirect 301 ke `/` (backward compatibility).
- **Admin Login**: Admin menggunakan username (bukan email) saat login. Field `identifier` pada `POST /api/auth/login` menerima email ATAU username. Lookup tunggal: `LOWER(email) = ? OR LOWER(username) = ?`.
- **Admin Seed**: `scripts/seed-admin.mjs` membuat akun admin `adminfordhani` (Gold, 100M token). Password di-hash scrypt.
- **Kolom `username`**: `kiosai.users.username VARCHAR(64)` NULL + unique index. Admin login pakai username; user biasa NULL dan login pakai email. Lookup tunggal: `LOWER(email) = ? OR LOWER(username) = ?`.

## 13. Auth Guard & Session

- **Guard `/dashboard`**: Komponen `AuthGuard` (client) memblokir akses jika `localStorage.kiosai_user_id` kosong → redirect `/?login=1`.
- **Modal otomatis**: `LandingAuthWatcher` membaca query `?login=1` dan membuka `AuthModal` di landing page.
- **Handoff**: Sukses auth → `window.location.assign("/dashboard")` (hard nav, menghindari race dengan reset query).
- **Logout**: `AuthModal` hapus localStorage lalu hard-nav ke `/`. Tidak ada fallback demo user.
- **Re-check**: `AuthGuard` mendengarkan event `focus` + `pageshow` untuk menangkap logout dari tab lain.
- **CTA Landing**: Navbar menampilkan "Masuk" + "Mulai Gratis" sebelum login, "Dashboard" setelah login.

## 14. Deploy Cloudflare Workers & Secret Sync

- **Target produksi**: Worker `kiosai` di `https://kiosai.dhanisepeda.workers.dev` (Next.js 15 via `@opennextjs/cloudflare`, handler `fetch` + named handlers `BucketCachePurge`/`DOQueueHandler`/`DOShardedTagCache`).
- **Penyebab error `DATABASE_URL environment variable is not defined`**: Worker tidak membaca `.env`; env harus dipasang sebagai secret. Worker ini pernah punya **0 secret**, sehingga login gagal walau halaman tampil normal.
- **`npm run secrets:sync`** (`scripts/sync-worker-secrets.mjs`): dorong `DATABASE_URL`, `NINEROUTER_URL`, `NINEROUTER_API_KEY_2`, `NINEROUTER_API_KEY` dari `.env` ke secret Worker. Nilai loopback untuk `NINEROUTER_URL` otomatis dilewati.
- **`npm run tunnel`** (`scripts/tunnel-sync.mjs`): jalankan `cloudflared tunnel --url http://localhost:20128`, tunggu URL `trycloudflare.com`, verifikasi tunnel, lalu set secret `NINEROUTER_URL` otomatis. Wajib karena quick tunnel berganti URL setiap restart.
- **Kenapa tunnel wajib**: Worker berjalan di edge Cloudflare. `http://127.0.0.1:20128` di dalam Worker menunjuk mesin edge → Cloudflare balas **error 1003**. Pola error: `/api/health` melaporkan `upstream: http_403`.
- **`npm run verify`** kini juga memeriksa keberadaan secret Worker dan mendeteksi drift (Worker kosong / `NINEROUTER_URL` masih loopback).
- **Subdomain akun**: `dhanisepeda` (pakai `e`).
- **Verifikasi live**: `/api/health` → `{"status":"healthy"}` (TiDB connected, upstream connected); login admin `adminfordhani` 200; chat completion 200 dengan pemotongan saldo real (100.000 → 98.250).

## 15. Troubleshooting Produksi

| Gejala | Penyebab | Fix |
|---|---|---|
| `DATABASE_URL environment variable is not defined` | Secret Worker kosong | `npm run secrets:sync` |
| Health `upstream: http_403`, chat `error code: 1003` | `NINEROUTER_URL` loopback | `npm run tunnel` |
| `{"error":"API key required for remote API access"}` | Key 9Router belum di Worker | `npm run secrets:sync` |
| URL `*.workers.dev` tidak resolve | Salah ejaan subdomain | Benar: `kiosai.dhanisepeda.workers.dev` (pakai `e`) |

## 16. Referensi File & Perintah Produksi

| Perintah | Script | Fungsi |
|---|---|---|
| `npm run secrets:sync` | `scripts/sync-worker-secrets.mjs` | Dorong env `.env` → secret Worker |
| `npm run tunnel` | `scripts/tunnel-sync.mjs` | Tunnel 9Router + set `NINEROUTER_URL` otomatis |
| `npm run verify` | `scripts/verify-deployment.mjs` | Audit env, TiDB, 9Router, batas baris, secret Worker |
| `npm run migrate` | `scripts/migrate.mjs` | DDL tabel TiDB |
| `npm run test:e2e` | `scripts/test-e2e.mjs` | 10 alur gateway E2E |
| — | `scripts/seed-admin.mjs` | Seed akun admin `adminfordhani` |

## 17. Dokumentasi Sesi & Onboarding

| Dokumen | Fungsi |
|---|---|
| `AGENT.md` | Operating manual AI agent: aturan keras, kredensial, arsitektur kunci, perintah rutin |
| `docs/HANDOFF.md` | Snapshot status terkini, checklist resume sesi, gotchas, peta file utama |
| `docs/ARCHITECTURE.md` | Topologi komponen, alur data, skema relasional, mekanisme perhitungan biaya |
| `docs/TROUBLESHOOTING-WORKER.md` | Diagnosis error env Worker & tunnel |
| `STATE.md` | Log riwayat implementasi tiap fase |
| `tasks/todo.md`, `tasks/plan.md` | Progres task dan rencana implementasi |

## 18. Playground Session Key & Chat Persistence

- **HMAC Session Key** (`lib/session-key.ts`): `GET /api/user?id=...` menghasilkan `kios-pg-<userId>.<hmac32>` yang ditandatangani HMAC-SHA256 dengan secret `DATABASE_URL`. `validateApiKey` di `lib/keys.ts` mendeteksi prefix `kios-pg-` lebih dulu, lalu memverifikasi signature dan memuat user asli.
- **Efek**: Playground web memotong saldo nyata dari akun pengguna yang login, dan setiap request tercatat di tabel `usage_logs` serta tampil di tab Statistik. Tidak ada lagi ketergantungan pada API key hardcoded.
- **Chat Persistence**: Percakapan disimpan di `sessionStorage` (`kios_playground_messages`). Berpindah tab dashboard tidak menghapus riwayat. Hanya tombol "Chat baru +" yang mengosongkannya.
- **Handoff Model**: Tombol "Coba di Playground" di `ModelsTab.tsx` menyimpan `kios_selected_model` lalu membuka tab Playground dengan model tersebut terpilih.

## 19. Katalog Model di Dashboard

- Menu **Model** (`Sidebar.tsx`, ikon `Cpu`) menampilkan `ModelsTab.tsx`.
- Fitur: pencarian teks, filter tier (Semua/Bronze/Silver/Gold), indikator kunci untuk model yang belum accessible, dan tombol aksi kontekstual (Upgrade paket atau Coba di Playground).
- Menampilkan nama bersih via `formatModelName` (misal `deepseek-v4.1-flash`) tetapi tetap memakai `m.id` lengkap sebagai value.
