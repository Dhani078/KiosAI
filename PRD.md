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
- Fitur: pencarian teks, filter tier (Semua/Free/Pro), counter dinamis, indikator kunci untuk model yang belum accessible, dan tombol aksi kontekstual (Beli Paket Pro atau Coba di Playground).
- Menampilkan nama bersih via `formatModelName` (misal `deepseek-v4.1-flash`) tetapi tetap memakai `m.id` lengkap sebagai value.

## 20. Arsitektur Billing 2-Tier & Rasio Tarif $/1M Directional

- **Struktur Tier**: Hanya 2 tier: `free` (bonus 2.500.000 token, model Atria Dawn) dan `pro` (seluruh model AI aktif).
- **Kalkulasi Biaya Terpisah Input vs Output (`calculateTokenCost`)**:
  $$\text{Input Ratio} = \max\left(0.025,\ \frac{\text{Input } \$}{1.37}\right)$$
  $$\text{Output Ratio} = \max\left(0.025,\ \frac{\text{Output } \$}{1.37}\right)$$
  $$\text{Total Deduksi} = \lceil (\text{Prompt Tokens} \times \text{Input Ratio}) + (\text{Completion Tokens} \times \text{Output Ratio}) \rceil$$
- Mencegah overcharging pada prompt konteks besar (coding/RAG) dan melindungi margin pada output panjang.
- **Proteksi Stream Abort & Concurrency**:
  - Event `cancel()` pada stream reader (`lib/stream-billing.ts`) menjamin token tetap dipotong proporsional dari karakter yang sudah terkirim jika koneksi diputus klien sebelum stream selesai.
  - Concurrency limiter (`acquireStreamSlot`/`releaseStreamSlot` di `lib/ratelimit.ts`) membatasi maksimal 3 stream simultan per API key untuk mencegah race condition overdraft saldo.

## 21. Maxxmode Statistik & Observabilitas

- 4 Kartu KPI: Saldo Aktif, Konsumsi Token (In vs Out), Latensi Rata-Rata (Min/Max ms), dan Reliabilitas Gateway (HTTP 200 %).
- Visualisasi Distribusi Model: Multi-segment visual bar berwarna proporsional per model AI.
- Log Inferensi & Transaksi Real-Time: Filter pencarian, filter status HTTP, dan ekspor data CSV klien.

## 22. Audit 5x & Pemangkasan Katalog Model

- Pengujian nyata 746 model 5x berturut-turut ke gateway 9Router (`scripts/audit-all-models-5x.mjs`).
- 679 model mati (scraper `cl/*` dan rute 503) dipangkas.
- 65 model terbukti aktif didaftarkan di `lib/verified-models.ts` dan disaring di `/v1/models`.

## 23. Role-Based Branding Database & Router

- Kata teknis internal "TiDB" dan "9Router" disembunyikan untuk pengunjung publik dan pengguna reguler web.
- Tampilan pengguna umum memakai label industri bersih: "Cloud Database", "database", "Gateway Live", "Gateway Aktif".
- Sesi admin (`adminfordhani`) tetap mempertahankan label teknis lengkap untuk kebutuhan audit dan diagnostik.

## 24. Resolusi Alias Komersial Otomatis

- Fungsi `resolveModelAlias` di `lib/model-utils.ts` memetakan nama model industri standar secara transparan:
  - `claude-3.7-sonnet` $\rightarrow$ `ag/claude-sonnet-4-6`
  - `gpt-4o` $\rightarrow$ `cx/gpt-6-luna`
  - `gemini-2.0-flash` $\rightarrow$ `ag/gemini-3.8-flash-high`
  - `deepseek-r1` $\rightarrow$ `cf/@cf/deepseek-ai/deepseek-r1-distill-qwen-32b`
  - `llama-3.3-70b` $\rightarrow$ `cf/@cf/meta/llama-3.3-70b-instruct-fp8-fast`
  - `deepseek-v4.1-flash` $\rightarrow$ `tokenharbor/deepseek-v4.1-flash:free`
  - `atria` $\rightarrow$ `atria/Atria-Dawn-Preview`

## 25. Identitas Brand & Vektor Logo KiosAI Resmi

- Simbol resmi: Monogram huruf "K" minimalis yang dibentuk dari kapsul pill vertikal kiri dan panah chevron kanan (`>`).
- Format aset tak terbatas: SVG murni di `Logo.tsx`, `public/favicon.svg`, `public/kiosai-icon.svg`, dan varian HD PNG (2048/512/192/transparent) di `public/brand/`.

## 26. Funnel Brankas Bonus Anti-Ternak Akun

- **Skema Dual-Wallet**: Pendaftaran baru menerima 250.000 token aktif langsung di `balance_tokens` (cukup untuk pengujian integrasi coding agent), sedangkan 2.250.000 token dialokasikan di `locked_bonus_tokens`.
- **Aktivasi Otomatis**: Pembayaran QRIS pertama (mulai Rp10.000) otomatis mencairkan seluruh 2.250.000 token bonus ke saldo aktif dan meng-upgrade akun ke Pro secara atomik.
- **Pesan 402 Terarah**: Error kuota habis mengarahkan pengguna ke `/dashboard` (Beli Token), menghindari link fiktif 404 `/billing`.

## 27. Pre-TTFB First-Chunk Probe Failover & Edge Prompt Caching

- **Pre-TTFB Probe**: Gateway menahan stream awal selama 12 detik sampai chunk pertama tiba. Jika upstream primer mengembalikan status retryable (429, 500, 502, 503, 504) atau error SSE, request dialihkan ke model cadangan terverifikasi secara transparan.
- **Price-Cap Protection**: Biaya yang dipotong tidak akan pernah melebihi tarif model yang diminta: $\min(\text{Harga Primer}, \text{Harga Cadangan})$.
- **Edge Exact Prompt Caching**: Payload deterministik (`temperature: 0`) di-cache di `caches.default` Cloudflare dengan kunci terisolasi tenant `SHA-256(tenant:${userId})`. Cache hit diberi diskon token 80% (user bayar 20%), dengan latensi <15ms dan biaya upstream Rp0.

## 28. Dual-Lane Priority Scheduler (Interactive vs Bulk Bot)

- **Klasifikasi Trafik**: Mendeteksi signature header IDE (`cline`, `roo-code`, `cursor`, `playground`) dan frekuensi burst (<8 req/10s) sebagai jalur `INTERACTIVE`, sedangkan request masif/non-streaming diklasifikasikan sebagai `BULK_BOT`.
- **Reserva Konkurensi 40%**: Minimal 40% slot konkurensi direservasi eksklusif untuk jalur interaktif (0ms delay).
- **Edge Micro-Pacing**: Bot massal yang menghabiskan token bucket ditahan sementara 150-1200ms di Edge (wall-clock sleep di RAM V8 tanpa memakan kuota CPU Workers), meredam lonjakan beban upstream.

## 29. Asynchronous Telemetry Rollup (10s Tumbling Window) & Code Normalization

- **Agregasi Ring Buffer di RAM**: Metrik inferensi (p50, p95, p99 TTFB, success, failover, cache hit) diringkas per 10 detik di memori V8 dan di-flush via multi-row `INSERT ... ON DUPLICATE KEY UPDATE` ke tabel `telemetry_rollup_10s`. Memangkas 99% konsumsi Request Units (RU) TiDB.
- **Code-Fence-Aware Normalizer**: Menyeragamkan format teks prompt untuk cache key tanpa memodifikasi satu byte pun isi di dalam blok kode markdown (` ```...``` `).
- **Chaos Load Testing**: Runner `scripts/chaos-load-test.mjs` memvalidasi sistem di bawah beban 25+ koneksi konkuren dengan 40% client abort tanpa error 500 dan tanpa kebocoran saldo.

## 30. Hardening Forensik F-01 s/d F-07

- **F-01 (Match-Vesting Bonus Vault)**: Bonus dicairkan proporsional 1:1 (`LEAST(locked_bonus_tokens, tokens_purchased)`) saat top-up QRIS, menutup celah eksploitasi arbitrase modal Rp10.000 untuk menyedot model mahal Claude 3.7 Sonnet.
- **F-02 (Akurasi Stream Billing)**: Perhitungan karakter saat abort murni mengekstrak isi `delta.content`, `delta.reasoning_content` (DeepSeek R1), dan `delta.tool_calls` via line buffer utuh, membuang bingkai metadata JSON SSE.
- **F-03 (Proteksi Memori V8 Vision)**: String blob Base64 >4KB diringkas menjadi fingerprint deterministik 64 byte mencegah Error 1102 (OOM 128 MB).
- **F-04 & F-07 (Telemetri Anti-Hotspot TiKV)**: Primary Key tabel `telemetry_rollup_10s` menggunakan urutan `(model_id, window_start)` untuk mendistribusikan beban tulis merata ke Region TiKV. Flag flush dibungkus blok `finally` untuk mencegah permanent lockup.
- **F-05 (Mid-Stream Watchdog 15 Detik)**: Pembacaan stream pasca-chunk pertama dipantau watchdog 15 detik untuk memutus koneksi menggantung secara anggun dan menagih parsial.

## 31. Proteksi Prototype Pollution & Strict Cloudflare Edge Guard

- **Anti-Prototype-Pollution**: Objek normalisasi payload dibuat dengan `Object.create(null)` serta memfilter properti `__proto__`, `constructor`, `prototype`.
- **Strict Cloudflare Edge Guard**: Endpoint `/v1/chat/completions` menolak request produksi yang tidak melewati edge resmi Cloudflare (memvalidasi header `cf-ray`), menutup celah bypass dan IP spoofing.

## 32. Faktur Digital & Bukti Pembayaran Cetak Instan

- **Generator Faktur Mandiri (`lib/receipt-generator.ts`)**: Memproduksi dokumen HTML faktur resmi siap cetak (auto-trigger `window.print()`) dengan rincian nomor order, nominal rupiah, jumlah token, status lunas, dan stempel digital KiosAI.
- **Aksi Satu-Klik di Dashboard (`OrderHistoryTable.tsx`)**: Setiap transaksi berstatus `paid` memiliki tombol aksi cetak langsung untuk keperluan klaim reimburse kantor atau pembukuan pajak developer.

## 33. Preset Persona System Prompt Instan

- **Katalog Persona Terkurasi (`lib/prompt-presets.ts`)**: Persona spesialis bawaan siap pakai (Coding Specialist, Penerjemah Formal KBBI, JSON Data Extractor, dan Default) yang langsung menyuntikkan instruksi sistem presisi ke Playground tanpa perlu mengetik manual.

## 34. Batas Pengeluaran Token per API Key (Spend Cap)

- **Proteksi Budget Developer (`lib/keys.ts`)**: Setiap API key kini dapat dibatasi plafon kuota maksimal (`max_spend_tokens`). Pemotongan saldo di `lib/stream-billing.ts` dan `/v1/chat/completions` secara otomatis mengakumulasi penggunaan ke kolom `spent_tokens`. Jika kuota tercapai, request berikutnya ditolak 402/403 dengan pesan error deskriptif, mencegah aplikasi klien menguras saldo akun pengguna tanpa terkendali.

## 35. Prioritas Tampilan Model Gemini (Pro Tier)

- **Posisi Teratas Model Pro (`ModelsTab.tsx` & `modelCatalogData.ts`)**: Keluarga Google Gemini (`ag/gemini-3.8-flash-high`, `google/gemini-2.0-flash`) diposisikan langsung di urutan teratas model Pro setelah model Free (Atria), memaksimalkan utilisasi kuota token Gemini yang melimpah dengan tarif super ekonomis ($0.075 / $0.30 per 1M).

## 36. Integrasi Model Baru BeatAPI DeepSeek Flash Free

- **Rute Baru Aktif (`beatapi/deepseek-v4.1-flash-free`)**: Terverifikasi via pengujian inferensi HTTP 200 (latensi 3103ms) ke 9Router. Terdaftar di `lib/verified-models.ts` (66 model aktif terverifikasi).
- **Redundansi Failover**: Menjadi kandidat failover timbal-balik utama untuk `tokenharbor/deepseek-v4.1-flash:free`, menjamin ketersediaan model DeepSeek Flash tetap 100% aktif jika salah satu upstream mengalami rate-limit.

## 37. Banner Peringatan Saldo Rendah Global

- **Sticky Low-Balance Alert (`DashboardApp.tsx`)**: Muncul otomatis di atas konten utama setiap tab saat saldo akun pengguna berada di bawah ambang batas aman 50.000 token, dilengkapi tombol aksi langsung ke checkout paket untuk mencegah disrupsi bot/integrasi klien.

## 38. Indikator Kecepatan & Latensi Riil pada Kartu Model

- **Benchmarking Latensi Responsif (`lib/model-latency.ts`)**: Mengklasifikasikan estimasi latensi respons per keluarga model AI: model Flash/Lite (~240ms), model Flagship (~650ms), dan model Deep Reasoning (~1.4s).
- **Badge Kecepatan di Dashboard (`ModelsTab.tsx`)**: Menyajikan indikator titik hijau dan estimasi waktu latensi di samping tag provider pada tiap kartu model, memberikan ekspektasi kecepatan yang transparan kepada pengembang sebelum memilih rute model.

## 39. Generator Cuplikan Kode Satu-Klik pada Setiap Model

- **Modal Integrasi Cepat (`ModelSnippetModal.tsx`)**: Pengembang dapat mengklik tombol kode `<Code2 />` pada kartu model apa pun untuk memunculkan cuplikan cURL, Python, dan Node.js yang sudah terisi otomatis dengan ID model target dan API key pengguna, memangkas friksi integrasi pertama hingga di bawah 30 detik.

## 40. Notifikasi Webhook Saldo Menipis Otomatis

- **Sistem Webhook Alert Proaktif (`lib/balance-alerts.ts`)**: Mendukung pengiriman payload JSON otomatis ke webhook Discord, Slack, atau bot Telegram pengguna saat saldo token menipis (< ambang batas default 50.000 token).
- **Proteksi Anti-Spam (30-Minute Debounce)**: Mekanisme in-memory throttle membatasi frekuensi webhook maksimal 1 kali setiap 30 menit per pengguna, mencegah spam request beruntun pada beban trafik tinggi.
- **Konfigurasi Akun Pengguna**: Pengguna dapat memasukkan URL webhook target mereka di modal profil akun (`AuthModal.tsx`) yang tersimpan aman pada kolom `alert_webhook_url` tabel pengguna di TiDB.

## 41. Generator & Ekspor File .env Satu-Klik

- **Modal Ekspor Konfigurasi (`EnvExportModal.tsx`)**: Menghasilkan template file `.env.local` instan yang sudah otomatis terisi `OPENAI_BASE_URL`, `OPENAI_API_KEY`, dan model pilihan pengguna.
- **Pintasan Pengembang Cepat**: Tombol `.env` pada tab Dokumentasi memungkinkan pengembang mengunduh file `.env.local` langsung atau menyalin teks untuk integrasi 1-detik ke VS Code, Cursor, Cline, atau proyek Next.js.

## 42. Integrasi Keluarga Model OpenCode ke Free Tier

- **Model OpenCode Terverifikasi (`oc/...`)**: 4 model baru dari penyedia OpenCode Free diintegrasikan ke gerbang KiosAI setelah lolos verifikasi inferensi live HTTP 200:
  - `oc/deepseek-v4.1-flash-free(max)`: Model reasoning cepat 200k context window dengan thinking max.
  - `oc/muse-spark-1.3-contributor-free`: Model percakapan instruksional open-weights.
  - `oc/mimo-v2.6-flash-free`: Model coding ringan dan obrolan interaktif kilat.
  - `oc/nemotron-3.5-lightning-free`: Model arsitektur lightning NVIDIA untuk inferensi terdistribusi.
- **Akses Gratis & Tarif Nol**: Seluruh model OpenCode dibuka langsung untuk akun tier Free (`tier: "free"`) dengan tarif pemotongan $0.00 / 1M token (Gratis), memperluas pilihan model gratis di KiosAI menjadi 5 model terverifikasi.
- **Redundansi Jaringan**: Terhubung dalam sistem failover multiarah bersama `beatapi` dan `tokenharbor`.

## 43. Autentikasi Sosial Native (Sign in with GitHub & Google)

- **Modul Sentral OAuth (`lib/oauth.ts`)**: Penukaran `code` ke `access_token` berbasis OpenID Connect dan OAuth 2.0 standar tanpa ketergantungan library eksternal berat (NextAuth/Passport).
- **Onboarding Akun Otomatis**: Pengguna baru yang mendaftar via GitHub atau Google langsung otomatis dibuatkan ID pengguna di TiDB, dihadiahi 250.000 token aktif instan + 2.250.000 token brankas bonus, dan ditautkan ke akun permanen.
- **UI Dialog Modern (`AuthModal.tsx`)**: Menyajikan tombol "Lanjutkan dengan GitHub" dan "Lanjutkan dengan Google" dengan ikon SVG presisi dan pemisah visual di atas formulir email konvensional.
- **Dukungan Kredensial Multi-Provider**: GitHub OAuth dan Google OAuth aktif live dengan encrypted secrets tersinkronisasi langsung ke Cloudflare Edge Worker.

## 44. Real-Time Streaming SSE di Playground & Buka Kunci OpenCode Free

- **Konsumsi Aliran Streaming SSE (`lib/playground-stream.ts`)**: Playground dashboard kini menggunakan SSE streaming secara asinkron; kata-kata balasan model AI muncul seketika secara bertahap begitu chunk pertama sampai (~240ms), mengeliminasi jeda tunggu penuh.
- **Dukungan Penuh Model OpenCode di Playground**: Seluruh 5 model Free Tier (`atria/Atria-Dawn-Preview`, `oc/deepseek-v4.1-flash-free(max)`, `oc/muse-spark-1.3-contributor-free`, `oc/mimo-v2.6-flash-free`, `oc/nemotron-3.5-lightning-free`) terbuka penuh dan tidak lagi berstatus terkunci bagi pengguna akun Free.

## 45. Redesain Modal Profil Pengguna & Ketahanan Katalog Penuh

- **Modal Profil Eksklusif (`UserProfileModal.tsx`)**: Menampilkan foto avatar profil asli pengguna yang login via Google atau GitHub, pill indikator penyedia koneksi akun, copy ID instan, dan rincian saldo dual-wallet (Saldo Aktif vs Brankas Bonus).
- **Avatar di Bar Navigasi**: Foto profil pengguna ditampilkan langsung di sidebar dan topbar header dashboard.
- **Katalog Fallback Lengkap Termasuk Gemini**: Endpoint model (`/v1/models`) menyajikan seluruh 71 model terverifikasi (termasuk keluarga Google Gemini 3.8/2.0/3.5) meskipun upstream sedang mengalami jeda sinkronisasi, menjamin ketersediaan katalog 100%.
- **Tunnel Reconnection Supervisor**: Mekanisme auto-recovery pada `tunnel-sync.mjs` memutar ulang tunnel otomatis dan menjaga sinkronisasi ke Edge Worker tanpa intervensi manual.

## 46. Kontainer Blok Kode Playground & Visualisasi Spend Cap Kunci

- **Kontainer Blok Kode Bersintaks (`MarkdownMessage.tsx`)**: Respon kode program (Python, Node.js, SQL, cURL, bash) yang dihasilkan AI di Playground kini dibungkus rapi dalam kontainer monospaced dengan bar bahasa dan tombol aksi "Salin" 1-klik.
- **Visualisasi Progress Bar Batas Kuota Kunci (`KeysTab.tsx`)**: API key yang dikonfigurasikan dengan batas token pengeluaran (`max_spend_tokens`) kini menampilkan progress bar mikro interaktif yang memperlihatkan token yang telah digunakan terhadap kuota maksimal, lengkap dengan indikator warna merah saat mencapai ambang batas kritis $\ge 90\%$.

## 47. Modal Diagnostik Status & Latensi Gateway Real-Time

- **Panel Diagnostik Gateway (`GatewayHealthModal.tsx`)**: Menampilkan status latensi milidetik riil dari komponen infrastruktur KiosAI: konektivitas TiDB Serverless, status router upstream (71 model terverifikasi aktif), dan Cloudflare Edge CDN.
- **Interaktivitas Header**: Pengguna dapat mengklik pill indikator status "Live Gateway" di navbar kapan saja untuk melihat diagnostik performa jaringan dan melakukan re-ping live.

## 48. Filter Cepat Multi-Provider pada Katalog Model

- **Komponen Filter Modular (`ModelFilters.tsx`)**: Menyediakan navigasi pencarian dan tombol pill filter multi-provider (Semua Provider, Google, DeepSeek, Anthropic, OpenAI, OpenCode, Meta) secara instan, memudahkan eksplorasi 71 model AI aktif tanpa keharusan mengetik manual.
