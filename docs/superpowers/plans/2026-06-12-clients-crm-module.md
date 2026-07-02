# Clients CRM Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the backend-only Clients / CRM module to the existing NestJS backend.

**Architecture:** Follow `apps/backend` foundation patterns: Prisma models, Nest module/controller/service, DTO validation, permission-key guards, `companyId` scoping, soft delete, audit logs, and standard API responses. Keep CRM isolated and avoid projects, invoices, and payments.

**Tech Stack:** NestJS, TypeScript, Prisma, PostgreSQL, Jest, Supertest.

---

### Task 1: Tests First

**Files:**
- Create: `apps/backend/src/modules/clients/clients.service.spec.ts`
- Modify: `apps/backend/test/app.e2e-spec.ts`

- [ ] Add unit tests for duplicate client protection, client creation audit logging, filtered/paginated listing, status changes, soft delete, contacts, notes, activities, and document metadata.
- [ ] Add e2e tests for seeded admin creating and listing clients.
- [ ] Run tests and confirm they fail because the module does not exist yet.

### Task 2: Prisma Schema and Migration

**Files:**
- Modify: `apps/backend/prisma/schema.prisma`
- Modify: `apps/backend/prisma/seed.ts`

- [ ] Add `Client`, `ClientContact`, `ClientActivity`, `ClientNote`, and `ClientDocument` models.
- [ ] Add client enums for type/status/activity/document metadata.
- [ ] Add relations from `Company` and `User`.
- [ ] Add indexes for `companyId`, `ownerId`, `status`, `type`, `email`, `phone`, `name`, and `createdAt`.
- [ ] Generate and apply migration locally.

### Task 3: Nest Module

**Files:**
- Create: `apps/backend/src/modules/clients/dto/*.ts`
- Create: `apps/backend/src/modules/clients/clients.service.ts`
- Create: `apps/backend/src/modules/clients/clients.controller.ts`
- Create: `apps/backend/src/modules/clients/clients.module.ts`
- Modify: `apps/backend/src/app.module.ts`

- [ ] Implement client CRUD, status changes, contacts, activities, notes, and document metadata endpoints.
- [ ] Use `clients.view`, `clients.create`, `clients.update`, and `clients.delete` permission keys.
- [ ] Audit create/update/delete/status changes and child record additions.

### Task 4: Docs and Verification

**Files:**
- Modify: `docs/status/current-status.md`
- Modify: `docs/handover/next-session.md`
- Create/Modify: `docs/modules/clients.md`
- Modify: `docs/api/api-contract.md`

- [ ] Update docs with endpoints, scope, validation results, and next steps.
- [ ] Run required verification commands.

## Self-Review

- Scope is limited to Clients / CRM.
- No frontend, projects, invoices, or payments are included.
- Tests and docs are part of the implementation.
