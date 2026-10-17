# TokoAI System Architecture 🏗️

Dokumentasi arsitektur teknis mendalam untuk platform gateway AI dan pasar token TokoAI (`https://tokoai.my.id`).

---

## 1. Topologi Komponen & Aliran Data

```
+-------------------------------------------------------------+
|                     Klien Eksternal / Web                   |
|  - Cursor / Cline / Claude Code (OpenAI SDK)                |
|  - Python / Node.js SDK                                     |
|  - Web Dashboard KiosAI (Next.js 15 UI)                     |
+-------------------------------------------------------------+
                               |
                               | HTTPS Request (Bearer kios-...)
                               v
+-------------------------------------------------------------+
|              Cloudflare Workers (Edge Router)               |
|            kiosai.dhanisepeda.workers.dev                   |
|                                                             |
|  1. /v1/chat/completions (Proxy Engine)                     |
|     - Verifikasi format key (kios-... atau kios-pg-...)     |
|     - Validasi hash SHA-256 / HMAC session signature        |
|     - Cek rate limit sliding-window per menit               |
|     - Validasi saldo token > 0                              |
|     - Validasi izin tier akses model (free/pro)             |
|                                                             |
|  2. /v1/models (Model Discovery)                            |
|     - Sinkronisasi dinamis dari upstream 9Router            |
|     - Penyaringan model terverifikasi (lib/verified-models) |
|     - Audit 5x uji berkala (679 model mati disaring)        |
|     - Anotasi required_tier & accessible status             |
|                                                             |
|  3. /api/* (Backend Services)                               |
|     - /api/auth (Login scrypt / Register 2.5M trial)        |
|     - /api/user (Profil, saldo & playground session key)    |
|     - /api/keys (CRUD API keys mandiri)                     |
|     - /api/orders (Checkout & payment webhook idempotency)  |
|     - /api/analytics (Agregasi log TiDB)                    |
|     - /api/health (Diagnostik koneksi & latensi)            |
+-------------------------------------------------------------+
            |                                     |
            | HTTP Fetch Query                    | HTTPS Tunnel
            v                                     v
+-----------------------+             +-----------------------+
|  TiDB Cloud Serverless|             |  Cloudflare Tunnel    |
|  (MySQL-compatible)   |             |  (cloudflared)        |
|                       |             +-----------------------+
|  - users              |                         |
|  - api_keys           |                         | Loopback Proxy
|  - orders             |                         v
|  - usage_logs         |             +-----------------------+
+-----------------------+             |  9Router Local Engine |
                                      |  (http://127.0.0.1:   |
                                      |   20128)              |
                                      +-----------------------+
                                                  |
                                                  v
                                      +-----------------------+
                                      | Model Upstream Pools  |
                                      | DeepSeek, Anthropic,  |
                                      | OpenAI, Google, Meta  |
                                      +-----------------------+
```

---

## 2. Model Otentikasi Ganda (Dual Authentication)

KiosAI mendukung dua metode otentikasi resmi:

### 2.1 API Key Standar Pengguna (`kios-<hex32>`)
- Plaintext key dibuat sekali saja via `POST /api/keys`.
- Disimpan di tabel `kiosai.api_keys` dalam bentuk hash **SHA-256** (`key_hash`).
- Klien menyertakan header `Authorization: Bearer kios-...`.
- Gateway mencocokkan hash SHA-256, memverifikasi status aktif, dan mengambil akun pengguna.

### 2.2 Playground Session Key (`kios-pg-<userId>.<hmac32>`)
- Dibuat secara deterministik oleh server via `lib/session-key.ts` saat pengguna terotentikasi membuka dashboard (`GET /api/user`).
- Ditandatangani menggunakan HMAC-SHA256 dengan secret `DATABASE_URL`.
- Memungkinkan Playground web memanggil `/v1/chat/completions` secara aman tanpa memaksa pengguna meng-copy-paste API key manual.
- Pemotongan saldo dan pencatatan log otomatis terasosiasi dengan `user_id` yang sebenarnya.

---

## 3. Skema Database & Relasi Tabel

```sql
users (
  id VARCHAR(64) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(64) UNIQUE NULL,
  password_hash VARCHAR(255) NULL,
  full_name VARCHAR(100),
  tier ENUM('free', 'pro') DEFAULT 'free',
  balance_tokens BIGINT DEFAULT 2500000,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)

api_keys (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) FOREIGN KEY -> users(id),
  key_hash VARCHAR(64) UNIQUE NOT NULL,
  key_prefix VARCHAR(16) NOT NULL,
  name VARCHAR(100) DEFAULT 'Default Key',
  rate_limit_per_min INT DEFAULT 60,
  allowed_models JSON NULL,
  is_active BOOLEAN DEFAULT TRUE,
  last_used_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)

orders (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) FOREIGN KEY -> users(id),
  amount_idr INT NOT NULL,
  tokens_purchased BIGINT NOT NULL,
  package_tier ENUM('free', 'pro') NOT NULL,
  payment_method VARCHAR(32) DEFAULT 'qris',
  status ENUM('pending', 'paid', 'expired', 'failed') DEFAULT 'pending',
  paid_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)

usage_logs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  api_key_id VARCHAR(64) NULL,
  user_id VARCHAR(64) NOT NULL,
  model VARCHAR(100) NOT NULL,
  prompt_tokens INT DEFAULT 0,
  completion_tokens INT DEFAULT 0,
  total_tokens INT DEFAULT 0,
  latency_ms INT DEFAULT 0,
  status_code INT DEFAULT 200,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

---

## 4. Mekanisme Perhitungan Biaya

Tidak ada multiplier. Setiap request AI dihitung dengan rasio yang diturunkan langsung dari tarif `$/1M` yang tampil di kartu model:

$$\text{Token Terpotong} = \lceil (\text{Prompt Tokens} + \text{Completion Tokens}) \times \text{Rasio Tarif} \rceil$$

$$\text{Rasio Tarif} = \max\left(0.05,\ \frac{\text{Input}\,\$ + \text{Output}\,\$}{1.37}\right)$$

`1.37` = baseline DeepSeek Flash (\$0.27 in + \$1.10 out), sehingga rasio `1.0` berarti 1 token usage memotong 1 token saldo.

| Model | Tarif ($/1M) | Rasio |
|---|---|---|
| Atria-Dawn-Preview | \$0.00 + \$0.00 | `0.05` (floor anti-abuse) |
| DeepSeek V4.1 Flash | \$0.27 + \$1.10 | `1.00` |
| Claude Haiku 4.5 | \$0.25 + \$1.25 | `1.10` |
| Gemini 2.0 Flash | \$0.075 + \$0.30 | `0.27` |
| DeepSeek R1 | \$0.55 + \$2.19 | `2.00` |
| GPT-4o | \$2.50 + \$10.00 | `9.12` |
| Claude Sonnet 4.5 | \$3.00 + \$15.00 | `13.14` |
| Claude Opus | \$15.00 + \$75.00 | `65.69` |

Sumber tunggal: `getModelPricing()` & `getCostRatio()` di `lib/model-pricing.ts` — angka yang dirender di kartu model dan angka yang dipotong tidak bisa berbeda.

Pemotongan saldo dieksekusi secara atomik di TiDB menggunakan `GREATEST(0, balance_tokens - ?)`.

---

## 5. Keamanan & Kepatuhan Arsitektur

1. **Aturan 200 Baris Kode**: Setiap file komponen TypeScript/MJS dipecah menjadi modul fungsional kecil.
2. **Timing Safe Verification**: Password verifikasi scrypt memakai `crypto.timingSafeEqual` untuk mencegah side-channel timing attacks.
3. **Sliding Window Rate Limiter**: Rate limit per menit menghalangi DoS & konsumsi kuota berlebih.
4. **Isolasi Lingkungan**: Edge Cloudflare tidak menyimpan file `.env`, melainkan encrypted secrets terkelola.
