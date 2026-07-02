# Payroll & Salary Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the backend-only Payroll & Salary foundation for salary structures, assignments, advances, payroll periods, payroll runs, payable-day calculation, line items, payslip metadata, and status transitions.

**Architecture:** Add a focused NestJS payroll module under `apps/backend/src/modules/payroll` with DTOs, a controller, and a service. Persist payroll domain records in Prisma with company-scoped models and additive migration SQL, using attendance records only for basic payable-day calculations.

**Tech Stack:** NestJS, TypeScript, Prisma, PostgreSQL, Jest, Supertest.

---

### Task 1: Tests First

**Files:**
- Create: `apps/backend/src/modules/payroll/payroll.service.spec.ts`
- Modify: `apps/backend/test/app.e2e-spec.ts`

- [x] Write unit tests for salary structure creation, salary assignment audit logging, salary advances, duplicate payroll period/run protection, attendance-based payable days, and run approve/pay/cancel audit actions.
- [x] Add E2E coverage for creating an employee, attendance records, salary structure, salary assignment, advance, payroll period, payroll run, status transitions, and payslip metadata lookup.

### Task 2: Prisma Schema

**Files:**
- Modify: `apps/backend/prisma/schema.prisma`
- Create: `apps/backend/prisma/migrations/20260613010000_payroll_salary/migration.sql`

- [ ] Add enums: `PayrollComponentType`, `PayrollCalculationType`, `SalaryAssignmentStatus`, `SalaryAdvanceStatus`, `PayrollRunStatus`, `PayslipStatus`.
- [ ] Add models: `SalaryStructure`, `SalaryStructureComponent`, `EmployeeSalaryAssignment`, `SalaryAdvance`, `PayrollPeriod`, `PayrollRun`, `PayrollEmployeeLineItem`, `Payslip`.
- [ ] Add relations to `Company` and `Employee`.

### Task 3: Payroll Module

**Files:**
- Create module/controller/service/DTOs under `apps/backend/src/modules/payroll`
- Modify: `apps/backend/src/app.module.ts`

- [ ] Add JWT and permission guards with `payroll.view` and `payroll.manage`.
- [ ] Add salary structure, assignment, advance, period, run, status transition, and payslip metadata endpoints.
- [ ] Add duplicate payroll protection per `companyId + payrollPeriodId`.
- [ ] Add audit logs for salary assignment, advance, run create/update/approve/pay/cancel.
- [ ] Keep payslips as metadata only.

### Task 4: Documentation and Verification

**Files:**
- Create: `docs/modules/payroll.md`
- Modify: `docs/api/api-contract.md`
- Modify: `docs/status/current-status.md`
- Modify: `docs/handover/next-session.md`

- [ ] Document routes, permissions, models, duplicate rules, status flow, and exclusions.
- [ ] Run required verification commands from `apps/backend`.
