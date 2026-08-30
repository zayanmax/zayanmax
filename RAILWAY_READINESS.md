# ZayanMax Railway Readiness

## Status

**READY WITH LIMITATIONS**

The repository is locally prepared and verified for Railway. Infrastructure has
not been planned against, applied to, or deployed in the user's Railway account,
and nothing has been pushed. The remaining actions require an authorized Railway
project/environment session and public domains.

## Architecture

The intended Railway project contains exactly four resources:

1. `zayanmax-frontend` — Next.js 16, public HTTPS.
2. `zayanmax-backend` — NestJS 11 + Prisma, public HTTPS.
3. `PostgreSQL` — Railway managed database, private connection from backend.
4. `Redis` — Railway managed Redis, private connection from backend.

No worker is defined because the repository has no runnable required worker.

## Deployment strategy

Railpack is used through Railway's current project-level Infrastructure as Code
in [`.railway/railway.ts`](./.railway/railway.ts). The repository is an isolated
monorepo: frontend and backend have independent manifests and lockfiles, so each
service uses its application directory as `source.rootDirectory`.

No Dockerfiles or deprecated `railway.json`/`railway.toml` files were added. The
IaC package is pinned through `.railway/package-lock.json` and typechecked.

## Service settings

Frontend:

| Setting | Value |
| --- | --- |
| Root Directory | `apps/frontend` |
| Build Command | `npm run build` |
| Start Command | `npm run start` |
| Healthcheck | `/api/health` |

Backend:

| Setting | Value |
| --- | --- |
| Root Directory | `apps/backend` |
| Build Command | `npm run build:railway` |
| Pre-Deploy Command | `npm run prisma:migrate:deploy` |
| Start Command | `npm run start:prod` (`node dist/src/main`) |
| Healthcheck | `/api/v1/health/ready` |

## Variables

See [Railway variables](./docs/RAILWAY_VARIABLES.md). Secret values are neither
stored in IaC nor committed examples. IaC references Railway shared variables
and the managed databases.

## Database

Prisma uses `env("DATABASE_URL")`. The backend receives the managed PostgreSQL
`DATABASE_URL` reference over Railway private networking. Each deployment runs
`prisma migrate deploy` as pre-deploy. An empty disposable PostgreSQL database
successfully applied all 18 migrations without `migrate dev`, reset, or `db push`.

## Redis

The backend requires `REDIS_URL` for validated startup and readiness. Current
readiness checks TCP reachability. No queue, cache, scheduler, or worker consumes
Redis yet, so no Worker service is justified.

## Public networking

The frontend and backend both require public HTTPS domains. Browser API calls
must use the backend public domain; a private `*.railway.internal` name cannot be
used in `NEXT_PUBLIC_API_BASE_URL`.

## Private networking

PostgreSQL and Redis are referenced directly from the backend in IaC and require
no public networking for application traffic.

## Seed strategy

- Production pre-deploy applies migrations only.
- Development and demo seeds are protected by explicit production-mode opt-in
  wrappers and never run in build/pre-deploy/start.
- Production initial company/admin creation is a separate manual transactional
  bootstrap with no default identity or password.
- Demo/Staging may manually opt into the known development and demo seeds.
- Demo data targets the configured administrator's company; the guarded cleanup
  command resets company operational data while preserving sign-in and RBAC.

## Validation results

Validated locally on Windows on 30 August 2026:

| Command/check | Result |
| --- | --- |
| `.railway: npm ci` | Passed; 0 vulnerabilities reported. |
| `.railway: npm run typecheck` | Passed against `railway` SDK 3.11.0. |
| `railway --version` | `railway 5.26.0`. |
| `apps/backend: npm ci` | Passed from lockfile; npm reported 1 low and 8 high dependency audit findings. |
| `npm run prisma:validate` | Passed. |
| `npm run prisma:generate` | Passed with Prisma Client 6.19.3. |
| `npm run typecheck` | Passed. |
| `npm test -- --runInBand` | 25 suites, 190 tests passed. |
| `npm run test:e2e -- --runInBand` | 1 suite, 21 tests passed. |
| `npm run build` | Passed; actual entry confirmed at `dist/src/main.js`. |
| Disposable `npm run prisma:migrate:deploy` | Passed; 18 migrations applied to a new database, then the disposable database was removed. |
| Production backend `PORT=4100` | Compiled server started and bound successfully. |
| Backend readiness | HTTP 200; PostgreSQL and Redis checks both `ok`. |
| Production CORS | Configured origin allowed with credentials; unlisted origin received no allow-origin header. |
| Production auth/API smoke | Login, refresh, `/auth/me`, dashboard, Employees, Attendance, Leave, and Payroll returned 200. |
| Weak JWT startup | Rejected before startup. |
| Development/demo seed safety | Both commands rejected under production mode without explicit opt-in. |
| Production bootstrap safety | Rejected when required one-time inputs were absent. |
| `apps/frontend: npm ci` | Passed from lockfile; npm reported 2 moderate and 9 high dependency audit findings. |
| `npm run typecheck` | Passed. |
| `npm run lint` | Passed with zero warnings. |
| `npm run build` | Passed; 101 routes generated and `/api/health` included. |
| Build-time API variable | Rebuilt with `NEXT_PUBLIC_API_BASE_URL=http://localhost:4100/api/v1`; value confirmed in built artifacts. |
| Production frontend `PORT=3100` | `next start` became ready; `/api/health` returned HTTP 200. |
| Frontend route regression | Required HR and representative CRM/projects/tasks/sales/billing/finance/purchase/inventory/assets/documents/calendar routes returned 200. |

## Known limitations

- Railway `config plan` was not run because this checkout is deliberately not
  linked to the user's Railway project. The first operator plan must be reviewed
  for unexpected resource/variable deletes or renames before apply.
- Backend and frontend lockfiles currently report npm audit findings; no blind
  `npm audit fix --force` was applied in this deployment task.
- Redis readiness checks reachability, not authenticated application operations;
  there is no active Redis-backed feature yet.
- Authentication endpoints have no application-level rate limiter.
- Proxy trust is not enabled; audit IP addresses may record Railway's proxy. No
  auth or cookie security decision currently depends on the client IP.
- Durable binary storage/upload, delivery providers, PDF/export generation,
  payments, reconciliation, and accounting integrations are not implemented.
- Performance and Recruitment remain presenter modules.

## Manual Railway steps remaining

1. Push the two local commits only when separately authorized.
2. Create/select distinct Demo/Staging and Production Railway environments.
3. Create the required shared variables with environment-specific secrets.
4. Run `railway link`, select the intended environment, and review
   `railway config plan` against the existing project.
5. Apply the IaC plan only after confirming no unexpected deletes/replacements.
6. Generate public HTTPS domains for backend and frontend.
7. Set final `NEXT_PUBLIC_API_BASE_URL` and `CORS_ORIGINS`, then redeploy both
   services so the frontend value is rebuilt.
8. Run the documented Railway smoke test.
9. Run one-time Production bootstrap or intentional Demo/Staging seed as needed,
   then remove temporary variables.
10. Configure custom domains and backup/restore policy when ownership and plan
    requirements are confirmed.
