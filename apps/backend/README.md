# Zayan Max Backend

NestJS backend for the Zayan Max internal office management platform.

## Runtime

- API base path: `/api/v1`
- Swagger UI: `/api/docs`
- OpenAPI JSON: `/api/docs-json`
- Health summary: `/api/v1/health`
- Liveness: `/api/v1/health/live`
- Readiness: `/api/v1/health/ready`

## Local Setup

Install dependencies:

```bash
npm install
```

Start local PostgreSQL and Redis:

```bash
docker compose up -d
```

Copy environment defaults:

```bash
cp .env.example .env
```

Apply migrations and seed local data:

```bash
npm run prisma:migrate
npm run prisma:seed
```

Start the API:

```bash
npm run start:dev
```

Seeded local admin:

```text
email: admin@zayan.test
password: Password123
```

## Useful Scripts

```bash
npm run prisma:validate
npm run prisma:migrate
npm run prisma:seed
npm run typecheck
npm run lint
npm test -- --runInBand
npm run test:e2e -- --runInBand
npm run build
```

## Local Services

PostgreSQL uses host port `5434`:

```text
postgresql://zayan:zayan@localhost:5434/zayan_max
```

Redis:

```text
redis://localhost:6379
```

## API Conventions

- All API routes use the global `/api/v1` prefix.
- Success responses are wrapped as `{ success, message, data }`.
- Errors are wrapped as `{ success, message, errorCode, details }`.
- Protected APIs use JWT bearer auth.
- Authorization is permission-key based through `@RequirePermissions(...)`.
- Business data is scoped by `companyId`.
- Primary business records use soft delete where applicable.

## Current Platform Notes

This backend includes platform modules for auth, users, roles, permissions, employees, CRM, projects/tasks, attendance/leave, payroll, finance, purchasing/inventory/assets, documents/knowledge base, communications/notifications, calendar, helpdesk, performance, recruitment, sales, billing, approvals, dashboard summaries, and report export metadata.

The backend intentionally does not include frontend screens, real email/SMS/WhatsApp sending, file binary storage, BullMQ workers, real report file generation, or real-time dashboard updates yet.
