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






