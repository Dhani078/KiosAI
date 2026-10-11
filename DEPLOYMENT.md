# KiosAI Deployment Guide 🚀

Panduan deploy produksi KiosAI ke Vercel dengan database TiDB Cloud Serverless dan upstream 9Router 24 jam.

---

## 1. Arsitektur Produksi ($0 Biaya Server)

```
[Pengguna / SDK]
       │ (HTTPS)
       ▼
[Vercel Edge/Serverless (Region Tokyo - hnd1)]
  ├── Database: TiDB Cloud Serverless (AWS Tokyo ap-southeast-1 / ap-northeast-1)
  └── Reverse Proxy ke Upstream 9Router
       │
       ▼ (HTTPS via Cloudflare Tunnel)
[Cloudflare Tunnel]
       │
       ▼
[9Router AI Gateway (STB Armbian / VPS Murah / Laptop)]
  └── http://localhost:20128 (Model Providers: TokenHarbor, Claude, Gemini, dll)
```

---

## 2. Prasyarat

1. Akun **TiDB Cloud Serverless** (Gratis 5 GB storage, spending limit $0.00).
2. Akun **Vercel** untuk hosting Next.js 15.
3. Node.js 20+ di komputer lokal.
4. **cloudflared CLI** untuk Cloudflare Tunnel.

---

## 3. Langkah 1: Migrasi Database TiDB

Pastikan koneksi TiDB siap dan migrasikan struktur tabel:
```bash
# Uji koneksi ping TiDB
npm run migrate
```
Perintah ini akan membuat tabel `users`, `api_keys`, `orders`, `usage_logs`, dan akun seed `usr_kiosai_demo`.

---

## 4. Langkah 2: Setup Cloudflare Tunnel untuk 9Router (24 Jam)

Agar Vercel dapat memanggil 9Router lokal tanpa IP publik atau port forward:

1. **Jalankan tunnel instan (Quick Tunnel):**
```bash
cloudflared tunnel --url http://localhost:20128
```
Anda akan mendapatkan URL publik HTTPS, contoh:
`https://random-subdomain.trycloudflare.com`

2. **Atau gunakan Named Tunnel (Permanen untuk STB/VPS):**
```bash
cloudflared tunnel login
cloudflared tunnel create kiosai-router
cloudflared tunnel route dns kiosai-router router.domainmu.com
cloudflared tunnel run --url http://localhost:20128 kiosai-router
```

---

## 5. Langkah 3: Deploy ke Vercel

1. **Login & Deploy via Vercel CLI:**
```bash
npx vercel --prod
```

2. **Atur Environment Variables di Vercel Dashboard:**
Masuk ke **Project Settings -> Environment Variables**:

| Variable | Nilai | Keterangan |
|---|---|---|
| `DATABASE_URL` | `mysql://...` | Connection string TiDB Cloud |
| `NINEROUTER_URL` | `https://url-cloudflare-tunnel-anda` | URL publik HTTPS 9Router |
| `NINEROUTER_API_KEY_2` | `sk-ecc25b1d...` | API Key master 9Router |
| `PAYMENT_WEBHOOK_SECRET` | `secret_acak_anda` | Secret untuk validasi HMAC webhook |

*Catatan: `vercel.json` telah dikonfigurasi untuk region Tokyo (`hnd1`) agar memiliki latensi minimal ke database TiDB Cloud.*

---

## 6. Langkah 4: Verifikasi Kesiapan Produksi

Jalankan perintah audit pra-deploy:
```bash
npm run verify
```
Skrip ini akan otomatis memeriksa:
- Ketersediaan seluruh environment variables.
- Koneksi ping & integritas tabel TiDB Cloud Serverless.
- Ketersediaan endpoint upstream 9Router.
- Kepatuhan aturan moduler (100% file <= 200 baris).

---

## 7. Pemantauan & Status Live

Setelah aplikasi aktif di Vercel:
- Buka URL deployment Vercel Anda di browser.
- Titik indikator di Header akan otomatis menampilkan status hijau `Live Gateway`.
- Endpoint `GET /api/health` dapat dipasang di uptime monitor (seperti UptimeRobot / BetterStack) dengan interval 1-5 menit.
