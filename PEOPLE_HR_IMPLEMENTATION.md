# ZayanMax People & HR implementation audit

**Audit date:** 30 August 2026
**Repository:** `C:\Users\naveenxd\Desktop\ZayanMax`
**Scope:** Attendance, Leave, Payroll, Performance, and Recruitment
**Current outcome:** Attendance is API-backed and complete within the documented v1 scope. Leave, Payroll, Performance, and Recruitment remain audited presenter modules and were not changed in the Attendance implementation.

## 1. Purpose

This file is the implementation handoff for replacing the five presenter-data pages below with authenticated, permission-aware, backend-integrated modules:

| Module | Route | Current frontend | Navigation permission |
| --- | --- | --- | --- |
| Attendance | `/attendance` | Real API-backed Attendance workspace | `attendance.view` |
| Leave | `/leave` | `DemoModulePage module="leave"` | `leaves.view` |
| Payroll | `/payroll` | `DemoModulePage module="payroll"` | `payroll.view` |
| Performance | `/performance` | `DemoModulePage module="performance"` | `performance.view` |
| Recruitment | `/recruitment` | `DemoModulePage module="recruitment"` | `recruitment.view` |

The remaining presenter pages must stay available until each replacement passes its module-specific definition of done. Attendance passed that gate on 30 August 2026; its route was switched and only its presenter configuration was removed.

## 2. Verified baseline

All requested checks passed against the working tree as it existed during this audit.

| Workspace | Command | Result |
| --- | --- | --- |
| Backend | `npm run build` | Passed, exit code 0 |
| Backend | `npm test` | Passed: 23 suites, 109 tests, 0 failures |
| Frontend | `npm run typecheck` | Passed, exit code 0 |
| Frontend | `npm run lint` | Passed, exit code 0 |
| Frontend | `npm run build` | Passed; Next.js production build generated 100 routes |

These results establish the pre-implementation baseline. They do not prove that every backend workflow below is production-safe; the contract gaps in this document still require resolution.

## 3. Existing frontend architecture to preserve

The Employees, Calendar, Finance, Billing, Sales, and Projects features establish the project conventions for real modules.

### 3.1 Feature structure

Create only the files required by the selected module, using this structure as the default:

```text
apps/frontend/src/features/<module>/
  api.ts        # typed apiRequest calls only
  hooks.ts      # query keys, queries, mutations, cache invalidation
  types.ts      # API records, query parameters, payloads, paginated results
  schemas.ts    # Zod form schemas
  utils.ts      # formatting and form-to-payload conversion when needed
  *-list.tsx    # list/dashboard surface
  *-form.tsx    # create/edit surface when supported by the API
  *-detail.tsx  # detail/action surface when supported by the API
```

Do not create empty placeholder files. Do not invent edit or detail pages where the backend has no corresponding contract.

### 3.2 API and query conventions

- Use `apps/frontend/src/lib/api/client.ts`; it already attaches authentication, unwraps `{ success, data, meta }`, and throws `ApiClientError`.
- Express list responses as the existing `PaginatedResult<T>` shape. Backend pagination uses `page`, `limit`, `search`, `sortBy`, `sortOrder`, and optional `status`; `limit` is capped at 100.
- Give every feature a stable root query key with list/detail child keys.
- Invalidate the feature root after create/delete/action mutations. Invalidate or update both detail and list data after record-specific changes.
- Keep page, search, status, and date-range values in explicit component state. Reset `page` to 1 whenever a filter changes.
- Never copy presenter data into a real feature as a fallback. Loading, empty, error, and zero-count states must be genuine states from the API.

### 3.3 Shared UI contracts

Reuse the existing components rather than introducing a parallel design system:

| Concern | Existing component |
| --- | --- |
| Page identity and primary actions | `PageHeader` |
| Bounded sections | `DataCard` |
| Summary metrics | `StatCard` |
| Search and select filters | `SearchFilterBar`, `SelectField` |
| Date filtering | `DateRangeFilter` |
| Records | `DataTable` |
| Pagination | `PaginationControls` |
| State labels | `StatusBadge` |
| Waiting/failure/empty states | `LoadingState`, `ErrorState`, `EmptyState` |
| Authorization | `PermissionGuard` |
| Destructive or consequential actions | `ConfirmDialog` |

Tables must remain horizontally usable on small screens. Forms should use React Hook Form, `zodResolver`, Zod schemas, and `Controller` where a non-native input requires it. Show backend validation errors through the established `ApiClientError` handling.

### 3.4 Permission model

| Module | Read | Employee/self action | Management action |
| --- | --- | --- | --- |
| Attendance | `attendance.view` | None separately defined | `attendance.manage` |
| Leave | `leaves.view` | `leaves.request` | `leaves.approve` |
| Payroll | `payroll.view` | None separately defined | `payroll.manage` |
| Performance | `performance.view` | None separately defined | `performance.manage` |
| Recruitment | `recruitment.view` | None separately defined | `recruitment.manage` |

Apply permissions at both the route/surface level and each action. Hiding a button is not an authorization boundary; the backend guards remain authoritative.

## 4. Cross-cutting backend findings

### 4.1 Confirmed platform behavior

- All controllers require JWT authentication and the permissions guard.
- All service calls receive `user.companyId`, and list/update lookups generally scope the target record by company.
- The global API prefix is `/api/v1`.
- Paginated service results are normalized by the response interceptor and unwrapped by the frontend client.
- Core write flows have service tests, but those tests focus on happy paths, duplicates, missing records, and audit creation rather than all tenant and transition invariants.

### 4.2 Backend work that must be treated as a release gate

1. **Validate every referenced identifier inside the active company.** A company-scoped parent record does not make an arbitrary `employeeId`, `shiftId`, `leaveTypeId`, `cycleId`, `candidateId`, or similar foreign key safe. Each referenced record must be looked up with `companyId` before a write.
2. **Define legal state transitions.** Payroll runs, goals, reviews, jobs, applications, and offers currently accept enum values without enforcing a transition graph. The UI must not become the only transition guard.
3. **Use transactions for multi-record business operations.** Payroll-run generation and candidate-to-employee conversion can leave partial data if a later write fails.
4. **Do not fabricate missing read contracts in the frontend.** Several domains can create records that cannot be listed or opened through an API. Add the backend reads first or deliberately limit the first frontend slice.
5. **Add regression tests for cross-company references and forbidden transitions.** The existing suite does not establish these guarantees.

## 5. Attendance

### 5.1 Readiness assessment

**Status: API BACKED / COMPLETE.** Attendance now provides real records, monthly summary, employee reports, corrections, shifts, holidays, and management actions. The missing correction-list contract and tenant-reference blockers identified by the foundation audit have been resolved.

### 5.2 Endpoints

All paths below are relative to `/api/v1`.

| Method | Path | Permission | Contract/use |
| --- | --- | --- | --- |
| GET | `/attendance` | `attendance.view` | Paginated records; query supports common pagination plus `employeeId`, `shiftId`, `status`, `fromDate`, and `toDate` |
| GET | `/attendance/monthly-summary` | `attendance.view` | Required `year` and `month`, optional `employeeId`; returns total and counts by status |
| GET | `/attendance/employees/:employeeId/report` | `attendance.view` | Optional `fromDate` and `toDate`; returns employee total, status counts, and records |
| POST | `/attendance/check-in` | `attendance.manage` | `employeeId`; optional `shiftId`, `date`, `checkInAt`, `status`, `location`, `notes` |
| POST | `/attendance/check-out` | `attendance.manage` | `employeeId`; optional `date`, `checkOutAt`, `notes` |
| POST | `/attendance/manual` | `attendance.manage` | `employeeId`, `date`, `status`; optional shift, times, location, notes |
| POST | `/attendance/corrections` | `attendance.manage` | Correction request with employee/date/reason and optional record, requested times/status |
| GET | `/attendance/corrections` | `attendance.view` | Paginated correction queue; filters support employee, status, date range, search, and common pagination/sort fields |
| PATCH | `/attendance/corrections/:id/review` | `attendance.manage` | Approve or reject with optional review comment |
| GET | `/shifts` | `attendance.view` | Active company shifts |
| POST | `/shifts` | `attendance.manage` | Create a shift |
| GET | `/holidays` | `attendance.view` | Paginated/searchable holiday list with date filtering |
| POST | `/holidays` | `attendance.manage` | Create a holiday |
| DELETE | `/holidays/:id` | `attendance.manage` | Company-scoped soft deletion |

Statuses are `PRESENT`, `ABSENT`, `LATE`, `HALF_DAY`, `WORK_FROM_HOME`, `HOLIDAY`, and `LEAVE`. Sources are `SELF`, `MANUAL`, `BIOMETRIC`, and `IMPORT`. Correction statuses are `PENDING`, `APPROVED`, and `REJECTED`.

### 5.3 Prisma models

- `Shift`
- `AttendanceRecord`
- `AttendanceCorrectionRequest`
- `Holiday`

### 5.4 Implemented frontend slice

- Typed API contracts, TanStack Query hooks, Zod schemas, form adapters, and display utilities live under `apps/frontend/src/features/attendance/`.
- The overview uses live monthly summary data and provides records, corrections, shifts and holidays, and employee-report tabs.
- Records support employee, shift, status, search, date-range, and server pagination controls with readable reset labels.
- Manual attendance, check-in, check-out, shift creation, holiday creation/deletion, correction submission, and one-time correction review are exposed only under `attendance.manage`.
- Employee and shift selectors use backend data and human-readable identity; no UUID entry is exposed.
- Loading, empty, retryable error, validation, and mutation-error states are explicit.
- The real `/attendance` route is active. The Attendance presenter configuration was removed while other presenter modules were preserved.

### 5.5 Resolved backend gaps

| Previous severity | Gap | Resolution |
| --- | --- | --- |
| Blocker for safe writes | Employee, shift, and linked attendance identifiers were not consistently validated against `companyId` | Company-scoped guards now protect manual/check-in/check-out/correction flows, with cross-company regression tests |
| Blocker for correction review UI | No GET endpoint listed correction requests | Added a company-scoped, paginated and filterable correction list |
| Important | Correction creation could link a record without proving company and employee ownership | Linked records and correction employees are now verified together |
| Important | No record-detail or general update endpoint | The v1 UI remains intentionally list/action-based and does not imply unsupported edit/detail flows |

### 5.6 Backend test coverage

The attendance/leave service spec now covers the existing shift, duplicate-record, check-in/check-out, manual, summary, leave, and holiday behavior plus cross-company employee/shift/record rejection, record/employee correction mismatch, time-order invariants, company-scoped correction listing and filters, approve/reject effects, one-time review, and foreign-company review rejection.

### 5.7 Attendance definition of done

- Real API data powers all visible counts, filters, rows, and actions.
- Read-only users can view but cannot see or invoke management actions.
- Empty, loading, validation, forbidden, and backend-failure states are explicit.
- Pagination and filters produce the backend query contract exactly.
- Cross-company employee/shift/record references are rejected by backend tests.
- Frontend typecheck, lint, and build pass; relevant backend build/tests pass.
- Only then is the route switched and the Attendance presenter entry removed.

### 5.8 Completion evidence and boundaries

- Backend: full unit suite passed with 23 suites and 123 tests; backend build passed; Prisma schema validation passed; PostgreSQL-backed E2E passed with 21 tests.
- Frontend: typecheck, lint, and production build passed; the build generated the real `/attendance` route.
- Seed: realistic records cover present, late, absent, half-day, and work-from-home states plus shifts, holidays, and pending/approved/rejected corrections. Stable identifiers and upserts make repeated demo seeding non-destructive and idempotent.
- Tenant boundary: every new reference lookup and correction list/review remains scoped to the authenticated company.
- Deliberate v1 limits: no biometric-provider integration, import automation, geofencing, or advanced workforce scheduling; correction reviewer display is limited to stored reviewer ID/comment/timestamp because the current Prisma relation does not expose reviewer profile data.

## 6. Leave

### 6.1 Readiness assessment

Leave requests and approvals can support an initial list/create/review UI. Balance visibility and cancellation are contract gaps, so the current API cannot yet support a complete employee leave experience.

### 6.2 Endpoints

| Method | Path | Permission | Contract/use |
| --- | --- | --- | --- |
| GET | `/leaves/types` | `leaves.view` | Company leave types |
| POST | `/leaves/types` | `leaves.approve` | Name/code plus allowance, approval, and paid flags |
| POST | `/leaves/balances` | `leaves.approve` | Upsert employee/type/year balances and usage values |
| GET | `/leaves/requests` | `leaves.view` | Paginated requests; filters include employee, leave type, status, and date range |
| POST | `/leaves/requests` | `leaves.request` | Employee, leave type, from/to dates, days, and optional reason |
| PATCH | `/leaves/requests/:id/review` | `leaves.approve` | `APPROVED` or `REJECTED` with optional review comment |

Request statuses are `PENDING`, `APPROVED`, `REJECTED`, and `CANCELLED`.

### 6.3 Prisma models

- `LeaveType`
- `LeaveBalance`
- `LeaveRequest`

### 6.4 Missing frontend flows

- Request list with employee/type/status/date filters.
- Employee-friendly create form using real employee and leave-type options.
- Approval/rejection queue with a confirmation and optional review comment.
- Leave-type and balance administration for `leaves.approve` users.
- Balance cards and entitlement context before submission.
- Employee cancellation of an eligible request.
- Request detail/history if review metadata must be presented outside the table.

### 6.5 Backend gaps and severity

| Severity | Gap | Required resolution |
| --- | --- | --- |
| Blocker for complete employee UI | No GET leave-balance endpoint | Add company/employee/year-filtered balance reads |
| Blocker for cancellation UI | `CANCELLED` exists but no cancellation endpoint exists | Add an authorized cancel action with legal-state rules and balance rollback semantics |
| Blocker for safe writes | Employee and leave-type references are not consistently company-validated | Add tenant-scoped lookups and regression tests |
| Blocker for correct balances | Date ordering, requested-day calculation, sufficient balance, and non-negative decrement are not fully enforced | Make the service authoritative for days and balance constraints |
| Important | No request detail, leave-type update, or balance history endpoint | Scope v1 accordingly or add contracts before those screens |

### 6.6 Implementation order

1. Add balance read, cancellation, tenant-reference validation, and balance/date tests.
2. Build typed API/hooks for types, balances, requests, create, review, and cancel.
3. Build role-aware employee and approver views from the same feature contracts.
4. Verify real state changes and cache invalidation.
5. Switch `/leave`; then remove only the Leave presenter configuration.

## 7. Payroll

### 7.1 Readiness assessment

Payroll exposes broad read/create contracts and a useful payroll-run detail response, but it is not ready for a production management UI until payroll generation is transactional and state transitions/calculation semantics are hardened.

### 7.2 Endpoints

| Method | Path | Permission | Contract/use |
| --- | --- | --- | --- |
| GET | `/payroll/salary-structures` | `payroll.view` | Paginated salary structures |
| POST | `/payroll/salary-structures` | `payroll.manage` | Create structure and components |
| GET | `/payroll/salary-assignments` | `payroll.view` | Paginated; employee, structure, status filters |
| POST | `/payroll/salary-assignments` | `payroll.manage` | Employee, structure, effective dates, monthly gross |
| GET | `/payroll/advances` | `payroll.view` | Paginated; employee and status filters |
| POST | `/payroll/advances` | `payroll.manage` | Employee, amount, installment amount, optional notes |
| GET | `/payroll/periods` | `payroll.view` | Paginated payroll periods |
| POST | `/payroll/periods` | `payroll.manage` | Name, start/end dates, optional pay date |
| GET | `/payroll/runs` | `payroll.view` | Paginated; period and status filters |
| POST | `/payroll/runs` | `payroll.manage` | Generate a run for a payroll period with optional notes |
| GET | `/payroll/runs/:id` | `payroll.view` | Run detail including employee line items and payslips |
| PATCH | `/payroll/runs/:id` | `payroll.manage` | Update notes only |
| PATCH | `/payroll/runs/:id/status` | `payroll.manage` | Change run status |
| GET | `/payroll/payslips/:employeeId` | `payroll.view` | Paginated employee payslips; optional run filter |

Component types are `EARNING` and `DEDUCTION`; calculation types are `FIXED` and `PERCENTAGE`. Assignment statuses are `ACTIVE` and `INACTIVE`. Advance statuses are `ACTIVE`, `SETTLED`, and `CANCELLED`. Run statuses are `DRAFT`, `PROCESSING`, `APPROVED`, `PAID`, and `CANCELLED`.

### 7.3 Prisma models

- `SalaryStructure`
- `SalaryStructureComponent`
- `EmployeeSalaryAssignment`
- `SalaryAdvance`
- `PayrollPeriod`
- `PayrollRun`
- `PayrollEmployeeLineItem`
- `Payslip`

### 7.4 Missing frontend flows

- Tabbed or grouped list surfaces for periods, runs, structures, assignments, and advances.
- Run creation with a clearly consequential confirmation.
- Run detail with employee line items, totals, exceptions, notes, and payslip links.
- Legal status actions based on backend-provided current state.
- Employee payslip lookup/download metadata experience.
- Creation forms using real employee/structure/period options rather than identifiers.

### 7.5 Backend release blockers

| Severity | Gap | Required resolution |
| --- | --- | --- |
| Critical | Payroll run, line item, and payslip creation is not one transaction | Wrap generation in a database transaction and test rollback on failure |
| Critical | `PERCENTAGE` components are represented but calculation treats amounts as fixed values | Implement and test the percentage base/rounding contract or remove the unsupported option |
| Critical | Run status accepts arbitrary transitions | Define transition graph, prerequisites, authorization, idempotency, and immutable states |
| Critical | Advance deductions do not reduce/settle advance balances when payroll is paid | Define posting behavior and perform it transactionally/idempotently |
| Blocker for safe writes | Employee and salary-structure references are not consistently company-validated | Add tenant-scoped reference checks |
| Important | Working days use calendar days rather than schedule/holiday rules | Define business calendar calculation before financial use |
| Important | Period and assignment date ordering is not fully validated | Enforce chronological and overlap rules |
| Important | Structures, assignments, advances, and periods lack detail/update contracts | Limit the first UI to create/list or add explicit lifecycle endpoints |

### 7.6 Existing backend test coverage

The payroll spec covers structure creation, assignments, duplicate-run rejection, attendance-fed run/payslip generation, status audit, and missing runs. Extend it with transaction rollback, percentage calculations, rounding, advances, legal/illegal transitions, period overlap, tenant references, and paid-run immutability.

### 7.7 Implementation order

1. Resolve all critical calculation, transaction, posting, and state-machine blockers.
2. Add tests before allowing frontend mutations to use the hardened contracts.
3. Implement typed list/detail/action hooks and management forms.
4. Present computed values as read-only outputs; never recalculate authoritative payroll totals in the browser.
5. Switch `/payroll`; then remove only the Payroll presenter configuration.

## 8. Performance

### 8.1 Readiness assessment

Cycles, goals, review templates, and reviews have list/create contracts. Several secondary records are create-only, while goals/reviews have unrestricted status actions and references that need tenant validation.

### 8.2 Endpoints

| Method | Path | Permission | Contract/use |
| --- | --- | --- | --- |
| GET / POST | `/performance/cycles` | view / manage | Paginated cycle list and cycle creation |
| GET / POST | `/performance/goals` | view / manage | Paginated/filterable goals and goal creation |
| POST | `/performance/goals/:id/progress` | `performance.manage` | Set 0–100 progress with optional comment |
| PATCH | `/performance/goals/:id/status` | `performance.manage` | Change goal status |
| POST | `/performance/kpi-categories` | `performance.manage` | Create KPI category |
| POST | `/performance/kpis` | `performance.manage` | Create employee KPI record |
| GET / POST | `/performance/review-templates` | view / manage | Paginated templates and nested-question creation |
| GET / POST | `/performance/reviews` | view / manage | Paginated/filterable reviews and review creation |
| PATCH | `/performance/reviews/:id/status` | `performance.manage` | Change review status |
| POST | `/performance/reviews/:id/responses` | `performance.manage` | Add question response/score |
| POST | `/performance/feedback` | `performance.manage` | Create feedback |
| POST | `/performance/one-on-ones` | `performance.manage` | Create meeting note |
| POST | `/performance/promotion-recommendations` | `performance.manage` | Create recommendation |
| GET | `/performance/employees/:employeeId/summary` | `performance.view` | Employee performance summary |
| GET | `/performance/managers/:managerEmployeeId/team-summary` | `performance.view` | Manager team summary |

Cycle and goal statuses are `DRAFT`, `ACTIVE`, `COMPLETED`, and `CANCELLED`. Review statuses are `DRAFT`, `SELF_REVIEW`, `MANAGER_REVIEW`, `HR_REVIEW`, `COMPLETED`, and `CANCELLED`.

### 8.3 Prisma models

- `PerformanceCycle`
- `EmployeeGoal`
- `GoalProgressUpdate`
- `KpiCategory`
- `EmployeeKpiRecord`
- `ReviewTemplate`
- `ReviewTemplateQuestion`
- `EmployeeReview`
- `ReviewResponse`
- `FeedbackRecord`
- `OneOnOneMeetingNote`
- `PromotionRecommendation`

### 8.4 Missing frontend flows

- Cycle, goal, template, and review lists with their supported filters.
- Employee summary and manager team-summary dashboards.
- Goal progress and legal status actions.
- Review form generated from template questions with response persistence.
- KPI categories/KPI history, feedback history, one-on-one history, and promotion recommendation history cannot be built completely because read endpoints do not exist.
- Detail pages cannot be built directly because cycle, goal, template, and review detail endpoints do not exist.

### 8.5 Backend gaps and severity

| Severity | Gap | Required resolution |
| --- | --- | --- |
| Blocker for safe writes | Employee, manager, cycle, category, template, reviewer, review, and question references lack consistent company validation | Add company-scoped reference checks and cross-tenant tests |
| Blocker for workflow correctness | Goal and review status transitions are unrestricted | Define legal transitions and terminal-state mutation rules |
| Blocker for secondary history UI | No GET contracts for KPI categories/KPIs, feedback, one-on-ones, or promotions | Add scoped/paginated reads for the intended user roles |
| Important | No detail/update/delete contracts for cycles, goals, templates, or reviews | Decide lifecycle requirements before creating corresponding frontend routes |
| Important | One-on-one and promotion writes do not have the same audit coverage pattern as other sensitive writes | Add consistent audit behavior and tests |

### 8.6 Implementation order

1. Harden tenant references and state transitions.
2. Add the read contracts required by the agreed first product slice.
3. Implement cycles and goals first, then templates/reviews, then supporting histories.
4. Verify manager and employee visibility rules with distinct users.
5. Switch `/performance`; then remove only the Performance presenter configuration.

## 9. Recruitment

### 9.1 Readiness assessment

Jobs, candidates, pipeline stages, and applications have list/create contracts. Interviews, offers, and onboarding are write-only from the controller's perspective, and conversion is a non-transactional multi-record operation. Recruitment requires backend hardening before end-to-end UI conversion.

### 9.2 Endpoints

| Method | Path | Permission | Contract/use |
| --- | --- | --- | --- |
| GET / POST | `/recruitment/jobs` | view / manage | Paginated/filterable openings and creation |
| PATCH | `/recruitment/jobs/:id/status` | `recruitment.manage` | Change job status |
| GET / POST | `/recruitment/candidates` | view / manage | Paginated candidates and creation |
| GET / POST | `/recruitment/pipeline-stages` | view / manage | Paginated stages and creation |
| GET / POST | `/recruitment/applications` | view / manage | Paginated/filterable applications and creation |
| PATCH | `/recruitment/applications/:id/status` | `recruitment.manage` | Change application status and optional rejection/withdrawal reason |
| POST | `/recruitment/applications/:id/convert-to-employee` | `recruitment.manage` | Create employee from application and mark conversion |
| POST | `/recruitment/interviews` | `recruitment.manage` | Create interview round |
| POST | `/recruitment/interviews/:id/feedback` | `recruitment.manage` | Add rating, feedback, and recommendation |
| POST | `/recruitment/offers` | `recruitment.manage` | Create offer letter metadata |
| PATCH | `/recruitment/offers/:id/status` | `recruitment.manage` | Change offer status |
| POST | `/recruitment/onboarding-checklists` | `recruitment.manage` | Create checklist with optional nested items |
| POST | `/recruitment/onboarding-checklists/:id/items` | `recruitment.manage` | Add checklist item |
| PATCH | `/recruitment/onboarding-items/:id/complete` | `recruitment.manage` | Set item completion state and optional completer |

Job statuses are `DRAFT`, `OPEN`, `PAUSED`, `CLOSED`, and `CANCELLED`. Application statuses are `APPLIED`, `SCREENING`, `INTERVIEW`, `OFFERED`, `HIRED`, `REJECTED`, and `WITHDRAWN`. Offer statuses are `DRAFT`, `SENT`, `ACCEPTED`, `DECLINED`, `EXPIRED`, and `CANCELLED`.

### 9.3 Prisma models

- `JobOpening`
- `CandidateProfile`
- `CandidatePipelineStage`
- `CandidateApplication`
- `InterviewRound`
- `InterviewFeedback`
- `OfferLetter`
- `OnboardingChecklist`
- `OnboardingChecklistItem`

### 9.4 Missing frontend flows

- Jobs, candidates, applications, and pipeline-stage lists and creation forms.
- Application pipeline/status view backed by the application list.
- Candidate/application/job detail screens require detail contracts.
- Interview schedule/history, feedback history, offers, and onboarding checklist views require list/detail contracts.
- Candidate conversion requires a guarded form using real organization selectors and a final confirmation.
- Job/candidate/application editing requires update contracts.

### 9.5 Backend release blockers

| Severity | Gap | Required resolution |
| --- | --- | --- |
| Critical | Candidate-to-employee conversion is not transactional | Create employee and update recruitment state in one transaction; test rollback and retry behavior |
| Critical | Conversion invents an `@candidate.local` email when email is absent | Define an explicit nullable/required identity policy; never manufacture a deliverable identity |
| Blocker for safe writes | Branch, department, designation, candidate, job, stage, application, interviewer, offer, checklist, and employee references are not consistently company-validated | Add tenant-scoped reference guards and tests |
| Blocker for workflow correctness | Job, application, and offer transitions are unrestricted | Define transition graphs and action prerequisites |
| Blocker for complete UI | No read endpoints for interviews, offers, or onboarding checklists/items | Add role-scoped list/detail contracts |
| Important | No job, candidate, or application detail/update endpoints | Add contracts or explicitly constrain the first UI |
| Important | Duplicate applications for the same candidate/job are not rejected | Add a service invariant and database constraint where practical |

### 9.6 Existing backend test coverage

The recruitment spec covers duplicate candidates, core create/status flows, interviews, offers, onboarding, and conversion. Extend it with cross-company references, invalid transitions, duplicate applications, conversion rollback/idempotency, email policy, and read-contract coverage.

### 9.7 Implementation order

1. Make conversion transactional and resolve candidate identity policy.
2. Add tenant guards, state machines, duplicate-application protection, and regression tests.
3. Add read/detail contracts for interviews, offers, and onboarding.
4. Implement jobs/candidates/applications, then interviews/offers/onboarding, then conversion.
5. Switch `/recruitment`; then remove only the Recruitment presenter configuration.

## 10. Delivery sequence and boundaries

Recommended sequence:

1. **Attendance** — completed on 30 August 2026; keep it as the reference implementation for the remaining modules.
2. **Leave** — add balance reads/cancellation and enforce balance invariants.
3. **Payroll** — complete financial transaction and calculation hardening before UI activation.
4. **Performance** — establish secondary read contracts and workflow transitions.
5. **Recruitment** — complete conversion transactionality and full pipeline read contracts.

For every module:

1. Preserve the current demo route while backend blockers are addressed.
2. Add or harden backend contracts and tests first when the intended UI cannot be safely supported.
3. Build the real feature using established API, query, form, permission, and shared-component conventions.
4. Validate with users having read-only, management, and no-permission roles as applicable.
5. Run relevant backend tests/build and frontend typecheck/lint/build.
6. Switch only that route to the real feature.
7. Remove only that module's entry from `features/demo-completion/module-config.ts` after confirming no remaining importer needs it.

The following modules are outside this project phase and must not be modified while implementing this plan: Helpdesk, Approvals, Reports, Settings, Company, Users, Roles, Permissions, and Audit Logs.

## 11. Final readiness gate

A People & HR module is complete only when:

- visible information comes from the authenticated backend, not local/demo fixtures;
- all route and action permissions match the seeded backend permissions;
- referenced records are verified inside the active company by the backend;
- legal state transitions and transaction boundaries are enforced server-side;
- supported create/list/detail/update/action flows have typed frontend contracts;
- unsupported flows are not implied by inactive controls or fabricated client behavior;
- loading, empty, error, validation, forbidden, and destructive-action states are handled;
- query invalidation makes successful writes visible without a hard refresh;
- backend and frontend tests/checks pass from a known baseline;
- the route replacement and matching demo-config removal happen last and together.

**Next implementation prompt:** Select exactly one of Leave, Payroll, Performance, or Recruitment and complete its backend safety gates before replacing its presenter route. Attendance requires no remaining implementation work inside its documented v1 scope.
