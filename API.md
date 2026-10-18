# TokoAI API Reference 📖

Dokumentasi spesifikasi endpoint REST & OpenAI-Compatible Gateway TokoAI (`https://tokoai.my.id`).

---

## 1. Otentikasi & Header Standar

### Gateway AI (`/v1/*`)
Semua pemanggilan gateway AI mewajibkan header:
```http
Authorization: Bearer kios-<...32hex>
Content-Type: application/json
```

### Dashboard REST API (`/api/*`)
Semua endpoint privat (`/api/user`, `/api/keys`, `/api/orders`, `/api/analytics`) diotentikasi secara aman menggunakan **Cookie HttpOnly bertanda tangan HMAC-SHA256** (`kiosai_session`). Parameter `userId` dari klien tidak lagi diperlukan/diabaikan server untuk mengeliminasi celah IDOR.

### Header Respons Rate Limit
| Header | Tipe | Deskripsi |
|---|---|---|
| `X-RateLimit-Limit` | integer | Batas request per menit untuk API key ini |
| `X-RateLimit-Remaining` | integer | Sisa kuota request dalam window 60 detik berjalan |
| `X-RateLimit-Reset` | integer | Sisa detik hingga window rate limit direset |
| `X-Quota-Warning` | string | Bernilai `low_balance` jika saldo akun < 20.000 token |

---

## 2. OpenAI-Compatible Gateway

### `POST /v1/chat/completions`
Membuat inferensi teks (chat completion) dengan dukungan JSON dan streaming SSE.

**Request Body:**
```json
{
  "model": "tokenharbor/deepseek-v4.1-flash:free",
  "messages": [
    { "role": "system", "content": "Jawab singkat." },
    { "role": "user", "content": "Halo!" }
  ],
  "stream": false,
  "max_tokens": 150
}
```

**Response (Non-streaming HTTP 200):**
```json
{
  "id": "chatcmpl-xxx",
  "object": "chat.completion",
  "model": "deepseek-v4.1-flash",
  "choices": [
    {
      "index": 0,
      "message": { "role": "assistant", "content": "Halo, ada yang bisa dibantu?" },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 820,
    "completion_tokens": 12,
    "total_tokens": 832
  }
}
```

**Response (Streaming SSE `stream: true`):**
```http
Content-Type: text/event-stream; charset=utf-8

data: {"choices":[{"delta":{"content":"Halo"}}]}
...
data: {"usage":{"prompt_tokens":820,"completion_tokens":12,"total_tokens":832}}
data: [DONE]
```

### `GET /v1/models`
Mengambil daftar model aktif dari 9Router beserta tier aksesnya.
Field `id` memuat model ID sistem lengkap (misal `tokenharbor/deepseek-v4.1-flash:free`), sedangkan `name` memuat nama bersih untuk tampilan UI (`deepseek-v4.1-flash`).

**Resolusi Alias Otomatis:**
Gateway secara transparan memetakan nama model standar industri ke rute aktif terverifikasi:
- `claude-3.7-sonnet` $\rightarrow$ `ag/claude-sonnet-4-6`
- `gpt-4o` $\rightarrow$ `cx/gpt-6-luna`
- `gemini-2.0-flash` $\rightarrow$ `ag/gemini-3.8-flash-high`
- `deepseek-r1` $\rightarrow$ `cf/@cf/deepseek-ai/deepseek-r1-distill-qwen-32b`
- `llama-3.3-70b` $\rightarrow$ `cf/@cf/meta/llama-3.3-70b-instruct-fp8-fast`
- `deepseek-v4.1-flash` $\rightarrow$ `tokenharbor/deepseek-v4.1-flash:free`
- `atria` $\rightarrow$ `atria/Atria-Dawn-Preview`

**Response (HTTP 200):**
```json
{
  "object": "list",
  "data": [
    {
      "id": "atria/Atria-Dawn-Preview",
      "name": "Atria-Dawn-Preview",
      "required_tier": "free",
      "accessible": true
    },
    {
      "id": "tokenharbor/deepseek-v4.1-flash:free",
      "name": "deepseek-v4.1-flash",
      "required_tier": "pro",
      "accessible": true
    }
  ]
}
```

---

## 3. Profil Pengguna & Session Key (`/api/user`)

### `GET /api/user?id=:id`
Mengambil data profil pengguna, saldo token terkini, 10 riwayat log penggunaan terakhir, dan `playgroundKey` bertanda tangan HMAC.

**Response (HTTP 200):**
```json
{
  "user": {
    "id": "usr_admin_dhani",
    "email": "adminfordhani@kiosai.id",
    "username": "adminfordhani",
    "full_name": "Admin Dhani",
    "tier": "pro",
    "balance_tokens": "99991351"
  },
  "recentUsage": [...],
  "playgroundKey": "kios-pg-usr_admin_dhani.a1b2c3d4..."
}
```

---

## 4. Manajemen API Key (`/api/keys`)

### `GET /api/keys?userId=:id`
Mengambil daftar API key aktif milik pengguna (hanya prefix yang ditampilkan).

### `POST /api/keys`
Membuat API key baru. Plaintext key hanya dikembalikan **sekali** pada respon ini.
```json
{
  "userId": "usr_xxx",
  "name": "Production Bot",
  "rateLimit": 60
}
```

### `DELETE /api/keys/:id`
Mencabut (soft-delete) API key agar tidak dapat digunakan lagi.

---

## 4. Pembelian & Order (`/api/orders`)

### `POST /api/orders`
Membuat tagihan pembelian paket token baru dengan Smart QRIS & Kode Unik.
- Paket: `free` (Rp 0 / 2.5M token bonus akun baru), `pro_25k` (Rp 25.000 / 100M token), `pro_100k` (Rp 100.000 / 600M token), `pro_150k` (Rp 150.000 / 1.000M token).
- Respons menyertakan `amountIdr` (nominal pasti dengan kode unik), `qrisUrl` (gambar QRIS dinamis EMVCo), dan `paymentUrl` (DOKU Checkout resmi jika aktif).

### `POST /api/orders/verify-receipt`
Verifikasi instan foto struk transfer / screenshot pembayaran e-wallet menggunakan Gemini 3.8 Flash Vision OCR.
- Request Body: `{ "orderId": "uuid", "imageBase64": "data:image/jpeg;base64,...", "mimeType": "image/jpeg" }`
- AI mengekstrak nominal, status, ID transaksi, dan nama merchant. Memvalidasi nominal hingga digit kode unik dan mencegah penggunaan struk ganda (Anti-Replay).

### `POST /api/orders/pay`
Pemeriksaan status pelunasan pesanan atau aktivasi paket Free (Rp 0). Untuk paket berbayar, pelunasan hanya diproses setelah pembayaran terverifikasi via AI Vision OCR struk atau webhook gateway berotentikasi.

### `POST /api/payment/webhook`
Endpoint penerima callback payment gateway otomatis (DOKU Checkout & internal webhook) dengan verifikasi HMAC SHA-256 fail-closed dan proteksi idempotensi transaksi.

---

## 5. Diagnostik & Sistem

### `GET /api/health`
Status uptime dan latensi real-time database TiDB dan upstream 9Router.
```json
{
  "status": "healthy",
  "database": { "status": "connected", "latencyMs": 120 },
  "upstream": { "status": "connected", "latencyMs": 1800 },
  "timestamp": "2026-10-11T13:30:00.000Z"
}
```

### `GET /api/analytics?userId=:id`
Ringkasan total token, total request, rata-rata latensi, breakdown penggunaan per model, dan 20 log request terbaru.

---

## 6. Format Kode Error

| Status | Code | Keterangan |
|---|---|---|
| `400` | `missing_model` / `invalid_json` | Parameter body tidak valid |
| `401` | `invalid_key` / `insufficient_balance` | API key salah atau saldo token habis |
| `403` | `tier_restricted` | Model memerlukan paket langganan lebih tinggi |
| `429` | `rate_limit_exceeded` | Melebihi batas request per menit (cek `Retry-After`) |
| `502` | `bad_gateway` | Upstream 9Router tidak terjangkau |
