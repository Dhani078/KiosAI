# Implementation Plan: KiosAI

## Architecture Overview
- Framework: Next.js 15 (App Router, React 19, TypeScript, Tailwind CSS)
- Database: TiDB Serverless via `@tidbcloud/serverless` (HTTP fetch connection, zero TCP pooling overhead)
- Upstream AI Proxy: 9Router on localhost:20128 (dev) / Cloudflare Tunnel (prod)
- State & Docs: Updated in PRD.md, STATE.md, tasks/todo.md, README.md

## Phasing & Task Checklist
- [x] Phase 0: PRD & Architecture Spec (`PRD.md`)
- [x] Phase 1: Setup Next.js, TiDB Client & Migration DDL (`core-db`)
- [x] Phase 2: Key Management API & Hash Generator (`key-mgmt`)
- [x] Phase 3: OpenAI Proxy Endpoint `/v1/chat/completions` + Token Deduction (`proxy-engine`)
- [x] Phase 4: Order & Top-Up QRIS Simulation API (`billing`)
- [x] Phase 5b: Billing total untuk stream (`include_usage`), keputusan di PRD §9
- [x] Phase 5: Dashboard UI (Key generator, balance gauge, test playground) (`dashboard-ui`)
- [x] Phase 6: User Authentication, Rate Limiting & Usage Analytics (`analytics-and-auth`)
- [x] Phase 7: Payment Webhook, Tier Gating & Idempotency (`security-and-hardening`)
- [x] Phase 8: Dynamic Model Discovery & Live Catalog Sync (`catalog-sync`)
- [x] Phase 9: Model Multipliers, Order Invoices & Low-Balance Alert (`pricing-and-invoices`)
- [x] Phase 10: Vercel Deploy Spec, E2E Verification & Git Push (`https://github.com/Dhani078/KiosAI.git`)
- [x] Phase 11: KiosAI Token Marketplace Design & Zero Dummy Data Architecture
  - Warm anti-slop orange design system (`#F28C38` primary, `#120F0C` canvas)
  - 100% database & live gateway data binding (no mock data)
  - Strict compliance: all 45 `.ts`/`.tsx`/`.mjs` files <= 200 lines
- [x] Phase 12: Production Observability, E2E Testing & CI/CD Pipeline
  - Automated 10-point E2E integration test suite (`npm run test:e2e`)
  - Verification & readiness auditor CLI (`npm run verify`)
  - Complete Markdown documentation suite (`API.md`, `DEPLOYMENT.md`, `SECURITY.md`)
  - GitHub Actions CI workflow (`.github/workflows/ci.yml`) with automated type check, line limit audit, and build
- [x] Phase 13: Route Restructure, Admin Auth & Landing Page as Homepage
  - `/` = Landing Page publik (SEO, hero, pricing, code sandbox, FAQ)
  - `/dashboard` = Dashboard workspace pengguna
  - Admin login via username (`adminfordhani`), user biasa via email
  - Login endpoint `identifier` field (email OR username lookup)
  - Admin seed script (`scripts/seed-admin.mjs`)
- [x] Phase 14: Auth Guard & Session Hardening
  - `AuthGuard` component gates `/dashboard` (redirect `/?login=1` when anonymous)
  - `LandingAuthWatcher` auto-opens AuthModal on `?login=1`
  - Demo-user fallback removed from `useKiosData` + `DashboardApp`
  - `username` column added to `kiosai.users` + unique index
  - Logout clears session and hard-navigates to `/`
  - Register payload key fixed (`fullName`)
  - Playwright verified: anon blocked, login (email/username), reload persists, logout→landing, wrong password error, 0 console errors, 0 overflow mobile+desktop
- [x] Phase 15: Cloudflare Workers Production Deploy & Secret Sync
  - Diagnostic: Worker live tampil normal tapi login gagal `DATABASE_URL environment variable is not defined`
  - Root cause: Worker punya 0 secret (OpenNext deploy source)
  - `npm run secrets:sync` (`scripts/sync-worker-secrets.mjs`) — push `.env` → secret Worker
  - `npm run tunnel` (`scripts/tunnel-sync.mjs`) — cloudflared + auto-set `NINEROUTER_URL`
  - `npm run verify` diperluas ke 6 pengecekan + deteksi drift secret Worker
  - `DEPLOYMENT.md` ditulis ulang; README deploy diganti Vercel → Cloudflare Workers
  - Verified live: health healthy, login admin 200, chat 200, saldo 100000 → 98250
- [x] Phase 16: Landing Page Models Catalog & Navbar Navigation
  - Link "Model" (`#model`) ditambahkan pada `LandingNavbar.tsx` dan `LandingFooter.tsx`
  - Komponen `ModelsSection.tsx` dan `modelCatalogData.ts` memuat katalog model terpopuler dengan filter provider
  - Terintegrasi di `app/page.tsx`
  - Playwright audit: 0 overflow (mobile & desktop), filter interaktif berfungsi, tsc & build pass


