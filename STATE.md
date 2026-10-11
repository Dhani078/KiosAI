# Project State: KiosAI

- **Repository**: `https://github.com/Dhani078/KiosAI.git`
- **Location**: `E:/Hermesproject/KiosAI`
- **Current Status**: Complete & Fully Verified (Phase 0 - 7)
- **Upstream Router**: 9Router local (`http://127.0.0.1:20128`)
- **Database**: TiDB Cloud Serverless (`gateway01.ap-southeast-1.prod.aws.tidbcloud.com:4000/kiosai`)

## History & Progress Log
- 2026-10-11:
  - Repository initialized with `.env` and `.gitignore`.
  - Specs and Architecture documented in `PRD.md`.
  - Implementation roadmap in `tasks/plan.md` and `tasks/todo.md`.
  - TiDB connection verified and database `kiosai` created via `@tidbcloud/serverless`.
  - Database schema migrated: `users`, `api_keys`, `orders`, `usage_logs`.
  - Seed user created with 1,000,000 initial balance tokens (`usr_kiosai_demo`).
  - Next.js 15 App router built with TypeScript & Tailwind CSS.
  - Endpoints implemented & verified:
    - `POST /v1/chat/completions`: OpenAI compatible streaming & JSON proxy to 9Router.
    - `GET /v1/models`: OpenAI compatible model list.
    - `GET /api/user`: User balance & usage metrics.
    - `POST /api/keys`: Key generation (`kios-xxxx`) with SHA-256 hash.
    - `DELETE /api/keys/[id]`: Soft revocation.
    - `POST /api/orders`: QRIS checkout order creation.
    - `POST /api/orders/pay`: Order confirmation & instant token credit.
  - Added Phase 2 Enhancements:
    - User Authentication: `POST /api/auth/register` (auto-credits 100k trial token) and `POST /api/auth/login` (scrypt password verification).
    - Rate Limiting: In-memory sliding window enforcing `rate_limit_per_min`, injects `X-RateLimit-*` headers, returns HTTP 429 when abused.
    - Usage Analytics: `GET /api/analytics` returns aggregated tokens, requests count, average latency, model breakdown, and recent log rows.
    - Dashboard UI upgraded with Auth switch modal and Analytics & Logs viewer tab.
  - E2E tests verified: Registration, Login, Key Creation, OpenAI Proxy call, Rate Limit headers, and QRIS top-up.
