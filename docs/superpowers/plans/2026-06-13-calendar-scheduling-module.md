# Calendar Scheduling Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the backend-only Calendar, Meetings & Scheduling module with metadata storage, conflict checks, permissions, tests, and documentation.

**Architecture:** Add Prisma calendar models for events, attendees, resources, bookings, and reminders, then expose them through a NestJS module using the existing controller/service/DTO pattern. Keep all data company-scoped, soft-delete mutable records, and audit event, RSVP, and booking state changes.

**Tech Stack:** NestJS, TypeScript, Prisma, PostgreSQL, class-validator, Jest, Supertest.

---

### Task 1: Calendar Service Behavior

**Files:**
- Create: `apps/backend/src/modules/calendar-scheduling/calendar-scheduling.service.spec.ts`
- Create: `apps/backend/src/modules/calendar-scheduling/dto/calendar-scheduling.enums.ts`
- Create: `apps/backend/src/modules/calendar-scheduling/dto/calendar-scheduling.dto.ts`
- Create: `apps/backend/src/modules/calendar-scheduling/calendar-scheduling.service.ts`

- [ ] Write failing service tests for event creation with attendees/resources/reminders, conflict rejection, RSVP updates, cancel audit, and resource duplicate protection.
- [ ] Run `npm test -- calendar-scheduling.service.spec.ts --runInBand` and confirm it fails because the module does not exist.
- [ ] Implement DTO enums, DTO validation classes, and service methods to satisfy the tests.
- [ ] Re-run the focused service spec and keep it green.

### Task 2: Prisma Schema And API Wiring

**Files:**
- Modify: `apps/backend/prisma/schema.prisma`
- Modify: `apps/backend/prisma/seed.ts`
- Create: `apps/backend/src/modules/calendar-scheduling/calendar-scheduling.controller.ts`
- Create: `apps/backend/src/modules/calendar-scheduling/calendar-scheduling.module.ts`
- Modify: `apps/backend/src/app.module.ts`

- [ ] Add calendar enums and models with companyId scoping, relations, soft delete fields, unique constraints, and indexes.
- [ ] Add `calendar.view` and `calendar.manage` permissions to seed data.
- [ ] Add controller routes guarded by existing JWT and permission guards.
- [ ] Register the module in `AppModule`.
- [ ] Run Prisma format/validation and create the migration.

### Task 3: E2E And Documentation

**Files:**
- Modify: `apps/backend/test/app.e2e-spec.ts`
- Create: `docs/modules/calendar-scheduling.md`
- Modify: `docs/api/api-contract.md`
- Modify: `docs/status/current-status.md`
- Modify: `docs/handover/next-session.md`

- [ ] Add e2e coverage for resource creation, event creation, conflict rejection, RSVP, cancel, my calendar, and company calendar.
- [ ] Update module docs and API contract with routes, enums, filters, and explicit exclusions.
- [ ] Update status and handover notes with completed work and next steps.
- [ ] Run the required verification commands and record the results.
