# System Design Specification: KiosAI High-Concurrency Gateway & Settlement

## 1. Objective
KiosAI (TokoAI) adalah platform pasar kuota token dan gateway API OpenAI-compatible untuk pengembang di Indonesia. Sistem ini menyediakan satu API key tunggal yang dapat mengakses ratusan model AI global (Claude, DeepSeek, GPT-4o, Gemini) dengan pembayaran instan via QRIS Rupiah, bebas kartu kredit internasional, latensi rendah region Tokyo, dan garansi zero-arbitrage pada sistem bonus deposit.

---

## 2. Tech Stack & Infrastructure
- **Web & Runtime**: Next.js 15 (App Router, Server Components + Client Islands, React 19, TypeScript).
- **Styling**: Tailwind CSS v4, Warm Obsidian & Electric Ember theme (`DESIGN.md`).
- **Database**: TiDB Cloud Serverless (AWS Tokyo `ap-southeast-1` / `ap-northeast-1`), HTTP-based stateless connection via `@tidbcloud/serverless`.
- **Edge Proxy**: Cloudflare Edge Workers & Cloudflare Quick Tunnel (`cloudflared`).
- **Upstream AI Router**: 9Router local cluster (`http://127.0.0.1:20128`).
- **Multimodal OCR**: Google Gemini 3.8 Flash Vision waterfall pool.
- **Payment Engine**: EMVCo Tag 54 Dynamic QRIS generator (DANA merchant) + DOKU Webhook.

---

## 3. Standard Commands
```bash
# Build & Typecheck
npx tsc --noEmit -p tsconfig.json
npm run build

# System & Deployment Audit
npm run verify

# Automated Test Suites
npm run test:pricing   # Verifikasi formula rasio potong input/output
npm run test:defense   # Verifikasi filter anti-prompt leakage
npm run test:qris      # Verifikasi Tag 54 EMVCo & CRC16-CCITT
npm run test:e2e       # Verifikasi 11 jalur integrasi end-to-end
npm run audit:ui       # Audit viewport desktop & mobile (0 horizontal overflow)
```

---

## 4. Project Structure
```
app/
├── api/
│   ├── auth/          # Login, Register, Logout (scrypt + HMAC cookie)
│   ├── keys/          # CRUD API Keys (SHA-256 hash)
│   ├── orders/        # Checkout QRIS, Order Status & AI Receipt OCR
│   ├── payment/       # DOKU & Internal Webhooks (HMAC-SHA256)
│   └── user/          # Profile & Saldo Token
├── v1/
│   ├── chat/completions/ # Streaming SSE & JSON proxy ke 9Router
│   └── models/           # Dynamic catalog sync
├── components/        # Modul dashboard workspace (<= 200 baris)
├── landing/           # Landing page komponen publik (HeroTerminal, Bento Grid)
lib/
├── db.ts              # Driver TiDB Serverless & query runner
├── keys.ts            # Validasi key, spend limits, & potong saldo
├── qris.ts            # Dynamic EMVCo QRIS generator (Tag 54)
├── receipt-verifier.ts # Gemini Flash Vision OCR receipt auditor
├── session.ts         # Server-side cookie HttpOnly HMAC-SHA256
└── stream-billing.ts  # Token metering stream SSE
```

---

## 5. Architectural Protocols & Concurrency Model

### 5.1 Atomic Compare-And-Swap (CAS) Settlement Protocol
Mencegah eksploitasi balapan konkurensi (race condition double-crediting) pada webhook pembayaran dan upload struk transfer:
1. `UPDATE kiosai.orders SET status = 'paid', paid_at = NOW() WHERE id = ? AND status != 'paid'`
2. TiDB mengembalikan `rowsAffected`.
3. Jika `rowsAffected === 1`, kunci transaksi berhasil didapatkan -> lanjutkan kredit saldo dan unlock bonus di `kiosai.users`.
4. Jika `rowsAffected === 0`, transaksi sudah pernah diproses oleh thread lain -> kembalikan respons idempotence 200 tanpa menambah token ganda.

### 5.2 Vault Match-Vesting Mechanism
Untuk mencegah arbitrase pendaftaran akun baru (bonus 2.500.000 token tidak bisa langsung dipakai untuk model mahal secara gratis):
- Bonus disimpan pada `locked_bonus_tokens`.
- Setiap deposit nyata membuka bonus dengan rasio 1:1:
  `SET balance_tokens = balance_tokens + purchased + LEAST(locked_bonus_tokens, purchased),`
  `    locked_bonus_tokens = GREATEST(0, locked_bonus_tokens - purchased)`
- Free tier hanya diizinkan memanggil model gratis (`atria/*`, `oc/*`); Pro model mewajibkan status `tier = 'pro'`.

---

## 6. Boundaries Contract
- **Always Do**:
  - Validasi kepemilikan data (IDOR prevention) via sesi server-side `readSessionUserId(req)`.
  - Prepared statement berparameter `[param1, param2]` pada semua query TiDB.
  - Pembatasan file kode sumber maksimal 200 baris per file (`PRD.md §6`).
  - Zero em-dash (`—`) pada seluruh antarmuka dan salinan teks.
- **Ask First**:
  - Perubahan skema tabel TiDB (DDL migration).
  - Rotasi master key atau kredensial upstream.
- **Never Do**:
  - Menyimpan plaintext API key di database (wajib SHA-256).
  - Mengizinkan saldo negatif (`GREATEST(0, balance_tokens - cost)`).
  - Melewati proteksi Cloudflare Edge di lingkungan produksi (`cf-ray` guard).

---

## 7. Success Criteria
1. `rowsAffected === 1` mengunci pelunasan pesanan secara atomik tanpa duplikasi saldo.
2. 100% diagram arsitektur dan sequence terverifikasi otomatis via Archify CLI showcase quality.
3. 100% file kode sumber mematuhi aturan $\le 200$ baris per file.
4. Seluruh 11 skenario pengujian E2E dan 16 audit viewport UI lolos tanpa catatan.
