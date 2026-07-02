# Invoices, Billing & Receivables Frontend

Last updated: 2026-07-02

## Scope Implemented

Frontend screens were added under `apps/frontend` for billing metadata workflows only.

Implemented routes:

- `/billing`
- `/billing/invoices`
- `/billing/invoices/new`
- `/billing/invoices/[id]`
- `/billing/invoices/[id]/edit`
- `/billing/receipts`
- `/billing/client-statements`

## Feature Folder

Billing frontend code lives in:

```text
apps/frontend/src/features/billing
```

Files include:

- `api.ts`
- `hooks.ts`
- `schemas.ts`
- `types.ts`
- `utils.ts`
- `billing-overview-page.tsx`
- `invoices-list-page.tsx`
- `invoice-form-page.tsx`
- `invoice-detail-page.tsx`
- `receipts-list-page.tsx`
- `client-statements-page.tsx`

## Permissions

Screens use backend permission keys from `/auth/me`:

- `billing.view` for overview, invoices, invoice detail, receipts, and client statements.
- `billing.manage` for invoice create/edit, invoice status actions, receipt creation, quotation conversion, and credit/debit note metadata creation.

## Implemented UI

### Billing Overview

- Shows receivable totals from `GET /billing/receivables/summary`.
- Shows aging buckets from `GET /billing/receivables/aging`.
- Shows invoice status counts and paid-this-period from fetched invoice metadata.
- Shows overdue or at-risk invoice rows.

### Invoices

- Invoice list includes invoice number, client, project/opportunity/quotation relation, status, issue date, due date, total, paid, balance, and actions.
- Search and filters support backend-supported `search`, `status`, and `clientId`.
- Create form supports client, project, opportunity, quotation, series, dates, metadata, terms/notes, and dynamic line items.
- Edit form is metadata-only because backend `PATCH /billing/invoices/:id` does not accept line item updates.
- Detail page shows summary, client/relation data, items, totals, receipt allocations, credit/debit note metadata, terms, and notes.
- Detail actions support issue, cancel, write-off, payment receipt creation, credit note metadata, and debit note metadata.

### Quotation Conversion

- `/billing/invoices/new` includes a quotation conversion card.
- It uses `POST /billing/quotations/:quotationId/convert-to-invoice`.
- It does not generate PDFs or send messages.

### Receipts

- `/billing/receipts` lists payment receipt metadata and allocations.
- Receipt create supports client, optional invoice allocation, amount, date, payment mode, reference number, and notes.

### Client Statements

- `/billing/client-statements` lets the user select a client.
- It displays invoices, receipts, credit notes, and debit notes as statement rows with a running balance.

## Backend Fit Notes

- The frontend required and backend now exposes `GET /billing/invoices/:id` for direct invoice detail routes.
- The frontend required and backend now exposes `GET /billing/payment-receipts` for receipt list routes.
- Billing date range filters are not currently supported by the billing backend endpoints, so the frontend does not expose date-range filters for billing lists yet.
- Overview invoice counts are based on fetched invoice metadata, not a dedicated aggregate endpoint.
- Credit/debit notes are metadata only.
- Payment receipts and allocations are metadata only.

## Exclusions

Not implemented:

- Invoice PDF generation.
- Quotation or invoice email/WhatsApp sending.
- Payment gateway flow.
- Bank reconciliation.
- Accounting ledger posting.
- Finance expenses, vendor payments, or accounting screens.
- Reports/export screens.
