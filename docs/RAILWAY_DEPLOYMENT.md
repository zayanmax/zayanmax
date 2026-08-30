# ZayanMax Railway Deployment

## Architecture

ZayanMax deploys as one Railway project with exactly four resources:

```text
Browser -> HTTPS -> zayanmax-frontend (Next.js 16)
Browser -> HTTPS -> zayanmax-backend  (NestJS 11 + Prisma)
                         |-> private PostgreSQL
                         `-> private Redis
```

The browser-facing frontend and backend require public HTTPS domains. PostgreSQL
and Redis use Railway private networking and must not be exposed publicly. There
is no runnable background worker in this repository, so no Worker service is
defined.

The repository is an isolated monorepo: each application has its own
`package.json` and lockfile and neither requires root workspace packages. Railway
therefore uses `apps/backend` and `apps/frontend` as source root directories.

## Prerequisites

- GitHub repository `zayanmax/zayanmax` with the intended commit pushed in a
  separately authorized task.
- Access to the intended Railway project and its Demo/Staging and Production
  environments.
- Railway CLI 5.26.0 or newer with Infrastructure-as-Code support.
- Shared variables listed in [RAILWAY_VARIABLES.md](./RAILWAY_VARIABLES.md).

## Infrastructure as Code

Railway's current project-level IaC file is
[`../.railway/railway.ts`](../.railway/railway.ts). Do not add legacy
`railway.json` or `railway.toml` files. The TypeScript definition manages all four
resources as one graph and uses Railpack.

Validate the authoring package:

```powershell
Set-Location .railway
npm ci
npm run typecheck
Set-Location ..
railway --version
```

Link only when authorized, select the correct Railway environment, then preview:

```powershell
railway login
railway link
railway config plan
```

`railway config plan` is read-only. Carefully reject a plan that proposes an
unexpected service/variable deletion or replacement. This is especially
important when applying the file to an existing project whose service names may
not yet match the desired names. Apply only during an authorized deployment:

```powershell
railway config apply
```

## Service 1 — PostgreSQL

IaC declares managed `PostgreSQL`. Railway provisions and persists it through its
database workflow. `zayanmax-backend` receives `PostgreSQL.DATABASE_URL` by
reference. Do not enable public TCP networking for application connectivity.

Use Railway backups/point-in-time recovery appropriate to the plan before risky
schema changes. Application rollback does not reverse a database migration.

## Service 2 — Redis

IaC declares managed `Redis`. `zayanmax-backend` receives `Redis.REDIS_URL` by
reference over private networking. Redis is currently checked by backend
readiness but is not yet used by a queue, cache, scheduler, or worker.

## Service 3 — Backend

| Setting | Value |
| --- | --- |
| Service | `zayanmax-backend` |
| GitHub source | `zayanmax/zayanmax`, branch `main` |
| Root Directory | `apps/backend` |
| Builder | Railpack |
| Build Command | `npm run build:railway` |
| Pre-Deploy Command | `npm run prisma:migrate:deploy` |
| Start Command | `npm run start:prod` |
| Healthcheck | `/api/v1/health/ready` |
| Healthcheck timeout | 30 seconds |
| Public networking | Required; generate an HTTPS domain |

The build runs `prisma generate` before `nest build`. Pre-deploy runs only
`prisma migrate deploy`; it never runs `migrate dev`, `db push`, a reset, or a
seed. Production starts compiled `dist/src/main.js`, reads Railway's `PORT`, and
binds `0.0.0.0`.

Swagger is disabled by IaC in the Production environment and enabled outside
Production. Helmet, strict DTO validation, credential-aware CORS, and the
existing request-body parser defaults remain active.

## Service 4 — Frontend

| Setting | Value |
| --- | --- |
| Service | `zayanmax-frontend` |
| GitHub source | `zayanmax/zayanmax`, branch `main` |
| Root Directory | `apps/frontend` |
| Builder | Railpack |
| Build Command | `npm run build` |
| Start Command | `npm run start` |
| Healthcheck | `/api/health` |
| Healthcheck timeout | 30 seconds |
| Public networking | Required; generate an HTTPS domain |

`NEXT_PUBLIC_API_BASE_URL` must be available during the frontend build and must
point to the backend's public HTTPS URL ending in `/api/v1`. Next.js embeds this
public value into browser bundles; updating it requires a new frontend build.

## First Deployment Order

1. In each Railway environment, create the four required shared variables. For
   the first plan, `CORS_ORIGINS` and `NEXT_PUBLIC_API_BASE_URL` may temporarily
   use safe `https://placeholder.invalid` values while domains do not exist.
2. Link the CLI to the intended project/environment and run
   `railway config plan`.
3. Review the complete four-resource plan, especially any deletions or renames.
4. When authorized, run `railway config apply` to provision PostgreSQL, Redis,
   backend, and frontend.
5. Generate a public Railway HTTPS domain for `zayanmax-backend`.
6. Set shared `NEXT_PUBLIC_API_BASE_URL` to
   `https://<backend-domain>/api/v1`.
7. Generate a public Railway HTTPS domain for `zayanmax-frontend`.
8. Set shared `CORS_ORIGINS` to `https://<frontend-domain>`.
9. Redeploy/rebuild the backend and frontend so CORS and the build-time frontend
   API URL use the final generated domains.
10. Run the smoke test below before attaching custom domains.

This order avoids pointing browser code at private `*.railway.internal` names
and makes the initial domain dependency explicit.

## Database Migration

Every backend deployment runs:

```powershell
npm run prisma:migrate:deploy
```

as Railway pre-deploy before the new application starts. Migration failure must
block rollout. Never substitute `prisma migrate dev`, `prisma migrate reset`, or
`prisma db push` in Production.

## Production Bootstrap

Production migrations create schema only. They do not create fake employees or
the known `admin@zayan.test` account.

For an empty Production database, temporarily set the four `BOOTSTRAP_*`
variables from [RAILWAY_VARIABLES.md](./RAILWAY_VARIABLES.md), then run once in
the active backend deployment:

```powershell
railway ssh --service zayanmax-backend npm run prisma:bootstrap
```

The bootstrap requires an explicit company, email, and strong password. It
creates one company, permissions, a Super Admin role, and the initial user in one
transaction; it refuses to overwrite an existing admin. Remove
`BOOTSTRAP_ADMIN_PASSWORD` and the other bootstrap variables immediately after
success.

## Demo Seed

Demo/Staging uses the same build but different data. The known development seed
and full demo dataset are never part of build, pre-deploy, or start commands.

For a disposable environment created with the development seed, run the two
commands in order. For a production-bootstrapped disposable demo, run only the
demo seed; it resolves the tenant from `DEMO_ADMIN_EMAIL` (default
`admin@zayan.test`) instead of creating a second development company.

```powershell
railway ssh --service zayanmax-backend env ALLOW_DEVELOPMENT_SEED=true npm run prisma:seed:dev
railway ssh --service zayanmax-backend env ALLOW_DEMO_SEED=true npm run prisma:seed:demo
```

To reset all operational data and non-admin users while preserving the company,
administrator credentials, roles, and permissions:

```powershell
railway ssh --service zayanmax-backend env ALLOW_DEMO_CLEANUP=true CONFIRM_DEMO_CLEANUP=DELETE_ZAYANMAX_DEMO_DATA npm run prisma:cleanup:demo
```

The flags above are command-scoped and are not persisted as Railway variables.

## Smoke Test

1. Request backend `/api/v1/health/live` and `/api/v1/health/ready`; both should
   return HTTP 200, with database and Redis checks healthy on readiness.
2. Request frontend `/api/health`; it should return HTTP 200 independently of
   the backend.
3. Log in with an environment-appropriate account, refresh the session, and
   open `/dashboard`, `/employees`, `/attendance`, `/leave`, and `/payroll`.
4. Open representative routes `/clients`, `/projects`, `/tasks`, `/sales/leads`,
   `/billing`, `/finance`, `/purchase`, `/inventory`, `/assets`, `/documents`,
   and `/calendar`.
5. From the configured frontend origin, verify a preflight/auth API request has
   `Access-Control-Allow-Origin` set to that exact origin and credentials enabled.
6. Verify an unlisted origin receives no CORS authorization.

## Rollback

Use Railway's deployment history to roll a service back to a previously healthy
application deployment. Before rolling back across a Prisma migration, inspect
the migration: Railway application rollback does not reverse database schema or
data changes. Prefer backward-compatible migrations and a forward fix; restore a
database backup only with an explicit data-recovery plan.

## Custom Domains

Generated Railway domains are acceptable for initial smoke testing. When domain
ownership is confirmed, attach the intended frontend and backend custom domains
(conceptually `app.<domain>` and `api.<domain>`), then update
`NEXT_PUBLIC_API_BASE_URL` and `CORS_ORIGINS` and rebuild/redeploy. The IaC file
does not claim placeholder domains or invent domain ownership.

## Production Limitations

- Redis has reachability/readiness coverage but no application queue/cache use;
  no Worker service exists.
- Authentication endpoints have no application-level rate limiter despite the
  throttler package being installed.
- Proxy trust is not enabled because bearer authentication does not depend on
  secure cookies or client IP. Audit IPs may therefore reflect Railway's proxy.
- Document records store metadata only; durable binary upload/download storage
  is not implemented. Railway's ephemeral filesystem must not hold business files.
- Email, WhatsApp, push delivery, generated PDFs, report exports, payment gateway,
  reconciliation, and accounting integrations remain unimplemented.
- Performance and Recruitment remain presenter modules; this deployment work
  does not expand them.
