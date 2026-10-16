# AGENT.md — KiosAI Autonomous Agent Operating Manual 🤖

Dokumen ini adalah sumber kebenaran (source of truth) utama bagi AI agent untuk melanjutkan pekerjaan di proyek KiosAI di sesi apa pun tanpa perlu menebak atau bertanya ulang.

---

## 1. Identitas & Gambaran Proyek

- **Nama Proyek**: KiosAI
- **Deskripsi**: Gateway API AI & Pasar Token lokal kompatibel OpenAI SDK, bayar QRIS Rupiah, terhubung ke 9Router lokal dan database TiDB Cloud Serverless.
- **Repository**: `https://github.com/Dhani078/KiosAI.git` (Branch `main`)
- **Lokasi Lokal**: `E:/Hermesproject/KiosAI`
- **Live Worker**: `https://kiosai.dhanisepeda.workers.dev` (Subdomain `dhanisepeda`, jangan salah ketik tanpa 'e')
- **Author/Git Commit**: `Muhammad Rizki Ramadhani <dhanisepeda@gmail.com>` (Wajib email ini agar kontribusi GitHub hijau)

---

## 2. Aturan Keras & Pantangan (Strict Rules)

1. **JANGAN PERNAH MENGUBAH API KEY**:
   - Dilarang memodifikasi atau merotasi API key master di `.env` (`NINEROUTER_API_KEY`, `NINEROUTER_API_KEY_2`) tanpa izin eksplisit.
   - Kredensial di Hermes dan `.env` harus dijaga 100% utuh.
2. **BATAS MAKSIMAL 200 BARIS PER FILE**:
   - Semua file kode sumber (`.ts`, `.tsx`, `.mjs`) **wajib <= 200 baris**.
   - Jika mendekati 200 baris, pecah ke subkomponen atau modul helper di `lib/`.
   - Verifikasi selalu dengan `npm run verify`.
3. **ZERO DUMMY DATA**:
   - Semua saldo, order, API key, log inferensi, dan pengguna **100% tersambung ke database TiDB** (`kiosai.*`).
   - Tidak ada mock data atau hardcoded user ID lama (`usr_9e6140b4...` dilarang).
4. **UPDATE DOKUMENTASI SETIAP PERUBAHAN**:
   - Wajib memperbarui dokumentasi berikut pada setiap perubahan kode:

   | Dokumen | Isi yang diperbarui |
   |---|---|
   | `CHANGELOG.md` | Entri commit baru (ditambah/diperbaiki/diubah) |
   | `STATE.md` | Log fase & status terkini |
   | `PRD.md` | Spesifikasi/modul baru bila ada |
   | `tasks/todo.md` | Task selesai |
   | `tasks/plan.md` | Fase implementasi |
   | `README.md` | Fitur & tautan dokumentasi |
   | `docs/HANDOFF.md` | Snapshot status & peta file |

5. **UPDATE CHANGELOG WAJIB MENCANTUMKAN HASH COMMIT**: setiap entri di `CHANGELOG.md` harus menyertakan hash commit singkat sebagai referensi.

---

## 3. Tech Stack & Environment

- **Frontend & API**: Next.js 15 (App Router, React 19, TypeScript, Tailwind CSS v4).
- **Design System**: Warm Anti-Slop Orange (`#F28C38` primary, `#120F0C` canvas, `#1C1714` surface, `#2E2722` border).
- **Database**: TiDB Cloud Serverless (`@tidbcloud/serverless` HTTP fetch client, zero connection pooling overhead).
- **Upstream Router**: 9Router lokal di `http://127.0.0.1:20128`.
- **Produksi Edge**: Cloudflare Workers (`kiosai.dhanisepeda.workers.dev`) via adapter OpenNext.
- **Koneksi Edge ke 9Router**: Cloudflare Quick/Named Tunnel (`cloudflared`).

---

## 4. Akun Default & Kredensial Pengujian

- **Admin Account**:
  - Username: `adminfordhani` (Login bisa pakai username langsung)
  - Email: `adminfordhani@kiosai.id`
  - Password: `dhaniforadmin` (Tersimpan via hash `scrypt` di TiDB)
  - Tier: `pro` | Saldo: `100.000.000` token
- **User Biasa**:
  - Login & Register via format email standar (`budi@gmail.com`).
  - Bonus pendaftaran baru otomatis: `2.500.000` token tier `free`.

---

## 5. Struktur Routing & Halaman

- `/` : Landing Page publik (Navbar, Hero, Fitur, Katalog Model, Paket Harga, Sandbox Kode, FAQ, Footer).
- `/dashboard` : Workspace pengguna terlindungi `AuthGuard` (Redirect ke `/?login=1` jika belum login).
  - Tab 1: **API Keys** (`KeysTab.tsx`) — Generate key `kios-xxxx` (SHA-256), rate limit 30/60/120.
  - Tab 2: **Beli Token** (`PackagesTab.tsx`) — Checkout paket Free & Pro (25K/100K/150K) via QRIS simulasi.
  - Tab 3: **Model** (`ModelsTab.tsx`) — Katalog model AI dengan filter tier & tombol uji Playground.
  - Tab 4: **Playground** (`PlaygroundTab.tsx`) — Chatbot uji coba live, terikat HMAC session key.
  - Tab 5: **Statistik** (`AnalyticsTab.tsx`) — Grafik konsumsi per model & tabel riwayat 20 log TiDB.
  - Tab 6: **Dokumentasi** (`DocsTab.tsx`) — Panduan SDK cURL, Python, Node.js tersinkronisasi live.

---

## 6. Mekanisme Kunci & Arsitektur Rahasia

### 6.1 HMAC Playground Session Key (`lib/session-key.ts`)
- Ketika pengguna membuka dashboard, `GET /api/user?id=...` menghasilkan `playgroundKey: kios-pg-:userId.:sig` yang ditandatangani HMAC-SHA256 menggunakan `DATABASE_URL`.
- Panggilan Playground di dashboard otomatis menggunakan key ini tanpa meminta input manual.
- Token langsung terpotong dari saldo user di TiDB dan tercatat pada tabel `usage_logs`.

### 6.2 Chat Persistence
- Percakapan di Playground disimpan di `sessionStorage` (`kios_playground_messages`).
- Berpindah antar-tab dashboard tidak mereset riwayat chat. Chat hanya dibersihkan jika tombol "Chat baru +" ditekan.

### 6.3 Worker Secret Sync (`npm run secrets:sync`)
- Cloudflare Worker **tidak membaca file `.env`**.
- Variabel `DATABASE_URL`, `NINEROUTER_API_KEY_2`, dan `NINEROUTER_URL` dipasang sebagai secret via Cloudflare API.
- Nilai `127.0.0.1` pada `NINEROUTER_URL` otomatis dilewati karena edge Cloudflare memblokir loopback (error 1003).

### 6.4 Tunnel Sync (`npm run tunnel`)
- Menjalankan `cloudflared tunnel --url http://localhost:20128` di komputer lokal.
- Mengambil URL `https://<random>.trycloudflare.com` lalu otomatis memperbarui secret `NINEROUTER_URL` di Worker.

---

## 7. Perintah Kerja Rutin (Cheat Sheet)

```bash
# 1. Audit Kesiapan Produksi (Env, TiDB, 9Router, Batas 200 baris, Secret Worker)
npm run verify

# 2. Pengujian Integrasi Otomatis (10 Skenario Gateway)
npm run test:e2e

# 3. Pengujian Billing & Pricing
npm run test:pricing
npm run test:billing

# 4. Audit UI & Dashboard (0 Horizontal Overflow pada 390px Mobile & Desktop)
npm run audit:ui
npm run audit:dashboard

# 5. Sinkronisasi Kredensial Lokal ke Cloudflare Worker
npm run secrets:sync

# 6. Aktifkan Tunnel 9Router & Sinkronkan URL ke Worker
npm run tunnel

# 7. Build Next.js & TypeScript Check
npm run build
npx tsc --noEmit -p tsconfig.json

# 8. Menjalankan Server Lokal Port 3000
npm start
```

---

## 8. Status Terkini (Session Continuity)

- **Total File Sumber**: 95 file TypeScript/MJS (100% patuh `<= 200` baris).
- **Katalog Model Aktif**: 65 model terverifikasi via audit 5x (`lib/verified-models.ts`), 1 Free Tier (`Atria-Dawn-Preview`), 64 Pro Tier. 679 model mati disaring keluar.
- **E2E Integration Test**: 11 Lolos, 0 Gagal (`test:e2e`).
- **Pricing & Billing Test**: 17/17 PASS (`test:pricing`), live deduction PASS (`test:billing`).
- **UI & Dashboard Audit**: 16/16 PASS (0 horizontal overflow pada mobile 390px & PC).
- **Git Branch**: `main` ter-push sinkron dengan `origin` (Commit `8bf2e69`).
- **Status Layanan**: Worker `kiosai.dhanisepeda.workers.dev` live dan sehat (`/api/health` status `healthy`).
