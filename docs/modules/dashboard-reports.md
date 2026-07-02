# Dashboard, Reports & Analytics Module

## Scope Implemented

- Main company dashboard summary endpoint.
- HR dashboard summary for employees, active employees, departments, today attendance, leave requests, and upcoming holidays.
- Project/task dashboard summary for active projects, overdue tasks, task status counts, my tasks, and project progress.
- CRM/sales dashboard summary for clients, active clients, leads by stage, quotations, and recent client activities.
- Finance dashboard summary for expenses, vendor bills, payroll, petty cash, and outstanding receivables.
- Inventory/assets dashboard summary for low stock items, asset assignment status counts, and upcoming maintenance metadata.
- Helpdesk dashboard summary for open tickets, urgent tickets, SLA-breached metadata, and tickets by category/status.
- Approval dashboard summary for my pending approvals, company pending approvals, and recent approval actions.
- Calendar dashboard summary for today events, upcoming meetings, and resource booking status counts.
- Static reports registry with report name, module, description, permission key, and available filter metadata.
- Generic report metadata lookup by report type.
- Export request metadata only, including requested filters, requested format, status, and nullable file placeholders.
- Search, filters, sorting, and pagination for export requests.
- Date range query filters on dashboard/report summary endpoints.

## Permissions

- `dashboard.view`
- `reports.view`
- `reports.export`

These permission keys already exist in the seed data.

## Data Model

Added `ReportExportRequest` with:

- `companyId`
- `requestedByUserId`
- `reportType`
- `requestedFilters`
- `format`: `CSV`, `XLSX`, or `PDF`
- `status`: `PENDING`, `PROCESSING`, `COMPLETED`, or `FAILED`
- nullable file metadata placeholders: `fileName`, `storageKey`, `mimeType`, `fileSize`
- nullable failure metadata
- requested, processing, completed, failed, created, updated, and deleted timestamps

Migration:

```text
apps/backend/prisma/migrations/20260702090000_dashboard_reports_analytics
```

## API Routes

Dashboard routes:

- `GET /api/v1/dashboard/summary`
- `GET /api/v1/dashboard/hr`
- `GET /api/v1/dashboard/projects-tasks`
- `GET /api/v1/dashboard/crm-sales`
- `GET /api/v1/dashboard/finance`
- `GET /api/v1/dashboard/inventory-assets`
- `GET /api/v1/dashboard/helpdesk`
- `GET /api/v1/dashboard/approvals`
- `GET /api/v1/dashboard/calendar`

Report routes:

- `GET /api/v1/reports/registry`
- `GET /api/v1/reports/metadata/:reportType`
- `POST /api/v1/reports/export-requests`
- `GET /api/v1/reports/export-requests`

## Filters

Dashboard summary endpoints support:

- `fromDate`
- `toDate`

Export request list supports:

- `page`
- `limit`
- `search`
- `sortBy`
- `sortOrder`
- `reportType`
- `format`
- `status`
- `fromDate`
- `toDate`

## Export Metadata Behavior

Export request creation records the requested report, filters, format, and `PENDING` status only. File metadata fields remain null until a future export worker/file service exists.

## Exclusions

This module does not generate CSV, XLSX, or PDF files. It does not implement BullMQ workers, real-time dashboard updates, frontend screens, report scheduling, report configuration storage, or file storage integration.

## Tests

- Unit coverage: `apps/backend/src/modules/dashboard-reports/dashboard-reports.service.spec.ts`
- E2E coverage: dashboard summary and report export metadata flow in `apps/backend/test/app.e2e-spec.ts`
