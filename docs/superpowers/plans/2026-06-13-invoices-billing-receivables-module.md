# Invoices, Billing & Receivables Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the backend-only Invoices, Billing & Receivables module with invoice numbering, invoices/items, quotation conversion, receipts/allocations, credit/debit note metadata, receivable summaries, docs, and tests.

**Architecture:** Follow existing `apps/backend` module patterns: one NestJS module with DTOs, enum DTOs, controller, service, Prisma models, seed permissions, unit tests, and authenticated e2e coverage. Keep records company-scoped and metadata-only for PDFs, messaging, gateways, and ledger posting.

**Tech Stack:** NestJS, TypeScript, Prisma, PostgreSQL, Jest, Supertest, class-validator.

---

### Task 1: Red Test

**Files:**
- Create: `apps/backend/src/modules/invoices-billing-receivables/invoices-billing-receivables.service.spec.ts`

- [x] **Step 1: Write failing unit tests**

Cover duplicate invoice number protection, invoice issue/cancel/write-off audit, quotation-to-invoice conversion, payment receipt allocation, credit/debit notes, receivable summary, statement, and aging.

- [x] **Step 2: Verify red**

Run: `npm test -- invoices-billing-receivables.service.spec.ts --runInBand`
Expected: fail because `invoices-billing-receivables.service` does not exist.

### Task 2: Schema, Permissions, and Module

**Files:**
- Modify: `apps/backend/prisma/schema.prisma`
- Modify: `apps/backend/prisma/seed.ts`
- Modify: `apps/backend/src/app.module.ts`
- Create: `apps/backend/src/modules/invoices-billing-receivables/*`

- [ ] **Step 1: Add Prisma enums and models**

Add invoice series, invoice, invoice item, payment receipt, receipt allocation, credit note, and debit note models with company/client/project/opportunity/quotation relations.

- [ ] **Step 2: Add seed permissions**

Add `billing.view` and `billing.manage`.

- [ ] **Step 3: Implement DTOs, controller, service, and module**

Use permission guards, DTO validation, pagination, company scoping, duplicate invoice number checks, status transitions, receipt allocation, quotation conversion, summaries, statements, and audit logs.

### Task 3: E2E and Docs

**Files:**
- Modify: `apps/backend/test/app.e2e-spec.ts`
- Create: `docs/modules/invoices-billing-receivables.md`
- Modify: `docs/api/api-contract.md`
- Modify: `docs/status/current-status.md`
- Modify: `docs/handover/next-session.md`

- [ ] **Step 1: Add authenticated e2e flow**

Exercise invoice series, invoice create/issue, duplicate invoice number, quotation conversion, receipt allocation, credit note, debit note, receivable summary, client statement, and aging summary.

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
