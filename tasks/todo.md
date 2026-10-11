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
  - Acceptance: Lists live upstream models tagged with `required_tier: "bronze" | "silver" | "gold"`
  - Verify: Tested curl `/v1/models` returned live models from 9Router
  - Files: `app/v1/models/route.ts`, `lib/keys.ts`

- [x] Task 4.2: Dynamic Model Picker in Dashboard Playground
  - Acceptance: Dropdown dynamically renders live model list with tier badges
  - Verify: Tested on frontend
  - Files: `app/page.tsx`

- [x] Task 4.3: Vercel Deployment Configuration (`vercel.json`)
  - Acceptance: Pre-configured Tokyo region `hnd1` close to TiDB Serverless
  - Verify: Valid JSON schema
  - Files: `vercel.json`

- [x] Task 4.4: Sync Documentation & Git Push
  - Acceptance: Update `PRD.md`, `tasks/plan.md`, `tasks/todo.md`, `STATE.md`, `README.md` and push to GitHub
