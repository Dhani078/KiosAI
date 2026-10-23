# KiosAI Session Handoff & Quick Resume 🚀

Dokumen ini dirancang agar setiap sesi AI atau pengembang dapat melanjutkan pekerjaan dalam hitungan detik tanpa kehilangan konteks.

---

## 1. Status Terkini Snapshot

| Komponen | Status | Keterangan |
|---|---|---|
| **Repository** | Clean, Up-to-Date | `https://github.com/Dhani078/KiosAI.git` (Branch `main`) |
| **Commit Terakhir** | `feat(payment)` | feat(payment): implement in-app DOKU QRIS iframe checkout, direct QRIS locking, and realtime polling cascade |
| **Worker Live** | `healthy` | `https://kiosai.dhanisepeda.workers.dev` (Subdomain `dhanisepeda` dengan huruf 'e') & `https://tokoai.my.id` |
| **Database** | `connected` | TiDB Cloud Serverless (AWS Tokyo `ap-southeast-1` / `ap-northeast-1`) |
| **Upstream 9Router** | `connected` | `http://127.0.0.1:20128` (69 model aktif terverifikasi 5x audit, 5 Free, 64 Pro) |
| **Batas Baris Kode** | 100% Patuh | 128 file sumber `.ts`/`.tsx`/`.mjs` `<= 200` baris |
| **UI Craft & Design** | Complete | `DESIGN.md`, 0 em-dash, Bento Grid, Hero Terminal, in-card QuickTestModal |
| **Dynamic QRIS DANA** | 7/7 Passed | `npm run test:qris` - EMVCo tag 54 nominal lock & CRC16-CCITT |
| **AI Receipt Verify** | 2/2 Passed | `npm run test:receipt` - Gemini 3.5 Flash Vision OCR, 4-layer anti-replay, digital forensics |
| **E2E Integration** | 11/11 Passed | `npm run test:e2e` lolos semua skenario |
| **Trend Analytics** | Complete | 7-day visual activity chart & Input/Output token split ratio |
| **DOKU Checkout** | 7/7 Passed | `npm run test:doku` — DOKU headers, signature HMAC-SHA256, and webhook verification |
| **Model Masking** | 13/13 Passed | `npm run test:defense` — Model identity persona guard, JSON & SSE cloaking, zero header leakage |
| **Security Regression** | 19/19 Passed | `npm run test:security` - Anti-bot register 403, IDOR eliminated, 4-layer anti-replay, 5MB boundary, HttpOnly HMAC |
| **Pricing Unit Test** | 21/21 Passed | `npm run test:pricing` — rasio directional input vs output + harga $/1M |
| **UI Audit** | 16/16 Passed | `npm run audit:ui` (4) + `npm run audit:dashboard` (12) — 0 overflow, 0 copy lama |
| **Tier Database** | 2 tier bersih | `free: 35`, `pro: 109` — saldo terlindungi non-negatif |

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
  - Password: **tidak ada di repo** — lihat `backups/ADMIN-CREDENTIALS.txt` (gitignored) atau `ADMIN_PASSWORD` di `.env`
- **User Uji**: buat sendiri via `POST /api/auth/register` (skrip e2e/chaos/billing melakukannya otomatis). Bonus 2.500.000 token saat daftar (tier `free`).

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
