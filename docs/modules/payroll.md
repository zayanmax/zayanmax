# Payroll & Salary Module

Last updated: 2026-06-13

## Scope

Implemented backend-only Payroll & Salary foundation.

Included:

- Salary structures.
- Earning and deduction salary components.
- Employee salary assignment.
- Salary advances.
- Payroll periods.
- Payroll run creation.
- Payroll employee line items.
- Basic attendance/leave integration for payable days.
- Payslip generation metadata only.
- Payroll status flow: `DRAFT`, `PROCESSING`, `APPROVED`, `PAID`, `CANCELLED`.
- Search, filters, sorting, and pagination.
- Duplicate payroll protection per company/payroll period.
- Audit logs for salary assignment, salary advance, payroll run create/update/approve/pay/cancel.

Excluded for now:

- Frontend screens.
- Accounting ledger integration.
- PDF payslip generation.
- Bank payment files.
- Statutory tax filing automation.

## Prisma Models

Added in `apps/backend/prisma/schema.prisma`:

- `SalaryStructure`
- `SalaryStructureComponent`
- `EmployeeSalaryAssignment`
- `SalaryAdvance`
- `PayrollPeriod`
- `PayrollRun`
- `PayrollEmployeeLineItem`
- `Payslip`

Added enums:

- `PayrollComponentType`
- `PayrollCalculationType`
- `SalaryAssignmentStatus`
- `SalaryAdvanceStatus`
- `PayrollRunStatus`
- `PayslipStatus`

Migration:

```text
apps/backend/prisma/migrations/20260613072051_payroll_salary
```

## Permissions

Uses existing seeded permissions:

- `payroll.view`
- `payroll.manage`

No role names are hardcoded for access checks.

## Endpoints

Salary structure routes:

- `GET /api/v1/payroll/salary-structures`
- `POST /api/v1/payroll/salary-structures`

Salary assignment routes:

- `GET /api/v1/payroll/salary-assignments`
- `POST /api/v1/payroll/salary-assignments`

Salary advance routes:

- `GET /api/v1/payroll/advances`
- `POST /api/v1/payroll/advances`

Payroll period routes:

- `GET /api/v1/payroll/periods`
- `POST /api/v1/payroll/periods`

Payroll run routes:

- `GET /api/v1/payroll/runs`
- `POST /api/v1/payroll/runs`
- `GET /api/v1/payroll/runs/:id`
- `PATCH /api/v1/payroll/runs/:id`
- `PATCH /api/v1/payroll/runs/:id/status`

Payslip metadata routes:

- `GET /api/v1/payroll/payslips/:employeeId`

## Filters

Salary structure and payroll period lists support:

- `page`
- `limit`
- `search`
- `sortBy`
- `sortOrder`

Salary assignment list supports:

- `page`
- `limit`
- `sortBy`
- `sortOrder`
- `employeeId`
- `salaryStructureId`
- `status`

Salary advance list supports:

- `page`
- `limit`
- `sortBy`
- `sortOrder`
- `employeeId`
- `status`

Payroll run list supports:

- `page`
- `limit`
- `sortBy`
- `sortOrder`
- `payrollPeriodId`
- `status`

Payslip metadata list supports:

- `page`
- `limit`
- `sortBy`
- `sortOrder`
- `payrollRunId`

## Payable Days

Payroll run creation reads attendance records for the payroll period.

Payable day rules:

- `PRESENT`, `LATE`, `WORK_FROM_HOME`, `HOLIDAY`, and `LEAVE` count as 1 payable day.
- `HALF_DAY` counts as 0.5 payable day.
- `ABSENT` counts as 0 payable days and increments absent days.

Payroll line items store working days, payable days, leave days, absent days, gross earnings, salary deductions, advance deduction, net pay, and earning/deduction metadata snapshots.

## Duplicate Rules

- Salary structure create rejects an active duplicate by `companyId + name`.
- Active salary assignment create rejects another active assignment for the same company/employee.
- Payroll period create rejects an active duplicate by `companyId + startDate + endDate`.
- Payroll run create rejects another run for the same `companyId + payrollPeriodId`.

## Audit Logging

Audit actions:

- `payroll.salary_structures.create`
- `payroll.salary_assignments.create`
- `payroll.advances.create`
- `payroll.periods.create`
- `payroll.runs.create`
- `payroll.runs.update`
- `payroll.runs.processing`
- `payroll.runs.approve`
- `payroll.runs.pay`
- `payroll.runs.cancel`

## Tests

Unit tests:

```text
apps/backend/src/modules/payroll/payroll.service.spec.ts
```

E2E coverage:

```text
apps/backend/test/app.e2e-spec.ts
```

The e2e flow logs in the seeded admin, creates an employee, creates a salary structure, assigns salary, creates an advance, creates attendance records, creates a payroll period, runs payroll, verifies duplicate run protection, approves and pays the run, and lists generated payslip metadata.
