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
- **Deployment**: Vercel (`hnd1` Tokyo) / Cloudflare Pages
- **Repository**: `https://github.com/Dhani078/KiosAI`

## 3. Capability Map & Modules

| Module ID | Tanggung Jawab | Status |
|---|---|---|
| `core-db` | Schema DDL, HTTP connection pool TiDB, seed data | Selesai |
| `auth` | Registrasi user (`/api/auth/register`), login (`/api/auth/login`), trial token | Selesai |
| `key-mgmt` | Generate key (`kios-xxxx`), SHA256 hash, validasi izin model & tier | Selesai |
| `proxy-engine` | Endpoint `/v1/chat/completions`, SSE streaming, rate limiting, tier gating, model multipliers, low-balance alert | Selesai |
| `catalog-sync` | Dynamic model discovery `/v1/models` sinkron dengan upstream 9Router dan anotasi tier | Selesai |
| `analytics` | Agregasi metrik penggunaan per model, latensi, dan log request (`/api/analytics`) | Selesai |
| `billing` | Paket token (Bronze/Silver/Gold), order flow, order history (`/api/orders`), webhook pembayaran & idempotensi | Selesai |
| `dashboard-ui` | UI toko, panel saldo, generator key, analytics charts, dynamic model picker, riwayat order, live playground | Selesai |

## 4. Database Schema (TiDB DDL)

```sql
CREATE DATABASE IF NOT EXISTS kiosai;
USE kiosai;

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NULL,
  full_name VARCHAR(100),
  tier ENUM('bronze', 'silver', 'gold') DEFAULT 'bronze',
  balance_tokens BIGINT DEFAULT 100000, -- Free 100k trial
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
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
  package_tier ENUM('bronze', 'silver', 'gold') NOT NULL,
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
  5. Cek Tier Gating: Bronze dibatasi model standar, Silver mencakup GPT/Claude, Gold unmetered
- **Model Multiplier Pricing**:
  - Bronze/Flash: 1.0x token
  - Silver/Sonnet/GPT-5: 2.0x token
  - Gold/Opus/Combos: 4.0x token
- **Forwarding**:
  - URL: `${NINEROUTER_URL}/v1/chat/completions`
  - Auth: Master `NINEROUTER_KEY`
- **Stream**: SSE passthrough ke client
- **Token Deduction**: Potong `balance_tokens` dan rekam ke `usage_logs`.

### 5.2 Model Discovery: `GET /v1/models`
- Mengembalikan daftar model aktif dari 9Router, dianotasi dengan `required_tier` ("bronze", "silver", "gold") dan ketersediaan akses sesuai tier pengguna.

### 5.3 Key Management:
- `POST /api/keys`: Buat key baru, return plaintext key sekali saja.
- `GET /api/keys`: List key user (prefix saja terungkap).
- `DELETE /api/keys/:id`: Revoke key.

### 5.4 Billing & Orders:
- Bronze: Rp 50.000 -> 1.000.000 Token
- Silver: Rp 150.000 -> 3.500.000 Token
- Gold: Rp 400.000 -> 10.000.000 Token
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
