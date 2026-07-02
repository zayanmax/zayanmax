# Sales, Leads & Quotations Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the backend-only Sales, Leads & Quotations module with leads, sources, stages, activities, notes, opportunities, quotations, conversion foundation, audit logs, permissions, docs, and tests.

**Architecture:** Follow the existing `apps/backend` module pattern: one NestJS module with DTOs, enum DTOs, controller, service, Prisma models, seed permissions, unit tests, and an authenticated e2e flow. Keep all records company-scoped, use soft deletes where appropriate, and keep PDFs, messaging, invoices, payments, and frontend out of scope.

**Tech Stack:** NestJS, TypeScript, Prisma, PostgreSQL, Jest, Supertest, class-validator.

---

### Task 1: Red Test

**Files:**
- Create: `apps/backend/src/modules/sales-leads-quotations/sales-leads-quotations.service.spec.ts`

- [x] **Step 1: Write failing unit tests**

Cover duplicate lead protection, lead assignment/status/conversion audit, opportunity lifecycle, quotation items/version metadata/status audit.

- [x] **Step 2: Verify red**

Run: `npm test -- sales-leads-quotations.service.spec.ts --runInBand`
Expected: fail because `sales-leads-quotations.service` does not exist.

### Task 2: Schema, Permissions, and Module

**Files:**
- Modify: `apps/backend/prisma/schema.prisma`
- Modify: `apps/backend/prisma/seed.ts`
- Modify: `apps/backend/src/app.module.ts`
- Create: `apps/backend/src/modules/sales-leads-quotations/*`

- [ ] **Step 1: Add Prisma enums and models**

Add lead source/stage/lead/activity/note, opportunity stage/opportunity, quotation/item/version models with relations to company, users/employees, clients, and converted leads.

- [ ] **Step 2: Add seed permissions**

Add `sales.view` and `sales.manage` while continuing to respect existing `leads.*` permissions as seeded business concepts.

- [ ] **Step 3: Implement DTOs, controller, service, and module**

Use permission guards, DTO validation, pagination, company scoping, duplicate lead checks, explicit lead-to-client conversion, status transitions, assignment changes, quotation version metadata, and audit logs.

### Task 3: E2E and Docs

**Files:**
- Modify: `apps/backend/test/app.e2e-spec.ts`
- Create: `docs/modules/sales-leads-quotations.md`
- Modify: `docs/api/api-contract.md`
- Modify: `docs/status/current-status.md`
- Modify: `docs/handover/next-session.md`

- [ ] **Step 1: Add authenticated e2e flow**

Exercise lead source/stage, lead duplicate protection, activity/note, assignment, status, conversion to client, opportunity stage/opportunity/status, quotation with items/version/status, and list filters.

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
