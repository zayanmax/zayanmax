# Backend Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Zayan Max backend foundation only.

**Architecture:** Use a NestJS modular monolith in `apps/backend` so the existing top-level `backend/` documentation remains intact. Shared infrastructure lives under `src/common`, `src/config`, and `src/database`; domain modules live under `src/modules`.

**Tech Stack:** NestJS, TypeScript, Prisma, PostgreSQL, Docker Compose, JWT, class-validator, class-transformer, Jest.

---

### Task 1: Scaffold Backend Project

**Files:**
- Create: `apps/backend/package.json`
- Create: `apps/backend/src/main.ts`
- Create: `apps/backend/src/app.module.ts`
- Create: `apps/backend/test/app.e2e-spec.ts`

- [ ] Generate or create the NestJS backend project under `apps/backend`.
- [ ] Install NestJS, Prisma, PostgreSQL client, config, validation, JWT, Passport, bcrypt, and test dependencies.
- [ ] Confirm `npm test` and `npm run build` can execute.

### Task 2: Infrastructure and Config

**Files:**
- Create: `apps/backend/.env.example`
- Create: `apps/backend/docker-compose.yml`
- Create: `apps/backend/prisma/schema.prisma`
- Create: `apps/backend/prisma/seed.ts`
- Create: `apps/backend/src/config/env.validation.ts`
- Create: `apps/backend/src/database/prisma.service.ts`
- Create: `apps/backend/src/database/prisma.module.ts`

- [ ] Write config validation tests first.
- [ ] Add environment validation for port, database URL, Redis URL, JWT secrets, and token expiry values.
- [ ] Add Prisma service and PostgreSQL schema for foundation entities.
- [ ] Add local Docker Compose services for PostgreSQL and Redis.

### Task 3: Common API Behavior

**Files:**
- Create: `apps/backend/src/common/interceptors/response.interceptor.ts`
- Create: `apps/backend/src/common/filters/http-exception.filter.ts`
- Create: `apps/backend/src/common/dto/pagination-query.dto.ts`
- Modify: `apps/backend/src/main.ts`

- [ ] Write failing tests for standard success and error response shapes.
- [ ] Add global validation pipe, response interceptor, and exception filter.
- [ ] Set global API prefix to `/api/v1`.

### Task 4: Auth, Users, Roles, Permissions

**Files:**
- Create: `apps/backend/src/modules/auth/*`
- Create: `apps/backend/src/modules/users/*`
- Create: `apps/backend/src/modules/roles/*`
- Create: `apps/backend/src/modules/permissions/*`
- Create: `apps/backend/src/common/decorators/current-user.decorator.ts`
- Create: `apps/backend/src/common/decorators/require-permissions.decorator.ts`
- Create: `apps/backend/src/common/guards/jwt-auth.guard.ts`
- Create: `apps/backend/src/common/guards/permissions.guard.ts`

- [ ] Write auth service tests for login success, invalid credentials, refresh token hashing, and me payload.
- [ ] Implement login, logout, refresh, and me endpoints.
- [ ] Seed permission keys from `backend/permissions-seed.md`.
- [ ] Implement permission-based guards without hardcoded role-name checks.

### Task 5: Organization and Employees

**Files:**
- Create: `apps/backend/src/modules/companies/*`
- Create: `apps/backend/src/modules/branches/*`
- Create: `apps/backend/src/modules/departments/*`
- Create: `apps/backend/src/modules/designations/*`
- Create: `apps/backend/src/modules/employees/*`

- [ ] Write employee service tests for `companyId` scoping, employee code uniqueness, and soft delete.
- [ ] Implement CRUD foundations for companies, branches, departments, designations, and employees.
- [ ] Keep DTO validation separate for create, update, and query.

### Task 6: Audit Logs and Verification

**Files:**
- Create: `apps/backend/src/modules/audit-logs/*`
- Modify: `docs/status/current-status.md`
- Modify: `docs/handover/next-session.md`

- [ ] Write tests for creating audit log records.
- [ ] Add audit logs for auth and employee changes.
- [ ] Run typecheck, tests, Prisma validation, and local Docker-backed migration check when available.
- [ ] Update status and handover docs with completed work and next steps.

## Self-Review

- The plan covers the requested backend-only foundation.
- Frontend work is intentionally excluded.
- The backend app is isolated under `apps/backend` to avoid overwriting top-level documentation.
- Validation includes tests, typecheck/build, Prisma validation, and Docker-backed database checks.
