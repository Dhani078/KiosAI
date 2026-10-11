# KiosAI Security Policy & Architecture 🛡️

Dokumentasi standar keamanan, proteksi data, dan mitigasi risiko KiosAI Gateway.

---

## 1. Perlindungan API Key

- **Penyimpanan Ter-enkripsi (One-Way Hash)**:
  Kunci API yang dibuat berformat `kios-<32_hex_chars>`. Kunci plaintext **TIDAK PERNAH** disimpan di database.
  Yang tersimpan di TiDB adalah:
  - `key_hash`: Hash SHA-256 dari plaintext key (`VARCHAR(64)`).
  - `key_prefix`: 8 karakter pertama untuk identifikasi di dashboard (`VARCHAR(16)`).
- **One-Time Secret Reveal**:
  Kunci asli hanya ditampilkan satu kali saat pembuatan via `POST /api/keys`. Setelah modal ditutup, kunci asli tidak dapat dipulihkan kembali oleh admin maupun pengguna.
- **Pencabutan Instan (Revocation)**:
  Kunci yang dicabut langsung diset `is_active = FALSE` dan ditolak oleh proxy dalam hitungan milidetik.

---

## 2. Autentikasi Pengguna & Password Hashing

- **Algoritma `scrypt`**:
  Password pengguna di-hash menggunakan algoritma `crypto.scryptSync` (standar Node.js crypto native) dengan parameter resisten GPU.
- **Unique Cryptographic Salt**:
  Setiap password digabungkan dengan salt acak 16 byte (`crypto.randomBytes(16)`).
- **Format Penyimpanan**:
  Format penyimpanan di database: `<salt_hex>:<hash_hex>`.

---

## 3. Rate Limiting (Sliding Window)

- **Proteksi Brute-Force & DoS**:
  Setiap request API divalidasi dengan in-memory sliding window 60 detik per API key.
- **Dynamic Capacity**:
  Batas limit ditentukan per kunci (30, 60, atau 120 req/menit) dan ditegakkan secara real-time.
- **Standar RFC Rate Limiting**:
  Header `X-RateLimit-Limit`, `X-RateLimit-Remaining`, dan `X-RateLimit-Reset` selalu dikirimkan.
  Request yang melebihi kuota otomatis ditolak dengan status `HTTP 429 Too Many Requests` dan header `Retry-After`.

---

## 4. Model Tier Permission Gating

- **Hak Akses Model**:
  Pengguna dengan paket lebih rendah dicegah memanggil model tier lebih tinggi di level proxy (sebelum request diteruskan ke upstream 9Router):
  - **Bronze**: Terbatas pada model standar/ringan (`gemini-flash`, `deepseek-flash`, `haiku`).
  - **Silver**: Model penalaran & coding lanjutan (`gpt-4o`, `claude-3.5-sonnet`).
  - **Gold**: Seluruh model, termasuk flagship & unmetered combos.
- **Status Penolakan**:
  Pelanggaran hak akses langsung ditolak dengan `HTTP 403 Forbidden` (`tier_restricted`).

---

## 5. Keamanan Pembayaran & Idempotensi Webhook

- **Validasi Signature HMAC SHA-256**:
  Setiap notifikasi webhook pembayaran divalidasi tanda tangannya menggunakan secret `PAYMENT_WEBHOOK_SECRET`. Payload palsu atau termodifikasi langsung ditolak dengan `HTTP 401`.
- **Anti Double-Crediting (Idempotensi)**:
  Tabel `orders` memeriksa status pesanan sebelum menambahkan token. Jika pesanan sudah berstatus `paid`, request kedua diabaikan dengan respon sukses idempotent tanpa menambah saldo ganda.

---

## 6. Isolasi Upstream & Sanitasi Database

- **Zero Client Leakage**:
  API key master 9Router (`NINEROUTER_API_KEY_2`) disimpan secara eksklusif di environment server Next.js dan tidak pernah dikirim ke browser atau respon API client.
- **SQL Injection Prevention**:
  Semua interaksi database dengan TiDB Serverless menggunakan parameterized queries (`?` placeholder) via driver `@tidbcloud/serverless`. Tidak ada string concatenation SQL query manual.
