# Decisions

## 2026-06-12

- Build backend before frontend.
- Use a NestJS modular monolith first, not microservices.
- Use Prisma with PostgreSQL.
- Keep Redis and BullMQ for queues and background work.
- Use `/api/v1` for all API routes.
- Use UUID IDs and `companyId` scoping from the first migration.
- Use permission keys for authorization instead of hardcoded role-name checks.
- Keep frontend work blocked until the backend foundation is stable.
- Place runnable backend code in `apps/backend` so the top-level `backend/` documentation folder remains intact.
- Use npm for the backend package unless the project later standardizes on a workspace package manager.
- Use Docker Compose for local PostgreSQL and Redis.
- Map local backend PostgreSQL to host port `5434` because `5432` was already occupied by another local database service.
- Seed local development with `admin@zayan.test` / `Password123`.

## Open Questions

- Should the future frontend live in `apps/frontend` to match the backend app layout?
- Should the repo be initialized as a git repository before the next implementation milestone?
- Should refresh tokens be promoted from a single hash on `users` to a dedicated sessions table now?
- Should the approval engine be built before notifications/files, or after those shared services exist?
