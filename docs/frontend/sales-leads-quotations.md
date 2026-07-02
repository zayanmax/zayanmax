# Sales, Leads And Quotations Frontend

Last updated: 2026-07-02

## Scope

Implemented frontend screens for Sales, Leads & Quotations.

Included:

- Leads list.
- Lead create and edit forms.
- Lead detail page.
- Lead activity creation and display.
- Lead note creation and display.
- Lead status change action.
- Lead conversion action.
- Lead soft-delete action.
- Opportunities list.
- Opportunity create and edit forms.
- Opportunity detail page.
- Opportunity status change action.
- Opportunity soft-delete action.
- Quotations list.
- Quotation create form with dynamic line items.
- Quotation metadata edit form.
- Quotation detail page.
- Quotation status change action.
- Quotation soft-delete action.

Not implemented in this pass:

- Invoices.
- Billing.
- Payments.
- Finance.
- Reports.
- Quotation PDF generation.
- Email or WhatsApp sending.
- Quotation item editing after create, because the backend update DTO only supports quotation metadata.

## Routes

- `/sales/leads`
- `/sales/leads/new`
- `/sales/leads/[id]`
- `/sales/leads/[id]/edit`
- `/sales/opportunities`
- `/sales/opportunities/new`
- `/sales/opportunities/[id]`
- `/sales/opportunities/[id]/edit`
- `/sales/quotations`
- `/sales/quotations/new`
- `/sales/quotations/[id]`
- `/sales/quotations/[id]/edit`

## Permissions

- `sales.view` for list/detail screens.
- `sales.manage` for create, update, delete, status changes, lead conversion, activities, and notes.

Navigation now exposes Leads, Opportunities, and Quotations as separate Sales entries hidden unless `/auth/me` returns `sales.view`.

## API Coverage

Lead APIs:

- `GET /sales/lead-sources`
- `GET /sales/lead-stages`
- `GET /sales/leads`
- `GET /sales/leads/:id`
- `POST /sales/leads`
- `PATCH /sales/leads/:id`
- `DELETE /sales/leads/:id`
- `POST /sales/leads/:id/activities`
- `POST /sales/leads/:id/notes`
- `PATCH /sales/leads/:id/status`
- `POST /sales/leads/:id/convert-to-client`

Opportunity APIs:

- `GET /sales/opportunities`
- `GET /sales/opportunities/:id`
- `POST /sales/opportunities`
- `PATCH /sales/opportunities/:id`
- `PATCH /sales/opportunities/:id/status`
- `DELETE /sales/opportunities/:id`

Quotation APIs:

- `GET /sales/quotations`
- `GET /sales/quotations/:id`
- `POST /sales/quotations`
- `PATCH /sales/quotations/:id`
- `PATCH /sales/quotations/:id/status`
- `DELETE /sales/quotations/:id`

## Backend Changes

Added read-only detail endpoints needed by direct frontend detail routes:

- `GET /api/v1/sales/leads/:id`
- `GET /api/v1/sales/opportunities/:id`
- `GET /api/v1/sales/quotations/:id`

These endpoints use existing `sales.view` RBAC and company scoping.

## Backend Notes

- Lead activities and notes are created through POST endpoints and displayed from the lead detail response.
- The backend has `POST /sales/opportunity-stages` but does not expose a list endpoint for opportunity stages, so the opportunity form currently uses an optional raw stage ID field.
- The backend quotation update DTO supports metadata only. Line items are created on quotation create and displayed on detail, but not edited in this frontend pass.
- Quotation date range filtering is not exposed by the backend quotation query DTO.
- PDF generation, sending, invoice conversion, payment capture, and accounting posting remain outside this pass.
