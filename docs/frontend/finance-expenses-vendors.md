# Finance, Expenses & Vendor Payments Frontend

Last updated: 2026-07-02

## Scope Implemented

Frontend screens were added under `apps/frontend` for finance metadata workflows only.

Implemented routes:

- `/finance`
- `/finance/expenses`
- `/finance/expenses/new`
- `/finance/expenses/[id]`
- `/finance/expenses/[id]/edit`
- `/finance/expense-categories`
- `/finance/vendors`
- `/finance/vendors/new`
- `/finance/vendors/[id]`
- `/finance/vendors/[id]/edit`
- `/finance/vendor-bills`
- `/finance/vendor-bills/new`
- `/finance/vendor-bills/[id]`
- `/finance/vendor-bills/[id]/edit`
- `/finance/vendor-payments`
- `/finance/petty-cash`
- `/finance/petty-cash/accounts`

## Feature Folder

Finance frontend code lives in:

```text
apps/frontend/src/features/finance
```

Files include API functions, query hooks, schemas, types, helpers, overview/list/detail/form screens, vendor payment UI, and petty cash UI.

## Permissions

Screens use backend permission keys from `/auth/me`:

- `finance.view` for finance overview, expenses, vendor bills, vendor payments, and petty cash read screens.
- `finance.manage` for expense/category/vendor bill/payment/petty cash mutations.
- `vendors.view` for vendor list/detail.
- `vendors.manage` for vendor create/update.

## Implemented UI

- Finance overview using `GET /finance/dashboard-summary`.
- Expense claim list with search, status, category, and date range filters.
- Expense claim create/edit with dynamic expense item rows and attachment metadata rows.
- Expense detail with item table, attachment metadata table, and status actions.
- Expense categories list/create modal. Edit/delete are not shown because backend routes are not available.
- Vendor list, create/edit, and detail profile with related bills/payments.
- Vendor bills list, create/edit with dynamic bill item rows, and detail page with payments.
- Vendor payments list and create modal.
- Petty cash transactions list/create modal and account list/create modal.

## Backend Fit Notes

- Backend now exposes direct detail/update endpoints for expense claims, vendors, and vendor bills so frontend edit/detail routes are stable.
- Vendor payments and petty cash transaction list responses now include relation labels where available.
- Expense categories and petty cash accounts remain list/create only in the UI because backend update/delete routes are not exposed.
- Vendor delete/soft-delete is not shown because backend delete is not exposed.
- Vendor bill status transitions are payment-driven; no standalone status endpoint exists.

## Exclusions

Not implemented:

- Purchase orders.
- Inventory.
- Payroll.
- Accounting ledger.
- GST filing.
- Reports/export.
- Payment gateway flows.
- File upload for expense attachments.
- PDF generation.
