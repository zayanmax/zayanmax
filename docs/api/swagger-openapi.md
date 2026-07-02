# Swagger / OpenAPI

Last updated: 2026-07-02

## Endpoints

- Swagger UI: `/api/docs`
- OpenAPI JSON: `/api/docs-json`
- API base path: `/api/v1`

Swagger is configured in `apps/backend/src/common/openapi/swagger.ts` and mounted from `apps/backend/src/main.ts`.

## Auth

Swagger includes a bearer JWT security scheme named `bearer`.

Use a token returned by:

```text
POST /api/v1/auth/login
```

Then authorize in Swagger with:

```text
Bearer <accessToken>
```

## API Grouping

Controllers are tagged by module so frontend consumers can browse by product area:

- Auth
- Health
- Companies, Branches, Departments, Designations
- Users, Roles, Permissions, Audit Logs
- Employees
- Clients / CRM
- Tasks & Projects
- Attendance, Leave & Holidays
- Payroll
- Finance and Vendors
- Purchase, Inventory & Assets
- Documents & Knowledge Base
- Communications & Notifications
- Calendar
- Helpdesk
- Performance
- Recruitment
- Sales
- Billing
- Approvals
- Dashboard & Reports

## Standard Schemas

Swagger registers these reusable schema names:

- `StandardSuccessResponse`
- `StandardErrorResponse`

Success shape:

```json
{
  "success": true,
  "message": "Request completed successfully",
  "data": {}
}
```

Error shape:

```json
{
  "success": false,
  "message": "Validation failed",
  "errorCode": "VALIDATION_ERROR",
  "details": []
}
```

## DTO Examples

Auth DTOs include examples for login, refresh session metadata, password change, and password reset metadata endpoints. Add more DTO examples module-by-module when frontend integration starts and the API payloads need richer inline guidance.
