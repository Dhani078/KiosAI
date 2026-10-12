# Changelog — KiosAI

Semua perubahan penting pada proyek ini dicatat di sini.
Format: `[commit-hash] tipe(scope): deskripsi`.

---

## [Unreleased]

*(Tidak ada perubahan tertunda. Working tree bersih setelah `828993d`.)*

---

## 2026-10-12

### `9911c13` — feat(plans): set free bonus to 2.5M, tier free default, lock non-free models, filter unwanted models
**Ditambahkan / Diubah**
- **Bonus Akun Baru 2.5 Juta Token & Tier Default Free**:
  - Pendaftaran baru mendapatkan **2.500.000 token** dengan tier **`free`** (bukan langsung `bronze`).
  - Paket Free Bansos disesuaikan menjadi 2.500.000 token (Rp 0), dan dicegah klaim ganda jika sudah aktif.
- **Model Gating untuk Free Plan**:
  - Akun tier `free` **hanya bisa mengakses**:
    1. `atria/Atria-Dawn-Preview` (Atria Dawn Preview)
    2. `tokenharbor/deepseek-v4.1-flash:free` (DeepSeek 4.1 Flash dari Token Harbor)
  - Model lainnya otomatis terkunci (HTTP 403 `tier_restricted`) dengan tombol ajakan upgrade ke paket berbayar di UI.
  - Membeli paket Starter/Bronze/Silver/Gold otomatis mengupgrade tier dan membuka seluruh model.
- **Filter Model Tidak Diinginkan**:
  - Model `free123`, `tesss`, `auto`, dan `auto-thinking` (termasuk `kr/auto`, `kr/auto-thinking`) disaring dan dibuang dari katalog gateway `/v1/models`.
- **Perbaikan UI Bug Konkatenasi String**:
  - Saldo di modal pembayaran dijumlahkan dengan aritmatika numerik `Number(userBalance) + Number(tokensGranted)`, mencegah tampilan angka gabungan (seperti `100000005000000`).
  - Badge CSS `.badge.free` ditambahkan dengan warna hijau emerald.

### `30dc297` — docs: sync AGENT, STATE, HANDOFF, tasks for Phase 19 + standard 402 insufficient_quota error
**Ditambahkan / Diubah**
- Penanganan error `/v1/chat/completions`: ketika saldo token habis, mengembalikan standar HTTP 402 `insufficient_quota` (sebelumnya generic 401).
- Sinkronisasi dokumentasi menyeluruh: `AGENT.md`, `STATE.md`, `docs/HANDOFF.md`, `tasks/todo.md`, dan `tasks/plan.md` diperbarui dengan spesifikasi Phase 19 (Free Plan 5M token, model Bansos Atria, model access universal, dan pricing restructure).

### `3f9549b` — feat(ui): refine free plan claim modal, add Atria to landing catalog, clean docs error handling
**Ditambahkan / Diubah**
- **Modal Klaim Free Plan (`PaymentModal.tsx`)**:
  - Untuk paket Free Bansos (Rp 0), UI scan QRIS digantikan dengan tombol "Klaim 5 Juta Token Gratis" langsung.
  - Sekali klik langsung terkonfirmasi dan menambah 5.000.000 token ke user login di TiDB.
- **Katalog Landing Page (`ModelsSection.tsx` & `modelCatalogData.ts`)**:
  - Ditambahkan provider `Atria` dan kartu model `Atria Dawn Preview (Bansos)`.
- **Perbandingan Paket & Dokumentasi (`PackageComparison.tsx` & `DocsTab.tsx`)**:
  - Tabel perbandingan model diupdate: seluruh tier memiliki tanda centang akses universal.
  - Dokumentasi error diupdate dari `tier_restricted` menjadi panduan penanganan `invalid_key / balance_exhausted`.
- **Tunnel & Health Live**:
  - Cloudflare Tunnel aktif menghubungkan Worker `kiosai.dhanisepeda.workers.dev` ke 9Router lokal. Status `/api/health` kembali `healthy`.

### `2368424` — feat(plans): add Free Plan 5M tokens and atria/Atria-Dawn-Preview bansos model
**Ditambahkan / Diubah**
- **Free Plan 5 Juta Token**:
  - Registrasi user baru otomatis memperoleh saldo gratis **5.000.000 token** (Free Plan Bansos) di TiDB.
  - Ditambahkan paket `Free Bansos` (Rp 0 / 5M token) di `app/components/packageData.ts` dan `app/api/orders/route.ts`.
- **Model Bansos `atria/Atria-Dawn-Preview`**:
  - Terintegrasi langsung dengan upstream 9Router dan fallback catalog.
  - Ditampilkan di web sebagai `Atria-Dawn-Preview (Bansos)` untuk pengguna biasa, dan `atria/Atria-Dawn-Preview` untuk admin.
  - Dukungan resolusi alias otomatis di `/v1/chat/completions`.
- Dokumentasi `README.md`, `PRD.md`, `API.md` disinkronkan.

### `e3d90e9` — feat(models): universal model access, remove combomaut, role-based model names
**Ditambahkan / Diubah**
- **Akses Model Universal**: Semua model AI terbuka untuk seluruh pengguna tanpa batas tier (`isModelAllowedForTier` = true). Pemakaian hanya dibatasi oleh saldo token nyata, dengan multiplier potongan (1.0x, 2.0x, 4.0x).
- **Hapus `combomaut`**: Dihapus permanen dari daftar model dan fallback list.
- **Tampilan Nama Model Berbasis Role (`lib/model-utils.ts`)**:
  - Untuk Admin (`adminfordhani`): Menampilkan ID routing teknis 9Router (`kr/claude-haiku-4.5-thinking-agentic`, `kr/claude-sonnet-4.5-thinking-agentic`).
  - Untuk Pengguna Biasa: Menampilkan nama komersial bersih (`claude-haiku-4.5`, `claude-sonnet-4.5`).
  - Sistem di belakang layar tetap merouting ke model ID upstream yang tepat (`kr/claude-haiku-4.5-thinking-agentic` & `kr/claude-sonnet-4.5-thinking-agentic`) via `resolveModelAlias`.
- UI `ModelsTab`, `PlaygroundToolbar`, `PlaygroundChat`, dan endpoint `/v1/models` disesuaikan.

### `d9c5351` — feat(pricing): update paket token (5rb/15M, 25rb/100M, 100rb/600M, 150rb/1Miliar)
**Ditambahkan / Diubah**
- Paket token baru di `app/components/packageData.ts` dan `app/api/orders/route.ts`:
  - **Starter**: Rp 5.000 untuk 15.000.000 Token (Tier Bronze, 1.0x).
  - **Bronze**: Rp 25.000 untuk 100.000.000 Token (Tier Bronze, 1.0x).
  - **Silver**: Rp 100.000 untuk 600.000.000 Token (Tier Silver, 2.0x).
  - **Gold**: Rp 150.000 untuk 1.000.000.000 Token / 1 Miliar (Tier Gold, 4.0x).
- Grid paket CSS di `app/globals.css` diupdate jadi auto-fit responsif 4 kolom.
- Dokumentasi `README.md`, `PRD.md`, `API.md` disinkronkan.

### `828993d` — feat: playground session key, chat persistence, sidebar Model menu
**Ditambahkan**
- `lib/session-key.ts` — generator & verifikator HMAC Playground session key (`kios-pg-<userId>.<sig>`).
- `app/components/ModelsTab.tsx` — tab katalog model di dashboard (pencarian, filter tier, tombol "Coba di Playground").
- Menu **Model** (ikon `Cpu`) di `app/components/Sidebar.tsx`.

**Diperbaiki**
- Playground sekarang memotong saldo token nyata dari akun pengguna yang login (sebelumnya memakai API key hardcoded milik user lain).
- Setiap request Playground tercatat di `usage_logs` dan tampil di tab Statistik.
- Histori chat Playground tidak lagi hilang saat berpindah tab dashboard (disimpan di `sessionStorage` `kios_playground_messages`).
- `GET /api/user` kini mengembalikan `playgroundKey`.

**Diubah**
- `app/api/user/route.ts`, `app/hooks/useKiosData.ts`, `app/dashboard/DashboardApp.tsx`, `app/components/constants.ts`, `lib/keys.ts`.

---

### `da1217c` — feat(ui): tampilkan nama model bersih tanpa `tokenharbor` di UI
**Ditambahkan**
- `lib/model-utils.ts` — fungsi `formatModelName()` untuk membuang prefiks `tokenharbor/` dan sufiks `:free` **hanya untuk tampilan**.

**Diubah**
- `PlaygroundToolbar.tsx`, `PlaygroundChat.tsx`, `DocsTab.tsx`, `RecentLogsTable.tsx`, `AnalyticsTab.tsx`, `PackageComparison.tsx` — render nama bersih (`deepseek-v4.1-flash`).
- ID sistem lengkap (`tokenharbor/deepseek-v4.1-flash:free`) tetap dipakai untuk value/API request agar routing 9Router tetap valid.

**Catatan penting**
- Tampilan berubah, **sistem tetap sama**. Nilai API key & `.env` tidak disentuh.

---

### `710f4d4` — feat(landing): tambah menu Model di navbar & section katalog model
**Ditambahkan**
- `app/landing/components/ModelsSection.tsx` + `modelCatalogData.ts` — katalog model publik dengan filter provider.
- Anchor `#model` di `LandingNavbar.tsx` dan `LandingFooter.tsx`.

---

### `eb105de` — docs: catatan troubleshooting Worker + naikkan timeout health ke 12s
**Diperbaiki**
- `app/api/health/route.ts` — timeout probe upstream `5s` → `12s`. Tunnel + payload 765 model butuh ~2-4 detik dan sempat memicu abort palsu.

**Ditambahkan**
- `docs/TROUBLESHOOTING-WORKER.md` — catatan lapangan error env Worker, error 1003, dan rotasi URL tunnel.

---

### `f514d06` — fix(deploy): sinkronisasi secret Worker + otomatisasi tunnel
**Ditambahkan**
- `scripts/sync-worker-secrets.mjs` (`npm run secrets:sync`) — dorong `.env` → secret Worker.
- `scripts/tunnel-sync.mjs` (`npm run tunnel`) — jalankan cloudflared lalu set `NINEROUTER_URL` otomatis.

**Diperbaiki**
- **Akar masalah** `DATABASE_URL environment variable is not defined` di Worker live: Worker punya **0 secret**. Bukan salah konfigurasi Cloudflare.
- `scripts/verify-deployment.mjs` diperluas jadi 6 pengecekan termasuk deteksi drift secret Worker.

**Diubah**
- `DEPLOYMENT.md` ditulis ulang (Cloudflare Workers, bukan Vercel).
- `README.md` bagian deploy: Vercel → Cloudflare Workers.

---

### `010feb2` / `a5be29f` — feat(auth): guard `/dashboard`, admin login via username
**Ditambahkan**
- Kolom `username VARCHAR(64)` + unique index di `kiosai.users`.
- `AuthGuard` — `/dashboard` diblokir untuk anonim (redirect `/?login=1`).
- `LandingAuthWatcher` — buka modal login otomatis dari query `?login=1`.
- `scripts/seed-admin.mjs` — akun `adminfordhani` (Gold, 100M token).

**Diperbaiki**
- Logout membersihkan session dan kembali ke `/`.
- Bug payload register: mengirim `fullName` (sebelumnya `name` sehingga nama selalu default).
- Fallback demo user dihapus dari `useKiosData` dan `DashboardApp`.

---

### `311769b` — feat: landing page jadi beranda `/`, dashboard pindah ke `/dashboard`
- Rute `/` menyajikan Landing Page publik (server component + SEO metadata).
- Rute `/dashboard` menyajikan workspace dashboard.
- `/landing` redirect ke `/` (kompatibilitas mundur).

---

### `3539562` — docs(security): tulis ulang SECURITY.md dengan hasil audit secret
- Hasil audit: `.env` tidak pernah ter-track dan tidak ada di seluruh history git.
- Repo berstatus **public** — risiko & checklist pra-produksi didokumentasikan.

---

## 2026-10-11

### `404130d` — test: suite E2E 10 alur gateway
### `f8ff6cc` — docs: `API.md`, `DEPLOYMENT.md`, `SECURITY.md`
### `f39fe11` — feat: Docs interaktif + `npm run verify`
### `fef9e83` — feat: ekspor CSV + System Prompt di Playground
### `a7fe60e` — feat: `/api/health` + selector rate limit per key
### `e1350e7` — feat: `RecentLogsTable` (20 log terakhir dari TiDB)
### `9fe0ba0` — fix: session key terpadu `kiosai_user_id` + logout
### `3d3a11f` — feat: design system KiosAI Token Marketplace + zero dummy data
### `d43169b` — fix(billing): tagih `total_tokens` upstream untuk stream (`stream_options.include_usage`)
### `27c01fe` / `dedc1db` — docs/model: default demo `tokenharbor/deepseek-v4.1-flash:free`

---

## Format Penulisan Commit

```
tipe(scope): deskripsi singkat

- poin perubahan 1
- poin perubahan 2
```

Tipe yang dipakai: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`.