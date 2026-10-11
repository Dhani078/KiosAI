# Troubleshooting Worker: error `env` kosong / upstream mati

Catatan lapangan (2026-10-11) saat memperbaiki Worker produksi `kiosai`.
Baca ini dulu sebelum menyalahkan konfigurasi Cloudflare.

---

## Gejala 1: `DATABASE_URL environment variable is not defined`

**Yang terlihat:** landing page dan halaman login tampil normal, tapi begitu submit
login muncul error merah `DATABASE_URL environment variable is not defined`.

**Bukan** karena: domain salah, akun Cloudflare salah, zone/DNS, atau Worker belum jalan.
Worker-nya sehat — hanya environment-nya kosong.

**Cek:**
```bash
npx wrangler secret list --name kiosai
```
Kalau hasilnya `[]`, itu penyebabnya. Worker **tidak** membaca `.env`.

**Fix:**
```bash
npm run secrets:sync
```

**Kenapa bisa kosong:** Worker ini memakai sumber deploy OpenNext
(`last_deployed_from: "wrangler"`, named handlers `BucketCachePurge` /
`DOQueueHandler` / `DOShardedTagCache`). Berkas `wrangler.toml` / `open-next.config.ts`
tidak ada di repo ini, jadi deploy terjadi dari working directory lain yang sudah hilang.
Secret tetap tersimpan di Cloudflare, jadi cukup di-set ulang.

Cara paling andal mengecek nilai secret tanpa membocorkan isinya:
```bash
curl "https://kiosai.dhanisepeda.workers.dev/api/health"
# database.status harus "connected"
```

---

## Gejala 2: `upstream: http_403` lalu chat balas `error code: 1003`

**Penyebab:** secret `NINEROUTER_URL` bernilai `http://127.0.0.1:20128`.

Worker berjalan di **edge Cloudflare**, bukan laptop Anda. `127.0.0.1` di dalam
Worker = mesin edge → `global_fetch_strictly_public` menolaknya, Cloudflare balas
**error 1003**.

**Fix:**
```bash
npm run tunnel
```

Script `scripts/tunnel-sync.mjs` menjalankan `cloudflared tunnel --url http://localhost:20128`,
menunggu URL `https://<acak>.trycloudflare.com`, memverifikasi tunnel menembus ke
9Router, lalu memasang URL itu sebagai secret `NINEROUTER_URL`.

> Quick tunnel **berganti URL setiap restart**. Setelah laptop/STB reboot, jalankan
> `npm run tunnel` lagi — bukan hanya `secrets:sync`.

---

## Gejala 3: chat balas `{"error":"API key required for remote API access"}`

Tunnel sudah tembus ke 9Router, tapi 9Router menolak karena tidak ada key.
Artinya secret `NINEROUTER_API_KEY_2` belum terpasang di Worker.

```bash
npm run secrets:sync
```

---

## Contoh lengkap sesi perbaikan

```bash
# 1. Cek kondisi
npx wrangler secret list --name kiosai        # -> []
curl https://kiosai.dhanisepeda.workers.dev/api/health
# {"status":"degraded","database":{"status":"error: DATABASE_URL environment variable is not defined"}}

# 2. Pasang secret
npm run secrets:sync
#   DATABASE_URL           HTTP 200  (len 105)
#   NINEROUTER_URL         DILEWATI (loopback tidak bisa diakses edge — pakai: npm run tunnel)
#   NINEROUTER_API_KEY_2   HTTP 200  (len 35)
#   NINEROUTER_API_KEY     HTTP 201

# 3. Tunnel + set URL otomatis
npm run tunnel
# Tunnel aktif: https://freeware-nutten-iron-select.trycloudflare.com

# 4. Verifikasi
curl https://kiosai.dhanisepeda.workers.dev/api/health
# {"status":"healthy","database":{"status":"connected"},"upstream":{"status":"connected"}}
```

---

## Catatan nama subdomain

Subdomain akun ini **`dhanisepeda`** (pakai `e`). `kiosai.dhanispeda.workers.dev`
tanpa `e` tidak resolve sama sekali — cek DoH kalau ragu:
```bash
curl -H "accept: application/dns-json" \
  "https://cloudflare-dns.com/dns-query?name=kiosai.dhanisepeda.workers.dev&type=A"
```

---

## Masih belum jelas? Waktu itu ~23:59, upstream 5 detik

Health check sempat melaporkan `error: The operation was aborted due to timeout`
karena timeout upstream di `app/api/health/route.ts` hanya 5 detik, sedangkan
tunnel + payload `/v1/models` (765 model) butuh ~2-4 detik dan bisa lebih saat
cold start. Sudah dinaikkan ke 12 detik.

Kalau upstream tetap timeout padahal `curl` dari laptop lancar, kemungkinan:
1. Tunnel mati / URL berubah → `npm run tunnel`
2. Laptop/STB yang menjalankan 9Router sedang suspend atau internetnya putus.
3. Payload model membesar — pertimbangkan endpoint upstream yang lebih ringan.