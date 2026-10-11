# Project State: KiosAI

- **Repository**: `https://github.com/Dhani078/KiosAI.git`
- **Location**: `E:/Hermesproject/KiosAI`
- **Current Status**: Complete & Fully Verified (Phase 0 - 9)
- **Upstream Router**: 9Router local (`http://127.0.0.1:20128`)
- **Database**: TiDB Cloud Serverless (`gateway01.ap-southeast-1.prod.aws.tidbcloud.com:4000/kiosai`)

## History & Progress Log
- 2026-10-11:
  - Repository initialized with `.env` and `.gitignore`.
  - Specs and Architecture documented in `PRD.md`.
  - Implementation roadmap in `tasks/plan.md` and `tasks/todo.md`.
  - TiDB connection verified and database `kiosai` created via `@tidbcloud/serverless`.
  - Database schema migrated: `users`, `api_keys`, `orders`, `usage_logs`.
  - Next.js 15 App router built with TypeScript & Tailwind CSS.
  - Core endpoints implemented & verified:
    - `POST /v1/chat/completions`: OpenAI compatible streaming & JSON proxy to 9Router.
    - `GET /v1/models`: OpenAI compatible model list synced dynamically from 9Router with tier labeling.
    - `GET /api/user`: User balance & usage metrics.
    - `POST /api/keys`: Key generation (`kios-xxxx`) with SHA-256 hash.
    - `DELETE /api/keys/[id]`: Soft revocation.
    - `POST /api/orders`: QRIS checkout order creation.
    - `POST /api/orders/pay`: Order confirmation & instant token credit.
    - `POST /api/payment/webhook`: Webhook handler with idempotency check, auto-upgrade tier, and token credit.
  - Hardening & Security (OWASP standard):
    - User Authentication: `POST /api/auth/register` (auto-credits 100k trial token) and `POST /api/auth/login` (scrypt password verification).
    - Rate Limiting: In-memory sliding window enforcing `rate_limit_per_min`, injects `X-RateLimit-*` headers, returns HTTP 429 when abused.
    - Tier-based model permission gating: Bronze tier blocked from advanced models (`tier_restricted`), Silver/Gold unlocked.
    - Usage Analytics: `GET /api/analytics` returns aggregated tokens, requests count, average latency, model breakdown, and recent log rows.
  - Phase 4 Model Catalog & Deployment:
    - Dynamic `/v1/models` discovery pulling real models from local 9Router.
    - Dynamic model picker in Dashboard Playground.
    - `vercel.json` configured with Tokyo region `hnd1`.
  - E2E tests verified: Registration, Login, Key Creation, OpenAI Proxy call, Rate Limit headers, QRIS top-up, Tier gating, Model discovery, and Webhook idempotency.
