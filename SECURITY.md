# Security Architecture 🛡️

Standar keamanan TokoAI: enkripsi kredensial, isolasi environment, dan mitigasi risiko produksi.

---

## 1. Manajemen Rahasia (Secrets)

### Aturan: kredensial TIDAK pernah masuk git

`.env` **wajib** masuk `.gitignore` dan tidak boleh pernah di-commit:

```gitignore
.env
.env*.local
```

Kredensial yang hidup di `.env` lokal:
| Variabel | Isi | Konsekuensi jika bocor |
|---|---|---|
| `DATABASE_URL` | Connection string TiDB (berisi password root) | Akses penuh baca/hapus semua tabel |
| `TIDB_PASSWORD` | Password TiDB | Sama seperti di atas |
| `NINEROUTER_API_KEY` | Master key 9Router (lama) | Pemakaian kuota model atas nama Anda |
| `NINEROUTER_API_KEY_2` | Master key 9Router (aktif) | Sama seperti di atas |

### Verifikasi berkala

Cek `.env` tidak ter-track:
```bash
git ls-files | grep -E "^\.env"      # harus kosong
git log --all --oneline -- .env      # harus kosong
```

Cek nilai rahasia tidak ada di seluruh history:
```bash
DBPW=$(grep '^DATABASE_URL' .env | cut -d: -f3 | cut -d@ -f1)
git log --all -S "$DBPW" --oneline   # harus kosong
```

Kalau perintah di atas pernah mengeluarkan output → **rotasi kredensial itu sekarang**.

---

## 2. Secret Environment di Cloudflare Worker

Worker **tidak** membaca `.env`. Rahasia disimpan sebagai **encrypted secret** di Cloudflare
(Write-only: nilainya tidak bisa dibaca kembali, hanya bisa ditimpa atau dihapus).

```bash
npm run secrets:sync                     # .env -> secret Worker
npx wrangler secret list --name kiosai   # hanya menampilkan NAMA, bukan nilai
```

> Jangan taruh kredensial di `[vars]` `wrangler.toml` — nilai `vars` terlihat plaintext
> di dashboard dan ikut ter-commit bila konfigurasi ada di repo.

Cara memverifikasi secret aktif tanpa membocorkan isinya: panggil endpoint yang memakainya.
```bash
curl https://kiosai.dhanisepeda.workers.dev/api/health
# database.status == "connected"  -> DATABASE_URL valid
```

Skrip `scripts/sync-worker-secrets.mjs` memakai OAuth token wrangler dari
`%APPDATA%/xdg.config/.wrangler/config/default.toml`. File itu **di luar repo** dan
hanya bisa dibaca user lokal — jangan pernah disalin ke dalam project.

---

## 3. Enkripsi Data Aplikasi

### API Key Pengguna (`kios-...`)
- Format plaintext: `kios-<32 hex>` (hanya ditampilkan **sekali** saat dibuat).
- Yang disimpan di TiDB: **SHA-256 hash** dari key (`api_keys.key_hash`).
- Prefiks 12 karakter disimpan terpisah (`key_prefix`) hanya untuk tampilan.
- Key bocor di database tidak bisa dipakai: hash tidak dapat dibalik.

### Password Pengguna
- Hash dengan **`scrypt`** (`N=16384, r=8, p=1`, 64-byte digest) + salt acak 16 byte per user.
- Format tersimpan: `<salt hex>:<hash hex>`.
- Verifikasi memakai `crypto.timingSafeEqual` untuk mencegah timing attack.
- Kolom `username` (untuk admin) **NULL** bagi user biasa — tidak bisa dipakai login.

### Sesi Browser
- Sesi server-side menggunakan **cookie HttpOnly bertanda tangan HMAC-SHA256** (`kiosai_session`), ditandatangani dengan `SESSION_SECRET` (disinkronkan ke Cloudflare Worker).
- Seluruh endpoint privat (`/api/user`, `/api/keys`, `/api/orders`, `/api/orders/pay`, `/api/analytics`) membaca `userId` dari cookie sesi terverifikasi, bukan dari query parameter atau request body klien (mencegah IDOR).
- `AuthGuard` di frontend memblokir `/dashboard` jika sesi tidak ada, dan re-check pada event `focus`/`pageshow`.
- Logout (`POST /api/auth/logout`) mencabut cookie sesi dengan `maxAge: 0`.

---

## 4. Rate Limiting & Kuota

- Sliding-window per menit per API key (`api_keys.rate_limit_per_min`; pilihan 30/60/120).
- Header standar dikirim balik: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`.
- Melebihi batas → HTTP 429.
- **Batasan yang diketahui:** penghitung disimpan **in-memory**, sehingga reset setiap
  Worker/instance restart dan tidak dibagi antar-instance. Untuk produksi serius pindahkan
  ke Durable Object atau Redis (Upstash).
- Saldo token dicek sebelum request; saldo habis → HTTP 402/403.

---

## 5. Pembatasan Akses Model per Tier

- Tier `free` diblokir dari model Pro → HTTP 403 `tier_restricted`.
- Tier `pro` membuka seluruh model AI yang tersedia di gateway.
- Anotasi tier dihitung dari nama model, **bukan** dari klaim klien.
- Hanya ada dua tier: `free` dan `pro`. Nilai tier lama (`bronze`/`silver`/`gold`) sudah dimigrasi ke `pro` via `npm run migrate:tiers`.

---

## 6. Webhook Pembayaran

- Endpoint `POST /api/payment/webhook` mendukung validasi ganda:
  1. **DOKU Checkout Webhook**: Memvalidasi signature HMAC-SHA256 (`HMACSHA256=...`) berbasis `Client-Id`, `Request-Id`, `Request-Timestamp`, `Request-Target`, dan SHA-256 base64 digest dari request body menggunakan `DOKU_SECRET_KEY`.
  2. **Internal/Test Webhook**: Memvalidasi `x-callback-signature` menggunakan `PAYMENT_WEBHOOK_SECRET` dengan penolakan fail-closed.
- **Idempotency**: order dengan status `paid` tidak diproses dua kali (mencegah double-credit).
- **Match-Vesting**: Bonus brankas dibuka secara proporsional sesuai nominal token yang dibeli (mencegah eksploitasi arbitrage).

---

## 7. Risiko Upstream yang Harus Disadari

- Model `ag/*` (Antigravity/Gemini) memakai **akun OAuth pribadi** di 9Router.
  Hanya untuk uji internal — **jangan dijual** ke pelanggan.
- Default demo `tokenharbor/deepseek-v4.1-flash:free` memakai pool gratis pihak ketiga;
  kuota bisa habis atau dicabut tanpa pemberitahuan.
- Sebelum komersial: pakai upstream yang secara eksplisit mengizinkan reseller, dan baca ToS-nya.
- Saat menjual akses, Anda bertanggung jawab atas kepatuhan ToS semua provider di belakang 9Router.

---

## 8. Checklist Sebelum Produksi Komersial

- [ ] Repo sudah **private**, atau dipastikan tidak ada kredensial di history
- [ ] Rotasi `DATABASE_URL`, `TIDB_PASSWORD`, dan master key 9Router bila pernah tampil di chat/log
- [ ] Ganti sesi `localStorage` → cookie HttpOnly bertanda tangan
- [ ] Pindahkan rate limit dari in-memory → Durable Object / Redis
- [ ] Integrasi payment gateway nyata (Midtrans/Tripay) + verifikasi signature produksi
- [ ] Aktifkan Cloudflare Access di belakang tunnel agar 9Router tidak terbuka publik
- [ ] Pasang uptime monitor pada `GET /api/health`
- [ ] Batasi `allowed_models` per key bila menjual paket terbatas
- [ ] Catat & tampilkan biaya overhead prompt upstream secara transparan ke pembeli (lihat PRD §9)