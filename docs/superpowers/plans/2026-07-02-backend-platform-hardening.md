# Backend Platform Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stabilize the existing backend for frontend integration with Swagger, health/readiness checks, additive auth session metadata, RBAC documentation, and developer setup docs.

**Architecture:** Keep `apps/backend` as the source of truth and add only platform modules/contracts. Do not rewrite business modules; use additive Prisma metadata tables for sessions/password reset and focused tests for new behavior.

**Tech Stack:** NestJS, Prisma/PostgreSQL, Redis TCP readiness check, Swagger/OpenAPI, Jest, Supertest.

---

### Task 1: Red Tests

**Files:**
- Modify: `apps/backend/test/app.e2e-spec.ts`
- Modify: `apps/backend/src/modules/auth/auth.service.spec.ts`

- [ ] Add e2e assertions for `/api/docs`, `/api/docs-json`, `/api/v1/health`, `/api/v1/health/live`, `/api/v1/health/ready`, denied access, password change, logout-all, and password reset metadata.
- [ ] Add auth service unit assertions for session creation/revocation and password-change validation.
- [ ] Run focused tests and confirm failure before implementation.

### Task 2: Swagger/OpenAPI

**Files:**
- Modify: `apps/backend/package.json`
- Modify: `apps/backend/package-lock.json`
- Modify: `apps/backend/src/main.ts`
- Modify: controller files under `apps/backend/src/modules/**`

- [ ] Add `@nestjs/swagger` and `swagger-ui-express`.
- [ ] Configure `/api/docs` and `/api/docs-json`.
- [ ] Add bearer auth, standard response/error schemas, and module tags.

### Task 3: Health Module

**Files:**
- Create: `apps/backend/src/modules/health/health.controller.ts`
- Create: `apps/backend/src/modules/health/health.service.ts`
- Create: `apps/backend/src/modules/health/health.module.ts`
- Modify: `apps/backend/src/app.module.ts`

- [ ] Add liveness, readiness, DB connectivity, Redis connectivity, and version/build metadata placeholder.

### Task 4: Auth Session Hardening

**Files:**
- Modify: `apps/backend/prisma/schema.prisma`
- Add migration under `apps/backend/prisma/migrations/`
- Modify: auth controller/service/DTOs/tests

- [ ] Add `UserSession` and `PasswordResetToken` metadata tables.
- [ ] Create session metadata on login.
- [ ] Rotate session refresh hash on refresh.
- [ ] Revoke sessions on logout/logout-all.
- [ ] Add password change endpoint.
- [ ] Add password reset request/confirm metadata-only foundation.

### Task 5: Docs And Verification

**Files:**
- Create: `docs/backend/platform-hardening.md`
- Create: `docs/api/swagger-openapi.md`
- Create: `docs/security/auth-rbac.md`
- Modify: `docs/api/api-contract.md`
- Modify: `docs/status/current-status.md`
- Modify: `docs/handover/next-session.md`
- Modify: `apps/backend/.env.example`
- Modify: `apps/backend/README.md`

- [ ] Document permissions, endpoints, setup, env vars, and exclusions.
- [ ] Run required verification commands and record results.
