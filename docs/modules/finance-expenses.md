# Finance, Expenses & Vendor Payments Module

Last updated: 2026-07-02

## Scope

Implemented backend-only Finance, Expenses & Vendor Payments foundation.

Included:

- Expense categories.
- Expense claims.
- Expense claim items.
- Expense attachment metadata only.
- Expense status flow: `DRAFT`, `SUBMITTED`, `APPROVED`, `REJECTED`, `PAID`, `CANCELLED`.
- Vendors.
- Vendor bills.
- Vendor bill items.
- Vendor payments.
- Petty cash accounts.
- Petty cash transactions.
- Payment modes.
- Basic finance dashboard summary endpoint.
- Search, filters, sorting, and pagination.
- Duplicate vendor protection per company email, phone, or GSTIN.
- Duplicate vendor bill protection per vendor and bill number.
- Audit logs for expenses, approvals/rejections, vendor bills, payments, and petty cash transactions.

Excluded for now:

- Frontend screens.
- Full accounting ledger.
- GST filing.
- Purchase orders.
- PDF generation.

## Prisma Models

Added in `apps/backend/prisma/schema.prisma`:

- `ExpenseCategory`
- `ExpenseClaim`
- `ExpenseClaimItem`
- `ExpenseAttachment`
- `Vendor`
- `VendorBill`
- `VendorBillItem`
- `VendorPayment`
- `PettyCashAccount`
- `PettyCashTransaction`

Added enums:

- `ExpenseClaimStatus`
- `VendorBillStatus`
- `VendorPaymentStatus`
- `PaymentMode`
- `PettyCashTransactionType`

Migration:

```text
apps/backend/prisma/migrations/20260613073700_finance_expenses_vendor_payments
```

## Permissions

Uses existing seeded permissions:

- `finance.view`
- `finance.manage`
- `vendors.view`
- `vendors.manage`

No role names are hardcoded for access checks.

## Endpoints

Finance summary and metadata routes:

- `GET /api/v1/finance/dashboard-summary`
- `GET /api/v1/finance/payment-modes`

Expense category routes:

- `GET /api/v1/finance/expense-categories`
- `POST /api/v1/finance/expense-categories`

Expense claim routes:

- `GET /api/v1/finance/expenses`
- `GET /api/v1/finance/expenses/:id`
- `POST /api/v1/finance/expenses`
- `PATCH /api/v1/finance/expenses/:id`
- `PATCH /api/v1/finance/expenses/:id/status`

Vendor routes:

- `GET /api/v1/vendors`
- `GET /api/v1/vendors/:id`
- `POST /api/v1/vendors`
- `PATCH /api/v1/vendors/:id`

Vendor bill routes:

- `GET /api/v1/finance/vendor-bills`
- `GET /api/v1/finance/vendor-bills/:id`
- `POST /api/v1/finance/vendor-bills`
- `PATCH /api/v1/finance/vendor-bills/:id`

Vendor payment routes:

- `GET /api/v1/finance/vendor-payments`
- `POST /api/v1/finance/vendor-payments`

Petty cash routes:

- `GET /api/v1/finance/petty-cash-accounts`
- `POST /api/v1/finance/petty-cash-accounts`
- `GET /api/v1/finance/petty-cash-transactions`
- `POST /api/v1/finance/petty-cash-transactions`

## Filters

Expense categories, vendors, petty cash accounts, and vendor bills support:

- `page`
- `limit`
- `search`
- `sortBy`
- `sortOrder`

Expense claims also support:

- `employeeId`
- `status`
- `fromDate`
- `toDate`

Vendor bills also support:

- `vendorId`
- `status`

Vendor payments also support:

- `vendorId`
- `vendorBillId`
- `status`

Petty cash transactions also support:

- `pettyCashAccountId`
- `type`

## Status Flows

Expense claims:

- `DRAFT`
- `SUBMITTED`
- `APPROVED`
- `REJECTED`
- `PAID`
- `CANCELLED`

Vendor bills:

- `DRAFT`
- `APPROVED`
- `PARTIALLY_PAID`
- `PAID`
- `CANCELLED`

Vendor payments:

- `RECORDED`
- `CANCELLED`

## Duplicate Rules

- Vendor create rejects another active vendor in the same `companyId` with matching normalized email, phone, or normalized GSTIN.
- Vendor bill create rejects another active bill for the same vendor and bill number.
- Expense category create rejects another active category by `companyId + name`.
- Petty cash account create rejects another active account by `companyId + name`.

## Dashboard Summary

`GET /api/v1/finance/dashboard-summary` returns:

- Expense claim count.
- Approved expense amount.
- Paid expense amount.
- Vendor bill outstanding amount.
- Vendor payment recorded amount.
- Petty cash transaction amount.

This is a basic operational summary. It is not a ledger or accounting statement.

## Audit Logging

Audit actions:

- `finance.expense_categories.create`
- `finance.expenses.create`
- `finance.expenses.submit`
- `finance.expenses.approve`
- `finance.expenses.reject`
- `finance.expenses.pay`
- `finance.expenses.cancel`
- `finance.vendors.create`
- `finance.vendor_bills.create`
- `finance.vendor_payments.create`
- `finance.petty_cash_accounts.create`
- `finance.petty_cash_transactions.create`

## Tests

Unit tests:

```text
apps/backend/src/modules/finance/finance.service.spec.ts
```

E2E coverage:

```text
apps/backend/test/app.e2e-spec.ts
```

The e2e flow logs in the seeded admin, creates an employee, creates an expense category, creates a vendor, verifies duplicate vendor protection, creates an expense claim with item and attachment metadata, moves the expense through submitted/approved/paid statuses, creates a vendor bill, verifies duplicate bill protection, records a vendor payment, creates a petty cash account and transaction, and checks the dashboard summary.
