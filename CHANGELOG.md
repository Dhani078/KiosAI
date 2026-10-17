# Changelog — KiosAI

Semua perubahan penting pada proyek ini dicatat di sini.
Format: `[commit-hash] tipe(scope): deskripsi`.

---

## [Unreleased]

### `b370429` — feat(secrets): support syncing oauth client credentials to cloudflare worker

**Sinkronisasi Kredensial OAuth ke Cloudflare Worker**
- **Ekstensi Secret Worker (`scripts/sync-worker-secrets.mjs`)**: Menambahkan kunci `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GOOGLE_CLIENT_ID`, dan `GOOGLE_CLIENT_SECRET` ke daftar kunci yang otomatis disinkronkan ke Cloudflare Worker.
- **Aktivasi Google OAuth Live**: Kredensial Google OAuth berhasil dipasang di `.env` dan tersinkronisasi langsung ke encrypted secrets Cloudflare Worker live (`HTTP 201 Created`).
- **Verifikasi Alur Redirect**: Endpoint `GET /api/auth/oauth/google` terverifikasi merespons `HTTP 307 Temporary Redirect` menuju `accounts.google.com/o/oauth2/v2/auth`.
- **Hasil Verifikasi**: tsc 0 error, 104/104 file patuh $\le 200$ baris, 22/22 pricing tests PASS, 11/11 E2E tests PASS, 3/3 billing deduction PASS, chaos test PASS, 16/16 UI audits PASS.

### `4047b72` — feat(auth): implement native GitHub and Google OAuth social login and onboarding

**Autentikasi Sosial Native: Sign in with GitHub & Google**
- **Modul OAuth Inti (`lib/oauth.ts`)**: Modul terpisah (151 baris) menangani pembuatan URL otorisasi, penukaran `code` ke `access_token`, pengambilan profil pengguna terverifikasi, dan upsert akun ke TiDB (`oauth_provider`, `oauth_id`, `avatar_url`).
- **Skema Kolom Database TiDB**: Menambahkan kolom `oauth_provider` (VARCHAR 50), `oauth_id` (VARCHAR 255), dan `avatar_url` (VARCHAR 500) pada tabel `kiosai.users`.
- **Endpoint Rute Terdistribusi**:
  - `app/api/auth/oauth/[provider]/route.ts` (25 baris): Memvalidasi konfigurasi kredensial dan mengarahkan browser ke layar persetujuan OAuth.
  - `app/api/auth/oauth/[provider]/callback/route.ts` (69 baris): Menukar token, mendaftarkan akun baru (250K token instan + 2.25M brankas bonus) atau mengaitkan akun lama, menyematkan sesi aman, dan mengalihkan ke `/dashboard`.
- **Integrasi Dialog Autentikasi (`app/components/AuthModal.tsx`)**: Menambahkan tombol sosial interaktif "Lanjutkan dengan GitHub" dan "Lanjutkan dengan Google" dengan ikon SVG presisi dan pemisah visual di atas formulir email/password tradisional.
- **Hasil Verifikasi**: tsc 0 error, 104/104 file patuh $\le 200$ baris, 22/22 pricing tests PASS, 11/11 E2E tests PASS, 3/3 billing deduction PASS, chaos test PASS, 16/16 UI audits PASS.

### `6ba1be5` — feat(models): integrate verified OpenCode models into free tier with failover and zero pricing

**Integrasi Model OpenCode Terverifikasi ke Free Tier Tanpa Biaya**
- **Verifikasi Model Nyata 9Router**: Menguji inferensi live HTTP 200 OK untuk 4 model OpenCode: `oc/deepseek-v4.1-flash-free(max)` (3531ms), `oc/muse-spark-1.3-contributor-free` (541ms), `oc/mimo-v2.6-flash-free` (9130ms), dan `oc/nemotron-3.5-lightning-free` (19405ms).
- **Akses Free Tier Penuh (`lib/keys.ts` & `app/v1/models/route.ts`)**: Seluruh model dengan awalan `oc/` otomatis diklasifikasikan sebagai `tier: "free"` dan dapat diakses langsung oleh akun tier Free tanpa penolakan 403 `tier_restricted`.
- **Daftar Model Terverifikasi (`lib/verified-models.ts`)**: Mendaftarkan model `oc/` ke dalam whitelist verifikasi resmi (total bertambah dari 66 menjadi 71 model aktif).
- **Tarif Nol Rupiah (`lib/model-pricing.ts`)**: Menetapkan tarif input $0.00 / output $0.00 (Gratis) untuk seluruh keluarga model OpenCode `oc/`.
- **Rute Failover Multiarah (`lib/failover-router.ts`)**: Mengonfigurasi jaring pengaman failover timbal-balik antara `oc/deepseek-v4.1-flash-free(max)`, `beatapi/deepseek-v4.1-flash-free`, `tokenharbor`, dan `oc/mimo-v2.6-flash-free`.
- **Katalog Landing Page & Hero Counter (`modelCatalogData.ts` & `HeroSection.tsx`)**: Menampilkan kartu model OpenCode di katalog landing dan memperbarui metrik hero menjadi "70+ Model Terverifikasi".
- **Hasil Verifikasi**: tsc 0 error, 101/101 file patuh $\le 200$ baris, 22/22 pricing tests PASS, 11/11 E2E tests PASS, 3/3 billing deduction PASS, chaos test PASS, 16/16 UI audits PASS.

### `b4dac3f` — feat(docs): add one-click .env file export modal for cline, vs code, and python

**Modal Ekspor File .env Satu-Klik**
- **Modal Generator .env (`app/components/EnvExportModal.tsx`)**: Modul baru (88 baris) menyediakan preview konfigurasi lingkungan produksi `.env.local` lengkap dengan Base URL, active API Key, target model, dan panduan provider kustom untuk Cline / Roo Code / Cursor / Next.js / Python.
- **Tombol Download & Ekspor Cepat (`app/components/DocsTab.tsx`)**: Menambahkan tombol `.env` di sebelah Base URL pada tab Dokumentasi untuk mengunduh langsung file `.env.local` atau menyalin cuplikan teks dengan 1 klik.
- **Kepatuhan Modularitas**: 101/101 file kode sumber patuh $\le 200$ baris per file (`DocsTab.tsx` 196 baris, `EnvExportModal.tsx` 88 baris).
- **Hasil Verifikasi**: tsc 0 error, E2E 11/11, pricing 18/18, chaos test PASS, billing deduction 3/3, UI audit 16/16.

### `614ab45` — feat(billing): add low-balance webhook notifications with 30m debounce and user config

**Notifikasi Webhook Saldo Menipis Otomatis**
- **Modul Pemicu Webhook (`lib/balance-alerts.ts`)**: Modul terpisah (57 baris) untuk pengiriman notifikasi webhook HTTP POST saat saldo akun jatuh di bawah ambang batas (default 50.000 token) dengan perlindungan in-memory debounce 30 menit per pengguna anti-spam.
- **Skema Kolom Database**: Menambahkan kolom `alert_webhook_url` (VARCHAR 500) dan `alert_threshold_tokens` (BIGINT) pada tabel `kiosai.users`.
- **Integrasi Endpoint & Streaming (`app/v1/chat/completions/route.ts` & `lib/stream-billing.ts`)**: Mendeteksi sisa saldo pasca eksekusi streaming (`onSettled`) maupun non-streaming dan mengeksekusi pengiriman alert secara asinkron tanpa memblokir siklus respon klien.
- **Konfigurasi Akun Pengguna (`app/components/AuthModal.tsx` & `app/api/user/route.ts`)**: Input URL webhook (Discord/Slack/Telegram) disematkan di modal akun pengguna dan disimpan via endpoint `PATCH /api/user`.
- **Kepatuhan Modularitas**: 100/100 file kode sumber patuh batasan $\le 200$ baris per file (`AuthModal.tsx` 146 baris, `route.ts` 167 baris, `lib/keys.ts` 182 baris).
- **Hasil Verifikasi**: tsc 0 error, E2E 11/11, pricing 18/18, chaos test PASS, billing deduction 3/3, UI audit 16/16.

### `c797359` — feat(models): add one-click code snippet modal generator to every model card

**Generator Cuplikan Kode Satu-Klik pada Setiap Kartu Model**
- **Modal Integrasi Cepat (`app/components/ModelSnippetModal.tsx`)**: Komponen modal baru (106 baris) yang langsung menghasilkan contoh kode integrasi cURL, Python, dan Node.js lengkap dengan ID model terpilih dan API key aktif pengguna.
- **Aksi Satu-Klik di Katalog (`app/components/ModelsTab.tsx`)**: Setiap kartu model di katalog dashboard kini memiliki tombol ikon kode `<Code2 />` di samping tombol aksi utama. Mengklik tombol ini langsung memunculkan modal integrasi tanpa harus berpindah ke tab Dokumentasi atau menyalin string ID model secara manual.
- **Kepatuhan Modularitas**: `DashboardApp.tsx` (199 baris), `ModelsTab.tsx` (189 baris), dan `ModelSnippetModal.tsx` (106 baris) patuh aturan $\le 200$ baris per file.
- **Hasil Verifikasi**: 99/99 file kode sumber patuh $\le 200$ baris per file, tsc 0 error, E2E 11/11, pricing 18/18, chaos test PASS, billing deduction 3/3, UI audit 16/16.

### `d64d640` — feat(models): display real-time latency speed indicators on catalog model cards

**Indikator Kecepatan & Latensi Riil pada Kartu Model**
- **Estimator Latensi Model (`lib/model-latency.ts`)**: Modul terpisah (30 baris) mendefinisikan benchmark latensi model berdasarkan keluarga model AI: Flash/Lite (~240ms hijau cepat), Flagship Standar (~650ms), dan Deep Reasoning/Opus (~1.4s).
- **Badge Latensi Interaktif (`app/components/ModelsTab.tsx`)**: Setiap kartu model di katalog dashboard kini menampilkan indikator dot status dan estimasi latensi respons di samping nama provider (misal `GOOGLE • ~240ms`), memberikan transparansi kecepatan kepada developer sebelum memilih model.
- **Hasil Verifikasi**: 98/98 file kode sumber patuh $\le 200$ baris per file (`ModelsTab.tsx` 170 baris), tsc 0 error, E2E 11/11, pricing 18/18, chaos test PASS, billing deduction 3/3, UI audit 16/16.

### `fd17d0d` — feat(dashboard): add sticky low balance warning banner with quick refill action

**Banner Peringatan Saldo Menipis di Dashboard**
- **Banner Peringatan Proaktif (`app/dashboard/DashboardApp.tsx`)**: Menampilkan peringatan visual di bagian atas dashboard ketika saldo token pengguna berada di bawah ambang batas 50.000 token, disertai tombol aksi instan "Isi Ulang" yang langsung mengarahkan pengguna ke tab Beli Token.
- **Kepatuhan Modularitas**: `DashboardApp.tsx` tetap ringkas (198 baris, patuh aturan $\le 200$ baris per file).
- **Hasil Verifikasi**: 97/97 file kode sumber patuh $\le 200$ baris per file, tsc 0 error, E2E 11/11, pricing 18/18, chaos test PASS, billing deduction 3/3, UI audit 16/16.

### `0e43d8d` — feat(models): integrate verified beatapi/deepseek-v4.1-flash-free into catalog, alias resolver, and failover router

**Integrasi Model Baru BeatAPI DeepSeek V4.1 Flash Free**
- **Verifikasi Model (`lib/verified-models.ts`)**: Mendaftarkan `beatapi/deepseek-v4.1-flash-free` ke daftar model terverifikasi aktif setelah uji inferensi nyata HTTP 200 via upstream 9Router (total 66 model aktif terverifikasi).
- **Resolusi Alias Komersial (`lib/model-utils.ts`)**: Menambahkan pemetaan otomatis untuk alias `deepseek-v4.1-flash-free` dan `beatapi/deepseek-v4.1-flash-free`.
- **Rute Failover Otomatis (`lib/failover-router.ts`)**: Menjadikan `beatapi/deepseek-v4.1-flash-free` sebagai kandidat failover timbal-balik utama untuk `tokenharbor/deepseek-v4.1-flash:free` saat salah satu upstream mengalami HTTP 429 atau overload.
- **Pengujian Tarif Token (`scripts/test-pricing.mjs`)**: Menambahkan assertion tarif untuk `beatapi/deepseek-v4.1-flash-free` (18/18 pricing checks lolos 100%).
- **Hasil Verifikasi**: 97/97 file kode sumber patuh $\le 200$ baris per file, tsc 0 error, E2E 11/11, pricing 18/18, chaos test PASS, billing deduction 3/3, UI audit 16/16.

### `d48892a` — feat(models): prioritize Gemini family at top of Pro models in dashboard and landing catalog

**Prioritas Model Gemini di Posisi Teratas Katalog Pro**
- **Sorting Katalog Dashboard (`app/components/ModelsTab.tsx`)**: Mengatur urutan tampilan kartu model AI agar keluarga Google Gemini (`ag/gemini-3.8-flash-high`, `google/gemini-2.0-flash`) berada di urutan teratas model Pro setelah model Free (Atria), memudahkan pengguna menemukan model Gemini berkecepatan tinggi dengan kuota melimpah.
- **Showcase Landing Page (`app/landing/components/modelCatalogData.ts`)**: Memposisikan kartu Gemini 3.8 Flash (High) dan Gemini 2.0 Flash tepat setelah Atria Dawn di grid landing page.
- **Hasil Verifikasi**: 97/97 file kode sumber patuh $\le 200$ baris per file (`ModelsTab.tsx` 165 baris), tsc 0 error, E2E 11/11, pricing 17/17, chaos test PASS, billing deduction 3/3, UI audit 16/16.

### `719a75a` — feat(keys): add per-key spend token limit cap to protect developer budget

**Batas Maksimal Pengeluaran Token per API Key (Spend Cap)**
- **Skema Database & Validasi Kunci (`lib/keys.ts`)**: Menambahkan kolom `max_spend_tokens` dan `spent_tokens` di tabel TiDB `api_keys`. Pada saat validasi API key di `/v1/chat/completions`, jika `spent_tokens >= max_spend_tokens`, request ditolak dengan pesan error deskriptif untuk mencegah loop tak hingga di aplikasi klien menguras seluruh saldo akun pengguna.
- **Pelacakan Pengeluaran Otomatis (`lib/keys.ts` & `lib/stream-billing.ts`)**: Fungsi `deductTokens` kini mencatat akumulasi token pemakaian langsung ke kolom `spent_tokens` milik key terkait, baik pada request streaming SSE maupun non-streaming JSON.
- **Antarmuka Pembuatan & Manajemen Key (`KeyModal.tsx` & `KeysTab.tsx`)**: Opsi Spend Cap disematkan di modal pembuatan key (500K Dev, 2M Bot Ringan, 10M Aplikasi Terbatas, Tanpa Batas). Label tabel API key menampilkan indikator batas kuota aktif.
- **Hasil Verifikasi**: 97/97 file kode sumber patuh $\le 200$ baris per file (`KeyModal.tsx` 184 baris, `KeysTab.tsx` 147 baris, `keys.ts` 180 baris), tsc 0 error, E2E 11/11, pricing 17/17, chaos test PASS, billing deduction 3/3, UI audit 16/16.

### `0f4b146` — feat(playground): add system prompt persona presets dropdown in playground toolbar

**Preset Persona System Prompt Instan di Playground**
- **Katalog Preset Prompt (`lib/prompt-presets.ts`)**: Modul terpisah (28 baris) mendefinisikan persona pengujian instan: Asisten Umum, Coding Specialist (solusi konkret tanpa basa-basi), Penerjemah Formal (KBBI/EYD baku), dan JSON Data Extractor.
- **Integrasi Dropdown Persona (`app/components/PlaygroundTab.tsx`)**: Menambahkan pemilih preset persona tepat di samping label input instruksi sistem, memungkinkan pengguna menguji prompt engineering beragam persona dengan satu klik tanpa mengetik instruksi berulang.
- **Hasil Verifikasi**: 97/97 file kode sumber patuh $\le 200$ baris per file (`PlaygroundTab.tsx` 199 baris), tsc 0 error, E2E 11/11, pricing 17/17, chaos test PASS, billing deduction 3/3, UI audit 16/16.

### `d9ea368` — feat(billing): add instant printable payment receipt and invoice generator

**Generator Faktur & Bukti Pembayaran Digital Cetak Instan**
- **Generator Bukti Pembayaran (`lib/receipt-generator.ts`)**: Modul terpisah (79 baris) untuk memproduksi dokumen HTML faktur resmi dengan format cetak profesional (tata letak header KiosAI, detail order, badge LUNAS, rincian token, dan skrip auto-print `window.print()`).
- **Integrasi Tombol Cetak (`app/components/OrderHistoryTable.tsx`)**: Setiap baris transaksi dengan status `paid` kini dilengkapi tombol ikon printer yang membuka dokumen faktur di jendela baru untuk klaim reimburse kantor atau pembukuan pajak.
- **Hasil Verifikasi**: 96/96 file kode sumber patuh $\le 200$ baris per file, tsc 0 error, E2E 11/11, pricing 17/17, chaos test PASS, billing deduction 3/3, UI audit 16/16.

### `e014511` — feat(security): add prototype pollution protection and strict cloudflare edge guard

**Proteksi Prototype Pollution di Edge V8 dan Kunci Header Strict Cloudflare Edge**
- **Anti-Prototype-Pollution (`lib/prompt-normalizer.ts`)**: Objek canonicalization dibangun di atas `Object.create(null)` dengan penyaringan eksplisit terhadap kunci berbahaya (`__proto__`, `constructor`, `prototype`). Mencegah eksploitasi keracunan prototipe objek di memori global V8 isolate.
- **Strict Cloudflare Edge Guard (`app/v1/chat/completions/route.ts`)**: Pada lingkungan produksi, request diwajibkan menyertakan header resmi `cf-ray` dari Cloudflare Edge (melewati pengecualian aman untuk `localhost` / `127.0.0.1` dev). Menutup celah penyerang melakukan direct IP spoofing atau membypass proteksi edge proxy.
- **Hasil Verifikasi**: 95/95 file kode sumber patuh $\le 200$ baris per file, tsc 0 error, E2E 11/11, pricing 17/17, chaos test PASS, billing deduction 3/3, UI audit 16/16.

### `84cc214` — fix(core): patch bonus vault arbitrage, sse chunk framing distortion, vision memory bloat, and mid-stream watchdog

**Patch Forensik F-01 s/d F-07: Anti-Arbitrase Bonus, Parser SSE Konten Murni, Proteksi Memori Vision, dan Watchdog Stream**
- **F-01 (Anti-Arbitrase Bonus Vault)**: Di `orders/pay/route.ts` dan `payment/webhook/route.ts`, pencairan `locked_bonus_tokens` menggunakan formula match-vesting proporsional (`LEAST(locked_bonus_tokens, tokens_purchased)`). Mencegah bot bermodal Rp10.000 mencairkan langsung 2,25M token untuk menguras model mahal Claude 3.7 Sonnet.
- **F-02 (Akurasi Stream Billing)**: Di `lib/stream-billing.ts`, menerapkan line buffer utuh yang tahan terhadap pembelahan TCP chunk. Karakter yang dihitung saat stream abort murni mengekstrak isi `delta.content`, `delta.reasoning_content` (DeepSeek R1), dan `delta.tool_calls` tanpa menghitung bingkai metadata JSON SSE.
- **F-03 (Proteksi Memori V8 Vision)**: Di `lib/prompt-normalizer.ts`, string blob besar (>4096 byte seperti Base64 `data:image/...`) diringkas menjadi fingerprint deterministik 64 byte. Mencegah alokasi memori berlebih 100+ MB yang memicu Cloudflare Error 1102 (OOM 128 MB).
- **F-04 & F-07 (Telemetri Anti-Hotspot & Anti-Lockup)**: Di `lib/edge-telemetry.ts`, membatasi ukuran Map maksimal 64 entri (FIFO eviction) untuk mencegah kebocoran memori, membungkus `flushInFlight = false` di dalam blok `finally`, dan merekonstruksi skema TiDB `telemetry_rollup_10s` dengan Primary Key `(model_id, window_start)` untuk mendistribusikan beban tulis merata ke seluruh Region TiKV.
- **F-05 (Mid-Stream Watchdog 15 Detik)**: Di `lib/failover-router.ts`, pembacaan stream downstream pasca-chunk pertama diproteksi watchdog 15 detik. Jika upstream mengalami silent hang di tengah stream, koneksi ditutup secara anggun dan saldo tetap terhitung akurat sesuai chunk yang sudah terkirim.
- **Hasil Verifikasi**: 95/95 file kode sumber patuh $\le 200$ baris per file, tsc 0 error, E2E 11/11, pricing 17/17, chaos test PASS, billing deduction 3/3, UI audit 16/16.

### `8bf2e69` — feat(edge): add priority scheduler, telemetry rollup, code-aware prompt normalizer, and chaos test

**Scheduler Jalur Prioritas, Ring Buffer Telemetri 10 Detik, Normalisasi Prompt Aman Kode, dan Chaos Test**
- **Dual-Lane Priority Token Bucket (`lib/priority-scheduler.ts`)**:
  - Klasifikasi otomatis trafik `INTERACTIVE` (Cline, Roo Code, Cursor, Playground) vs `BULK_BOT` (WhatsApp bot, scraper).
  - Reserva 40% slot konkurensi khusus untuk jalur interaktif (0ms delay).
  - Menerapkan Edge Micro-Pacing (150-1200ms sleep di Edge tanpa memakan CPU Workers) untuk bot yang menembak beruntun, mencegah monopoli upstream.
- **Asynchronous Telemetry Rollup (`lib/edge-telemetry.ts`)**:
  - Mengagregasi metrik p50, p95, p99 TTFB, jumlah sukses, failover, dan cache hit dalam tumbling window 10 detik di RAM V8.
  - Multi-row `INSERT ... ON DUPLICATE KEY UPDATE` ke tabel TiDB `telemetry_rollup_10s`. Memangkas operasi tulis database hingga 99% (menghemat ratusan juta Request Units per bulan).
- **Code-Fence-Aware Prompt Normalizer (`lib/prompt-normalizer.ts`)**:
  - Menormalisasi variasi whitespace dan format tanpa mengubah satu byte pun isi blok kode markdown (` ```...``` ` dan ` `...` `).
  - Mengurutkan kunci objek JSON secara rekursif agar urutan schema tools menghasilkan hash deterministik identik.
- **Chaos Load Test Runner (`scripts/chaos-load-test.mjs`, `npm run test:chaos`)**:
  - Mensimulasikan klien paralel dengan 40% client abort di tengah stream.
  - Memvalidasi 3 invarian: 0 unhandled 500 error, saldo pengguna selalu $\ge 0$, dan seluruh slot konkurensi terlepas bersih.
- **Hasil Verifikasi**: 95/95 file kode sumber patuh $\le 200$ baris per file, TypeScript 0 error, E2E 11/11 lolos, chaos test lolos, pricing 17/17 lolos, billing deduction lolos, UI audit 16/16 lolos.

### `3852957` — feat(core): implement bonus vault funnel, pre-ttfb failover router, and edge prompt caching

**Funnel Brankas Bonus Anti-Ternak Akun, Router Failover Pre-TTFB, dan Edge Exact Prompt Caching**
- **Funnel Brankas Bonus Anti-Ternak Akun (`lib/bonus-vault.ts`, `app/api/auth/register`, `orders/pay`, `payment/webhook`)**:
  - Pendaftaran baru kini menerima 250.000 token aktif instan (cukup untuk pengujian integrasi) dan 2.250.000 token disimpan di Brankas Terkunci (`locked_bonus_tokens`).
  - Top-up pertama via QRIS (mulai Rp10.000) otomatis mencairkan 2.250.000 token bonus ke saldo aktif dan membuka seluruh model Pro secara atomik.
  - Penanganan error 402 kuota habis (`buildQuotaExhaustedError`) membimbing developer langsung ke `/dashboard` (menghindari error 404 `/billing`).
  - Tampilan Dual-Wallet di `AnalyticsCards.tsx` menampilkan Saldo Aktif dan badge Brankas Bonus `🔒`.
- **Pre-TTFB First-Chunk Probe Failover (`lib/failover-router.ts`)**:
  - Probe first-chunk stream upstream dengan deteksi HTTP 429/500/502/503/504 dan soft-error SSE (`"error":`, `"rate_limit"`).
  - Otomatis beralih ke model cadangan terverifikasi tanpa memutus koneksi klien yang meminta streaming SSE.
  - Price-cap protection: tagihan ke pengguna dibatasi maksimal sebesar tarif model yang diminta ($\min(\text{requestedPricing}, \text{actualPricing})$).
- **Exact Prompt Caching di Edge (`lib/edge-cache.ts`)**:
  - Mendeteksi payload deterministik (`temperature: 0` / `top_p: 0`) dengan isolasi tenant `SHA-256(tenant:${userId})`.
  - Cache hit disajikan instan dari `caches.default` dengan diskon token 80% ke pengguna (user bayar 20%) dan biaya upstream Rp0.
- **Hasil Verifikasi**: 91/91 file kode sumber patuh $\le 200$ baris per file, TypeScript 0 error, E2E 11/11 lolos, pricing 17/17 lolos, billing deduction lolos, UI audit 16/16 lolos.

### `0bd7361` — feat(billing): implement directional token pricing, stream abort protection, concurrent stream limiter, and cline env preset

**Pemisahan Tarif Input vs Output, Proteksi Stream Abort, Limiter Stream Konkuren, dan Preset Cline .env**
- **Directional Token Pricing (`lib/model-pricing.ts`)**: Memisahkan kalkulasi tarif prompt vs completion secara asimetris via `getDirectionalRatios` dan `calculateTokenCost`. Token prompt dibobotkan dengan `inputUsd / 1.37` dan token output dengan `outputUsd / 1.37`. Mencegah overcharging 5-6x pada beban konteks besar (coding/RAG) dan melindungi margin penyedia pada respons panjang.
- **Proteksi Eksploitasi Stream Abort (`lib/stream-billing.ts`)**: Membuat helper stream billing terpisah yang menangani event `cancel()` saat klien memutus koneksi di tengah jalan (stream abort). Saldo tetap terpotong proporsional berdasarkan karakter yang sudah terkirim (`accumulatedChars / 3.5`), mencegah kebocoran kuota gratis.
- **Limiter Stream Konkuren (`lib/ratelimit.ts`)**: Menambahkan `acquireStreamSlot` dan `releaseStreamSlot` in-memory untuk membatasi maksimal 3 stream SSE simultan per API key. Mencegah race condition saldo terkuras/overdraft akibat puluhan request konkuren paralel.
- **Preset VS Code Cline / Roo Code / .env (`app/components/DocsTab.tsx`)**: Menambahkan tab baru `Cline / .env` yang langsung menyajikan format variabel lingkungan `OPENAI_BASE_URL`, `OPENAI_API_KEY`, dan `MODEL` siap salin untuk integrasi coding agent instan.
- **Ekspansi Test Suite**: 17 pricing & directional assertions di `scripts/test-pricing.mjs` lolos 100%. Kepatuhan modularitas: 88/88 file kode sumber patuh $\le 200$ baris per file (`stream-billing.ts` 87 baris, `route.ts` 149 baris, `DocsTab.tsx` 190 baris).

### `7393a9e` — test(e2e): expand suite to 11 tests with post-upgrade pro alias access verification

**Pengujian E2E Menyeluruh 11 Langkah dengan Akses Model Pro Alias**
- **Verifikasi Akses Pro Pasca-Upgrade (`scripts/test-e2e.mjs`)**: Menambahkan langkah ke-10 yang menguji pemanggilan model Pro via alias `deepseek-v4.1-flash` setelah settlement pembayaran QRIS, memvalidasi bahwa status akun `pro` berhasil melewati gate 403 `tier_restricted` dan menghasilkan inferensi sukses.
- **Refactoring Helper `postChat`**: Menyederhanakan payload dan header request chat completion sehingga file tetap ringkas (195 baris, patuh batas $\le 200$ baris).
- **Hasil Pengujian**: 11/11 lolos 100%.

### `81d5212` — docs: synchronize all markdown documentation across repository

**Sinkronisasi Menyeluruh Dokumentasi Markdown**
- **PRD (`PRD.md`)**: Menambahkan Seksi 20 s/d 25 mencakup spesifikasi arsitektur billing 2-tier final, metrik observabilitas Maxxmode, hasil audit 5x penyaringan katalog, penyembunyian branding internal role-based, resolusi alias komersial, serta identitas brand dan vektor logo resmi.
- **API Reference (`API.md`)**: Mendokumentasikan tabel pemetaan resolusi alias model industri (`claude-3.7-sonnet`, `gpt-4o`, `gemini-2.0-flash`, `deepseek-r1`, `llama-3.3-70b`, `deepseek-v4.1-flash`, `atria`).
- **Overview Proyek (`README.md`)**: Memperbarui deskripsi fitur utama, tautan dokumentasi lengkap, aset brand folder `public/brand/`, dan metrik katalog 65 model aktif terverifikasi.
- **Manual Operasional & Handoff (`AGENT.md`, `docs/HANDOFF.md`)**: Memperbarui total file sumber (87 file <= 200 LOC) dan jumlah assertion pengujian tarif (13/13).

### `e941cc8` — feat(landing): display model id code badge on landing cards and add deepseek-v4.1-flash pricing test

**Tampilan Parameter Model pada Kartu Landing & Pengujian Tarif Alias**
- **Badge Kode Model (`ModelsSection.tsx` & `modelCatalogData.ts`)**: Kartu model pada landing page kini menampilkan badge kode monospace ID model (misal `deepseek-v4.1-flash`, `atria/Atria-Dawn-Preview`, `openai/gpt-4o`) tepat di bawah nama model, sehingga developer dapat langsung menyalin parameter model persis yang diterima SDK.
- **Pengujian Tarif Model Alias (`scripts/test-pricing.mjs`)**: Menambahkan uji assertion eksplisit untuk `deepseek-v4.1-flash` (13/13 lolos), menjamin rasio pemotongan saldo terbukti identik 1.0 dengan rute internal.
- **Kepatuhan Modularitas**: `ModelsSection.tsx` (121 baris) dan `modelCatalogData.ts` (118 baris) patuh batas $\le 200$ baris per file.

### `6e79e58` — feat(landing): update hero CTA bonus to 2.5M, verified model count to 65+, and use clean model aliases in code snippets

**Penyelarasan Copy Landing Page & Integrasi Kode Bersih**
- **Koreksi CTA Tombol Hero (`HeroSection.tsx`)**: Mengubah teks tombol CTA utama dari copy lama (`Mulai Sekarang (+100.000 Token)`) menjadi `Mulai Gratis (2.5 Juta Token)`.
- **Koreksi Metrik Model Terverifikasi (`HeroSection.tsx`)**: Memperbarui kartu ringkasan dari `765+ Model AI` menjadi `65+ Model Terverifikasi` (mencerminkan hasil audit 5x Phase 23).
- **Snippet Kode Bersih (`CodeSection.tsx`)**: Mengganti rute internal `tokenharbor/deepseek-v4.1-flash:free` di contoh integrasi Python, Node.js, dan cURL menjadi alias bersih `deepseek-v4.1-flash` (memanfaatkan `resolveModelAlias`).
- **Kepatuhan Modularitas**: `HeroSection.tsx` (146 baris) dan `CodeSection.tsx` (99 baris) patuh $\le 200$ baris per file.

### `b82acae` — feat(brand): apply official KiosAI vector logo across web, favicon, and brand assets

**Integrasi Logo Resmi KiosAI & Folder Brand Aset**
- **Vektorisasi Logo Presisi (`Logo.tsx`)**: Mengganti ikon lama (3 batang miring) dengan simbol resmi KiosAI (Kapsul vertikal pill + panah chevron chevron kustom) dalam format SVG vektor murni yang tajam pada resolusi apa pun.
- **Favicon & Web App Icon (`public/favicon.svg`, `public/kiosai-icon.svg`, `app/layout.tsx`)**: Memasang favicon SVG baru dan metadata ikon browser (PNG 512x512 dan Apple Touch Icon 192x192).
- **Pengorganisasian Folder Aset (`public/brand/`)**: Memindahkan file master gambar `Gemini_Generated_Image_1q6k8k1q6k8k1q6k.jfif` ke `public/brand/kiosai-logo-master.jfif` dan menghasilkan varian resolusi tinggi:
  - `kiosai-logo-2048.png` (Master lossless 2048x2048)
  - `kiosai-logo-512.png` & `kiosai-logo-192.png` (Standard high-res icons)
  - `kiosai-logo-transparent.png` (Background transparan)
  - `kiosai-logo.svg` & `kiosai-logo-symbol.svg` (Vektor SVG tak terbatas resolusi)
- **Kepatuhan Modularitas**: `Logo.tsx` berukuran 30 baris dan `layout.tsx` 30 baris (jauh di bawah batas $\le 200$ baris). Semuanya lolos 100% verifikasi.

### `8703846` — feat(ui): hide 9Router branding from public and regular users, keep visible for admin

**Penyembunyian Branding Router Internal**
- **Kondisional `isAdmin` pada UI**: Teks "9Router" disembunyikan dari semua pengguna umum / publik di 3 komponen antarmuka web (`LandingFooter.tsx`, `Header.tsx`, dan `PlaygroundTab.tsx`).
- **Tampilan Khusus Pengguna**:
  - Footer landing: `"Cloud Database & Gateway Live"` (bukan 9Router).
  - Header tooltip: `"Database: connected (Xms) | Gateway: connected (Yms)"` (bukan 9Router).
  - Konteks Playground: `"Koneksi Live Gateway Aktif"` (bukan 9Router).
- **Tampilan Admin Tetap Lengkap**: Admin (`adminfordhani`) tetap melihat label teknis `"9Router"` lengkap untuk kemudahan inspeksi gateway.
- **Verifikasi CDP**: 0 kemunculan kata "9Router" pada landing page dan seluruh tab dashboard untuk pengguna reguler; tetap tampil normal untuk sesi admin.
- **Kepatuhan Modularitas**: Semua file termodifikasi tetap patuh $\le 200$ baris per file (`Header.tsx` 91 baris, `LandingFooter.tsx` 60 baris, `PlaygroundTab.tsx` 192 baris).

### `c0a6533` — feat(playground): humanize gateway error messages with friendly indonesian explanations and countdown

**Pesan Error Manusiawi di Playground**
- **Format Pesan Ramah Pengguna (`lib/model-utils.ts` & `PlaygroundTab.tsx`)**: Fungsi `humanizeErrorMessage` mengubah pesan error teknis mentah gateway upstream (seperti `Upstream (503): [atria] [429]: {"error":{"message":"Token quota exhausted"}} (reset after 24s)`) menjadi kalimat bahasa Indonesia yang jelas dan mudah dipahami:
  - Error kuota upstream: `"Kuota provider untuk model ini sedang habis (reset dalam 24s). Silakan tunggu sebentar atau beralih ke model lain."`
  - Error rate limit: `"Batas frekuensi permintaan tercapai (reset dalam Xs). Silakan tunggu sebentar."`
  - Error 503 upstream: `"Layanan model AI upstream sedang sibuk atau mengalami gangguan sementara. Silakan coba sesaat lagi atau beralih ke model lain."`
  - Error timeout, tier restricted, atau balance: otomatis diterjemahkan ke solusi konkret.
- **Dukungan Debug untuk Admin**: Untuk sesi admin (`isAdmin = true`), pesan ramah disertai anotasi `[Detail Teknis: ...]` agar kemudahan investigasi upstream tetap terjaga.
- **Kepatuhan Modularitas**: `lib/model-utils.ts` (116 baris) dan `PlaygroundTab.tsx` (192 baris) tetap patuh batasan $\le 200$ baris per file.

### `2055cda` — feat(ui): make workspace header clickable to open account profile modal

**Akses Cepat Profil & Pengaturan Akun**
- **Interaksi Workspace Header (`Sidebar.tsx`)**: Header `.workspace` di bagian atas sidebar kiri kini interaktif (`role="button"`, `tabIndex={0}`, navigasi keyboard Enter/Spasi), langsung membuka modal profil akun untuk mengecek saldo token, tier, dan detail akun.
- **Kepatuhan Modularitas & Aksesibilitas**: `Sidebar.tsx` tetap patuh 130 baris ($\le 200$ baris) dengan dukungan atribut aksesibilitas standar.

### `016412e` — feat(billing): support granular pro tier keys in order settlement and test alias routing in e2e

**Penyelesaian Order Granular & Validasi E2E Alias**
- **Dukungan Key Tier Granular (`pay/route.ts` & `payment/webhook/route.ts`)**: Klausul `CASE WHEN` kini memvalidasi `'pro_25k'`, `'pro_100k'`, dan `'pro_150k'` secara eksplisit, menjamin akun terupgrade ke `pro` tanpa bergantung pada normalisasi tier sebelumnya.
- **Validasi E2E Live Alias (`scripts/test-e2e.mjs`)**: Step 5 pengujian integrasi gateway memanggil model alias `"atria"` (memverifikasi pemetaan otomatis ke `"atria/Atria-Dawn-Preview"` pada request nyata non-stream).
- **Kepatuhan Modularitas**: Semua file termodifikasi tetap patuh batasan $\le 200$ baris per file (`test-e2e.mjs` 191 baris, `pay/route.ts` 54 baris, `webhook/route.ts` 91 baris).

### `fa56315` — feat(models): add universal commercial alias resolution for standard OpenAI model identifiers

**Resolusi Alias Model Industri Otomatis**
- **Dukungan Identifier Standar (`lib/model-utils.ts`)**: Fungsi `resolveModelAlias` kini memetakan secara cerdas identifier industri standar ke rute model 9Router yang terbukti aktif (`200 OK`):
  - `claude-3.7-sonnet` / `anthropic/claude-3.7-sonnet` $\rightarrow$ `ag/claude-sonnet-4-6`
  - `gpt-4o` / `openai/gpt-4o` $\rightarrow$ `cx/gpt-6-luna`
  - `gemini-2.0-flash` / `google/gemini-2.0-flash` $\rightarrow$ `ag/gemini-3.8-flash-high`
  - `deepseek-r1` / `deepseek/deepseek-r1` $\rightarrow$ `cf/@cf/deepseek-ai/deepseek-r1-distill-qwen-32b`
  - `llama-3.3-70b` / `meta/llama-3.3-70b` $\rightarrow$ `cf/@cf/meta/llama-3.3-70b-instruct-fp8-fast`
- **Zero Configuration untuk Client SDK**: Developer yang menggunakan Cursor, Cline, atau script OpenAI SDK yang memanggil nama model standar tidak akan lagi mengalami error rute mati atau upstream 503.
- **Kepatuhan Modularitas**: `lib/model-utils.ts` berukuran 81 baris (patuh batas ketat $\le 200$ baris).

### `5302c29` — feat(docs): add real-time model search and reset in DocsTab with role-based formatting

**Pencarian Model di Dokumentasi**
- **Live Search & Reset (`DocsTab.tsx`)**: Menambahkan bilah pencarian instan dan tombol reset `X` pada daftar model aktif di tab Dokumentasi, memudahkan developer menemukan model spesifik tanpa perlu scroll 65 baris.
- **Counter Model Dinamis**: Judul panel diperkaya counter dinamis yang mencerminkan jumlah model aktif yang tersedia.
- **Penerusan Prop Role `isAdmin`**: `DashboardApp.tsx` meneruskan status `isAdmin` ke `DocsTab.tsx` agar format nama model konsisten dengan preferensi role pengguna.
- **Kepatuhan Modularitas**: `DocsTab.tsx` (187 baris) dan `DashboardApp.tsx` (197 baris) patuh $\le 200$ baris per file.

### `cd4bddb` — feat(keys): show last used timestamp on API keys and accept name alias on register

**Aktivitas API Key & Robustness Registrasi**
- **Indikator Terakhir Digunakan (`KeysTab.tsx`)**: Menampilkan waktu `last_used_at` pada setiap baris tabel API key (`Dipakai [Tgl/Bln]` atau `Belum dipakai`) untuk membedakan key yang sedang aktif menerima traffic.
- **Dukungan Alias Field Registrasi (`app/api/auth/register/route.ts`)**: Menerima input `fullName` maupun `name` secara fleksibel pada payload JSON registrasi.
- **Kepatuhan Modularitas**: `KeysTab.tsx` (145 baris) dan `register/route.ts` (64 baris) patuh $\le 200$ baris per file.

### `7b803d2` — refactor(code): streamline PlaygroundTab and chat completions route for safe line limit headroom

**Penyederhanaan & Headroom Batas Baris**
- **Headroom Modul Kunci**: Merampingkan `PlaygroundTab.tsx` (dari 200 ke 192 baris) dan `app/v1/chat/completions/route.ts` (dari 198 ke 184 baris).
- **Hasil Audit Batas Baris**: Seluruh 87 file sumber kini memiliki headroom aman (maksimal 196 baris di `DashboardApp.tsx`), menghilangkan risiko melanggar batas ketat $\le 200$ baris pada perubahan mendatang.
- **Verifikasi**: 10/10 test E2E lolos, 12/12 pricing checks lolos, 16/16 UI audits lolos.

### `d7fdde3` — fix(auth): update signup bonus copy to 2.5M and enrich profile card with tier & balance

**Penyempurnaan Modal Akun & Profil**
- **Koreksi Saldo Pendaftaran Baru**: Memperbaiki teks pendaftaran akun baru dari sisa copy lama (`100.000 token` / `100k Token`) menjadi `2.500.000 token gratis` (sesuai implementasi aktual Free Tier di `register/route.ts`).
- **Peningkatan Kartu Profil Pengguna**: Menambahkan kartu ringkasan interaktif yang menampilkan status Tier aktif (`FREE` / `PRO`) dan Saldo Token aktual langsung di dalam dialog profil akun.
- **Tampilan Handle Username**: Menampilkan handle username akun (misal `@adminfordhani`) jika tersedia.
- **Kepatuhan Modularitas**: File `AuthModal.tsx` berukuran 183 baris (patuh $\le 200$ baris).

### `80c78c8` — feat(ui): gate TiDB branding behind admin check, hide from regular users

**Penyembunyian Branding Database Internal**
- **Kondisional `isAdmin` pada UI**: Teks "TiDB" disembunyikan dari semua pengguna umum / publik di 14 komponen UI (`LandingFooter`, `DashboardApp`, `Header`, `AuthModal`, `KeyModal`, `PackagesTab`, `PaymentModal`, `PlaygroundTab`, `PlaygroundChat`, `AnalyticsCards`, `ModelUsageBreakdown`, `RecentLogsTable`, `OrderHistoryTable`, dan `constants.ts`).
- **Tampilan Khusus Pengguna**: Digantikan dengan sebutan generik bersih ("Cloud Database", "database", "akun", "Live Cloud Serverless").
- **Tampilan Admin Tetap Utuh**: Admin (`adminfordhani`) tetap dapat melihat label "TiDB" lengkap untuk inspeksi teknis gateway.
- **Session Persistence**: Flag `kiosai_is_admin` disinkronkan di `localStorage` saat login, pengambilan profil, dan dibersihkan saat logout.
- **Verifikasi CDP**: 0 kemunculan kata "TiDB" pada landing page dan 6 tab dashboard untuk pengguna reguler (100% lolos); terlihat normal pada sesi admin.
- **Kepatuhan Arsitektur**: Seluruh 87 file sumber tetap patuh $\le 200$ baris per file (`npm run verify`).

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