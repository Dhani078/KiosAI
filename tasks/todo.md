# Tasks: KiosAI Implementation

## Phase 1 (Core Foundation - Completed)
- [x] Task 1.1: Init Next.js 15 app with TypeScript & Tailwind CSS in `E:/Hermesproject/KiosAI`
- [x] Task 1.2: Setup TiDB Serverless client & DDL migration script
- [x] Task 2.1: Key Management Engine (`lib/keys.ts`) & API `/api/keys`
- [x] Task 3.1: OpenAI Proxy Endpoint `app/v1/chat/completions/route.ts`
- [x] Task 4.1: Orders & Top-Up API
- [x] Task 5.1: Web Dashboard UI
- [x] Task 6.1: Initial commit and push to GitHub

## Phase 2 (Production Hardening & Features - Completed)
- [x] Task 2.1: User Auth System (`/api/auth/register`, `/api/auth/login`) with 100k trial token
- [x] Task 2.2: Rate Limiting Enforcement in Proxy (`app/v1/chat/completions/route.ts`)
- [x] Task 2.3: Usage Analytics API (`/api/analytics`)
- [x] Task 2.4: Enhanced Dashboard UI with Auth, Analytics Charts & Multi-user support
- [x] Task 2.5: Commit, Push & Document Updates

## Phase 3 (Payment Gateway Webhook & Tier Model Gating - Completed)
- [x] Task 3.1: Model Access Gating per Tier in `lib/keys.ts` & `app/v1/chat/completions/route.ts`
- [x] Task 3.2: Production Payment Webhook Handler (`/api/payment/webhook`)
- [x] Task 3.3: Sync Documentation & Git Push

## Phase 4 (Live Model Catalog Sync & Vercel Readiness - Completed)
- [x] Task 4.1: Dynamic Model Discovery (`GET /v1/models`) with live 9Router sync & tier labeling
- [x] Task 4.2: Dynamic Model Picker in Dashboard Playground
- [x] Task 4.3: Vercel Deployment Configuration (`vercel.json`)
- [x] Task 4.4: Sync Documentation & Git Push

## Phase 5 (Model Multiplier Pricing, Order Invoices & Low-Balance Alert - Completed)
- [x] Task 5.1: Model Pricing Multipliers (1.0x Bronze, 2.0x Silver, 4.0x Gold) in `lib/keys.ts`
  - Acceptance: Token deduction applies weight based on model complexity
  - Verify: Verified deduction formula
  - Files: `lib/keys.ts`, `app/v1/chat/completions/route.ts`

- [x] Task 5.2: Order History API (`GET /api/orders`)
  - Acceptance: Lists user order history with invoice status
  - Verify: Tested curl `/api/orders` returned 200 with order list
  - Files: `app/api/orders/route.ts`

- [x] Task 5.3: Order History UI Table & Low-Balance Quota Alert
  - Acceptance: Displays order history table and warning banner if tokens < 20,000
  - Verify: Build passed (14 routes compiled), tested on frontend
  - Files: `app/page.tsx`

- [x] Task 5.4: Sync Documentation & Git Push
- [x] Task 5.5: Stream billing via `stream_options.include_usage` (tagih total, PRD §9)
- [x] Task 5.6: Sync docs STATE/README/plan/todo untuk billing
  - Acceptance: Update `PRD.md`, `tasks/plan.md`, `tasks/todo.md`, `STATE.md`, `README.md` and push to GitHub

## Phase 6 (Design System Integration & Zero Dummy Data - Completed)
- [x] Task 6.1: Adopt KiosAI Token Marketplace Design system (`#F28C38` orange, `#120F0C` canvas, `#1C1714` surface)
- [x] Task 6.2: Eliminate all dummy/mock data; wire 100% components to real TiDB tables (`users`, `api_keys`, `orders`, `usage_logs`)
- [x] Task 6.3: Refactor codebase so 100% files are <= 200 lines (PRD §6 enforcement)
- [x] Task 6.4: Playwright E2E browser audit (390px mobile, 1366px desktop, 0 overflow, 0 console error)
- [x] Task 6.5: Sync all markdown docs (`PRD.md`, `STATE.md`, `tasks/todo.md`, `tasks/plan.md`, `README.md`)
- [x] Task 6.6: Add Recent API Request Logs table (`RecentLogsTable`) in Statistik tab from TiDB `usage_logs`
- [x] Task 6.7: Automatic raw key handoff from `KeyModal` to `PlaygroundTab` via `sessionStorage`
- [x] Task 6.8: System health diagnostics API (`GET /api/health`) with latency metrics & dynamic Header tooltip
- [x] Task 6.9: Granular rate limit selector in `KeyModal` (30/60/120 req/min) saved to `api_keys.rate_limit_per_min`
- [x] Task 6.10: Client-side CSV export utility (`lib/export-csv.ts`) for transaction history and recent request logs
- [x] Task 6.11: Interactive System Prompt configuration in Playground tab with live system message injection
- [x] Task 6.12: Interactive model sync in Docs tab (clicking any model live-updates cURL/Python/Node code examples)
- [x] Task 6.13: Production deployment verification CLI script (`scripts/verify-deployment.mjs` / `npm run verify`)
- [x] Task 6.14: Complete Production Markdown Suite (`API.md`, `DEPLOYMENT.md`, `SECURITY.md`) and sync with `README.md`
- [x] Task 6.15: Automated End-to-End Integration Test Suite (`scripts/test-e2e.mjs` / `npm run test:e2e`) covering 10 core pathways
- [x] Task 6.16: GitHub Actions CI workflow (`.github/workflows/ci.yml`) for automated type check, line limits check, and build
- [x] Task 6.17: Public Marketing Landing Page (`/`) as homepage with Hero, Features, Pricing, Code Sandbox, and FAQ
- [x] Task 6.18: Route restructure — `/` = Landing Page, `/dashboard` = Dashboard workspace
- [x] Task 6.19: Admin login by username (`adminfordhani`), login endpoint supports `identifier` field (email OR username)
- [x] Task 6.20: Admin seed script (`scripts/seed-admin.mjs`) — Gold tier, 100M token balance
- [x] Task 6.21: `AuthGuard` component — `/dashboard` blocked for anonymous users, redirects to `/?login=1`
- [x] Task 6.22: `LandingAuthWatcher` — auto-opens AuthModal on `?login=1` query from landing page
- [x] Task 6.23: Removed demo-user fallback from `useKiosData` and `DashboardApp`; user must be authenticated
- [x] Task 6.24: `username` column on `kiosai.users` + unique index; admin logs in by username, users by email
- [x] Task 6.25: Logout hard-navigates to `/` and clears session; AuthGuard re-checks on `focus`/`pageshow`
- [x] Task 6.26: Fixed register payload key (`fullName` not `name`); `identifier` field for login lookups

## Phase 7 (Cloudflare Workers Production Deploy - Completed)
- [x] Task 7.1: Diagnosed `DATABASE_URL environment variable is not defined` on live Worker `kiosai.dhanisepeda.workers.dev`
- [x] Task 7.2: Root cause — Worker had 0 secrets (`wrangler secret list` → `[]`), OpenNext deploy source
- [x] Task 7.3: `scripts/sync-worker-secrets.mjs` / `npm run secrets:sync` — push `.env` → Worker secrets via Cloudflare API
- [x] Task 7.4: `scripts/tunnel-sync.mjs` / `npm run tunnel` — cloudflared + auto-set `NINEROUTER_URL` secret
- [x] Task 7.5: Extended `scripts/verify-deployment.mjs` to 6 checks incl. Worker secret drift detection
- [x] Task 7.6: Rewrote `DEPLOYMENT.md` (Worker arch + tunnel + troubleshooting), README deploy section Vercel → Cloudflare Workers
- [x] Task 7.7: Verified live end-to-end: health healthy, admin login 200, chat 200, balance deducted 100000 → 98250

## Phase 8 (Landing Models Showcase & Navigation Integration - Completed)
- [x] Task 8.1: Add "Model" anchor link to `LandingNavbar.tsx` and `LandingFooter.tsx` pointing to `#model`
- [x] Task 8.2: Build modular `ModelsSection.tsx` & `modelCatalogData.ts` with tier tags, context size, and provider filters
- [x] Task 8.3: Mount `<ModelsSection />` in `app/page.tsx`
- [x] Task 8.4: Playwright audit: verify navigation scroll, card filters, 0 overflow (mobile 390px & desktop 1366px)
- [x] Task 8.5: Verify 100% files adhere to <= 200 lines limit (71 files checked) and sync documentation

## Phase 9 (UI Clean Model Name Display - Completed)
- [x] Task 9.1: Build `lib/model-utils.ts` (`formatModelName`) to strip `tokenharbor/` and `:free` prefix/suffix for UI display only
- [x] Task 9.2: Keep underlying system model ID intact as `tokenharbor/deepseek-v4.1-flash:free` in state, API requests, and `/v1/models`
- [x] Task 9.3: Update `PlaygroundToolbar.tsx`, `PlaygroundChat.tsx`, `DocsTab.tsx`, `RecentLogsTable.tsx`, `AnalyticsTab.tsx`, and `PackageComparison.tsx`
- [x] Task 9.4: Protect API keys: confirm zero modifications to `.env` or existing credentials
- [x] Task 9.5: Verified via Playwright (display shows `deepseek-v4.1-flash [BRONZE]`, value sends system ID) and 10/10 e2e tests pass

## Phase 10 (Playground Session Key, Chat Persistence & Sidebar Model Menu - Completed)
- [x] Task 10.1: Build `lib/session-key.ts` (`createPlaygroundToken`, `validatePlaygroundToken`) with HMAC signatures
- [x] Task 10.2: Bind Playground requests to user's real account (`kios-pg-...`), ensuring real TiDB token deduction and `usage_logs` tracking in Statistik
- [x] Task 10.3: Persist Playground chat messages across tab navigation via `sessionStorage` (`kios_playground_messages`)
- [x] Task 10.4: Add "Model" item to left dashboard Sidebar (`Sidebar.tsx`), `constants.ts`, and mount `ModelsTab.tsx` in `DashboardApp.tsx`
- [x] Task 10.5: Zero API keys modified; 100% files <= 200 LOC; verified via Playwright & E2E suite

## Phase 11 (Token Marketplace Restructure & Free Plan Bansos - Completed)
- [x] Task 11.1: Restructure token pricing packages (Starter 5k/15M, Bronze 25k/100M, Silver 100k/600M, Gold 150k/1Miliar)
- [x] Task 11.2: Add Free Plan (Rp 0 / 5.000.000 tokens) trial bonus for all new registered accounts in TiDB
- [x] Task 11.3: Integrate `atria/Atria-Dawn-Preview` (Bansos) model into gateway, fallbacks, and landing catalog
- [x] Task 11.4: Universal model access — all models unlocked regardless of user tier, billed proportionally by multiplier
- [x] Task 11.5: Role-based model names in UI (`lib/model-utils.ts`): raw technical routing for admin (`adminfordhani`), clean commercial names for regular users
- [x] Task 11.6: Dynamic 1-click Free Plan claim flow in `PaymentModal.tsx` (bypassing QRIS for Rp 0 packages)
- [x] Task 11.7: Cloudflare Quick Tunnel restored and verified live healthy on `kiosai.dhanisepeda.workers.dev`
- [x] Task 11.8: Sync documentation (`CHANGELOG.md`, `README.md`, `PRD.md`, `API.md`, `HANDOFF.md`, `STATE.md`)









