# KiosAI Deployment Guide 🚀

Panduan deploy produksi KiosAI: **Cloudflare Workers** (frontend + API) + **TiDB Cloud Serverless** + **Cloudflare Tunnel** ke 9Router.

---

## 1. Arsitektur Produksi ($0 Biaya Server)

```
[Pengguna / SDK OpenAI]
       │ (HTTPS)
       ▼
[Cloudflare Worker "kiosai"  —  kiosai.<subdomain>.workers.dev]
  ├── Next.js 15 via @opennextjs/cloudflare (SSR + API routes)
  ├── Secret: DATABASE_URL        → TiDB Cloud Serverless (Tokyo)
  ├── Secret: NINEROUTER_URL      → URL tunnel HTTPS (diisi otomatis)
  └── Secret: NINEROUTER_API_KEY_2
       │
       ▼ (HTTPS, Cloudflare Tunnel)
[cloudflared di komputer/STB]
       │
       ▼
[9Router — http://localhost:20128]
  └── Provider: TokenHarbor, Claude, Gemini, dll
```

**Kenapa tunnel wajib:** Worker berjalan di edge Cloudflare. `http://127.0.0.1:20128`
di dalam Worker menunjuk ke mesin edge, bukan laptop Anda → Cloudflare balas **error 1003**.
9Router harus punya URL HTTPS publik.

---

## 2. Secret Worker (Penyebab error `DATABASE_URL environment variable is not defined`)

Worker **tidak** membaca file `.env`. Semua env harus dipasang sebagai secret.

Cek isi secret Worker saat ini:
```bash
npx wrangler secret list --name kiosai
```
Kalau hasilnya `[]`, Worker belum punya env sama sekali — itu penyebab error di atas.

Sinkronkan otomatis dari `.env` lokal:
```bash
npm run secrets:sync
```

Atau manual satu per satu:
```bash
npx wrangler secret put DATABASE_URL --name kiosai
npx wrangler secret put NINEROUTER_API_KEY_2 --name kiosai
```

> **Penting:** `NINEROUTER_URL` **jangan** diisi `http://127.0.0.1:20128` — nilainya harus URL tunnel.
> `npm run secrets:sync` otomatis melewati nilai loopback untuk mencegah kesalahan ini.

---

## 3. Langkah 1: Migrasi Database TiDB

```bash
npm run migrate
```
Membuat tabel `users` (termasuk kolom `username`), `api_keys`, `orders`, `usage_logs`.

Seed akun admin:
```bash
node --env-file=.env scripts/seed-admin.mjs
```
Membuat `adminfordhani` (username, tier Gold, 100 juta token).

---

## 4. Langkah 2: Tunnel 9Router + Sync Otomatis

```bash
npm run tunnel
```

Script `scripts/tunnel-sync.mjs` akan:
1. Menjalankan `cloudflared tunnel --url http://localhost:20128`
2. Menunggu URL `https://<acak>.trycloudflare.com` muncul
3. Memverifikasi tunnel benar-benar menembus ke 9Router
4. Memasang URL itu ke secret `NINEROUTER_URL` milik Worker `kiosai`

Biarkan proses ini berjalan. **URL quick tunnel berubah setiap restart**, jadi kalau
komputer reboot, jalankan `npm run tunnel` lagi (bukan `secrets:sync` saja).

Verifikasi:
```bash
curl https://kiosai.dhanisepeda.workers.dev/api/health
# {"status":"healthy","database":{"status":"connected"...},"upstream":{"status":"connected"...}}
```

### Named Tunnel (permanen, butuh domain)

Quick tunnel gratis tapi URL-nya berganti. Untuk URL tetap:
```bash
cloudflared tunnel login
cloudflared tunnel create kiosai-router
cloudflared tunnel route dns kiosai-router router.domainmu.com
cloudflared tunnel run kiosai-router
```
Lalu set `NINEROUTER_URL=https://router.domainmu.com` (sekali saja, tidak berubah lagi).

---

## 5. Langkah 3: Deploy Worker

```bash
npm run build
npx wrangler deploy --name kiosai
```

Build metadata Worker yang benar:
- Compatibility date `2026-10-06`, flag `global_fetch_strictly_public`
- Handler `fetch` + named handlers `BucketCachePurge`, `DOQueueHandler`, `DOShardedTagCache`
  (ciri khas `@opennextjs/cloudflare`)
- Bindings: `ASSETS`, `IMAGES`, `WORKER_SELF_REFERENCE`

---

## 6. Langkah 4: Verifikasi Kesiapan Produksi

```bash
npm run verify      # cek env lokal, TiDB, 9Router, batas 200 baris
npm run test:e2e    # 10 alur gateway
```

Uji alur live dari luar:
```bash
# 1. Login
curl -X POST https://kiosai.dhanisepeda.workers.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"adminfordhani","password":"dhaniforadmin"}'

# 2. Buat API key (pakai id dari respons di atas)
curl -X POST https://kiosai.dhanisepeda.workers.dev/api/keys \
  -H "Content-Type: application/json" \
  -d '{"userId":"usr_admin_dhani","name":"Test","rateLimit":60}'

# 3. Chat completion
curl -X POST https://kiosai.dhanisepeda.workers.dev/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer kios-<key>" \
  -d '{"model":"tokenharbor/deepseek-v4.1-flash:free","messages":[{"role":"user","content":"Halo"}]}'
```

---

## 7. Pemantauan

- `GET /api/health` → status TiDB + 9Router dengan latensi. Pasang di UptimeRobot (interval 1-5 menit).
- Indikator di Header dashboard menampilkan status live + tooltip latensi.
- Log Worker: `npx wrangler tail kiosai`

---

## 8. Troubleshooting

| Gejala | Penyebab | Fix |
|---|---|---|
| `DATABASE_URL environment variable is not defined` | Secret Worker kosong | `npm run secrets:sync` |
| Health `upstream: http_403`, chat balas `error code: 1003` | `NINEROUTER_URL` masih loopback | `npm run tunnel` |
| Chat balas `{"error":"API key required for remote API access"}` | `NINEROUTER_API_KEY_2` belum di-set di Worker | `npm run secrets:sync` |
| Health `degraded` dengan DB `connected` | 9Router lokal mati / tunnel putus | Cek `curl http://localhost:20128/v1/models`, restart `npm run tunnel` |
| URL `*.workers.dev` tidak resolve | Salah ejaan subdomain | Cek `wrangler deployments list --name kiosai` |

> Catatan: subdomain akun ini adalah **`dhanisepeda`** (pakai `e`), bukan `dhanispeda`.