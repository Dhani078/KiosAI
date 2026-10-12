# KiosAI System Architecture 🏗️

Dokumentasi arsitektur teknis mendalam untuk platform gateway AI dan pasar token KiosAI.

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
|     - Validasi izin tier akses model (Bronze/Silver/Gold)   |
|                                                             |
|  2. /v1/models (Model Discovery)                            |
|     - Sinkronisasi dinamis dari upstream 9Router            |
|     - Anotasi required_tier & accessible status             |
|                                                             |
|  3. /api/* (Backend Services)                               |
|     - /api/auth (Login scrypt / Register 100k trial)        |
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
  tier ENUM('bronze', 'silver', 'gold') DEFAULT 'bronze',
  balance_tokens BIGINT DEFAULT 100000,
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
  package_tier ENUM('bronze', 'silver', 'gold') NOT NULL,
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

## 4. Mekanisme Multiplier & Perhitungan Biaya

Setiap request AI dihitung berdasarkan rumus:
$$\text{Token Terpotong} = \lceil (\text{Prompt Tokens} + \text{Completion Tokens}) \times \text{Multiplier} \rceil$$

| Tier Model | Multiplier | Contoh Model |
|---|---|---|
| **Bronze** | `1.0×` | DeepSeek V4.1 Flash, Gemini 2.0 Flash, Claude Haiku |
| **Silver** | `2.0×` | Claude 3.7 Sonnet, GPT-4o, DeepSeek R1 |
| **Gold** | `4.0×` | Claude 3.5/3.7 Opus, Combo Models |

Pemotongan saldo dieksekusi secara atomik di TiDB menggunakan `GREATEST(0, balance_tokens - ?)`.

---

## 5. Keamanan & Kepatuhan Arsitektur

1. **Aturan 200 Baris Kode**: Setiap file komponen TypeScript/MJS dipecah menjadi modul fungsional kecil.
2. **Timing Safe Verification**: Password verifikasi scrypt memakai `crypto.timingSafeEqual` untuk mencegah side-channel timing attacks.
3. **Sliding Window Rate Limiter**: Rate limit per menit menghalangi DoS & konsumsi kuota berlebih.
4. **Isolasi Lingkungan**: Edge Cloudflare tidak menyimpan file `.env`, melainkan encrypted secrets terkelola.
