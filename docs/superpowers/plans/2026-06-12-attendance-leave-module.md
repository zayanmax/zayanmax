# Attendance, Leave & Holidays Backend Plan

## Scope

Build the backend-only Attendance, Leave & Holidays module using the existing NestJS, Prisma, RBAC, company scoping, audit logging, validation, and testing patterns.

## Data Model

- Add attendance enums for attendance status, attendance source, correction status, and leave request status.
- Add shift, attendance record, attendance correction request, leave type, leave balance, leave request, and holiday models.
- Keep records company-scoped and add soft delete columns where operational records may be removed.
- Protect duplicate attendance in service logic by `companyId + employeeId + date`.

## API Surface

- `POST /attendance/check-in`
- `POST /attendance/check-out`
- `POST /attendance/manual`
- `GET /attendance`
- `GET /attendance/monthly-summary`
- `GET /attendance/employees/:employeeId/report`
- `POST /attendance/corrections`
- `PATCH /attendance/corrections/:id/review`
- `GET /shifts`
- `POST /shifts`
- `GET /leaves/types`
- `POST /leaves/types`
- `POST /leaves/balances`
- `GET /leaves/requests`
- `POST /leaves/requests`
- `PATCH /leaves/requests/:id/review`
- `GET /holidays`
- `POST /holidays`
- `DELETE /holidays/:id`

## Tests

- Unit tests for attendance duplicate protection, check-in/check-out, monthly summaries, leave approval, and holiday duplicates.
- E2E coverage for a company-scoped employee through shift, manual attendance, duplicate rejection, correction review, leave request approval, holiday, and monthly summary endpoints.

## Documentation

- Create `docs/modules/attendance-leave.md`.
- Update API contract, current status, and next-session handover after verification.
