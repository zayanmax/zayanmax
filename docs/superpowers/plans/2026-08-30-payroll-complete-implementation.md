# Payroll Complete Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `/payroll` presenter with an authenticated, tenant-safe, transactionally correct, PostgreSQL-backed Payroll v1 workspace.

**Architecture:** Keep the existing NestJS controller and Prisma models, centralize Decimal-safe calculations in a pure helper, and make run generation plus paid posting atomic. Build a typed Next.js client feature over the existing Axios/TanStack Query stack; authoritative amounts remain backend-owned.

**Tech Stack:** NestJS 11, Prisma 6 Decimal/PostgreSQL, Jest, Next.js 16 App Router, React 19, TanStack Query, Axios, React Hook Form, Zod, shadcn/Radix UI.

**Spec:** `C:\Users\naveenxd\.codex\attachments\716611e9-8296-4f53-b627-0923ed825709\pasted-text.txt`

## Global Constraints

- Payroll only; do not modify Performance or Recruitment.
- Preserve existing unrelated dirty-tree work and do not push.
- `monthlyGross` is the full-period percentage base and the earnings fallback when a structure has no earning component.
- `FIXED` component value is money; `PERCENTAGE` value is a percentage of `monthlyGross`.
- Round every component and aggregate to two decimals using deterministic half-up rounding.
- Working days are inclusive calendar days in v1. Attendance, company holidays, and approved paid/unpaid leave determine payable days; this is documented as a limitation rather than hidden.
- Draft generation never recovers salary advances. Recovery occurs only once inside `APPROVED -> PAID`.
- No PDF, email, WhatsApp, bank-transfer, statutory filing, or accounting-integration claims.

---

### Task 1: Pure Financial Calculation Contract

**Files:**
- Create: `apps/backend/src/modules/payroll/payroll-calculation.ts`
- Create: `apps/backend/src/modules/payroll/payroll-calculation.spec.ts`

**Interfaces:**
- Produces `roundMoney(value)`, `componentFullAmount(monthlyGross, component)`, `prorateMoney(value, payableDays, workingDays)`, and `sumMoney(values)` returning `Prisma.Decimal`.
- Percentage components use `monthlyGross * amount / 100`; fixed components use `amount` directly.

- [ ] Write literal-expectation tests for fixed earnings/deductions, percentage earnings/deductions, fractional percentage rounding, proration, and aggregate rounding.
- [ ] Run `npm test -- payroll-calculation.spec.ts --runInBand` and confirm RED because the helper does not exist.
- [ ] Implement the minimal Decimal helper with two-decimal half-up rounding and zero-safe proration.
- [ ] Re-run the focused spec and require GREEN.

### Task 2: Payroll Reference and Date Invariants

**Files:**
- Modify: `apps/backend/src/modules/payroll/dto/create-salary-structure.dto.ts`
- Modify: `apps/backend/src/modules/payroll/dto/payroll.dto.ts`
- Modify: `apps/backend/src/modules/payroll/payroll.service.ts`
- Modify: `apps/backend/src/modules/payroll/payroll.service.spec.ts`

**Interfaces:**
- Produces company-scoped employee/structure/period validation, component normalization, assignment overlap rejection, period overlap rejection, and payslip employee validation.
- Structure components require unique normalized codes, non-negative fixed values, and percentage values in `[0, 100]`; advances require positive amount/installment with installment not exceeding amount.

- [ ] Add failing tests for foreign employee, structure, advance employee, period/run reference, and payslip employee IDs.
- [ ] Add failing tests for empty/duplicate components, invalid component values, assignment date reversal/overlap, invalid advance amounts, period reversal/pay-date/overlap.
- [ ] Run the payroll service spec and confirm each new case fails for the intended missing invariant.
- [ ] Add DTO boundaries and service-level validation so direct service use is also safe.
- [ ] Re-run the focused service spec until GREEN.

### Task 3: Attendance, Leave, and Line Calculation

**Files:**
- Modify: `apps/backend/src/modules/payroll/payroll.service.ts`
- Modify: `apps/backend/src/modules/payroll/payroll.service.spec.ts`

**Interfaces:**
- `buildLineItem` consumes company attendance, active company holidays, approved leave with `leaveType.paid`, active assignment components, and active advances.
- Produces calendar `workingDays`, payable days, leave days, unpaid/absence effect, component evidence JSON, gross, structure deductions, planned advance deductions, and net pay.

- [ ] Add failing tests for present/late/WFH/half-day/absent, company holiday, paid approved leave, unpaid approved leave, percentage components, advance cap, and `gross - deductions = net`.
- [ ] Run focused tests and confirm RED against the current fixed-only attendance implementation.
- [ ] Implement per-day payable precedence and use the pure Decimal calculation helper.
- [ ] Store structure and advance deduction evidence, including `advanceId`, in existing line-item JSON without schema changes.
- [ ] Re-run focused tests until GREEN.

### Task 4: Atomic Run Generation and State Machine

**Files:**
- Modify: `apps/backend/src/modules/payroll/payroll.service.ts`
- Modify: `apps/backend/src/modules/payroll/payroll.service.spec.ts`

**Interfaces:**
- Run generation writes `PayrollRun`, all line items, all payslips, and audit evidence inside one callback transaction.
- Legal transitions are `DRAFT -> PROCESSING|CANCELLED`, `PROCESSING -> APPROVED|CANCELLED`, and `APPROVED -> PAID`; paid/cancelled runs are terminal.
- Run notes are mutable only in `DRAFT` or `PROCESSING`.

- [ ] Add failing transaction tests proving mid-generation failure leaves no committed run, line item, or payslip.
- [ ] Add table-driven legal/illegal transition tests and immutable-note tests.
- [ ] Implement callback-transaction generation and conditional status updates with audit writes in the same transaction.
- [ ] Re-run focused tests until GREEN.

### Task 5: Transactional Advance Posting and Payslips

**Files:**
- Modify: `apps/backend/src/modules/payroll/payroll.service.ts`
- Modify: `apps/backend/src/modules/payroll/payroll.service.spec.ts`

**Interfaces:**
- `APPROVED -> PAID` reads planned advance deductions from line-item JSON, atomically increments `paidAmount`, decrements `balanceAmount`, settles zero balances, publishes payslip metadata, marks the run paid, and audits the action.
- Repeat paid actions fail before recovery; conditional writes protect concurrent retries.

- [ ] Add failing tests for installment recovery, partial/final settlement, repeat protection, cross-company advance rejection, and paid-posting rollback.
- [ ] Implement recovery and payslip publication in the same Prisma transaction as the run transition.
- [ ] Include payroll line items in payslip reads and validate the requested employee inside the company.
- [ ] Run targeted Payroll tests, then `npm test`, before frontend work.

### Task 6: Typed Payroll Frontend

**Files:**
- Create: `apps/frontend/src/features/payroll/types.ts`
- Create: `apps/frontend/src/features/payroll/api.ts`
- Create: `apps/frontend/src/features/payroll/hooks.ts`
- Create: `apps/frontend/src/features/payroll/schemas.ts`
- Create: `apps/frontend/src/features/payroll/utils.ts`
- Create: `apps/frontend/src/features/payroll/payroll-overview-page.tsx`
- Create: `apps/frontend/src/features/payroll/payroll-runs.tsx`
- Create: `apps/frontend/src/features/payroll/salary-structures.tsx`
- Create: `apps/frontend/src/features/payroll/salary-assignments.tsx`
- Create: `apps/frontend/src/features/payroll/salary-advances.tsx`
- Create: `apps/frontend/src/features/payroll/payroll-periods.tsx`
- Create: `apps/frontend/src/features/payroll/payslips.tsx`

**Interfaces:**
- Produces exact API record/query/payload types without `any`, stable `payrollKeys`, typed calls through `apiRequest`, and invalidation for structures, assignments, advances, periods, runs, detail, and payslips.
- UI tabs expose only supported list/create/detail/status flows and use `payroll.view`/`payroll.manage` guards.

- [ ] Define backend-derived types, Zod schemas, INR/application currency formatting, error normalization, and legal-next-action helpers.
- [ ] Implement API functions and TanStack Query hooks with no second client and no local storage.
- [ ] Build real overview metrics from latest run detail, then structures, assignments, advances, periods, runs/detail, and payslips tabs.
- [ ] Use employee/structure/period selectors, consequential confirmations, loading/error/empty/pagination states, and no fake PDF actions.
- [ ] Run frontend typecheck before route migration and fix all contract mismatches.

### Task 7: Stable Seed, Route Migration, and Documentation

**Files:**
- Modify: `apps/backend/prisma/demo-seed.ts`
- Modify: `apps/frontend/src/app/(app)/payroll/page.tsx`
- Modify: `apps/frontend/src/features/demo-completion/module-config.ts`
- Modify: `apps/frontend/src/features/demo-completion/demo-launchpad-page.tsx`
- Modify: `PEOPLE_HR_IMPLEMENTATION.md`

**Interfaces:**
- Seed produces three structures, assignments for the existing employees, active/settled advances, non-overlapping periods, reconciled runs/lines/payslips, and exact cleanup of Payroll E2E artifacts.
- `/payroll` renders `PayrollOverviewPage`; only the Payroll presenter entry is removed and launchpad status becomes API-backed.

- [ ] Add stable-ID/upsert Payroll seed data using the same calculation contract and internally consistent totals.
- [ ] Run the seed twice and compare structures, assignments, advances, periods, runs, lines, and payslip counts.
- [ ] Migrate the route only after backend/frontend checks pass; remove only `payroll` presenter configuration.
- [ ] Search for `module="payroll"`, Payroll presenter storage, fake totals, and Payroll feature local storage.
- [ ] Replace the Payroll audit section with the exact v1 rules, contracts, transactions, security, seed evidence, tests, and limitations.

### Task 8: Full Verification and Runtime Reconciliation

**Files:**
- Verify all scoped files without committing Payroll or pushing.

**Interfaces:**
- Produces fresh automated, database, browser, persistence, transaction, and financial reconciliation evidence.

- [ ] Run Prisma validation, targeted Payroll tests, full backend tests, backend build, and relevant PostgreSQL E2E.
- [ ] Run Attendance/Leave targeted tests and load both completed routes as regressions.
- [ ] Run frontend typecheck, lint, and production build.
- [ ] Exercise `/payroll` as Super Admin: list/create contracts, run detail, legal/illegal transitions, paid recovery exactly once, persistence after refresh, payslip metadata, and console health.
- [ ] Reconcile one stored run: line gross/deductions/net sums equal run totals; each line gross minus deductions equals net; percentage and advance evidence match persisted state.
- [ ] Run `git diff --check`, record `59df937`, report honest v1 limitations, and stop before Performance.
