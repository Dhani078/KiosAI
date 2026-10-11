# Tasks: KiosAI Implementation

- [x] Task 1.1: Init Next.js 15 app with TypeScript & Tailwind CSS in `E:/Hermesproject/KiosAI`
  - Acceptance: `package.json`, `tsconfig.json`, `next.config.ts`, Tailwind working
  - Verify: `npm run build` passed with 0 errors
  - Files: `package.json`, `tsconfig.json`, `next.config.ts`, `app/globals.css`

- [x] Task 1.2: Setup TiDB Serverless client & DDL migration script
  - Acceptance: Connection established to TiDB Cloud, database `kiosai` and tables created
  - Verify: Run test migration script, created tables `users`, `api_keys`, `orders`, `usage_logs`
  - Files: `lib/db.ts`, `scripts/migrate.mjs`

- [x] Task 2.1: Key Management Engine (`lib/keys.ts`) & API `/api/keys`
  - Acceptance: Generate key `kios-xxx`, sha256 hash, DB insertion, list keys
  - Verify: Test curl create key, returned active `kios-d5ad28...`
  - Files: `lib/keys.ts`, `app/api/keys/route.ts`, `app/api/keys/[id]/route.ts`

- [x] Task 3.1: OpenAI Proxy Endpoint `app/v1/chat/completions/route.ts`
  - Acceptance: Accept Bearer `kios-xxx`, check quota, forward to 9Router, stream response, deduct balance
  - Verify: Real request through proxy to 9Router returned AI response and balance in TiDB decreased automatically
  - Files: `app/v1/chat/completions/route.ts`, `app/v1/models/route.ts`

- [x] Task 4.1: Orders & Top-Up API
  - Acceptance: Create QRIS mock order, mark paid, add balance tokens to user
  - Verify: Call `/api/orders` and `/api/orders/pay`, +3,500,000 tokens credited
  - Files: `app/api/orders/route.ts`, `app/api/orders/pay/route.ts`

- [x] Task 5.1: Web Dashboard UI
  - Acceptance: Clean dashboard, view balance, generate API key, packages cards, live chat tester
  - Verify: Next.js 15 App router page compiled, 9 routes static/dynamic ready
  - Files: `app/page.tsx`, `app/layout.tsx`

- [ ] Task 6.1: End-to-end verification and Git commit/push
  - Acceptance: Push to `https://github.com/Dhani078/KiosAI.git`, build passes
  - Verify: `git push origin master`
