# Invoices, Billing & Receivables Module

Last updated: 2026-07-02

## Scope Implemented

Backend only. No frontend, PDF generation, messaging, accounting ledger posting, or payment gateway integration was added.

Implemented in `apps/backend/src/modules/invoices-billing-receivables`:

- Invoice series and numbering configuration metadata.
- Invoices with required client relation and optional project, opportunity, quotation, and series relations.
- Invoice items with tax and discount metadata.
- Invoice status flow: draft, issued, partially paid, paid, overdue, cancelled, and written off.
- Quotation-to-invoice conversion foundation.
- Payment receipts.
- Receipt allocation to invoices with paid/balance/status updates.
- Credit note metadata.
- Debit note metadata.
- Outstanding receivables summary.
- Client statement endpoint.
- Invoice aging summary endpoint.
- Search, filters, sorting, and pagination.
- Duplicate invoice-number protection per company.
- Audit logs for invoice create/update/issue/cancel/payment/write-off/credit-note/debit-note actions.

## Permissions

Seeded permission keys:

- `billing.view`
- `billing.manage`

All billing routes require JWT auth and permission-key guards.

## Data Model

Prisma migration:

```text
apps/backend/prisma/migrations/20260613181910_invoices_billing_receivables
```

Primary models:

- `InvoiceSeries`
- `Invoice`
- `InvoiceItem`
- `PaymentReceipt`
- `ReceiptAllocation`
- `CreditNote`
- `DebitNote`

Primary enum:

- `InvoiceStatus`

## API Routes

Base route:

```text
/api/v1/billing
```

Routes:

- `GET /api/v1/billing/invoice-series`
- `POST /api/v1/billing/invoice-series`
- `GET /api/v1/billing/invoices`
- `GET /api/v1/billing/invoices/:id`
- `POST /api/v1/billing/invoices`
- `PATCH /api/v1/billing/invoices/:id`
- `PATCH /api/v1/billing/invoices/:id/issue`
- `PATCH /api/v1/billing/invoices/:id/cancel`
- `PATCH /api/v1/billing/invoices/:id/write-off`
- `POST /api/v1/billing/quotations/:quotationId/convert-to-invoice`
- `GET /api/v1/billing/payment-receipts`
- `POST /api/v1/billing/payment-receipts`
- `POST /api/v1/billing/payment-receipts/:id/allocations`
- `POST /api/v1/billing/credit-notes`
- `POST /api/v1/billing/debit-notes`
- `GET /api/v1/billing/receivables/summary`
- `GET /api/v1/billing/clients/:clientId/statement`
- `GET /api/v1/billing/receivables/aging`

## List Filters

Invoice and series list endpoints support standard pagination and sorting:

- `page`
- `limit`
- `search`
- `sortBy`
- `sortOrder`

Invoice list additionally supports:

- `status`
- `clientId`
- `projectId`
- `opportunityId`

## Duplicate Rules

- Invoice create rejects duplicate `invoiceNumber` inside the same `companyId`.
- Invoice series create rejects duplicate active series name inside the same `companyId`.

## Exclusions

Not implemented yet:

- Frontend screens.
- Invoice PDF generation.
- Email, SMS, WhatsApp, or push sending.
- Full accounting ledger posting.
- Payment gateway integration.
- Bank reconciliation.
- Tax filing or GST return flows.
