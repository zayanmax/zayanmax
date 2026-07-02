# Sales, Leads & Quotations Module

## Scope

Backend-only sales pipeline support has been implemented in `apps/backend/src/modules/sales-leads-quotations`.

Implemented:

- Lead sources.
- Lead stages.
- Leads with status flow: new, contacted, qualified, proposal, negotiation, won, lost, archived.
- Lead activities.
- Lead notes.
- Lead assignment to user and employee.
- Duplicate lead protection by company-scoped email or phone.
- Explicit lead-to-client conversion foundation.
- Opportunity stages.
- Sales opportunities with status flow: open, won, lost, cancelled.
- Quotations.
- Quotation items.
- Quotation status flow: draft, sent, accepted, rejected, expired, cancelled.
- Quotation version metadata.
- Search, filters, sorting, and pagination.
- Permission-key RBAC with `sales.view` and `sales.manage`.
- Audit logs for lead, opportunity, quotation create/update/delete/status/assignment/conversion changes and child metadata creation.

Not implemented:

- Frontend screens.
- Quotation PDF generation.
- Email or WhatsApp sending.
- Invoices.
- Payments.
- Accounting or ledger posting.

## Data Model

Migration:

```text
apps/backend/prisma/migrations/20260613175817_sales_leads_quotations
```

Primary models:

- `LeadSource`
- `LeadStage`
- `SalesLead`
- `LeadActivity`
- `LeadNote`
- `OpportunityStage`
- `SalesOpportunity`
- `Quotation`
- `QuotationItem`
- `QuotationVersion`

Primary enums:

- `LeadStatus`
- `OpportunityStatus`
- `QuotationStatus`

## Permissions

- `sales.view`: read sales records and lists.
- `sales.manage`: create, update, delete, assign, convert, and change sales records.

Existing `leads.*` seed permissions remain available for future finer-grained policy if needed.

## API Routes

All routes use `/api/v1`.

Lead sources and stages:

- `GET /sales/lead-sources`
- `POST /sales/lead-sources`
- `GET /sales/lead-stages`
- `POST /sales/lead-stages`

Leads:

- `GET /sales/leads`
- `POST /sales/leads`
- `PATCH /sales/leads/:id`
- `DELETE /sales/leads/:id`
- `POST /sales/leads/:id/activities`
- `POST /sales/leads/:id/notes`
- `PATCH /sales/leads/:id/assignment`
- `PATCH /sales/leads/:id/status`
- `POST /sales/leads/:id/convert-to-client`

Opportunities:

- `POST /sales/opportunity-stages`
- `GET /sales/opportunities`
- `POST /sales/opportunities`
- `PATCH /sales/opportunities/:id`
- `PATCH /sales/opportunities/:id/status`
- `DELETE /sales/opportunities/:id`

Quotations:

- `GET /sales/quotations`
- `POST /sales/quotations`
- `PATCH /sales/quotations/:id`
- `POST /sales/quotations/:id/versions`
- `PATCH /sales/quotations/:id/status`
- `DELETE /sales/quotations/:id`

## Validation

Latest focused checks during implementation:

- `npm test -- sales-leads-quotations.service.spec.ts --runInBand`: 1 suite, 3 tests passed.
- `npm run test:e2e -- --runInBand`: 1 suite, 15 tests passed.

Full required verification is tracked in `docs/status/current-status.md`.
