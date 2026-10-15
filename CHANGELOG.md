# Changelog — KiosAI

Semua perubahan penting pada proyek ini dicatat di sini.
Format: `[commit-hash] tipe(scope): deskripsi`.

---

## [Unreleased]

### `24221f4` — docs: align commit hash references across AGENT, STATE, and HANDOFF

- Menyelaraskan seluruh referensi commit hash di `AGENT.md`, `STATE.md`, dan `docs/HANDOFF.md` agar konsisten dengan `HEAD`.
- Verifikasi menyeluruh: tsc, 87 file <= 200 baris, 10/10 e2e, 12/12 pricing, 3/3 billing, 16/16 UI & dashboard audit, dan health check Worker live.

### `3decad7` — docs: synchronize all markdown documentation for session transition

- Sinkronisasi menyeluruh seluruh dokumen markdown (`AGENT.md`, `STATE.md`, `docs/HANDOFF.md`, `docs/ARCHITECTURE.md`, `tasks/plan.md`, `tasks/todo.md`).
- Mencatat hasil audit 5x penyaringan katalog (65 model aktif, 679 model mati disaring) pada Phase 23.
- Memperbarui status kelulusan pengujian (87 file sumber patuh $\le 200$ baris, 12/12 pricing, 10/10 E2E).

### `34fcbd3` — feat(models): audit 746 models with 5x retry, prune 679 dead models, retain 65 verified models

**Audit 5x & Penyaringan Menyeluruh**
- **Pengujian Nyata 5x Retry (`scripts/audit-all-models-5x.mjs`)**: Menguji seluruh 746 model dengan toleransi 5x percobaan berturut-turut ke gateway 9Router.
- **Pemangkasan 679 Model Mati**: Menemukan 679 model yang gagal 5/5 kali berturut-turut (termasuk seluruh 482 model internal `cl/*` yang timeout scraper, serta model yang mengembalikan error 503).
- **Daftar Model Terverifikasi (`lib/verified-models.ts`)**: Mendaftarkan 65 model aktif yang terbukti berhasil 200 OK.
- **Penyaringan Gateway (`app/v1/models/route.ts`)**: Gateway dan dashboard hanya menampilkan model yang lolos audit.
- **Verifikasi Produksi Live**: Dashboard Worker `https://kiosai.dhanisepeda.workers.dev/dashboard` bersih dengan filter `Semua (65)`, `Free Tier (1)`, `Pro Tier (64)`.

### `2d27ccb` — feat(analytics): upgrade Statistik tab to Maxxmode with 4 KPI cards, multi-segment model breakdown, and live search

**Peningkatan Statistik Maxxmode**
- **4 Kartu KPI Interaktif (`app/components/AnalyticsCards.tsx`)**:
  - Saldo Aktif dengan tombol cepat Isi Saldo.
  - Konsumsi Token dengan rincian In (prompt) vs Out (completion) serta total request.
  - Latensi Rata-Rata lengkap dengan indikator Min dan Max latency (ms).
  - Reliabilitas Gateway dengan kalkulasi persentase sukses HTTP 200 live TiDB dan pulse status dot.
- **Distribusi Penggunaan per Model (`app/components/ModelUsageBreakdown.tsx`)**:
  - Multi-segment visual bar berwarna proporsional per model AI.
  - Kartu baris model dengan jumlah request, rata-rata latensi, dan persentase pangsa token.
- **Penyaringan & Pencarian Log Real-Time (`app/components/RecentLogsTable.tsx`)**:
  - Input pencarian instan berdasarkan nama model atau slug teknis.
  - Tombol filter status: `Semua`, `Sukses 200`, dan `Error`.
  - Ekspor CSV data log inferensi.
- **Ringkasan Investasi & Faktur (`app/components/OrderHistoryTable.tsx`)**:
  - Banner ringkasan total dana yang diinvestasikan (Rp) dan total token yang berhasil masuk.
  - Ekspor CSV riwayat pembelian.
- **Penyempurnaan Endpoint Analytics (`app/api/analytics/route.ts`)**:
  - Menghitung agregasi `prompt_tokens`, `completion_tokens`, `min_latency_ms`, `max_latency_ms`, dan `success_rate` langsung dari database TiDB.
- **Kepatuhan Arsitektur**:
  - Seluruh 6 file modul komponen tetap patuh batas ketat $\le 200$ baris per file.

---

### `0519315` — feat(models): audit 746 models with 5x retry, prune 679 dead models, retain 65 verified models

**Audit 5x & Penyaringan Menyeluruh**
- **Pengujian Nyata 5x Retry (`scripts/audit-all-models-5x.mjs`)**:
  - Menguji seluruh 746 model gateway 9Router dengan retry hingga 5x percobaan berturut-turut.
  - 679 model terbukti mati/timeout 5x berturut-turut (termasuk seluruh 482 model scrap `cl/*` yang tidak pernah merespons, model rute palsu `together/*`, `kc/*`, `af/*`, dll.).
  - 65 model aktif lolos verifikasi dan merespons `200 OK` (model unggulan Claude Sonnet & Haiku `kr/*`, DeepSeek `tokenharbor/*` & `kr/*`, Gemini `ag/*` & `gemini/*`, Qwen `kr/*` & `cf/*`, Llama `cf/*`, dll.).
- **Daftar Model Terverifikasi (`lib/verified-models.ts`)**:
  - Menyimpan set 65 model yang lolos audit 5x secara deterministik.
  - `app/v1/models/route.ts` menyaring katalog hanya menampilkan model yang terbukti hidup.
  - Dashboard KiosAI kini bersih, cepat, tanpa kartu duplikat palsu atau error 503/timeout.

---

### `5db9717` — fix(models): test candidate models 3x and prune 13 dead models from catalog

**Diuji 3x & Dihapus**
- **Audit Pengujian Nyata 3x (`scripts/test-model-trials.mjs`)**:
  - Menguji 14 model kandidat dari tangkapan layar masing-masing 3 kali berturut-turut.
  - 13 model gagal 3/3 kali (TimeoutError / 503) dan resmi dihapus dari gateway:
    1. `nemotron-3.5-lightning` (`cl/nvidia/nemotron-3.5-lightning`, `:free`)
    2. `sakana-namazu` (`cl/sakana/sakana-namazu`)
    3. `solar-pro4` (`cl/upstage/solar-pro4`)
    4. `muse-glimmer-30b` (`cl/meta/muse-glimmer-30b`)
    5. `muse-spark-1.2` (`cl/meta/muse-spark-1.2`, `-contributor`, `cutadai/...`)
    6. `deepseek-v4-flash-latest` (`cl/~deepseek/deepseek-v4-flash-latest`)
    7. `deepseek-v4-flash-0731` (`cl/...`, `apinex/free/...`)
    8. `inkling-small` (`cl/thinkingmachines/inkling-small`, `:free`)
  - 1 model terbukti berhasil (`200 OK`) dan dipertahankan: `bzl/deepseek/deepseek-v4-flash-0731free`.
- **Penyaringan Gateway (`app/v1/models/route.ts`)**:
  - `isHiddenModel` menyaring seluruh 13 model yang gagal 3x dari API dan dashboard.

---

### `f21de9b` — docs: add Phase 14 / Phase 22 checklist and state records

### `ee06a39` — feat(models): hide unwanted Gemini 3.7/3.6/3.1 models and retain Gemini 3.8 & Claude 4.6 in Pro plan

**Dihapus & Disaring**
- **Model Disembunyikan (`app/v1/models/route.ts`)**:
  - `isHiddenModel` menyaring `ag/gemini-3.7-*`, `ag/gemini-3.6-*`, `ag/gemini-3.1-*`, dan `ag/gemini-pro-agent` dari discovery list `/v1/models` dan dashboard UI.
  - Menghapus `ag/gemini-3.1-pro-high` dari katalog landing page (`app/landing/components/modelCatalogData.ts`).
  - Model Pro aktif yang dipertahankan: `ag/gemini-3.8-flash*` (High/Medium/Low/Flash), `ag/claude-sonnet-4-6`, `ag/claude-opus-4-6-thinking`.

---

### `76f6c27` — feat(models): integrate Google Gemini 3.8/3.7/3.6/3.1 and Claude 4.6 Thinking models into Pro plan

**Ditambahkan & Diperbaiki**
- **Model Pro Baru (`ag/*`)**:
  - `ag/gemini-3.8-flash-high`, `ag/gemini-3.8-flash-medium`, `ag/gemini-3.8-flash-low`, `ag/gemini-3.8-flash`
  - `ag/gemini-3.7-flash-high`, `ag/gemini-3.7-flash-medium`, `ag/gemini-3.7-flash-low`
  - `ag/gemini-3.6-flash-high`, `ag/gemini-3.6-flash-medium`, `ag/gemini-3.6-flash-low`
  - `ag/gemini-3.1-pro-high`, `ag/gemini-pro-agent`, `ag/gemini-3.1-pro-low`
  - `ag/claude-sonnet-4-6` (`Claude Sonnet 4.6 (Thinking)`)
  - `ag/claude-opus-4-6-thinking` (`Claude Opus 4.6 (Thinking)`)
- **Format UI (`lib/model-utils.ts`)**:
  - Helper `formatAgGemini` mengubah ID internal menjadi nama komersial rapi: misal `ag/gemini-3.8-flash-high` $\rightarrow$ `Gemini 3.8 Flash (High)`.
  - Mapping alias untuk Claude Sonnet 4.6 & Claude Opus 4.6 Thinking.
- **Perbaikan Evaluasi Tarif (`lib/model-pricing.ts`)**:
  - Mengatasi substring clash (`"gemini".includes("mini")`) sehingga model Gemini Pro (`$1.25 / $5.00`) tidak salah tergolong sebagai model mini (`$0.15 / $0.60`).
- **Showcase Landing Page (`app/landing/components/modelCatalogData.ts`)**:
  - Menampilkan Gemini 3.8 Flash (High), Gemini 3.1 Pro (High), Claude Sonnet 4.6 Thinking, dan Claude Opus 4.6 Thinking di katalog publik.
- **Otomasi Refresh Token Worker (`scripts/tunnel-sync.mjs`, `scripts/sync-worker-secrets.mjs`)**:
  - Auto-refresh OAuth access token Wrangler menggunakan `refresh_token` saat mendekati masa kedaluwarsa.
- **Pengujian & Kepatuhan**:
  - `test:pricing` diperluas dari 9 ke 13 assertion (100% pass).
  - Seluruh file tetap patuh batas arsitektur $\le 200$ baris.

---

### `712ccc6` — docs: synchronize all documentation across repository

**Diperbarui**
- **Dokumentasi Terpadu**:
  - `AGENT.md`: pembaruan perintah kerja rutin (tambah `test:pricing`, `test:billing`, `audit:ui`, `audit:dashboard`), jumlah total 82 file sumber patuh.
  - `PRD.md`: sinkronisasi spesifikasi billing 2 tier (Free & Pro 25K/100K/150K).
  - `API.md`: penyesuaian contoh endpoint `GET /v1/models` (Atria = Free, DeepSeek = Pro).
  - `DEPLOYMENT.md`: pembaruan tier akun admin `adminfordhani` menjadi `pro`.
  - `STATE.md`: pembaruan status ke Phase 21, upstream 771 model, commit pin.
  - `tasks/plan.md`: penambahan catatan Phase 21 (UI polish, dynamic counters, strict 200 LOC).
  - `tasks/todo.md`: penambahan checklist Phase 13 (UI Polish, Dynamic Counters & Architecture Audit).

---

### `e1184a1` — style(ui): polish model cards, dynamic counts, search reset, and pricing comparison

**Dipoles**
- **ModelsTab (`app/components/ModelsTab.tsx`)**:
  - Tombol filter tier kini menampilkan counter dinamis: `Semua (764)`, `Free Tier (2)`, `Pro Tier (762)`.
  - Input pencarian dilengkapi tombol reset instan `X` saat teks terisi.
  - Kartu model diperkaya label provider (Anthropic, OpenAI, DeepSeek, Google, Meta, Atria, xAI, dll.).
  - Tipografi harga Input/Output/Cached per 1M token diformat tabular monospace (`JetBrains Mono`).
  - Empty state elegan saat pencarian tidak menghasilkan model yang cocok, lengkap dengan tombol reset.
  - Tetap patuh batas arsitektur modularitas KiosAI: 159 LOC (maks 200 LOC).
- **PackageComparison (`app/components/PackageComparison.tsx`)**:
  - Subtitle model diperkaya tarif resmi $/1M (mis. `In $0.27 / Out $1.10 (1M)`).

---

### `7a7f4ee` — docs: add Phase 12 checklist to tasks/todo.md

### `4ca7336` — fix(ui): decouple model tier badge & filter from current user access level

**Diperbaiki**
- **Badge dan Filter Tier di `ModelsTab.tsx`**:
  - Root cause: `modelTier` sebelumnya dihitung dari `checkAllowed(m.id) ? "free" : "pro"`. Karena admin/pengguna Pro memiliki akses ke seluruh model (`checkAllowed` selalu `true`), semua model salah terlabeli sebagai `FREE` dan filter "Pro Tier" menjadi kosong.
  - Fix: Memisahkan penentuan tier model (`getModelTier(m)`) dari izin akses pengguna (`checkAllowed(m)`). Model Atria tetap `FREE`, sedangkan seluruh model AI lainnya (Claude, GPT, Gemini, DeepSeek, dll.) bertanda `PRO`. Filter "Free Tier" hanya memunculkan Atria, dan filter "Pro Tier" memunculkan seluruh model Pro.

### `dc9a0f1` — build: add type module to package.json to resolve typeless warning

### `4010d06` / `e5b7718` — feat(tiers): restrict Free tier exclusively to Atria Dawn, move all other models to Pro

**Ditambahkan**
- **`getCostRatio()` di `lib/model-pricing.ts`** — sumber tunggal rasio pemotongan saldo: `(Input $ + Output $) / 1.37`, baseline DeepSeek Flash ($0.27 + $1.10). Floor `0.05` untuk model $0 (Atria) sebagai jaring anti-abuse. Angka yang dirender di kartu model dan angka yang dipotong kini tidak bisa berbeda.
- **`scripts/migrate-tiers.mjs`** (`npm run migrate:tiers`) — migrasi data `bronze`/`silver`/`gold` → `pro` di `users.tier` dan `orders.package_tier`. Idempoten, menulis backup JSON ke `backups/` sebelum menulis.
- **`scripts/test-pricing.mjs`** (`npm run test:pricing`) — 9 assert: tiap model rasio == `(in+out)/1.37`, dan rasio tidak boleh divergen dari harga UI.
- **`scripts/audit-ui.mjs`** (`npm run audit:ui`) + **`scripts/audit-dashboard.mjs`** (`npm run audit:dashboard`) + helper bersama `scripts/cdp.mjs` — audit UI nyata lewat CDP ke `chrome-headless-shell` bawaan (tanpa dependency npm baru). Memeriksa 0 overflow horizontal + tidak ada copy `1.0×/2.0×/4.0×`/`multiplier`/`bansos`.
- **`scripts/verify-billing.cjs`** — verifikasi rasio live end-to-end terhadap TiDB nyata.

**Diubah**
- **Paket jadi 2 tier**: `free` (Rp 0 / 2.5 Juta token, hanya Atria Dawn) dan `pro` (Pro 25K Rp 25.000 / 100 Juta, Pro 100K Rp 100.000 / 600 Juta, Pro 150K Rp 150.000 / 1 Miliar — seluruh model AI, top-up QRIS).
- **`getModelMultiplier()` dihapus** dari `lib/keys.ts`; kedua titik potong (`stream` + non-stream) di `app/v1/chat/completions/route.ts` kini memakai `getCostRatio()`.
- **Semua copy lama dibersihkan**: `Bansos`, `multiplier`, `1.0×/2.0×/4.0×`, dan label `Silver`/`Gold` hilang dari landing, dashboard, FAQ, PRD, README, API.md, SECURITY.md, ARCHITECTURE.md, AGENT.md, dan HANDOFF.md.
- **Badge tier di `PaymentModal.tsx`** — sebelumnya `<Badge tier={pkg.name} />` menghasilkan kelas CSS rusak (`badge pro 25k`); kini `FREE`/`PRO`.
- **`handleBuyPackage` dihapus** dari `app/hooks/useKiosActions.ts` (dead code bertipe `"bronze" | "silver" | "gold"`).
- **`scripts/migrate.mjs` & `scripts/seed-admin.mjs`** — default tier jadi `free` (2.5M token) dan `pro`, bukan `bronze`/`gold`.

**Diperbaiki**
- **502 pada setiap request non-stream model Pro** (pre-existing, ditemukan saat verifikasi). Upstream 9Router membalas `stream:false` dalam tiga bentuk berbeda: (a) `chat.completion` JSON biasa, (b) JSON dengan `data: [DONE]` **ditempel tanpa newline** (`}data: [DONE]`), (c) stream SSE chunk asli (`kr/*` thinking models). `parseUpstreamJson()` di `lib/proxy-http.ts` hanya mampu bentuk (a). Kini ketiganya dinormalisasi menjadi satu objek `chat.completion` (+ salvage kurung seimbang untuk body yang terkontaminasi).
- **Envelope error upstream** — error upstream kini lewat `errorResponse()` dengan code `upstream_error`, bukan `new NextResponse(errText)` mentah yang membocorkan body upstream apa adanya.
- **Overflow horizontal mobile** (pre-existing). `.landing-nav-links` tidak punya rule CSS sama sekali sehingga nav landing tidak pernah collapse di 390px (18 elemen meluber). Ditambahkan `@media(max-width:700px){.landing-nav-links{display:none!important}}` — `!important` wajib karena inline style React mengalahkan CSS biasa.

**Diverifikasi (bukti eksekusi, bukan klaim)**
- `npm run test:e2e` → **10/10 lolos**.
- `npm run test:pricing` → **9/9 lolos**.
- `npm run audit:ui` → **4/4 lolos** (pc+mobile × `/` + `/dashboard`, 0 overflow).
- `npm run audit:dashboard` → **12/12 lolos** (6 tab × pc+mobile, 0 overflow, 0 copy terlarang).
- Rasio live terhadap TiDB nyata: DeepSeek Flash `1.000`, Claude Haiku `1.095`, Claude Sonnet `13.139` — persis sama dengan angka `$/1M` di kartu model.
- Migrasi data: 41 user + 29 order lama → `free`/`pro`; hasil akhir `free:1, pro:46` (users) dan `free:10, pro:34` (orders). Backup di `backups/tier-migration-*.json`.
- `tsc --noEmit` bersih, `next build` sukses.

---

## 2026-10-12

### `c42e0cb` — feat(tiers): simplify to 2 tiers (Free & Pro), replace multipliers with real $/1M rates
**Ditambahkan / Diubah**
- **Penyederhanaan Menjadi 2 Tier (`Free` & `Pro`)**:
  - Hapus skema lama (starter, bronze, silver, gold) menjadi hanya dua tier murni:
    1. **Free Tier**: Bawaan pendaftaran baru (2.500.000 token), model: Atria Dawn Preview & DeepSeek Flash.
    2. **Pro Tier**: Terbuka penuh untuk seluruh katalog model AI (Claude Sonnet/Opus, GPT-4o, Gemini, Grok, dll.). Upgrade otomatis aktif saat top-up paket Pro.
  - Paket top-up: `Pro 25K` (Rp 25.000 / 100M token), `Pro 100K` (Rp 100.000 / 600M token), `Pro 150K` (Rp 150.000 / 1 Miliar token).
- **Hapus Teks Pengali `1.0×`, `2.0×`, `4.0×` & Tampilkan Tarif Real ($ / 1M Tokens)**:
  - Modul baru `lib/model-pricing.ts` menyajikan tarif resmi provider per 1 Juta token: **Input Data**, **Output Data**, dan **Cached Data** (contoh: DeepSeek Flash `In $0.27 · Out $1.10`, Sonnet `In $3.00 · Out $15.00`, Atria Dawn `Gratis`).
  - Strip kartu model di tab **Model** menampilkan tabel 3 kolom transparan (`INPUT / 1M`, `OUTPUT / 1M`, `CACHED / 1M`) persis data komparasi industri.
  - Dropdown Playground dan tab Dokumentasi diperbarui menampilkan tarif input/output real.

### `f9b6461` — feat(ui): strip all router prefixes (cx/, xai/, cl/, etc.) for clean regular user display
**Ditambahkan / Diubah**
- **Pembersihan Prefiks Model Menyeluruh untuk Pengguna Biasa (`lib/model-utils.ts`)**:
  - Semua prefiks routing internal upstream seperti `cx/`, `xai/`, `cl/`, `kc/`, `bzl/`, `qd/`, `apinex/`, `cutadai/`, `tokenharbor/`, `kr/`, `openrouter/`, `ollama/`, `together/`, `af/`, `cbai/`, `ag/`, dll. otomatis dipotong habis untuk pengguna web biasa.
  - Tampilan nama model di antarmuka web 100% bersih menjadi nama komersial murni (contoh: `gpt-6.1-sol`, `grok-4.6`, `claude-sonnet-5.5`, `claude-haiku-4.5`, `deepseek-v4.1-flash`).
  - Untuk Admin (`adminfordhani`), nama teknis/routing tetap dipertahankan untuk kebutuhan inspeksi upstream.

### `aab1bc3` — feat(ui): sort accessible models to the top of model catalog and playground
**Ditambahkan / Diubah**
- **Model yang Dapat Digunakan Tampil di Paling Atas**:
  - Di tab **Model** (`ModelsTab.tsx`) dan dropdown **Playground** (`PlaygroundToolbar.tsx`), model yang berstatus terbuka / dapat digunakan (`isAllowed` / `accessible`) otomatis diurutkan ke paling atas.
  - Untuk pengguna tier `free`, model `Atria Dawn Preview (Bansos)` dan `DeepSeek 4.1 Flash (Token Harbor)` otomatis menempati posisi teratas dengan status terbuka, disusul model lainnya yang berstatus terkunci.
  - Endpoint `/v1/models` juga mengurutkan model terbuka di urutan teratas secara dinamis sesuai tier akun yang melakukan request.

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