# Communication, Announcements & Notifications Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build backend-only company announcements, read receipts, in-app notification metadata, preferences, templates, and reminder records.

**Architecture:** Add a focused NestJS module under `apps/backend/src/modules/communication-notifications` with DTOs, controller, and service. Persist metadata only in Prisma using additive models, company scoping, soft deletes, explicit communication/notification permission keys, and audit logs; do not add provider integrations or workers.

**Tech Stack:** NestJS, TypeScript, Prisma, PostgreSQL, Jest, Supertest.

---

### Task 1: Tests First

**Files:**
- Create: `apps/backend/src/modules/communication-notifications/communication-notifications.service.spec.ts`
- Modify: `apps/backend/test/app.e2e-spec.ts`

- [ ] Add unit tests for announcement creation with audience targeting, publish/archive audit logs, read receipt creation, notification type/template metadata, in-app notification with delivery metadata, read/unread transition, preference upsert audit, and reminder creation.
- [ ] Run focused unit tests and verify they fail because the module does not exist yet.
- [ ] Add E2E coverage for creating an announcement with audiences, publishing/archiving it, read receipt, notification type/template, notification create/read, preference upsert, reminder create, and filtered list endpoints.

### Task 2: Prisma Schema And Seed

**Files:**
- Modify: `apps/backend/prisma/schema.prisma`
- Modify: `apps/backend/prisma/seed.ts`
- Create migration via Prisma.

- [ ] Add enums for announcement status/audience, notification category/priority/entity/channel/delivery/reminder status.
- [ ] Add models for announcements, announcement audiences, read receipts, notification types, internal notifications, notification deliveries, notification preferences, notification templates, and reminders.
- [ ] Add company/user/branch/department/employee/role relations where useful.
- [ ] Add `communications.view/manage` and `notifications.view/manage` permission keys to seed.

### Task 3: NestJS Module

**Files:**
- Create: `apps/backend/src/modules/communication-notifications/dto/communication-notifications.dto.ts`
- Create: `apps/backend/src/modules/communication-notifications/dto/communication-notifications.enums.ts`
- Create: `apps/backend/src/modules/communication-notifications/communication-notifications.service.ts`
- Create: `apps/backend/src/modules/communication-notifications/communication-notifications.controller.ts`
- Create: `apps/backend/src/modules/communication-notifications/communication-notifications.module.ts`
- Modify: `apps/backend/src/app.module.ts`

- [ ] Add guarded routes under `/announcements`, `/notifications`, `/notification-types`, `/notification-templates`, `/notification-preferences`, and `/reminders`.
- [ ] Use `communications.view/manage` and `notifications.view/manage` permission keys.
- [ ] Add search, filters, sorting, pagination.
- [ ] Add audit logs for announcement create/update/publish/archive and notification preference changes.

### Task 4: Documentation And Verification

**Files:**
- Create: `docs/modules/communication-notifications.md`
- Modify: `docs/api/api-contract.md`
- Modify: `docs/status/current-status.md`
- Modify: `docs/handover/next-session.md`

- [ ] Document routes, permissions, models, statuses, audience targeting, delivery metadata, entity linking, preferences, reminders, and exclusions.
- [ ] Run required verification commands from `apps/backend`.
