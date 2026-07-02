# Helpdesk / Internal Tickets Module

Last updated: 2026-06-13

## Scope

Implemented backend-only Helpdesk / Internal Tickets foundation.

Included:

- Ticket categories.
- Ticket subcategories.
- Tickets.
- Ticket status flow: `OPEN`, `IN_PROGRESS`, `WAITING_FOR_EMPLOYEE`, `WAITING_FOR_ADMIN`, `RESOLVED`, `CLOSED`, `CANCELLED`.
- Ticket priorities: `LOW`, `MEDIUM`, `HIGH`, `URGENT`.
- Ticket sources: `EMPLOYEE`, `ADMIN`, `SYSTEM`.
- Ticket assignment to user, employee, and team-name placeholder.
- Ticket comments.
- Ticket internal notes.
- Ticket attachment metadata only.
- SLA metadata fields for first response due, resolution due, and breach flags.
- Entity linking metadata for employee, asset, document, payroll, attendance, leave, finance, purchase, and inventory records.
- My tickets endpoint.
- Department/category queue endpoint.
- Search, filters, sorting, and pagination.
- Audit logs for ticket create/update/status/assignment/comment/note/close and attachment metadata creation.

Excluded for now:

- Frontend screens.
- Real SLA workers.
- Real notification sending.
- File upload/storage.
- Automatic ticket routing.

## Prisma Models

Added in `apps/backend/prisma/schema.prisma`:

- `HelpdeskTicketCategory`
- `HelpdeskTicketSubcategory`
- `HelpdeskTicket`
- `HelpdeskTicketComment`
- `HelpdeskTicketInternalNote`
- `HelpdeskTicketAttachment`

Added enums:

- `HelpdeskTicketStatus`
- `HelpdeskTicketPriority`
- `HelpdeskTicketSource`
- `HelpdeskEntityType`

Migration:

```text
apps/backend/prisma/migrations/20260613140337_helpdesk_tickets
```

Seed permissions already existed:

- `helpdesk.view`
- `helpdesk.manage`

## Permissions

Helpdesk routes use:

- `helpdesk.view`
- `helpdesk.manage`

No role names are hardcoded for access checks.

## Endpoints

Category routes:

- `GET /api/v1/helpdesk/categories`
- `POST /api/v1/helpdesk/categories`

Subcategory routes:

- `GET /api/v1/helpdesk/subcategories`
- `POST /api/v1/helpdesk/categories/:id/subcategories`

Ticket routes:

- `GET /api/v1/helpdesk/tickets`
- `GET /api/v1/helpdesk/tickets/my`
- `GET /api/v1/helpdesk/tickets/queue`
- `POST /api/v1/helpdesk/tickets`
- `PATCH /api/v1/helpdesk/tickets/:id`
- `PATCH /api/v1/helpdesk/tickets/:id/status`
- `PATCH /api/v1/helpdesk/tickets/:id/assignment`
- `DELETE /api/v1/helpdesk/tickets/:id`

Ticket child record routes:

- `POST /api/v1/helpdesk/tickets/:id/comments`
- `POST /api/v1/helpdesk/tickets/:id/internal-notes`
- `POST /api/v1/helpdesk/tickets/:id/attachments`

## Filters

Category list supports:

- `page`
- `limit`
- `search`
- `sortBy`
- `sortOrder`
- `status`
- `departmentId`

Subcategory list supports:

- `page`
- `limit`
- `search`
- `sortBy`
- `sortOrder`
- `status`
- `categoryId`

Ticket, my ticket, and queue lists support:

- `page`
- `limit`
- `search`
- `sortBy`
- `sortOrder`
- `status`
- `priority`
- `source`
- `requesterUserId`
- `requesterEmployeeId`
- `assignedUserId`
- `assignedEmployeeId`
- `assignedTeamName`
- `departmentId`
- `categoryId`
- `subcategoryId`
- `entityType`
- `entityId`

## Ticket Numbers

Ticket numbers are generated as company-scoped `HD-000001` style values using the current company ticket count.

## Audit Logging

Audit actions:

- `helpdesk.categories.create`
- `helpdesk.subcategories.create`
- `helpdesk.tickets.create`
- `helpdesk.tickets.update`
- `helpdesk.tickets.status`
- `helpdesk.tickets.assign`
- `helpdesk.tickets.comment`
- `helpdesk.tickets.note`
- `helpdesk.tickets.attachment`
- `helpdesk.tickets.close`
- `helpdesk.tickets.delete`

## Tests

Unit tests:

```text
apps/backend/src/modules/helpdesk-tickets/helpdesk-tickets.service.spec.ts
```

E2E coverage:

```text
apps/backend/test/app.e2e-spec.ts
```

Covered flows include category creation and duplicate protection, subcategory creation, ticket creation with assignment/SLA/entity metadata, assignment update, comments, internal notes, attachment metadata, status transitions, my tickets, and queue listing.
