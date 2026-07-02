# Performance Appraisals Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the backend-only Performance, Goals & Appraisals module with cycles, goals, KPIs, reviews, responses, feedback, one-on-one notes, promotion metadata, summaries, tests, and documentation.

**Architecture:** Add Prisma models for performance cycles, goals/progress, KPI categories/records, review templates/questions, employee reviews/responses, feedback, one-on-one notes, and promotion recommendations. Expose them through a NestJS module using existing DTO validation, permission guards, company scoping, pagination, soft deletes, and audit logging patterns.

**Tech Stack:** NestJS, TypeScript, Prisma, PostgreSQL, class-validator, Jest, Supertest.

---

### Task 1: Service Behavior

**Files:**
- Create: `apps/backend/src/modules/performance-appraisals/performance-appraisals.service.spec.ts`
- Create: `apps/backend/src/modules/performance-appraisals/dto/performance-appraisals.enums.ts`
- Create: `apps/backend/src/modules/performance-appraisals/dto/performance-appraisals.dto.ts`
- Create: `apps/backend/src/modules/performance-appraisals/performance-appraisals.service.ts`

- [ ] Write failing service tests for cycle duplicate protection, goal creation/progress/status audits, KPI records, templates/reviews/responses, feedback, employee summary, and manager team summary.
- [ ] Run `npm test -- performance-appraisals.service.spec.ts --runInBand` and confirm it fails because the service does not exist.
- [ ] Implement DTOs and service methods to satisfy the tests.
- [ ] Re-run the focused spec and keep it green.

### Task 2: Schema And Routes

**Files:**
- Modify: `apps/backend/prisma/schema.prisma`
- Modify: `apps/backend/prisma/seed.ts`
- Create: `apps/backend/src/modules/performance-appraisals/performance-appraisals.controller.ts`
- Create: `apps/backend/src/modules/performance-appraisals/performance-appraisals.module.ts`
- Modify: `apps/backend/src/app.module.ts`

- [ ] Add performance enums and models with company scoping, relations, indexes, soft-delete fields, and uniqueness where needed.
- [ ] Add `performance.view` and `performance.manage` seed permissions.
- [ ] Add guarded controller routes.
- [ ] Register the module in `AppModule`.
- [ ] Format/validate Prisma and create the migration.

### Task 3: E2E And Docs

**Files:**
- Modify: `apps/backend/test/app.e2e-spec.ts`
- Create: `docs/modules/performance-appraisals.md`
- Modify: `docs/api/api-contract.md`
- Modify: `docs/status/current-status.md`
- Modify: `docs/handover/next-session.md`

- [ ] Add e2e coverage for cycles, goals, progress, KPIs, templates, reviews, responses, feedback, one-on-one notes, promotion metadata, employee summary, and manager team summary.
- [ ] Document routes, enums, filters, audit actions, and exclusions.
- [ ] Run the required verification commands and record final results.
