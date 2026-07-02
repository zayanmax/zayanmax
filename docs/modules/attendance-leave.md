# Attendance, Leave & Holidays Module

Last updated: 2026-06-13

## Scope

Implemented backend-only Attendance, Leave & Holidays foundation.

Included:

- Attendance records.
- Check-in and check-out.
- Manual attendance entry.
- Attendance correction requests with local review.
- Attendance statuses: `PRESENT`, `ABSENT`, `LATE`, `HALF_DAY`, `WORK_FROM_HOME`, `HOLIDAY`, `LEAVE`.
- Shift support.
- Leave types.
- Leave balances.
- Leave requests.
- Local leave approval/rejection foundation.
- Holiday calendar.
- Monthly attendance summary.
- Employee attendance report.
- Search, filters, sorting, and pagination.
- Duplicate attendance protection per employee/date within a company.
- Audit logs for attendance changes, correction review, leave requests, leave review, balances, shifts, and holiday changes.

Excluded for now:

- Frontend screens.
- Payroll.
- Generic approval workflow.
- Biometric/device integrations.
- Real document upload/storage.

## Prisma Models

Added in `apps/backend/prisma/schema.prisma`:

- `Shift`
- `AttendanceRecord`
- `AttendanceCorrectionRequest`
- `LeaveType`
- `LeaveBalance`
- `LeaveRequest`
- `Holiday`

Added enums:

- `AttendanceStatus`
- `AttendanceSource`
- `AttendanceCorrectionStatus`
- `LeaveRequestStatus`

Migration:

```text
apps/backend/prisma/migrations/20260613000000_attendance_leave
```

## Permissions

Uses existing seeded permissions:

- `attendance.view`
- `attendance.manage`
- `leaves.view`
- `leaves.request`
- `leaves.approve`

No role names are hardcoded for access checks.

## Endpoints

Shift routes:

- `GET /api/v1/shifts`
- `POST /api/v1/shifts`

Attendance routes:

- `GET /api/v1/attendance`
- `GET /api/v1/attendance/monthly-summary`
- `GET /api/v1/attendance/employees/:employeeId/report`
- `POST /api/v1/attendance/check-in`
- `POST /api/v1/attendance/check-out`
- `POST /api/v1/attendance/manual`
- `POST /api/v1/attendance/corrections`
- `PATCH /api/v1/attendance/corrections/:id/review`

Leave routes:

- `GET /api/v1/leaves/types`
- `POST /api/v1/leaves/types`
- `POST /api/v1/leaves/balances`
- `GET /api/v1/leaves/requests`
- `POST /api/v1/leaves/requests`
- `PATCH /api/v1/leaves/requests/:id/review`

Holiday routes:

- `GET /api/v1/holidays`
- `POST /api/v1/holidays`
- `DELETE /api/v1/holidays/:id`

## Filters

`GET /api/v1/attendance` supports:

- `page`
- `limit`
- `search`
- `sortBy`
- `sortOrder`
- `employeeId`
- `shiftId`
- `status`
- `fromDate`
- `toDate`

`GET /api/v1/attendance/monthly-summary` supports:

- `year`
- `month`
- `employeeId`

`GET /api/v1/attendance/employees/:employeeId/report` supports:

- `fromDate`
- `toDate`

`GET /api/v1/leaves/requests` supports:

- `page`
- `limit`
- `sortBy`
- `sortOrder`
- `employeeId`
- `leaveTypeId`
- `status`
- `fromDate`
- `toDate`

`GET /api/v1/holidays` supports:

- `page`
- `limit`
- `search`
- `sortBy`
- `sortOrder`
- `fromDate`
- `toDate`

## Duplicate Rules

- Manual attendance rejects an existing non-deleted attendance record for the same `companyId`, `employeeId`, and normalized date.
- Check-in rejects when an attendance record for the same employee/date already has `checkInAt`.
- Shift creation rejects a duplicate active shift name within the same company.
- Leave type creation rejects a duplicate active leave code within the same company.
- Holiday creation rejects a duplicate active holiday by company, normalized date, and case-insensitive name.

## Audit Logging

Audit actions:

- `attendance.shifts.create`
- `attendance.manual_create`
- `attendance.check_in`
- `attendance.check_out`
- `attendance.corrections.create`
- `attendance.corrections.review`
- `attendance.holidays.create`
- `attendance.holidays.delete`
- `leaves.types.create`
- `leaves.balances.upsert`
- `leaves.requests.create`
- `leaves.requests.review`

## Tests

Unit tests:

```text
apps/backend/src/modules/attendance-leave/attendance-leave.service.spec.ts
```

E2E coverage:

```text
apps/backend/test/app.e2e-spec.ts
```

The e2e flow logs in the seeded admin, creates an employee, creates a shift, adds manual attendance, verifies duplicate attendance rejection, checks in/out on another date, creates and approves an attendance correction, creates a leave type and balance, requests and approves leave, creates a holiday, and verifies monthly summary and employee report endpoints.
