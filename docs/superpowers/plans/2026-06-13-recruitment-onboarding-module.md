# Recruitment & Onboarding Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the backend-only Recruitment & Onboarding module with job openings, candidates, applications, interviews, offers, onboarding checklists, candidate-to-employee conversion foundation, audit logs, permissions, docs, and tests.

**Architecture:** Follow the existing `apps/backend` module pattern: a single NestJS module with DTOs, enum DTOs, controller, service, Prisma models, seed permissions, unit tests, and an authenticated e2e flow. Keep all records company-scoped and avoid frontend, email, notification, calendar, and PDF integrations.

**Tech Stack:** NestJS, TypeScript, Prisma, PostgreSQL, Jest, Supertest, class-validator.

---

### Task 1: Red Test

**Files:**
- Create: `apps/backend/src/modules/recruitment-onboarding/recruitment-onboarding.service.spec.ts`

- [x] **Step 1: Write failing unit tests**

Cover duplicate candidate protection, job/application/offer status audit, interview feedback, onboarding checklist creation, and conversion metadata.

- [x] **Step 2: Verify red**

Run: `npm test -- recruitment-onboarding.service.spec.ts --runInBand`
Expected: fail because `recruitment-onboarding.service` does not exist.

### Task 2: Schema, Permissions, and Module

**Files:**
- Modify: `apps/backend/prisma/schema.prisma`
- Modify: `apps/backend/prisma/seed.ts`
- Modify: `apps/backend/src/app.module.ts`
- Create: `apps/backend/src/modules/recruitment-onboarding/*`

- [ ] **Step 1: Add Prisma enums and models**

Add job opening, candidate, pipeline stage, application, interview round, interview feedback, offer letter metadata, onboarding checklist, and onboarding item models with company relations and sensible indexes/uniques.

- [ ] **Step 2: Add seed permissions**

Add `recruitment.view` and `recruitment.manage`.

- [ ] **Step 3: Implement DTOs, controller, service, and module**

Use `@RequirePermissions`, `companyId` scoping, DTO validation, pagination, duplicate candidate checks, status transitions, and audit log writes.

### Task 3: E2E and Docs

**Files:**
- Modify: `apps/backend/test/app.e2e-spec.ts`
- Create: `docs/modules/recruitment-onboarding.md`
- Modify: `docs/api/api-contract.md`
- Modify: `docs/status/current-status.md`
- Modify: `docs/handover/next-session.md`

- [ ] **Step 1: Add authenticated e2e flow**

Exercise job opening, candidate duplicate protection, source/stage/application, interview feedback, offer status, onboarding checklist/item, conversion endpoint, and list filters.

- [ ] **Step 2: Update documentation**

Document scope, endpoints, permissions, migration, exclusions, verification results, and next-session handover state.

### Task 4: Verification

- [ ] Run `npm run prisma:validate`
- [ ] Run `npm run typecheck`
- [ ] Run `npm run lint`
- [ ] Run `npm test -- --runInBand`
- [ ] Run `npm run test:e2e -- --runInBand`
- [ ] Run `npm run build`
- [ ] Fix any failures and update docs with final results.
