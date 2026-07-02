# Frontend API Consumption

Last updated: 2026-07-02

## Base URLs

Backend API base path:

```text
/api/v1
```

Frontend environment variable:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api/v1
```

OpenAPI tooling:

```text
/api/docs-json
```

Swagger UI:

```text
/api/docs
```

## Local Frontend CORS

Backend CORS supports frontend configuration through:

- `FRONTEND_URL`
- `CORS_ORIGINS`

Example:

```env
FRONTEND_URL=http://localhost:5173
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

`CORS_ORIGINS` takes precedence over `FRONTEND_URL`.

## Auth Flow

Login:

```text
POST /api/v1/auth/login
```

Response data includes:

- `accessToken`
- `refreshToken`
- `sessionId`
- `user`

Use the access token as:

```text
Authorization: Bearer <accessToken>
```

Refresh:

```text
POST /api/v1/auth/refresh
```

Send `sessionId` when available so the backend can rotate the matching session metadata.

Current user:

```text
GET /api/v1/auth/me
```

## Standard Response Shape

Success:

```json
{
  "success": true,
  "message": "Request completed successfully",
  "data": {}
}
```

Paginated list:

```json
{
  "success": true,
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 0,
    "totalPages": 0
  }
}
```

Error:

```json
{
  "success": false,
  "message": "Permission denied",
  "errorCode": "FORBIDDEN",
  "details": null
}
```

## Frontend-Ready High-Use Endpoints

Auth:

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/logout-all`

Dashboard:

- `GET /api/v1/dashboard/summary`
- `GET /api/v1/dashboard/hr`
- `GET /api/v1/dashboard/projects-tasks`
- `GET /api/v1/dashboard/crm-sales`
- `GET /api/v1/dashboard/finance`
- `GET /api/v1/dashboard/inventory-assets`
- `GET /api/v1/dashboard/helpdesk`
- `GET /api/v1/dashboard/approvals`
- `GET /api/v1/dashboard/calendar`

Core list/detail:

- `GET /api/v1/employees`
- `GET /api/v1/employees/:id`
- `GET /api/v1/clients`
- `GET /api/v1/clients/:id`
- `GET /api/v1/projects`
- `GET /api/v1/projects/:id`
- `GET /api/v1/tasks`
- `GET /api/v1/tasks/:id`
- `GET /api/v1/billing/invoices`

Communication and notifications:

- `GET /api/v1/announcements`
- `GET /api/v1/announcements/:id`
- `GET /api/v1/announcements/:id/read-receipts`
- `GET /api/v1/notifications`
- `GET /api/v1/notification-templates`
- `GET /api/v1/notification-preferences`
- `GET /api/v1/reminders`

## OpenAPI Generation Notes

`/api/docs-json` includes bearer auth, module tags, standard response/error schemas, and examples for high-use DTOs including auth, dashboard filters, employees, clients, projects, tasks, and invoices.

Frontend code generation should still wrap generated calls with a small API client that handles:

- bearer token injection
- refresh-token retry policy
- standard response unwrapping
- standard error-code handling
- pagination metadata

## Current Frontend Client

The `apps/frontend` foundation implements the wrapper manually in:

```text
apps/frontend/src/lib/api/client.ts
apps/frontend/src/lib/api/endpoints.ts
```

The client stores `accessToken`, `refreshToken`, `sessionId`, and current user metadata in browser storage, retries one failed authorized request through `POST /auth/refresh`, and emits a global unauthorized event when the session cannot be recovered.
