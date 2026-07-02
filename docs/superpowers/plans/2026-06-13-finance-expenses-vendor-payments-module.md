# Finance, Expenses & Vendor Payments Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build backend-only finance operations for expenses, vendors, vendor bills/payments, petty cash, payment modes, and a basic finance summary.

**Architecture:** Add a focused NestJS finance module under `apps/backend/src/modules/finance` with DTOs, controller, and service. Persist finance records in Prisma using additive models, company scoping, soft deletes, audit logs, and no accounting ledger side effects.

**Tech Stack:** NestJS, TypeScript, Prisma, PostgreSQL, Jest, Supertest.

---

### Task 1: Tests First

**Files:**
- Create: `apps/backend/src/modules/finance/finance.service.spec.ts`
- Modify: `apps/backend/test/app.e2e-spec.ts`

- [x] Add unit tests for duplicate vendor protection, expense claim creation/status audit, duplicate vendor bill protection, vendor payment audit, petty cash balance update, and dashboard summary.
- [x] Add E2E coverage for category, vendor, duplicate vendor, expense claim, status changes, bill, duplicate bill, payment, petty cash transaction, and dashboard summary.

### Task 2: Prisma Schema

**Files:**
- Modify: `apps/backend/prisma/schema.prisma`
- Create migration via Prisma.

- [ ] Add enums: `ExpenseClaimStatus`, `VendorBillStatus`, `VendorPaymentStatus`, `PaymentMode`, `PettyCashTransactionType`.
- [ ] Add models: `ExpenseCategory`, `ExpenseClaim`, `ExpenseClaimItem`, `ExpenseAttachment`, `Vendor`, `VendorBill`, `VendorBillItem`, `VendorPayment`, `PettyCashAccount`, `PettyCashTransaction`.
- [ ] Add relations to `Company`, `Employee`, and `User` where useful.

### Task 3: Finance Module

**Files:**
- Create module/controller/service/DTOs under `apps/backend/src/modules/finance`
- Modify: `apps/backend/src/app.module.ts`

- [ ] Add JWT and permission guards with `finance.view`, `finance.manage`, `vendors.view`, and `vendors.manage`.
- [ ] Add finance routes for expenses, vendor bills/payments, petty cash, payment modes, and dashboard summary.
- [ ] Add duplicate vendor protection per company email/phone/GSTIN.
- [ ] Add duplicate bill protection per vendor and bill number.
- [ ] Add audit logs for expenses, approvals/rejections, vendor bills, payments, and petty cash transactions.

### Task 4: Documentation and Verification

**Files:**
- Create: `docs/modules/finance-expenses.md`
- Modify: `docs/api/api-contract.md`
- Modify: `docs/status/current-status.md`
- Modify: `docs/handover/next-session.md`

- [ ] Document routes, permissions, models, duplicate rules, status flows, and exclusions.
- [ ] Run required verification commands from `apps/backend`.
