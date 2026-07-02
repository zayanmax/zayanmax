# Codex Instructions

## Project Goal

Build the backend for Zayan Max, a full-fledged internal office management system.

## Use This Stack

- NestJS
- TypeScript
- PostgreSQL
- Prisma
- Redis
- BullMQ
- JWT authentication
- Role-based permissions

## Initial Backend Tasks

Start backend in this order:

1. Create NestJS project structure.
2. Configure environment validation.
3. Configure Prisma and PostgreSQL.
4. Create base response interceptor and exception filter.
5. Create auth module.
6. Create users, roles, and permissions modules.
7. Create companies, branches, departments, and designations modules.
8. Create employees module.
9. Create audit logs module.
10. Create file/document service abstraction.
11. Create approvals engine.
12. Create clients module.
13. Continue module-by-module based on `backend/modules.md`.

## Must-Follow Rules

- Use `/api/v1` prefix.
- Use DTO validation for all request bodies.
- Use UUID primary keys.
- Scope business data by `companyId`.
- Implement soft delete where applicable.
- Add audit logs for critical actions.
- Do not hardcode role names for permission checks.
- Keep third-party integrations inside `src/integrations`.
- Use queues for emails, WhatsApp, SMS, reports, and reminders.

## Response Format

Every API should return:

```json
{
  "success": true,
  "message": "Done",
  "data": {}
}
```

Errors should return:

```json
{
  "success": false,
  "message": "Something went wrong",
  "errorCode": "ERROR_CODE",
  "details": null
}
```

## First Implementation Milestone

Create the backend foundation with:

- Auth
- Users
- Roles
- Permissions
- Companies
- Branches
- Departments
- Designations
- Employees
- Audit Logs

Even though the product is full-fledged, implement in clean domain modules so all features can be expanded safely.

## Code Quality

- Use strict TypeScript.
- Keep services small and focused.
- Avoid business logic in controllers.
- Use repositories only if they improve readability.
- Keep DTOs separate for create, update, and query.
- Add unit tests for core services.
- Add e2e tests for auth and employee APIs.
