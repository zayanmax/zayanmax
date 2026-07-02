# Tasks Projects Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add backend-only Tasks & Projects support to the existing NestJS backend.

**Architecture:** Follow the existing `apps/backend` module pattern: Prisma models, Nest controller/service/module files, DTO validation, permission-key guards, company scoping, soft delete, audit logging, and standard response formatting. Keep invoices, payments, approvals, and frontend out of scope.

**Tech Stack:** NestJS, TypeScript, Prisma, PostgreSQL, Jest, Supertest.

---

### Task 1: Tests First

**Files:**
- Create: `apps/backend/src/modules/tasks-projects/tasks-projects.service.spec.ts`
- Modify: `apps/backend/test/app.e2e-spec.ts`

- [ ] Add unit tests for project create/list/member/status/delete behavior.
- [ ] Add unit tests for task create/list/kanban/status/assignment/subtask/comment/attachment/delete behavior.
- [ ] Add e2e test for seeded admin creating a project, adding a member, creating a task, adding task child records, listing kanban tasks, changing status, and deleting records.
- [ ] Run tests and confirm they fail because the module does not exist yet.

### Task 2: Prisma Schema and Migration

**Files:**
- Modify: `apps/backend/prisma/schema.prisma`

- [ ] Add project/task enums for status and priority.
- [ ] Add `Project`, `ProjectMember`, `Task`, `TaskAssignee`, `TaskComment`, and `TaskAttachment` models.
- [ ] Add optional project-client relation.
- [ ] Add user and employee relations for members and assignees.
- [ ] Add indexes for company, project, client, member, assignee, status, priority, date, and parent task lookups.
- [ ] Generate and apply migration locally.

### Task 3: Nest Module

**Files:**
- Create: `apps/backend/src/modules/tasks-projects/dto/*.ts`
- Create: `apps/backend/src/modules/tasks-projects/tasks-projects.service.ts`
- Create: `apps/backend/src/modules/tasks-projects/projects.controller.ts`
- Create: `apps/backend/src/modules/tasks-projects/tasks.controller.ts`
- Create: `apps/backend/src/modules/tasks-projects/tasks-projects.module.ts`
- Modify: `apps/backend/src/app.module.ts`

- [ ] Implement `/api/v1/projects` routes.
- [ ] Implement `/api/v1/tasks` routes.
- [ ] Use `projects.view/create/update/delete` and `tasks.view/create/update/delete` permission keys.
- [ ] Audit create/update/delete/status changes/assignment changes.

### Task 4: Docs and Verification

**Files:**
- Modify: `docs/status/current-status.md`
- Modify: `docs/handover/next-session.md`
- Create: `docs/modules/tasks-projects.md`
- Modify: `docs/api/api-contract.md`

- [ ] Document endpoints, filters, exclusions, migration, permissions, and tests.
- [ ] Run required verification commands.

## Self-Review

- Scope is limited to Tasks & Projects.
- No frontend, invoices, payments, or approvals are included.
- Tests and docs are included in the implementation.
