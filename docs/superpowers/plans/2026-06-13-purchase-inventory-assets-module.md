# Purchase, Inventory & Asset Management Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build backend-only purchase requests/orders, goods receiving, inventory stock movement, and asset management foundations.

**Architecture:** Add a focused NestJS module under `apps/backend/src/modules/purchase-inventory-assets` with DTOs, controller, and service. Persist operational records in Prisma using additive models, company scoping, soft deletes, audit logs, and local purchase-request approval only.

**Tech Stack:** NestJS, TypeScript, Prisma, PostgreSQL, Jest, Supertest.

---

### Task 1: Tests First

**Files:**
- Create: `apps/backend/src/modules/purchase-inventory-assets/purchase-inventory-assets.service.spec.ts`
- Modify: `apps/backend/test/app.e2e-spec.ts`

- [x] Add unit tests for duplicate SKU/item codes, duplicate asset tags/serial numbers, purchase request create/status audit, purchase order create, goods received stock movement, stock adjustment, asset assignment, and maintenance audit.
- [x] Add E2E coverage for categories, item, duplicate item, purchase request, approve/order status, purchase order, GRN, stock adjustment, asset category, asset, duplicate asset, assignment, maintenance.

### Task 2: Prisma Schema

**Files:**
- Modify: `apps/backend/prisma/schema.prisma`
- Create migration via Prisma.

- [ ] Add enums for purchase request status, purchase order status, stock movement type, asset status, and asset assignment status.
- [ ] Add models for purchase requests/items, purchase orders/items, goods received notes/items, inventory categories/items, stock movements, asset categories/assets, asset assignments, and asset maintenance records.
- [ ] Add relations to `Company`, `Employee`, and existing `Vendor` where useful.

### Task 3: NestJS Module

**Files:**
- Create module/controller/service/DTOs under `apps/backend/src/modules/purchase-inventory-assets`
- Modify: `apps/backend/src/app.module.ts`

- [ ] Add JWT and permission guards with `purchases.view/manage`, `inventory.view/manage`, and `assets.view/manage`.
- [ ] Add routes under `/purchases`, `/inventory`, and `/assets`.
- [ ] Add duplicate protection for item codes, SKUs, asset tags, and serial numbers.
- [ ] Add audit logs for purchase requests, purchase orders, stock movements, asset assignments, and maintenance.

### Task 4: Documentation and Verification

**Files:**
- Create: `docs/modules/purchase-inventory-assets.md`
- Modify: `docs/api/api-contract.md`
- Modify: `docs/status/current-status.md`
- Modify: `docs/handover/next-session.md`

- [ ] Document routes, permissions, models, status flows, duplicate rules, and exclusions.
- [ ] Run required verification commands from `apps/backend`.
