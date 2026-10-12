# KiosAI API Reference 📖

Dokumentasi spesifikasi endpoint REST & OpenAI-Compatible Gateway KiosAI.

---

## 1. Otentikasi & Header Standar

Semua pemanggilan gateway AI mewajibkan header:
```http
Authorization: Bearer kios-<token_rahasia>
Content-Type: application/json
```

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

**Response (HTTP 200):**
```json
{
  "object": "list",
  "data": [
    {
      "id": "tokenharbor/deepseek-v4.1-flash:free",
      "name": "deepseek-v4.1-flash",
      "required_tier": "bronze",
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
    "tier": "gold",
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
Membuat tagihan pembelian paket token baru.
- Paket: `free` (Rp 0 / 5M token trial), `starter` (Rp 5.000 / 15M token), `bronze` (Rp 25.000 / 100M token), `silver` (Rp 100.000 / 600M token), `gold` (Rp 150.000 / 1.000M token).

### `POST /api/orders/pay`
Konfirmasi pembayaran simulasi. Menambah saldo token dan mengupgrade tier pengguna secara real-time di TiDB.

### `POST /api/payment/webhook`
Endpoint penerima callback payment gateway otomatis (Midtrans/Tripay) dengan verifikasi HMAC SHA-256 dan proteksi idempotensi transaksi.

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
