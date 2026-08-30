# Leave Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `/leave` presenter with a complete authenticated, tenant-safe, PostgreSQL-backed Leave Management module without changing Payroll, Performance, or Recruitment.

**Architecture:** Extend the existing `attendance-leave` NestJS module with company-scoped balance reads, authoritative calendar-day calculation, overlap protection, transactional approval/cancellation, and self-service authorization based on `CurrentUser.employeeId`. Add a focused Next.js client feature using the established Axios client, TanStack Query, React Hook Form, Zod, shared tables/cards/dialogs, and backend-owned state.

**Tech Stack:** NestJS 11, Prisma 6, PostgreSQL, Jest, Next.js 16 App Router, React 19, TanStack Query, Axios, React Hook Form, Zod, shadcn/Radix UI.

**Spec:** `C:\Users\naveenxd\.codex\attachments\3b65488f-1b8c-4bc2-9215-fb596472187d\pasted-text.txt`

## Global Constraints

- Preserve Attendance behavior and tests; touch shared Attendance code only where Leave transaction helpers require it.
- Use inclusive calendar days for v1 because the schema has no half-day or workforce-calendar model; reject cross-year requests.
- Normal `leaves.request` users may create/cancel only for `CurrentUser.employeeId`; `leaves.approve` users may act for another company employee.
- A balance-consuming type is an active LeaveType with `annualAllowance > 0`; approval requires a matching balance with enough remaining leave.
- Pending requests may be cancelled; approved requests may be cancelled only before their UTC start date and must restore balance transactionally.
- Do not add fake update/delete controls where no endpoint exists.
- Do not push. Attendance checkpoint `293e8e3` is the only required checkpoint commit; Leave changes remain for final review unless the user separately requests a commit.

---

### Task 1: Backend DTO and Controller Contracts

**Files:**
- Modify: `apps/backend/src/modules/attendance-leave/dto/leave.dto.ts`
- Modify: `apps/backend/src/modules/attendance-leave/leaves.controller.ts`
- Test: `apps/backend/src/modules/attendance-leave/attendance-leave.service.spec.ts`

**Interfaces:**
- Produces: `LeaveBalanceQueryDto`, optional compatibility-only `CreateLeaveRequestDto.days`, `GET /leaves/balances`, and `PATCH /leaves/requests/:id/cancel`.
- Passes: `user.employeeId` and `user.permissions.includes('leaves.approve')` into service reads/writes that enforce self-service scope.

- [ ] Add failing service tests that call the wished-for balance read and cancel methods.
- [ ] Run `npm test -- attendance-leave.service.spec.ts --runInBand` and confirm failures name missing methods/contracts.
- [ ] Add `LeaveBalanceQueryDto` with `employeeId`, `leaveTypeId`, `year`, and repository pagination fields.
- [ ] Make `days` optional so old clients remain valid while the service ignores it.
- [ ] Register authenticated permission-guarded balance GET and cancellation PATCH routes.
- [ ] Re-run targeted tests and keep failures limited to unimplemented service behavior.

### Task 2: Tenant-Safe Balance Administration and Reads

**Files:**
- Modify: `apps/backend/src/modules/attendance-leave/attendance-leave.service.ts`
- Test: `apps/backend/src/modules/attendance-leave/attendance-leave.service.spec.ts`

**Interfaces:**
- Produces: `findLeaveBalances(companyId, actorEmployeeId, canApprove, query)` returning the repository paginated envelope with `employee` and `leaveType` display relations.
- Produces: safe `upsertLeaveBalance` that preserves omitted existing values and enforces `openingBalance + accrued >= used`.

- [ ] Write failing tests for company-only balance reads, filters, computed remaining, cross-company employee/type rejection, negative values, and used greater than allocation.
- [ ] Run the targeted test file and verify each new test fails for the missing guard or read method.
- [ ] Add a company-scoped LeaveType helper parallel to Attendance employee/shift helpers.
- [ ] Implement self/approver scoping and paginated balance reads with related employee/type fields.
- [ ] Harden upsert validation, preservation of omitted fields, and authoritative remaining calculation.
- [ ] Run the targeted tests until green.

### Task 3: Authoritative Request Creation

**Files:**
- Modify: `apps/backend/src/modules/attendance-leave/attendance-leave.service.ts`
- Test: `apps/backend/src/modules/attendance-leave/attendance-leave.service.spec.ts`

**Interfaces:**
- Produces: inclusive `calculateLeaveDays(fromDate, toDate)` behavior, employee/type tenant validation, same-year enforcement, and active-overlap rejection.
- Request creation accepts actor employee/self context and never trusts `dto.days`.

- [ ] Write failing tests for foreign employee/type, non-self normal requester, reversed dates, cross-year dates, literal inclusive day totals, and overlapping PENDING/APPROVED requests.
- [ ] Run the targeted tests and verify RED failures are caused by current unsafe behavior.
- [ ] Implement centralized UTC date normalization and inclusive calendar-day calculation.
- [ ] Add company-scoped references and overlap query (`fromDate <= requestedTo`, `toDate >= requestedFrom`, status in PENDING/APPROVED).
- [ ] Persist only the derived day count and audit the successful request.
- [ ] Run targeted tests until green.

### Task 4: Transactional Review and Cancellation

**Files:**
- Modify: `apps/backend/src/modules/attendance-leave/attendance-leave.service.ts`
- Modify: `apps/backend/src/modules/attendance-leave/leaves.controller.ts`
- Test: `apps/backend/src/modules/attendance-leave/attendance-leave.service.spec.ts`

**Interfaces:**
- Review legal transitions: `PENDING -> APPROVED|REJECTED` only.
- Cancel legal transitions: `PENDING -> CANCELLED`; future `APPROVED -> CANCELLED`; all other states reject.
- Balance rule: allocation is `openingBalance + accrued`, remaining is allocation minus used; approval increments used and cancellation decrements used in one Prisma transaction.

- [ ] Write failing tests for insufficient balance, rejection without balance mutation, repeat review, cancelled review, cross-company review, pending cancel, rejected/repeat cancel, self authorization, future approved rollback, started approved rejection, and transaction wrapper use.
- [ ] Run the targeted test file and verify expected RED behavior.
- [ ] Resolve active LeaveType and matching year balance before approval.
- [ ] Implement `$transaction` updates for approval and approved cancellation, validating non-negative remaining/used values before mutation.
- [ ] Implement pending cancellation, future-date policy, actor authorization, and cancellation audit.
- [ ] Run targeted and full backend unit tests until green.

### Task 5: Typed Leave Client Layer

**Files:**
- Create: `apps/frontend/src/features/leave/types.ts`
- Create: `apps/frontend/src/features/leave/api.ts`
- Create: `apps/frontend/src/features/leave/hooks.ts`
- Create: `apps/frontend/src/features/leave/schemas.ts`
- Create: `apps/frontend/src/features/leave/utils.ts`

**Interfaces:**
- Produces: exact LeaveType, LeaveBalance, LeaveRequest, query, payload, and paginated result types without `any`.
- Produces: `leaveApi` methods for types, balances, requests, review, cancel, and stable `leaveKeys` roots with scoped invalidation.

- [ ] Define backend-derived types, allowing Prisma decimal JSON values as `number | string` only at the API boundary.
- [ ] Implement all API calls through `apiRequest`.
- [ ] Implement parallel-safe query hooks and mutations with request/balance/type invalidation.
- [ ] Add Zod schemas for request, review, type creation, and balance upsert; omit client-authored days.
- [ ] Add UTC/display utilities and backend error normalization.
- [ ] Run frontend typecheck and fix contract mismatches before UI work.

### Task 6: Real Leave Workspace

**Files:**
- Create: `apps/frontend/src/features/leave/leave-overview-page.tsx`
- Create: `apps/frontend/src/features/leave/leave-requests.tsx`
- Create: `apps/frontend/src/features/leave/leave-request-form.tsx`
- Create: `apps/frontend/src/features/leave/leave-approvals.tsx`
- Create: `apps/frontend/src/features/leave/leave-balances.tsx`
- Create: `apps/frontend/src/features/leave/leave-types.tsx`

**Interfaces:**
- Overview consumes active employees, leave types, exact status totals from `limit=1` request queries, and auth `employeeId`/permissions.
- Request, approval, balance, and policy tabs use only query results and backend mutations.

- [ ] Build permission-guarded page header and accurate status cards from response metadata, not visible page rows.
- [ ] Build server-paginated request table with search/employee/type/status/date filters, readable reset, related display names, and eligible cancellation confirmations.
- [ ] Build request dialog with real selectors, derived UX day count, and selected-year balance context.
- [ ] Build approver-only pending queue with approve/reject confirmation and review comment.
- [ ] Build balance list/admin upsert and type list/create surfaces; expose no unsupported edit/delete actions.
- [ ] Wire explicit loading, empty, retryable error, 403, and mutation-error states.
- [ ] Review React code for unnecessary waterfalls, unstable query keys, and effect-derived state.

### Task 7: Seed, Route Migration, and Audit Document

**Files:**
- Modify: `apps/backend/prisma/demo-seed.ts`
- Modify: `apps/frontend/src/app/(app)/leave/page.tsx`
- Modify: `apps/frontend/src/features/demo-completion/module-config.ts`
- Modify: `apps/frontend/src/features/demo-completion/demo-launchpad-page.tsx`
- Modify: `PEOPLE_HR_IMPLEMENTATION.md`

**Interfaces:**
- Seed produces four stable LeaveTypes, current-year balances for meaningful employees, and non-overlapping PENDING/APPROVED/REJECTED/CANCELLED requests with balance usage equal to approved consuming requests.
- `/leave` renders `LeaveOverviewPage`; only the Leave presenter entry is removed.

- [ ] Extend the stable-ID/upsert seed without resets and clean exact Leave E2E fixtures where present.
- [ ] Run demo seed twice and compare Leave counts and balance totals exactly.
- [ ] Switch `/leave`, remove only `leave` presenter configuration, and mark Leave API-backed in the launchpad.
- [ ] Search for `module="leave"`, Leave presenter storage keys, and Leave feature local/session storage usage; require no operational references.
- [ ] Update the People & HR matrix and Leave section with endpoints, rules, security, seed, tests, and true limitations.

### Task 8: Full Verification and Runtime QA

**Files:**
- Verify all modified files; do not create committed QA artifacts.

**Interfaces:**
- Produces final evidence for backend, frontend, PostgreSQL persistence, role actions, and Attendance regression.

- [ ] Run Prisma validation, targeted Attendance/Leave tests, full backend tests, backend build, and PostgreSQL E2E.
- [ ] Run frontend typecheck, lint, and production build.
- [ ] Start PostgreSQL, Redis, backend, and frontend; confirm health endpoints.
- [ ] Use authenticated API smoke calls to create/persist/approve/reject/cancel requests, verify balance consumption/rollback, create a type, and upsert a balance.
- [ ] Use the Browser plugin at `/leave` to verify page identity, nonblank content, summary, each tab, filters, selectors, balance context, refresh persistence, console health, and screenshot evidence.
- [ ] Reload `/attendance` and verify records, summary, corrections, shifts, holidays, and clean console output.
- [ ] Run `git diff --check`, review scoped status, and report checkpoint `293e8e3` plus exact remaining limitations without committing or pushing Leave.
