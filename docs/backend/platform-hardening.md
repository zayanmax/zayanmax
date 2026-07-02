# Backend Platform Hardening

Last updated: 2026-07-02

## Scope

This pass stabilized the existing backend platform without adding new business modules or frontend code.

Implemented:

- Swagger/OpenAPI documentation at `/api/docs` and `/api/docs-json`.
- Health, liveness, and readiness endpoints.
- Database connectivity readiness check.
- Redis TCP connectivity readiness check.
- Version/build metadata placeholders in health responses.
- Session/device metadata foundation for auth.
- Logout-all-sessions foundation.
- Password change endpoint.
- Password reset token metadata foundation only.
- RBAC permission audit against seeded permission keys.
- Focused denied-access e2e coverage.

## API Discoverability

Swagger uses:

- API title: `Zayan Max Backend API`
- Runtime route prefix: `/api/v1`
- Docs route: `/api/docs`
- JSON route: `/api/docs-json`
- Bearer JWT auth scheme: `bearer`
- Standard response/error schemas:
  - `StandardSuccessResponse`
  - `StandardErrorResponse`

Controllers are tagged by module so frontend developers can scan APIs by product area.

## Health And Readiness

Routes:

- `GET /api/v1/health`
- `GET /api/v1/health/live`
- `GET /api/v1/health/ready`

Readiness checks:

- PostgreSQL through Prisma `$queryRaw(SELECT 1)`.
- Redis by opening a TCP connection to `REDIS_URL`.

Health metadata:

- `BUILD_VERSION`, default `0.0.1`
- `BUILD_SHA`, default `local`
- `NODE_ENV`
- uptime and timestamp

## Auth Hardening

Added metadata tables:

- `UserSession`
- `PasswordResetToken`

Behavior:

- Login still returns `accessToken`, `refreshToken`, and `user`, and now also returns `sessionId`.
- Refresh accepts optional `sessionId` and rotates session refresh hash when a matching session exists.
- Logout revokes active session metadata for that user.
- Logout-all revokes all active session metadata for that user.
- Password change validates the current password, rejects reuse of the same password, updates the hash, and revokes sessions.
- Password reset request stores metadata only. No email/SMS/WhatsApp provider is called.
- Password reset confirm can consume a valid reset token record, but token delivery remains out of scope.

## RBAC Audit

Current audit result:

- Controller permission usages found: 64.
- Seeded permission keys found: 69.
- Missing seeded permissions for implemented controllers: 0.

The backend continues to use permission-key guards instead of role-name checks.

## Database And Prisma Audit

Verified:

- Current Prisma schema validates.
- Migrations are append-only and ordered by timestamp.
- New platform metadata was added through migration `20260702103000_platform_hardening_auth_sessions`.
- Existing business modules already follow `companyId` scoping and soft-delete conventions for primary records.
- Existing modules generally index the main company/status/date filters used by their list queries.
- A broad scan found many historical tables without standalone `deletedAt` or `createdAt` indexes. No mass index migration was applied because it would add many low-value indexes without query-plan evidence.

No existing migration was rewritten.

## Local Setup Notes

Backend folder:

```text
apps/backend
```

Local services:

```bash
docker compose up -d
```

Postgres:

```text
postgresql://zayan:zayan@localhost:5434/zayan_max
```

Redis:

```text
redis://localhost:6379
```

Useful scripts:

- `npm run prisma:validate`
- `npm run prisma:migrate`
- `npm run prisma:seed`
- `npm run typecheck`
- `npm run lint`
- `npm test -- --runInBand`
- `npm run test:e2e -- --runInBand`
- `npm run build`

## Verification

Latest full verification from `apps/backend`:

- `npm run prisma:validate`: passed.
- `npm run typecheck`: passed.
- `npm run lint`: passed with warnings in test typing.
- `npm test -- --runInBand`: 21 suites, 100 tests passed.
- `npm run test:e2e -- --runInBand`: 1 suite, 21 tests passed.
- `npm run build`: passed.

Additional dependency audit:

- `npm audit --omit=dev`: reports high-severity Multer advisories inherited through Nest platform packages.
- The npm suggested forced fix would apply breaking dependency changes, so it was not applied during this scoped stabilization pass.

## Exclusions

Not implemented in this pass:

- Frontend screens.
- Real password reset email/SMS/WhatsApp delivery.
- OAuth/social login.
- 2FA.
- Redis-backed session store.
- Rate-limit tuning beyond the existing package foundation.
- Business module rewrites.
