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
- [x] Task 5.1: Model pricing ratios (rasio dari tarif $/1M) in `lib/model-pricing.ts` — `getModelMultiplier()` dihapus di Phase 20
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

## Phase 11 (Token Marketplace Restructure — Completed, superseded by Phase 20)
- [x] Task 11.1: Token pricing packages (historis: Starter 5k/15M, Bronze 25k/100M, Silver 100k/600M, Gold 150k/1Miliar — kini 2 tier)
- [x] Task 11.2: Add Free Plan trial bonus for all new registered accounts in TiDB (kini 2.500.000 token, tier `free`)
- [x] Task 11.3: Integrate `atria/Atria-Dawn-Preview` (Bansos) model into gateway, fallbacks, and landing catalog
- [x] Task 11.4: Model gating 2 tier final — `free` (hanya Atria Dawn) dan `pro` (seluruh model), dibatasi saldo token nyata dengan rasio tarif $/1M (lihat Phase 20).
- [x] Task 11.5: Role-based model names in UI (`lib/model-utils.ts`): raw technical routing for admin (`adminfordhani`), clean commercial names for regular users
- [x] Task 11.6: Dynamic 1-click Free Plan claim flow in `PaymentModal.tsx` (bypassing QRIS for Rp 0 packages)
- [x] Task 11.7: Cloudflare Quick Tunnel restored and verified live healthy on `kiosai.dhanisepeda.workers.dev`
- [x] Task 11.8: Sync documentation (`CHANGELOG.md`, `README.md`, `PRD.md`, `API.md`, `HANDOFF.md`, `STATE.md`)

## Phase 12 (Final 2-Tier Architecture & $/1M Token Billing - Completed)
- [x] Task 12.1: Implement `getCostRatio()` in `lib/model-pricing.ts` using real $/1M rates (baseline DeepSeek Flash = 1.0, floor 0.05)
- [x] Task 12.2: Remove legacy `getModelMultiplier()` and wire `app/v1/chat/completions/route.ts` to `getCostRatio()`
- [x] Task 12.3: Restrict Free tier strictly to Atria Dawn; gate all other models behind Pro tier
- [x] Task 12.4: One-time idempotent TiDB data migration (`scripts/migrate-tiers.mjs`) migrating users and orders to `free`/`pro`
- [x] Task 12.5: Fix `parseUpstreamJson()` in `lib/proxy-http.ts` to normalize 3 upstream shapes (JSON, glued DONE, and SSE chunk streams)
- [x] Task 12.6: Fix landing navbar mobile overflow on 390px via `@media(max-width:700px)`
- [x] Task 12.7: Decouple `modelTier` from `checkAllowed` in `ModelsTab.tsx` so Pro/Admin users see correct model badges & filters
- [x] Task 12.8: Add test scripts: `npm run test:pricing`, `npm run test:billing`, `npm run audit:ui`, `npm run audit:dashboard`
- [x] Task 12.9: 100% tests passing, 0 overflow, clean git tree, Cloudflare tunnel live healthy

## Phase 13 (UI Polish, Dynamic Counters & Architecture Audit - Completed)
- [x] Task 13.1: Add dynamic counters to tier filter buttons (`Semua (764)`, `Free Tier (2)`, `Pro Tier (762)`) in `ModelsTab.tsx`
- [x] Task 13.2: Add instant search reset button `X` and empty search state in `ModelsTab.tsx`
- [x] Task 13.3: Add provider tag (Anthropic, OpenAI, DeepSeek, Google, Meta, Atria, xAI) to model cards
- [x] Task 13.4: Format Input/Output/Cached rates in clean monospace typography
- [x] Task 13.5: Add $/1M rate annotations to model comparison subtitles in `PackageComparison.tsx`
- [x] Task 13.6: Verify 100% compliance across all 82 source files (<= 200 LOC per file)
- [x] Task 13.7: Sync all documentation markdown files across the repository

## Phase 14 (Pro Model Expansion & Curation - Completed)
- [x] Task 14.1: Integrate Google Gemini 3.8 Flash (High/Medium/Low/Flash) and Claude 4.6 (Sonnet & Opus Thinking) into Pro tier
- [x] Task 14.2: Filter out unwanted Gemini 3.7/3.6/3.1 and `gemini-pro-agent` models via `isHiddenModel` in `app/v1/models/route.ts`
- [x] Task 14.3: Add commercial name formatting in `lib/model-utils.ts` (`formatAgGemini`) and alias resolvers
- [x] Task 14.4: Fix substring clash (`gemini` matching `mini`) in `lib/model-pricing.ts`
- [x] Task 14.5: Update `test:pricing` to 12 checks (100% pass)
- [x] Task 14.6: Implement Wrangler OAuth auto-refresh in `scripts/tunnel-sync.mjs` and `scripts/sync-worker-secrets.mjs`
- [x] Task 14.7: Live Worker edge deployment verified — 0 unwanted models, Pro models active and healthy

## Phase 15 (Model 5x Audit & Catalog Pruning - Completed)
- [x] Task 15.1: Write automated 5x retry tester script `scripts/audit-all-models-5x.mjs`
- [x] Task 15.2: Audit all 746 models against upstream 9Router with 5 consecutive attempts
- [x] Task 15.3: Identify and prune 679 dead models (all 482 `cl/*` timeout scrapers + 503 broken routes)
- [x] Task 15.4: Create `lib/verified-models.ts` with 65 proven functional models (1 Free, 64 Pro)
- [x] Task 15.5: Wire `app/v1/models/route.ts` with `isModelVerified` filter
- [x] Task 15.6: Verify live worker production `https://kiosai.dhanisepeda.workers.dev/dashboard` via CDP (Semua 65, Free 1, Pro 64)
- [x] Task 15.7: All 86 source files verified <= 200 lines, 12/12 pricing tests passed, 10/10 E2E tests passed

## Phase 16 (Hide Internal DB Branding from Public/Regular Users - Completed)
- [x] Task 16.1: Gate "TiDB" text behind `isAdmin` condition in `LandingFooter`, `DashboardApp`, `Header`, `AuthModal`, `KeyModal`, `PackagesTab`, `PaymentModal`, `PlaygroundTab`, `PlaygroundChat`, `AnalyticsCards`, `ModelUsageBreakdown`, `RecentLogsTable`, and `OrderHistoryTable`
- [x] Task 16.2: Ensure clean user experience ("Cloud Database", "database", "akun") while keeping technical "TiDB" details for admin
- [x] Task 16.3: Sync session admin flag (`kiosai_is_admin`) in `localStorage` across login, fetch, and logout
- [x] Task 16.4: Validate with CDP on PC & Mobile (0 occurrences of TiDB on landing and all dashboard tabs for visitor/regular user; visible for admin)
- [x] Task 16.5: Verify 100% compliance: all 87 source files <= 200 LOC, 10/10 E2E passed, 16/16 UI audits passed

## Phase 17 (Docs Model Search & Key Activity Tracking - Completed)
- [x] Task 17.1: Add live search and reset button to active models list in `DocsTab.tsx`
- [x] Task 17.2: Add dynamic model counter in `DocsTab.tsx` header
- [x] Task 17.3: Pass `isAdmin` to `DocsTab.tsx` from `DashboardApp.tsx` for consistent model name rendering
- [x] Task 17.4: Add `last_used_at` activity indicator to API key rows in `KeysTab.tsx`
- [x] Task 17.5: Accept `name` alias alongside `fullName` in `register/route.ts`
- [x] Task 17.6: Verify 100% compliance: all 87 files <= 200 lines, 10/10 E2E tests passed, 16/16 UI checks passed

## Phase 18 (Universal Commercial Model Aliases - Completed)
- [x] Task 18.1: Map industry standard model IDs (`claude-3.7-sonnet`, `gpt-4o`, `gemini-2.0-flash`, `deepseek-r1`, `llama-3.3-70b`) to verified active routes in `resolveModelAlias`
- [x] Task 18.2: Verify zero regression across all 10 alias scenarios, 10/10 E2E tests, and 12/12 pricing assertions
- [x] Task 18.3: Confirm strict modularity compliance (81 LOC in `lib/model-utils.ts`, all 87 files <= 200 LOC)

## Phase 19 (Granular Order Settlement & E2E Alias Validation - Completed)
- [x] Task 19.1: Support `pro_25k`, `pro_100k`, and `pro_150k` package keys in `pay/route.ts` & `payment/webhook/route.ts`
- [x] Task 19.2: Test live alias resolution directly in step 5 of `scripts/test-e2e.mjs`
- [x] Task 19.3: Verify all 87 files <= 200 LOC, clean working tree, and sync documentation

## Phase 20 (Interactive Workspace Profile Trigger - Completed)
- [x] Task 20.1: Make `.workspace` in `Sidebar.tsx` clickable with Enter/Space keyboard accessibility
- [x] Task 20.2: Verify CDP click behavior opening profile modal (Akun Anda)
- [x] Task 20.3: Ensure 0 overflow, 10/10 E2E tests, 12/12 pricing tests, and git sync

## Phase 21 (Humanized Playground Error Messaging - Completed)
- [x] Task 21.1: Build `humanizeErrorMessage` in `lib/model-utils.ts` to translate raw upstream errors to Indonesian
- [x] Task 21.2: Parse provider quota limits, countdown timer (`reset after 24s`), rate limits, and 503 overloads
- [x] Task 21.3: Wire `PlaygroundTab.tsx` error state to `humanizeErrorMessage` with role-based debug details for admin
- [x] Task 21.4: Verify all 87 source files <= 200 lines, 10/10 E2E tests, and sync git origin

## Phase 22 (Role-Based 9Router Branding - Completed)
- [x] Task 22.1: Hide "9Router" from `LandingFooter.tsx` for regular users ("Gateway Live")
- [x] Task 22.2: Hide "9Router" from `Header.tsx` tooltip for regular users ("Gateway: connected")
- [x] Task 22.3: Hide "9Router" from `PlaygroundTab.tsx` status bar for regular users ("Gateway Aktif")
- [x] Task 22.4: Keep "9Router" label intact for admin `adminfordhani` across all components
- [x] Task 22.5: Verify CDP audit on PC & Mobile (0 occurrences of 9Router for visitors/regular users)

## Phase 23 (Official Vector Logo & HD Brand Assets - Completed)
- [x] Task 23.1: Move master `.jfif` to `public/brand/kiosai-logo-master.jfif` and generate 2048, 512, 192, and transparent PNGs
- [x] Task 23.2: Construct precision mathematical vector SVG for `Logo.tsx`, `public/favicon.svg`, and `public/kiosai-icon.svg`
- [x] Task 23.3: Configure browser icons metadata in `app/layout.tsx`
- [x] Task 23.4: Verify all 87 source files <= 200 lines, 10/10 E2E tests, 12/12 pricing tests, and 16/16 UI checks

## Phase 24 (Landing Copy Harmonization & Clean Snippets - Completed)
- [x] Task 24.1: Update hero CTA button in `HeroSection.tsx` from 100k to 2.5 Juta Token
- [x] Task 24.2: Update hero verified models card in `HeroSection.tsx` from 765+ to 65+ Model Terverifikasi
- [x] Task 24.3: Use clean commercial alias `deepseek-v4.1-flash` in `CodeSection.tsx` snippets
- [x] Task 24.4: Verify all 87 files <= 200 lines, 10/10 E2E tests pass, 16/16 UI audits pass

## Phase 25 (Landing Model Badges & Alias Pricing Test - Completed)
- [x] Task 25.1: Add monospace model ID code badge on landing cards in `ModelsSection.tsx`
- [x] Task 25.2: Add `deepseek-v4.1-flash` assertion to `test-pricing.mjs` (13/13 passing)
- [x] Task 25.3: Ensure strict <= 200 lines rule across all 87 files, clean git tree, and push to origin

## Phase 26 (Expanded 11-Step E2E Suite with Pro Verification - Completed)
- [x] Task 26.1: Add post-upgrade pro model alias chat completion step to `scripts/test-e2e.mjs`
- [x] Task 26.2: Refactor `postChat` helper to maintain strict <= 200 lines limit (195 lines)
- [x] Task 26.3: Verify all 11/11 tests PASS in `npm run test:e2e`









