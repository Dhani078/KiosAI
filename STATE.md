# Project State: KiosAI

- **Repository**: `https://github.com/Dhani078/KiosAI.git`
- **Location**: `E:/Hermesproject/KiosAI`
- **Current Status**: Complete & Verified (Phase 0 - 6)
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
  - Interactive Web Dashboard implemented in `app/page.tsx` with Live AI Playground.
  - E2E curl tests passed: Real AI response from upstream `ag/gemini-3.8-flash-high`, automatic token deduction recorded in TiDB, Silver package +3,500,000 tokens credited.
