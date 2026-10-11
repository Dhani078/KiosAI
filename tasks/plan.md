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

