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
- **Deployment**: Vercel / Cloudflare Pages
- **Repository**: `https://github.com/Dhani078/KiosAI`

## 3. Capability Map & Modules

| Module ID | Tanggung Jawab | Dependensi |
|---|---|---|
| `core-db` | Schema DDL, HTTP connection pool TiDB, seed data | — |
| `key-mgmt` | Generate key (`kios-xxxx`), SHA256 hash, validasi izin model & tier | `core-db` |
| `proxy-engine` | Endpoint `/v1/chat/completions`, SSE streaming, potong token otomatis | `core-db`, `key-mgmt` |
| `billing` | Paket token (Bronze/Silver/Gold), order flow, simulasi/webhook QRIS | `core-db`, `key-mgmt` |
| `dashboard-ui` | UI toko, panel saldo, generator key, live API playground | `core-db`, `key-mgmt`, `proxy-engine`, `billing` |

Build order: `core-db` → `key-mgmt` → `proxy-engine` → `billing` → `dashboard-ui`.

## 4. Database Schema (TiDB DDL)

```sql
CREATE DATABASE IF NOT EXISTS kiosai;
USE kiosai;

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(100),
  tier ENUM('bronze', 'silver', 'gold') DEFAULT 'bronze',
  balance_tokens BIGINT DEFAULT 100000, -- Free 100k trial
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email (email)
);

CREATE TABLE IF NOT EXISTS api_keys (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
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
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
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
  api_key_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
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
- **Header**: Standard OpenAI client headers
- **Validasi**:
  1. Hash key -> cek `api_keys` & `users`
  2. Cek `is_active == true` & `balance_tokens > 0`
  3. Cek `allowed_models` cocok dengan `body.model`
- **Forwarding**:
  - URL: `${NINEROUTER_URL}/v1/chat/completions`
  - Auth: Master `NINEROUTER_KEY`
- **Stream**: SSE passthrough ke client
- **Token Deduction**: Potong `balance_tokens` dan rekam ke `usage_logs`.

### 5.2 Key Management:
- `POST /api/keys`: Buat key baru, return plaintext key sekali saja.
- `GET /api/keys`: List key user (prefix saja terungkap).
- `DELETE /api/keys/:id`: Revoke key.

### 5.3 Billing & Packages:
- Bronze: Rp 50.000 -> 1.000.000 Token
- Silver: Rp 150.000 -> 3.500.000 Token
- Gold: Rp 400.000 -> 10.000.000 Token

## 6. Implementation Phasing
- **Tahap 1**: Setup project Next.js 15, koneksi TiDB Serverless, database migration script.
- **Tahap 2**: Service layer: Auth & Key Management engine (`kios-xxxx`, hashing, DB store).
- **Tahap 3**: Core Proxy Engine `/v1/chat/completions` (OpenAI format, token tracking, 9Router forwarder).
- **Tahap 4**: Web Frontend Dashboard (Beli paket, generate key, status saldo, live playground).
- **Tahap 5**: Build, verifikasi end-to-end, commit & push ke GitHub.
