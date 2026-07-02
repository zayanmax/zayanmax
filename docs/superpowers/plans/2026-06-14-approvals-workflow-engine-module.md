# Approvals Workflow Engine Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the backend-only reusable approvals workflow engine with workflow definitions, steps, requests, step instances, actions, delegation metadata, escalation metadata, pending approvals, entity history, docs, and tests.

**Architecture:** Add a focused NestJS module under `apps/backend/src/modules/approvals-workflow` using the existing service/controller/module pattern. Persist generic approval records in additive Prisma models with company scoping, soft deletes where applicable, permission-key guards, audit logs, and no refactor of existing local approval flows.

**Tech Stack:** NestJS, TypeScript, Prisma, PostgreSQL, Jest, Supertest, class-validator.

---

### Task 1: Red Test

**Files:**
- Create: `apps/backend/src/modules/approvals-workflow/approvals-workflow.service.spec.ts`

- [ ] **Step 1: Write failing unit tests**

Cover workflow definition duplicate protection, request submission with step instance creation, approve/reject/cancel/delegate audit logs, my pending approvals, and entity history.

- [ ] **Step 2: Verify red**

Run: `npm test -- approvals-workflow.service.spec.ts --runInBand`
Expected: fail because `approvals-workflow.service` does not exist.

### Task 2: Schema, Permissions, and Module

**Files:**
- Modify: `apps/backend/prisma/schema.prisma`
- Modify: `apps/backend/prisma/seed.ts`
- Modify: `apps/backend/src/app.module.ts`
- Create: `apps/backend/src/modules/approvals-workflow/*`

- [ ] **Step 1: Add Prisma enums and models**

Add approval workflow definitions, workflow steps, approval requests, step instances, and approval actions with entity-linking enums, step approver types, request statuses, and step statuses.

- [ ] **Step 2: Add seed permissions**

Confirm or add `approvals.view`, `approvals.manage`, and `approvals.approve`.

- [ ] **Step 3: Implement DTOs, controller, service, and module**

Use permission guards, DTO validation, pagination, company scoping, duplicate workflow key checks, request submit, approve, reject, cancel, delegate, pending approvals, entity history, and audit logs.

### Task 3: E2E and Docs

**Files:**
- Modify: `apps/backend/test/app.e2e-spec.ts`
- Create: `docs/modules/approvals-workflow.md`
- Modify: `docs/api/api-contract.md`
- Modify: `docs/status/current-status.md`
- Modify: `docs/handover/next-session.md`

- [ ] **Step 1: Add authenticated e2e flow**

Exercise workflow create/list/update/delete, request submit/list, pending approvals, approve/reject/cancel/delegate actions, and entity history.

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
