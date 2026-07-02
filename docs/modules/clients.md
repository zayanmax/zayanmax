# Clients / CRM Module

Last updated: 2026-06-12

## Scope

Implemented backend-only Clients / CRM foundation.

Included:

- Clients.
- Client contacts.
- Client activities.
- Client notes.
- Client document metadata.
- Client type, status, and owner support.
- Search, filters, sorting, and pagination.
- Duplicate protection by company-scoped email, phone, or name.
- Audit logs for client create, update, delete, status change, and child record creation.

Excluded for now:

- Projects.
- Invoices.
- Payments.
- File upload/storage processing.
- Frontend screens.

## Prisma Models

Added in `apps/backend/prisma/schema.prisma`:

- `Client`
- `ClientContact`
- `ClientActivity`
- `ClientNote`
- `ClientDocument`

Added enums:

- `ClientType`
- `ClientStatus`
- `ClientActivityType`
- `ClientDocumentCategory`

Migration:

```text
apps/backend/prisma/migrations/20260612122445_clients_crm
```

## Permissions

Uses existing seeded permissions:

- `clients.view`
- `clients.create`
- `clients.update`
- `clients.delete`

No role names are hardcoded for access checks.

## Endpoints

Base path:

```text
/api/v1/clients
```

Client routes:

- `GET /api/v1/clients`
- `POST /api/v1/clients`
- `GET /api/v1/clients/:id`
- `PATCH /api/v1/clients/:id`
- `PATCH /api/v1/clients/:id/status`
- `DELETE /api/v1/clients/:id`

Child routes:

- `GET /api/v1/clients/:id/contacts`
- `POST /api/v1/clients/:id/contacts`
- `GET /api/v1/clients/:id/activities`
- `POST /api/v1/clients/:id/activities`
- `GET /api/v1/clients/:id/notes`
- `POST /api/v1/clients/:id/notes`
- `GET /api/v1/clients/:id/documents`
- `POST /api/v1/clients/:id/documents`

## List Filters

`GET /api/v1/clients` supports:

- `page`
- `limit`
- `search`
- `sortBy`
- `sortOrder`
- `status`
- `type`
- `ownerId`

Search checks:

- `name`
- `email`
- `phone`
- `industry`
- `taxNumber`

## Duplicate Protection

On create and update, the service checks active records in the same `companyId` for matches on:

- normalized email, when provided.
- phone, when provided.
- case-insensitive name.

This stays in service logic because email and phone are optional and the intended match rule is broader than a single database unique constraint.

## Audit Logging

Audit actions:

- `clients.create`
- `clients.update`
- `clients.status_change`
- `clients.delete`
- `clients.contacts.create`
- `clients.activities.create`
- `clients.notes.create`
- `clients.documents.create`

## Tests

Unit tests:

```text
apps/backend/src/modules/clients/clients.service.spec.ts
```

E2E coverage:

```text
apps/backend/test/app.e2e-spec.ts
```

The e2e flow logs in the seeded admin, creates a client, checks duplicate rejection, adds contact/note/activity/document metadata, lists clients, changes status, and soft deletes.
