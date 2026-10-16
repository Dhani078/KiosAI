# KiosAI Session Handoff & Quick Resume 🚀

Dokumen ini dirancang agar setiap sesi AI atau pengembang dapat melanjutkan pekerjaan dalam hitungan detik tanpa kehilangan konteks.

---

## 1. Status Terkini Snapshot

| Komponen | Status | Keterangan |
|---|---|---|
| **Repository** | Clean, Up-to-Date | `https://github.com/Dhani078/KiosAI.git` (Branch `main`) |
| **Commit Terakhir** | `0bd7361` | Feat(billing): implement directional token pricing, stream abort protection, concurrent stream limiter, and cline env preset |
| **Worker Live** | `healthy` | `https://kiosai.dhanisepeda.workers.dev` (Subdomain `dhanisepeda` dengan huruf 'e') |
| **Database** | `connected` | TiDB Cloud Serverless (AWS Tokyo `ap-southeast-1` / `ap-northeast-1`) |
| **Upstream 9Router** | `connected` | `http://127.0.0.1:20128` (65 model terverifikasi 5x audit, 1 Free, 64 Pro) |
| **Batas Baris Kode** | 100% Patuh | 88 file sumber `.ts`/`.tsx`/`.mjs` `<= 200` baris |
| **E2E Integration** | 11/11 Passed | `npm run test:e2e` lolos semua skenario |
| **Pricing Unit Test** | 17/17 Passed | `npm run test:pricing` — rasio directional input vs output + harga $/1M |
| **UI Audit** | 16/16 Passed | `npm run audit:ui` (4) + `npm run audit:dashboard` (12) — 0 overflow, 0 copy lama |
| **Tier Database** | 2 tier bersih | `free: 1`, `pro: 46` — legacy `bronze`/`silver`/`gold` sudah dimigrasi |

---

## 2. Checklist Cepat Melanjutkan Sesi (Resume in 30 Seconds)

Jika Anda baru membuka sesi baru, jalankan 3 perintah ini secara berurutan:

```bash
# 1. Pastikan dependensi dan build bersih
npx tsc --noEmit -p tsconfig.json

# 2. Jalankan audit kesiapan sistem (cek database, upstream, & batas baris)
npm run verify

# 3. Jalankan automated E2E test suite
npm run test:e2e
```

Jika ketiga perintah di atas menghasilkan status hijau / lulus, aplikasi dalam kondisi sehat 100%.

---

## 3. Kredensial Pengujian yang Tersedia

- **Admin Account**:
  - Identifier: `adminfordhani`
  - Password: `dhaniforadmin`
  - Tier: `pro` | Saldo: `100.000.000` token (berkurang nyata saat uji coba di Playground)
- **User Biasa (Contoh yang sudah terdaftar di TiDB)**:
  - Email: `live_test1@gmail.com`
  - Password: `rahasia123`
  - Tier: `pro` (dimigrasi dari `bronze`) | Bonus 2.500.000 token otomatis saat daftar (tier `free`)

---

## 4. Gotchas & Hal yang Perlu Diingat (Critical Knowledge)

1. **JANGAN MEROTASI/MENGUBAH API KEY**:
   - Master key 9Router di `.env` (`NINEROUTER_API_KEY_2`) dan kredensial Hermes **tidak boleh diubah**.
2. **CLOUDFLARE QUICK TUNNEL BERGANTI URL SETIAP RESTART**:
   - Jika komputer atau proses `cloudflared` mati, jalankan kembali:
     ```bash
     npm run tunnel
     ```
     Script ini otomatis memverifikasi tunnel dan memperbarui secret `NINEROUTER_URL` di Worker.
3. **WORKER TIDAK MEMBACA `.env`**:
   - Jika Anda mengubah variabel database di `.env`, jalankan `npm run secrets:sync` agar Worker menerima secret terbaru.
4. **PEMOTONGAN TOKEN PLAYGROUND DI WEB**:
   - Playground di dashboard menggunakan HMAC session key (`kios-pg-...`) yang terikat dengan user ID login. Token langsung terpotong nyata di TiDB dan tercatat pada menu **Statistik**.
5. **HISTORI CHAT PLAYGROUND TERSIMPAN**:
   - Chat tidak akan hilang saat pengguna berpindah tab (tersimpan di `sessionStorage`). Gunakan tombol **"Chat baru +"** untuk menghapus percakapan.
6. **EJAAN SUBDOMAIN WORKERS**:
   - Subdomain akun adalah **`dhanisepeda`** (pakai huruf `e`), **bukan** `dhanispeda`.

---

## 5. Peta File Utama

- `app/page.tsx` : Halaman muka publik (Landing Page).
- `app/dashboard/DashboardApp.tsx` : Shell utama dashboard workspace.
- `app/components/Sidebar.tsx` : Navigasi sidebar kiri (API Keys, Beli Token, Model, Playground, Statistik, Docs).
- `app/components/ModelsTab.tsx` : Tab katalog model AI dengan pencarian dan filter tier.
- `app/components/PlaygroundTab.tsx` : Antarmuka chat AI live terintegrasi HMAC session key.
- `app/components/AnalyticsTab.tsx` : Dashboard analitik dan riwayat transaksi/request TiDB.
- `lib/session-key.ts` : Generator dan verifikator HMAC playground session token.
- `lib/keys.ts` : Engine validasi API key, pemotongan saldo, dan pengecekan tier.
- `scripts/verify-deployment.mjs` : Skrip audit 6 langkah kesiapan produksi (`npm run verify`).
- `scripts/test-e2e.mjs` : Skrip pengujian integrasi E2E 10 skenario (`npm run test:e2e`).
- `scripts/tunnel-sync.mjs` : Skrip otomatisasi tunnel 9Router ke Cloudflare Worker (`npm run tunnel`).
