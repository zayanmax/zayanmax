# Helpdesk Tickets Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the backend-only Helpdesk / Internal Tickets module with ticket taxonomy, tickets, comments, notes, attachments metadata, queues, audit logs, tests, and documentation.

**Architecture:** Add Prisma models for categories, subcategories, tickets, comments, notes, and attachments, then expose them through a NestJS module using the existing service/controller/DTO pattern. Tickets remain company-scoped, use permission-key RBAC, store SLA and linked-entity metadata, and audit critical actions.

**Tech Stack:** NestJS, TypeScript, Prisma, PostgreSQL, class-validator, Jest, Supertest.

---

### Task 1: Service Behavior

**Files:**
- Create: `apps/backend/src/modules/helpdesk-tickets/helpdesk-tickets.service.spec.ts`
- Create: `apps/backend/src/modules/helpdesk-tickets/dto/helpdesk-tickets.enums.ts`
- Create: `apps/backend/src/modules/helpdesk-tickets/dto/helpdesk-tickets.dto.ts`
- Create: `apps/backend/src/modules/helpdesk-tickets/helpdesk-tickets.service.ts`

- [ ] Write failing service tests for category duplicate protection, ticket creation with SLA/entity metadata, status changes, assignment changes, comments, internal notes, attachments, my tickets, and queue filters.
- [ ] Run `npm test -- helpdesk-tickets.service.spec.ts --runInBand` and confirm it fails because the service does not exist.
- [ ] Implement DTOs and service methods to satisfy the tests.
- [ ] Re-run the focused spec and keep it green.

### Task 2: Schema And Routes

**Files:**
- Modify: `apps/backend/prisma/schema.prisma`
- Create: `apps/backend/src/modules/helpdesk-tickets/helpdesk-tickets.controller.ts`
- Create: `apps/backend/src/modules/helpdesk-tickets/helpdesk-tickets.module.ts`
- Modify: `apps/backend/src/app.module.ts`

- [ ] Add helpdesk enums and models with company scoping, soft-delete fields, indexes, unique constraints, and relations.
- [ ] Add controller routes guarded by `helpdesk.view` and `helpdesk.manage`.
- [ ] Register the module in `AppModule`.
- [ ] Format/validate Prisma and create the migration.

### Task 3: E2E And Docs

**Files:**
- Modify: `apps/backend/test/app.e2e-spec.ts`
- Create: `docs/modules/helpdesk-tickets.md`
- Modify: `docs/api/api-contract.md`
- Modify: `docs/status/current-status.md`
- Modify: `docs/handover/next-session.md`

- [ ] Add e2e coverage for categories, subcategories, ticket create, assignment, comment, note, attachment metadata, status close, my tickets, and queue listing.
- [ ] Document routes, enums, filters, audit actions, and exclusions.
- [ ] Run the required verification commands and record final results.
