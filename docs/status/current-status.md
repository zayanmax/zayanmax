# Current Status

Last updated: 2026-07-02

## Repository State

- Backend foundation app now exists at `apps/backend`.
- The top-level `backend/` folder remains documentation/source-of-truth material.
- Frontend foundation now exists at `apps/frontend`.
- This folder was added to make handover and implementation tracking easier.
- This directory is not currently a Git repository.

## Read Documentation

Read and summarized:

- `README.md`
- `codex/codex-instructions.md`
- `architecture/system-architecture.md`
- `architecture/system-design.md`
- `backend/project-structure.md`
- `backend/modules.md`
- `backend/api-structure.md`
- `backend/database-design.md`
- `backend/security-permissions.md`
- `backend/permissions-seed.md`
- `backend/.env.example`
- `frontend/frontend-structure.md`
- `design/design-system.md`
- `integrations/integration-rules.md`
- `integrations/notifications.md`
- `devops/deployment.md`

## Completed Backend Foundation

- Created NestJS backend in `apps/backend`.
- Added TypeScript scripts for build, typecheck, tests, Prisma generate/validate/migrate/seed.
- Added config/env validation with required database, Redis, JWT, and port settings.
- Added global `/api/v1` prefix.
- Added global request validation with DTO whitelist and transform.
- Added standard success response interceptor.
- Added global HTTP exception filter with standard error format.
- Added Helmet, cookie parser, and CORS setup.
- Added Prisma/PostgreSQL schema and initial migration.
- Added Docker Compose for local PostgreSQL and Redis.
- Added local Postgres host port `5434` to avoid a detected existing service on `5432`.
- Added seed script for first company, permission keys, Super Admin role, and local admin user.
- Added JWT auth foundation: login, refresh, logout, and me.
- Added permission decorators and guards using permission keys, not hardcoded role checks.
- Added users, roles, permissions, companies, branches, departments, designations, employees, and audit logs modules.
- Added employee create/list/get/update/delete foundation with company scoping, employee code uniqueness, soft delete, and audit logging.
- Added audit log read endpoint and audit creation helpers.
- Added implementation plan at `docs/superpowers/plans/2026-06-12-backend-foundation.md`.

## Completed Frontend Foundation

- Created Next.js App Router frontend in `apps/frontend`.
- Added React, TypeScript, Tailwind CSS v4, shadcn/ui components, Radix UI packages, Lucide React icons, TanStack Query, React Hook Form, Zod, Axios, and Zustand.
- Added `NEXT_PUBLIC_API_BASE_URL` configuration with `.env.example`.
- Added typed API client with standard backend response unwrapping, standard error mapping, bearer token injection, refresh-token retry, and unauthorized logout handling.
- Added auth state foundation with access token, refresh token, session ID, current user, and permission storage.
- Added auth pages for login, forgot password request, reset password foundation, and protected change password.
- Added protected app shell with sidebar, topbar, profile menu, logout/logout-all actions, breadcrumbs, responsive navigation, loading state, and permission-aware navigation.
- Added dashboard foundation backed by dashboard summary APIs with date range filters and summary cards for employees, attendance, projects/tasks, clients/sales, finance, approvals, helpdesk, calendar, and inventory/assets.
- Added reusable frontend foundations: page header, data card, stat card, data table, status badge, confirm dialog, form field wrapper, search/filter bar, pagination controls, date range filter, loading, empty, error, and permission guard components.
- Did not build module CRUD screens, file upload UI, real notifications, deep charts, or frontend code generation yet.
- Added module documentation at `docs/frontend/frontend-foundation.md`.

## Completed Clients / CRM Module

- Added Clients / CRM module in `apps/backend/src/modules/clients`.
- Added Prisma models for clients, contacts, activities, notes, and document metadata.
- Added CRM enums for client type, client status, activity type, and document category.
- Added migration `apps/backend/prisma/migrations/20260612122445_clients_crm`.
- Added client owner support through optional `ownerId` relation to `User`.
- Added `companyId` scoping for clients and child records.
- Added soft delete for clients, contacts, notes, and document metadata.
- Added duplicate client protection by company-scoped email, phone, or case-insensitive name.
- Added search, filters, sorting, and pagination for client lists.
- Added audit logs for create, update, delete, status changes, and child record additions.
- Added endpoints for client contacts, activities, notes, and document metadata only.
- Did not add projects, invoices, payments, file upload handling, or frontend screens.
- Added module documentation at `docs/modules/clients.md`.
- Added implementation plan at `docs/superpowers/plans/2026-06-12-clients-crm-module.md`.

## Completed Tasks & Projects Module

- Added Tasks & Projects module in `apps/backend/src/modules/tasks-projects`.
- Added Prisma models for projects, project members, tasks, task assignees, task comments, and task attachment metadata.
- Added project/task enums for statuses and priorities.
- Added migration `apps/backend/prisma/migrations/20260612131444_tasks_projects`.
- Added optional project relation to clients.
- Added optional user/employee relations for project members and task assignees.
- Added `companyId` scoping for projects, tasks, and child records.
- Added soft delete for projects, tasks, comments, attachments, members, and assignees where applicable.
- Added search, filters, sorting, and pagination for project/task lists.
- Added kanban-friendly task listing grouped by status.
- Added audit logs for create, update, delete, status changes, member changes, comments, attachments, and assignee changes.
- Did not add frontend, invoices, payments, approvals, or real file upload handling.
- Added module documentation at `docs/modules/tasks-projects.md`.
- Added implementation plan at `docs/superpowers/plans/2026-06-12-tasks-projects-module.md`.

## Completed Attendance, Leave & Holidays Module

- Added Attendance, Leave & Holidays module in `apps/backend/src/modules/attendance-leave`.
- Added Prisma models for shifts, attendance records, attendance correction requests, leave types, leave balances, leave requests, and holidays.
- Added attendance/leave enums for attendance status, attendance source, correction status, and leave request status.
- Added migration `apps/backend/prisma/migrations/20260613000000_attendance_leave`.
- Added `companyId` scoping for shifts, attendance, leave, and holiday records.
- Added soft delete for shifts, attendance records, leave types, leave requests, and holidays where applicable.
- Added duplicate attendance protection by company-scoped employee/date.
- Added duplicate shift, leave type, and holiday protection where sensible.
- Added check-in, check-out, manual attendance, correction request/review, leave request/review, leave balance, shift, holiday, monthly summary, and employee attendance report endpoints.
- Added search, filters, sorting, and pagination for attendance, leave request, and holiday lists.
- Added audit logs for attendance changes, correction reviews, leave requests, leave approvals/rejections, leave balances, shifts, and holiday changes.
- Did not add frontend, payroll, generic approval workflow, biometric integrations, or real file upload handling.
- Added module documentation at `docs/modules/attendance-leave.md`.
- Added implementation plan at `docs/superpowers/plans/2026-06-12-attendance-leave-module.md`.

## Completed Payroll & Salary Module

- Added Payroll & Salary module in `apps/backend/src/modules/payroll`.
- Added Prisma models for salary structures, salary structure components, employee salary assignments, salary advances, payroll periods, payroll runs, payroll employee line items, and payslip metadata.
- Added payroll enums for component type, calculation type, salary assignment status, salary advance status, payroll run status, and payslip status.
- Added migration `apps/backend/prisma/migrations/20260613072051_payroll_salary`.
- Added `companyId` scoping for payroll records.
- Added soft delete for salary structures, salary assignments, salary advances, payroll periods, and payroll runs where applicable.
- Added salary structure creation with earning and deduction components.
- Added employee salary assignment and salary advance endpoints.
- Added payroll period and payroll run creation.
- Added payroll employee line items with basic attendance/leave integration for payable days.
- Added payslip generation metadata only.
- Added payroll run status flow: draft, processing, approved, paid, cancelled.
- Added search, filters, sorting, and pagination.
- Added duplicate payroll protection by company-scoped payroll period.
- Added audit logs for salary assignment, advance, payroll run create/update/approve/pay/cancel.
- Did not add frontend, accounting ledger, PDF payslips, or bank payment files.
- Added module documentation at `docs/modules/payroll.md`.
- Added implementation plan at `docs/superpowers/plans/2026-06-13-payroll-salary-module.md`.

## Completed Finance, Expenses & Vendor Payments Module

- Added Finance module in `apps/backend/src/modules/finance`.
- Added Prisma models for expense categories, expense claims, expense claim items, expense attachment metadata, vendors, vendor bills, vendor bill items, vendor payments, petty cash accounts, and petty cash transactions.
- Added finance enums for expense claim status, vendor bill status, vendor payment status, payment mode, and petty cash transaction type.
- Added migration `apps/backend/prisma/migrations/20260613073700_finance_expenses_vendor_payments`.
- Added `companyId` scoping for finance records.
- Added soft delete for finance records where applicable.
- Added expense category, expense claim, vendor, vendor bill, vendor payment, petty cash account, and petty cash transaction endpoints.
- Added expense status flow: draft, submitted, approved, rejected, paid, cancelled.
- Added vendor bill payment updates for paid amount, balance amount, and paid/partially paid status.
- Added payment modes endpoint and basic finance dashboard summary endpoint.
- Added search, filters, sorting, and pagination.
- Added duplicate vendor protection by company-scoped email, phone, or GSTIN.
- Added duplicate vendor bill protection by vendor and bill number.
- Added audit logs for expenses, approvals/rejections, vendor bills, payments, and petty cash transactions.
- Did not add frontend, accounting ledger, GST filing, purchase invoice posting, or PDF generation.
- Added module documentation at `docs/modules/finance-expenses.md`.
- Added implementation plan at `docs/superpowers/plans/2026-06-13-finance-expenses-vendor-payments-module.md`.

## Completed Purchase, Inventory & Asset Management Module

- Added Purchase, Inventory & Asset Management module in `apps/backend/src/modules/purchase-inventory-assets`.
- Added Prisma models for purchase requests, purchase request items, purchase orders, purchase order items, goods received notes, inventory categories, inventory items, stock movements, asset categories, assets, asset assignments, and asset maintenance records.
- Added purchase/inventory/asset enums for purchase request status, purchase order status, stock movement type, asset status, and asset assignment status.
- Added migration `apps/backend/prisma/migrations/20260613083953_purchase_inventory_assets`.
- Added `companyId` scoping for purchase, inventory, stock, asset assignment, and asset maintenance records.
- Added soft delete fields for primary purchase, inventory, and asset records where applicable.
- Added purchase request endpoints with local submit/approve/reject/order/cancel status changes.
- Added purchase order endpoints with sent/partially received/received/cancelled status support.
- Added goods received note creation with inventory stock movement integration.
- Added inventory category, inventory item, stock movement, and stock adjustment endpoints.
- Added low stock threshold support on inventory items.
- Added asset category, asset, asset assignment, and asset maintenance endpoints.
- Added warranty expiry and serial number fields for assets.
- Added search, filters, sorting, and pagination.
- Added duplicate protection for inventory item codes, SKUs, asset tags, serial numbers, purchase order numbers, and category names where sensible.
- Added audit logs for purchase requests, purchase orders, goods received notes, stock movements, asset assignments, and maintenance.
- Did not add frontend, full approval workflow, accounting ledger posting, invoice posting, or PDF generation.
- Added module documentation at `docs/modules/purchase-inventory-assets.md`.
- Added implementation plan at `docs/superpowers/plans/2026-06-13-purchase-inventory-assets-module.md`.

## Completed Documents, Files & Knowledge Base Module

- Added Documents, Files & Knowledge Base module in `apps/backend/src/modules/documents-knowledge-base`.
- Added Prisma models for document folders, document categories, document tags, document records, document record tags, document versions, document links, knowledge base categories, knowledge base articles, and knowledge base article tags.
- Added document/KB enums for document visibility, document status, linked entity type, and knowledge article status.
- Added migration `apps/backend/prisma/migrations/20260613093710_documents_knowledge_base`.
- Added `companyId` scoping for document and knowledge base records.
- Added soft delete fields for folders, categories, tags, document records, document versions, KB categories, and KB articles where applicable.
- Added folder hierarchy with generated folder paths.
- Added owner user and department visibility metadata.
- Added document entity linking support for employees, clients, projects, tasks, vendors, and assets.
- Added document category, tag, document record, document version metadata, and status endpoints.
- Added document expiry and reminder date fields.
- Added knowledge base category and article endpoints.
- Added article status flow: draft, published, archived.
- Added search, filters, sorting, and pagination.
- Added duplicate protection for folder paths, document titles in folders, categories, and tags where sensible.
- Added audit logs for folder/document/version/article create/update/delete/publish/archive operations.
- Did not add frontend, binary upload/storage, OCR, document preview, public sharing, or full text indexing.
- Added module documentation at `docs/modules/documents-knowledge-base.md`.
- Added implementation plan at `docs/superpowers/plans/2026-06-13-documents-knowledge-base-module.md`.

## Completed Communication, Announcements & Notifications Module

- Added Communication, Announcements & Notifications module in `apps/backend/src/modules/communication-notifications`.
- Added Prisma models for company announcements, announcement audiences, announcement read receipts, notification types, internal notifications, notification deliveries, notification preferences, notification templates, and reminder records.
- Added communication/notification enums for announcement status, audience type, notification category, priority, entity type, delivery channel, delivery status, and reminder status.
- Added migration `apps/backend/prisma/migrations/20260613095226_communication_notifications`.
- Added seed permission keys `communications.view`, `communications.manage`, `notifications.view`, and `notifications.manage`.
- Ran `npm run prisma:seed` after migration so local Super Admin has the new permissions.
- Added `companyId` scoping for communication and notification records.
- Added soft delete fields where applicable.
- Added announcement audience targeting for all company, branch, department, employee, and role.
- Added announcement draft/published/archived status flow and read receipts.
- Added internal notification records with read/unread state.
- Added notification type/category metadata, priority, and entity linking metadata.
- Added delivery channel and delivery status metadata for in-app, email, SMS, WhatsApp, and push channels.
- Added notification preferences per user.
- Added notification template metadata.
- Added reminder records for future scheduled reminders.
- Added search, filters, sorting, and pagination.
- Added audit logs for announcement create/update/publish/archive and notification preference changes.
- Did not add frontend, real provider integrations, BullMQ workers, scheduled execution, or real notification sending.
- Added module documentation at `docs/modules/communication-notifications.md`.
- Added implementation plan at `docs/superpowers/plans/2026-06-13-communication-notifications-module.md`.

## Completed Calendar, Meetings & Scheduling Module

- Added Calendar, Meetings & Scheduling module in `apps/backend/src/modules/calendar-scheduling`.
- Added Prisma models for calendar events, event attendees, meeting/resources, resource bookings, and event reminder metadata.
- Added calendar enums for event type, event status, RSVP status, and linked entity type.
- Added migration `apps/backend/prisma/migrations/20260613134617_calendar_scheduling`.
- Added seed permission keys `calendar.view` and `calendar.manage`.
- Ran `npm run prisma:seed` after migration so local Super Admin has the new permissions.
- Added `companyId` scoping for calendar events, attendees, resources, bookings, and reminders.
- Added soft delete fields for events, attendees, resources, bookings, and reminders where applicable.
- Added event types for meetings, task deadlines, project milestones, holidays, interviews, client meetings, reminders, birthdays, work anniversaries, and custom events.
- Added event status flow: scheduled, completed, cancelled, postponed.
- Added RSVP status flow: pending, accepted, declined, tentative.
- Added resource booking conflict checks for overlapping active bookings on the same resource.
- Added recurring event metadata fields and event reminder metadata fields.
- Added entity linking support for employee, client, project, task, leave, holiday, and document records.
- Added my calendar and company calendar endpoints.
- Added search, filters, sorting, and pagination.
- Added audit logs for event create/update/delete/cancel, attendee RSVP responses, resource creation, and resource booking creation.
- Did not add frontend, Google Calendar integration, real reminder sending, BullMQ workers, provider calls, or recurrence execution.
- Added module documentation at `docs/modules/calendar-scheduling.md`.
- Added implementation plan at `docs/superpowers/plans/2026-06-13-calendar-scheduling-module.md`.

## Completed Helpdesk / Internal Tickets Module

- Added Helpdesk / Internal Tickets module in `apps/backend/src/modules/helpdesk-tickets`.
- Added Prisma models for ticket categories, ticket subcategories, tickets, ticket comments, ticket internal notes, and ticket attachment metadata.
- Added helpdesk enums for ticket status, priority, source, and linked entity type.
- Added migration `apps/backend/prisma/migrations/20260613140337_helpdesk_tickets`.
- Confirmed seed permission keys already exist: `helpdesk.view` and `helpdesk.manage`.
- Ran `npm run prisma:seed` after migration so local Super Admin permissions remain current.
- Added `companyId` scoping for helpdesk categories, subcategories, tickets, comments, notes, and attachments.
- Added soft delete fields for categories, subcategories, tickets, comments, notes, and attachments where applicable.
- Added ticket status flow: open, in progress, waiting for employee, waiting for admin, resolved, closed, cancelled.
- Added ticket priorities: low, medium, high, urgent.
- Added ticket sources: employee, admin, system.
- Added assignment metadata for user, employee, and team-name placeholder.
- Added comments, internal notes, and attachment metadata only.
- Added SLA metadata for first response due, resolution due, and breach flags.
- Added entity linking metadata for employee, asset, document, payroll, attendance, leave, finance, purchase, and inventory.
- Added my tickets and department/category queue endpoints.
- Added search, filters, sorting, and pagination.
- Added audit logs for ticket create/update/status/assignment/comment/note/close/delete and attachment metadata creation.
- Did not add frontend, real SLA workers, real notification sending, file upload/storage, or automatic ticket routing.
- Added module documentation at `docs/modules/helpdesk-tickets.md`.
- Added implementation plan at `docs/superpowers/plans/2026-06-13-helpdesk-tickets-module.md`.

## Completed Performance, Goals & Appraisals Module

- Added Performance, Goals & Appraisals module in `apps/backend/src/modules/performance-appraisals`.
- Added Prisma models for performance cycles, employee goals, goal progress updates, KPI categories, employee KPI records, review templates, review template questions, employee reviews, review responses, feedback records, one-on-one meeting notes, and promotion recommendations.
- Added performance enums for cycle status, goal status, and review status.
- Added migration `apps/backend/prisma/migrations/20260613141926_performance_appraisals`.
- Added seed permission keys `performance.view` and `performance.manage`.
- Ran `npm run prisma:seed` after migration so local Super Admin has the new permissions.
- Added `companyId` scoping for all performance records.
- Added soft delete fields for primary performance records where applicable.
- Added performance cycles, employee goals, goal progress updates, KPI categories, employee KPI records, review templates, review questions, employee reviews, review responses, feedback records, one-on-one note metadata, and promotion recommendation metadata.
- Added goal status flow: draft, active, completed, cancelled.
- Added review status flow: draft, self review, manager review, HR review, completed, cancelled.
- Added employee performance summary endpoint.
- Added manager team performance endpoint based on employee reporting manager relation.
- Added search, filters, sorting, and pagination.
- Added audit logs for goal/review/feedback/status changes and primary create actions.
- Did not add frontend, payroll appraisal increments, calendar meeting creation, notification sending, or automated appraisal workflows.
- Added module documentation at `docs/modules/performance-appraisals.md`.
- Added implementation plan at `docs/superpowers/plans/2026-06-13-performance-appraisals-module.md`.

## Completed Recruitment & Onboarding Module

- Added Recruitment & Onboarding module in `apps/backend/src/modules/recruitment-onboarding`.
- Added Prisma models for job openings, candidate profiles, candidate pipeline stages, candidate applications, interview rounds, interview feedback, offer letter metadata, onboarding checklists, and onboarding checklist items.
- Added recruitment enums for job opening status, application status, and offer status.
- Added migration `apps/backend/prisma/migrations/20260613144836_recruitment_onboarding`.
- Added seed permission keys `recruitment.view` and `recruitment.manage`.
- Ran `npm run prisma:seed` after migration so local Super Admin has the new permissions.
- Added `companyId` scoping for all recruitment and onboarding records.
- Added soft delete fields for primary recruitment records where applicable.
- Added job opening status flow: draft, open, paused, closed, cancelled.
- Added candidate source tracking and duplicate protection by company-scoped email or phone.
- Added candidate pipeline stages and applications.
- Added application status flow: applied, screening, interview, offered, hired, rejected, withdrawn.
- Added interview round metadata and interview feedback.
- Added offer letter metadata only and offer status flow: draft, sent, accepted, declined, expired, cancelled.
- Added onboarding checklists and checklist items.
- Added explicit candidate-to-employee conversion endpoint; employees are not created automatically.
- Added search, filters, sorting, and pagination.
- Added audit logs for job, candidate, application, interview, offer, onboarding, and status-change actions.
- Did not add frontend, PDF offer generation, emails, notifications, or calendar interview event integration.
- Added module documentation at `docs/modules/recruitment-onboarding.md`.
- Added implementation plan at `docs/superpowers/plans/2026-06-13-recruitment-onboarding-module.md`.

## Completed Sales, Leads & Quotations Module

- Added Sales, Leads & Quotations module in `apps/backend/src/modules/sales-leads-quotations`.
- Added Prisma models for lead sources, lead stages, sales leads, lead activities, lead notes, opportunity stages, sales opportunities, quotations, quotation items, and quotation versions.
- Added sales enums for lead status, opportunity status, and quotation status.
- Added migration `apps/backend/prisma/migrations/20260613175817_sales_leads_quotations`.
- Added seed permission keys `sales.view` and `sales.manage`; existing `leads.*` permissions remain available.
- Ran `npm run prisma:seed` after migration so local Super Admin has the new permissions.
- Added `companyId` scoping for all sales records.
- Added soft delete fields for primary sales records where applicable.
- Added lead sources, lead stages, lead activities, and lead notes.
- Added lead status flow: new, contacted, qualified, proposal, negotiation, won, lost, archived.
- Added lead assignment to user and employee.
- Added duplicate lead protection by company-scoped email or phone.
- Added explicit lead-to-client conversion endpoint; clients are not created automatically.
- Added opportunity stages and sales opportunities.
- Added opportunity status flow: open, won, lost, cancelled.
- Added quotations, quotation items, and quotation version metadata.
- Added quotation status flow: draft, sent, accepted, rejected, expired, cancelled.
- Added search, filters, sorting, and pagination.
- Added audit logs for lead/opportunity/quotation create/update/delete/status/assignment/conversion changes and child metadata creation.
- Did not add frontend, quotation PDF generation, email/WhatsApp sending, invoices, payments, or accounting ledger posting.
- Added module documentation at `docs/modules/sales-leads-quotations.md`.
- Added implementation plan at `docs/superpowers/plans/2026-06-13-sales-leads-quotations-module.md`.

## Completed Invoices, Billing & Receivables Module

- Added Invoices, Billing & Receivables module in `apps/backend/src/modules/invoices-billing-receivables`.
- Added Prisma models for invoice series, invoices, invoice items, payment receipts, receipt allocations, credit notes, and debit notes.
- Added invoice enum for status flow: draft, issued, partially paid, paid, overdue, cancelled, and written off.
- Added migration `apps/backend/prisma/migrations/20260613181910_invoices_billing_receivables`.
- Added seed permission keys `billing.view` and `billing.manage`.
- Ran `npm run prisma:seed` after migration so local Super Admin has the new permissions.
- Added `companyId` scoping for all billing and receivable records.
- Added soft delete fields for invoice series, invoices, invoice items, payment receipts, credit notes, and debit notes where applicable.
- Added required client relation for invoices and payment receipts.
- Added optional project, opportunity, quotation, and series relations for invoices.
- Added invoice tax and discount metadata at invoice and item level.
- Added quotation-to-invoice conversion foundation.
- Added payment receipt allocation to invoices with paid amount, balance amount, and paid/partially-paid status updates.
- Added credit note and debit note metadata only.
- Added outstanding receivables summary, client statement, and invoice aging summary endpoints.
- Added search, filters, sorting, and pagination.
- Added duplicate invoice number protection by company.
- Added audit logs for invoice create/update/issue/cancel/payment/write-off/credit-note/debit-note actions.
- Did not add frontend, invoice PDFs, email/WhatsApp sending, full accounting ledger posting, payment gateway integration, or bank files.
- Added module documentation at `docs/modules/invoices-billing-receivables.md`.
- Added implementation plan at `docs/superpowers/plans/2026-06-13-invoices-billing-receivables-module.md`.

## Completed Approvals Workflow Engine Module

- Added Approvals Workflow Engine module in `apps/backend/src/modules/approvals-workflow`.
- Added Prisma models for approval workflow definitions, workflow steps, approval requests, approval step instances, and approval action records.
- Added approval enums for step approver type, linked entity type, request status, step status, and action type.
- Added migration `apps/backend/prisma/migrations/20260614090008_approvals_workflow_engine`.
- Added seed permission key `approvals.manage`; existing `approvals.view` and `approvals.approve` remain seeded.
- Ran `npm run prisma:seed` after migration so local Super Admin has the new permission.
- Added `companyId` scoping for all approval records.
- Added soft delete fields for workflow definitions, workflow steps, and approval requests where applicable.
- Added workflow definition and ordered step APIs.
- Added step approver type metadata for user, employee, role, department head, reporting manager, finance manager, HR manager, and admin.
- Added approval request records with entity linking for leave, attendance correction, expense claim, purchase request, payroll run, vendor bill, invoice, quotation, asset assignment, document, and custom records.
- Added request status flow: draft, pending, approved, rejected, cancelled.
- Added step instance status flow: pending, approved, rejected, skipped.
- Added approval actions/comments.
- Added delegation metadata and escalation metadata only.
- Added my pending approvals endpoint.
- Added approval history endpoint per entity.
- Added search, filters, sorting, and pagination.
- Added audit logs for workflow create/update/delete, request submit, approve, reject, cancel, and delegate actions.
- Did not add frontend, notification sending, real escalation workers, BullMQ jobs, automatic dynamic approver resolution, or refactor existing local approval flows.
- Added module documentation at `docs/modules/approvals-workflow.md`.
- Added implementation plan at `docs/superpowers/plans/2026-06-14-approvals-workflow-engine-module.md`.

## Completed Dashboard, Reports & Analytics Module

- Added Dashboard, Reports & Analytics module in `apps/backend/src/modules/dashboard-reports`.
- Added Prisma model for report export request metadata only.
- Added migration `apps/backend/prisma/migrations/20260702090000_dashboard_reports_analytics`.
- Confirmed permission keys already exist: `dashboard.view`, `reports.view`, and `reports.export`.
- Added main company dashboard summary endpoint.
- Added HR dashboard summary for total employees, active employees, departments, today attendance, leave requests, and upcoming holidays.
- Added project/task dashboard summary for active projects, overdue tasks, task status counts, my tasks, and project progress.
- Added CRM/sales dashboard summary for clients, active clients, leads by stage, quotations, and recent client activities.
- Added finance dashboard summary for expenses, vendor bills, payroll, petty cash, and outstanding receivables.
- Added inventory/assets dashboard summary for low stock items, asset assignment status, and maintenance due metadata.
- Added helpdesk dashboard summary for open tickets, urgent tickets, SLA-breached metadata, and tickets by category/status.
- Added approval dashboard summary for my pending approvals, company pending approvals, and recent approval actions.
- Added calendar dashboard summary for today events, upcoming meetings, and resource booking status counts.
- Added reports registry and generic report metadata endpoint.
- Added export request create/list APIs for metadata only with search, filters, sorting, and pagination.
- Added date range filters for dashboard summary endpoints.
- Added unit and e2e coverage for dashboard summaries and export request metadata.
- Did not add frontend, actual CSV/XLSX/PDF generation, BullMQ workers, real-time dashboard updates, scheduled reports, or file storage integration.
- Added module documentation at `docs/modules/dashboard-reports.md`.
- Added implementation plan at `docs/superpowers/plans/2026-07-02-dashboard-reports-analytics-module.md`.

## Completed Backend Stabilization, API Documentation & Platform Hardening Pass

- Added Swagger/OpenAPI support at `/api/docs` and `/api/docs-json`.
- Added module tags to backend controllers for API discoverability.
- Added bearer JWT support and standard success/error schemas to Swagger.
- Added Health module with `/api/v1/health`, `/api/v1/health/live`, and `/api/v1/health/ready`.
- Added database readiness check through Prisma.
- Added Redis readiness check through TCP connectivity to `REDIS_URL`.
- Added app version/build metadata placeholders through `BUILD_VERSION` and `BUILD_SHA`.
- Added `UserSession` metadata table for refresh-token/session/device tracking foundation.
- Added `PasswordResetToken` metadata table for password reset foundation.
- Added migration `apps/backend/prisma/migrations/20260702103000_platform_hardening_auth_sessions`.
- Updated login to return `sessionId`.
- Updated refresh to accept optional `sessionId` and rotate matching session metadata.
- Added logout-all-sessions endpoint.
- Added password change endpoint with audit logging and session revocation.
- Added password reset request/confirm metadata endpoints without real email/SMS/WhatsApp delivery.
- Verified controller permission usage against seeded permission keys: 64 usages, 69 seeded keys, 0 missing.
- Added e2e coverage for Swagger/health, a denied-access RBAC case, and auth session/password flows.
- Added documentation at `docs/backend/platform-hardening.md`, `docs/api/swagger-openapi.md`, and `docs/security/auth-rbac.md`.
- Updated backend README with local setup, API docs, and verification scripts.

## Local Runtime

Backend folder:

```text
apps/backend
```

Local services:

```bash
docker compose up -d
```

Database URL:

```text
postgresql://zayan:zayan@localhost:5434/zayan_max
```

Seeded local admin:

```text
email: admin@zayan.test
password: Password123
```

## Verification Completed

From `apps/backend`:

- `npm run prisma:generate`
- `npx prisma migrate dev --name init --skip-seed`
- `npm run prisma:seed`
- `npm run prisma:validate`
- `npm test -- --runInBand`
- `npm run test:e2e -- --runInBand`
- `npm run typecheck`
- `npm run build`
- `npm run lint`
- `npm audit --omit=dev`

Result:

- Unit tests passed after foundation: 5 suites, 11 tests.
- E2E tests passed after foundation: 1 suite, 2 tests.
- Typecheck passed.
- Build passed.
- Prisma schema validation passed.
- npm production audit found 0 vulnerabilities after `npm audit fix`.
- Lint exits successfully with warnings in Jest/Supertest typing only.

Latest Clients / CRM verification:

- `npm run prisma:validate`: passed.
- `npm run typecheck`: passed.
- `npm run lint`: passed with warnings only in Jest/Supertest test-harness typing.
- `npm test -- --runInBand`: 6 suites, 18 tests passed.
- `npm run test:e2e -- --runInBand`: 1 suite, 3 tests passed.
- `npm run build`: passed.

Latest Tasks & Projects verification:

- `npm run prisma:validate`: passed.
- `npm run typecheck`: passed.
- `npm run lint`: passed with warnings only in Jest/Supertest test-harness typing.
- `npm test -- --runInBand`: 7 suites, 28 tests passed.
- `npm run test:e2e -- --runInBand`: 1 suite, 4 tests passed.
- `npm run build`: passed.

Latest Attendance, Leave & Holidays verification:

- `npx prisma migrate dev --skip-seed`: applied `20260613000000_attendance_leave`.
- `npm run prisma:seed`: passed.
- `npm run prisma:validate`: passed.
- `npm run typecheck`: passed.
- `npm run lint`: passed with warnings only in Jest/Supertest test-harness typing.
- `npm test -- --runInBand`: 8 suites, 35 tests passed.
- `npm run test:e2e -- --runInBand`: 1 suite, 5 tests passed.
- `npm run build`: passed.

Latest Payroll & Salary verification:

- `npx prisma migrate dev --name payroll_salary --skip-seed`: created and applied `20260613072051_payroll_salary`.
- `npm run prisma:validate`: passed.
- `npm run typecheck`: passed.
- `npm run lint`: passed with warnings only in Jest/Supertest test-harness typing.
- `npm test -- --runInBand`: 9 suites, 41 tests passed.
- `npm run test:e2e -- --runInBand`: 1 suite, 6 tests passed.
- `npm run build`: passed.

Latest Finance, Expenses & Vendor Payments verification:

- `npx prisma migrate dev --name finance_expenses_vendor_payments --skip-seed`: created and applied `20260613073700_finance_expenses_vendor_payments`.
- `npm run prisma:validate`: passed.
- `npm run typecheck`: passed.
- `npm run lint`: passed with warnings only in Jest/Supertest test-harness typing.
- `npm test -- --runInBand`: 10 suites, 48 tests passed.
- `npm run test:e2e -- --runInBand`: 1 suite, 7 tests passed.
- `npm run build`: passed.

Latest Purchase, Inventory & Asset Management verification:

- `npx prisma migrate dev --name purchase_inventory_assets --skip-seed`: created and applied `20260613083953_purchase_inventory_assets`.
- `npm run prisma:validate`: passed.
- `npm run typecheck`: passed.
- `npm run lint`: passed with warnings only in Jest/Supertest test-harness typing.
- `npm test -- --runInBand`: 11 suites, 55 tests passed.
- `npm run test:e2e -- --runInBand`: 1 suite, 8 tests passed.
- `npm run build`: passed.

Latest Documents, Files & Knowledge Base verification:

- `npx prisma migrate dev --name documents_knowledge_base --skip-seed`: created and applied `20260613093710_documents_knowledge_base`.
- Focused red step verified with `npm test -- --runInBand --testPathPatterns documents-knowledge-base`: failed before implementation because the service module did not exist.
- `npm run prisma:validate`: passed.
- `npm run typecheck`: passed.
- `npm run lint`: passed with warnings only in Jest/Supertest test-harness typing.
- `npm test -- --runInBand`: 12 suites, 61 tests passed.
- `npm run test:e2e -- --runInBand`: 1 suite, 9 tests passed.
- `npm run build`: passed.

Latest Communication, Announcements & Notifications verification:

- `npx prisma migrate dev --name communication_notifications --skip-seed`: created and applied `20260613095226_communication_notifications`.
- `npm run prisma:seed`: passed after adding communication and notification permission keys.
- Focused red step verified with `npm test -- --runInBand --testPathPatterns communication-notifications`: failed before implementation because the service module did not exist.
- Focused e2e caught and fixed boolean query parsing for `isRead=false`.
- `npm run prisma:validate`: passed.
- `npm run typecheck`: passed.
- `npm run lint`: passed with warnings only in Jest/Supertest test-harness typing.
- `npm test -- --runInBand`: 13 suites, 67 tests passed.
- `npm run test:e2e -- --runInBand`: 1 suite, 10 tests passed.
- `npm run build`: passed.

Latest Calendar, Meetings & Scheduling verification:

- `npx prisma migrate dev --name calendar_scheduling`: created and applied `20260613134617_calendar_scheduling`.
- `npm run prisma:seed`: passed after adding calendar permission keys.
- Focused red step verified with `npm test -- calendar-scheduling.service.spec.ts --runInBand`: failed before implementation because the service module did not exist.
- Focused service test passed with `npm test -- calendar-scheduling.service.spec.ts --runInBand`: 1 suite, 5 tests passed.
- `npm run prisma:validate`: passed.
- `npm run typecheck`: passed.
- `npm run lint`: passed with warnings only in Jest/Supertest test-harness typing.
- `npm test -- --runInBand`: 14 suites, 73 tests passed.
- `npm run test:e2e -- --runInBand`: 1 suite, 11 tests passed.
- `npm run build`: passed.

Latest Helpdesk / Internal Tickets verification:

- `npx prisma migrate dev --name helpdesk_tickets`: created and applied `20260613140337_helpdesk_tickets`.
- `npm run prisma:seed`: passed after confirming helpdesk permission keys already existed.
- Focused red step verified with `npm test -- helpdesk-tickets.service.spec.ts --runInBand`: failed before implementation because the service module did not exist.
- Focused service test passed with `npm test -- helpdesk-tickets.service.spec.ts --runInBand`: 1 suite, 5 tests passed.
- `npm run prisma:validate`: passed.
- `npm run typecheck`: passed.
- `npm run lint`: passed with warnings only in Jest/Supertest test-harness typing.
- `npm test -- --runInBand`: 15 suites, 78 tests passed.
- `npm run test:e2e -- --runInBand`: 1 suite, 12 tests passed.
- `npm run build`: passed.

Latest Performance, Goals & Appraisals verification:

- `npx prisma migrate dev --name performance_appraisals`: created and applied `20260613141926_performance_appraisals`.
- `npm run prisma:seed`: passed after adding performance permission keys.
- Focused red step verified with `npm test -- performance-appraisals.service.spec.ts --runInBand`: failed before implementation because the service module did not exist.
- Focused service test passed with `npm test -- performance-appraisals.service.spec.ts --runInBand`: 1 suite, 5 tests passed.
- Focused e2e passed with `npm run test:e2e -- --runInBand`: 1 suite, 13 tests passed.
- `npm run prisma:validate`: passed.
- `npm run typecheck`: passed.
- `npm run lint`: passed with warnings only in Jest/Supertest test-harness typing.
- `npm test -- --runInBand`: 16 suites, 83 tests passed.
- `npm run test:e2e -- --runInBand`: 1 suite, 13 tests passed.
- `npm run build`: passed.

Latest Recruitment & Onboarding verification:

- `npx prisma migrate dev --name recruitment_onboarding`: created and applied `20260613144836_recruitment_onboarding`.
- `npm run prisma:seed`: passed after adding recruitment permission keys.
- Focused red step verified with `npm test -- recruitment-onboarding.service.spec.ts --runInBand`: failed before implementation because the service module did not exist.
- Focused service test passed with `npm test -- recruitment-onboarding.service.spec.ts --runInBand`: 1 suite, 3 tests passed.
- Focused e2e passed with `npm run test:e2e -- --runInBand`: 1 suite, 14 tests passed.
- `npm run prisma:validate`: passed.
- `npm run typecheck`: passed.
- `npm run lint`: passed with warnings only in Jest/Supertest test-harness typing.
- `npm test -- --runInBand`: 17 suites, 86 tests passed.
- `npm run test:e2e -- --runInBand`: 1 suite, 14 tests passed.
- `npm run build`: passed.

Latest Sales, Leads & Quotations verification:

- `npx prisma migrate dev --name sales_leads_quotations`: created and applied `20260613175817_sales_leads_quotations`.
- `npm run prisma:seed`: passed after adding sales permission keys.
- Focused red step verified with `npm test -- sales-leads-quotations.service.spec.ts --runInBand`: failed before implementation because the service module did not exist.
- Focused service test passed with `npm test -- sales-leads-quotations.service.spec.ts --runInBand`: 1 suite, 3 tests passed.
- Focused e2e passed with `npm run test:e2e -- --runInBand`: 1 suite, 15 tests passed.
- `npm run prisma:validate`: passed.
- `npm run typecheck`: passed.
- `npm run lint`: passed with warnings only in Jest/Supertest test-harness typing.
- `npm test -- --runInBand`: 18 suites, 89 tests passed.
- `npm run test:e2e -- --runInBand`: 1 suite, 15 tests passed.
- `npm run build`: passed.

Latest Invoices, Billing & Receivables verification:

- `npx prisma migrate dev --name invoices_billing_receivables`: created and applied `20260613181910_invoices_billing_receivables`.
- `npm run prisma:seed`: passed after adding billing permission keys.
- Focused red step verified with `npm test -- invoices-billing-receivables.service.spec.ts --runInBand`: failed before implementation because the service module did not exist.
- Focused service test passed with `npm test -- invoices-billing-receivables.service.spec.ts --runInBand`: 1 suite, 3 tests passed.
- Focused e2e passed with `npm run test:e2e -- --runInBand`: 1 suite, 16 tests passed.
- `npm run prisma:validate`: passed.
- `npm run typecheck`: passed.
- `npm run lint`: passed with warnings only in Jest/Supertest test-harness typing.
- `npm test -- --runInBand`: 19 suites, 92 tests passed.
- `npm run test:e2e -- --runInBand`: 1 suite, 16 tests passed.
- `npm run build`: passed.

Latest Approvals Workflow Engine verification:

- `npx prisma migrate dev --name approvals_workflow_engine`: created and applied `20260614090008_approvals_workflow_engine`.
- `npm run prisma:seed`: passed after adding `approvals.manage`.
- Focused red step verified with `npm test -- approvals-workflow.service.spec.ts --runInBand`: failed before implementation because the service module did not exist.
- Focused service test passed with `npm test -- approvals-workflow.service.spec.ts --runInBand`: 1 suite, 3 tests passed.
- Focused e2e passed with `npm run test:e2e -- --runInBand`: 1 suite, 17 tests passed.
- `npm run prisma:validate`: passed.
- `npm run typecheck`: passed.
- `npm run lint`: passed with warnings only in Jest/Supertest test-harness typing.
- `npm test -- --runInBand`: 20 suites, 95 tests passed.
- `npm run test:e2e -- --runInBand`: 1 suite, 17 tests passed.
- `npm run build`: passed.

Latest Dashboard, Reports & Analytics verification:

- `npx prisma migrate dev --name dashboard_reports_analytics --skip-seed`: applied `20260702090000_dashboard_reports_analytics`.
- `npm run prisma:validate`: passed.
- `npm run typecheck`: passed.
- `npm run lint`: passed with warnings only in existing Jest/Supertest test-harness typing plus the new dashboard-reports spec warning.
- `npm test -- --runInBand`: 21 suites, 97 tests passed.
- `npm run test:e2e -- --runInBand`: 1 suite, 18 tests passed.
- `npm run build`: passed.

Latest Backend Platform Hardening verification:

- `npm run prisma:validate`: passed. Prisma also reported the existing Prisma 7 config deprecation/update notice.
- `npm run typecheck`: passed.
- `npm run lint`: passed with warnings only in existing Jest/Supertest/test-harness typing plus the new auth/e2e test warnings.
- `npm test -- --runInBand`: 21 suites, 100 tests passed.
- `npm run test:e2e -- --runInBand`: 1 suite, 21 tests passed.
- `npm run build`: passed.
- Additional `npm audit --omit=dev`: failed on high-severity Multer advisories inherited through Nest platform packages; npm's suggested `--force` fix would apply breaking dependency changes, so it was not applied in this pass.

## Completed Backend Security Cleanup & Frontend Readiness Pass

- Investigated the Multer/Nest production audit warning.
- Confirmed the dependency path was `@nestjs/swagger -> @nestjs/core -> @nestjs/platform-express -> multer@2.1.1`.
- Updated Nest patch packages to `11.1.27`.
- Added npm override for `multer@2.2.0`.
- Verified `npm audit --omit=dev` now reports 0 vulnerabilities.
- Added request-context extraction helper and decorator for actor user ID, company ID, IP address, user agent, and request ID placeholder.
- Used request context in auth, employees, clients, projects/tasks, and billing controllers where audit metadata is already passed to services.
- Added CORS frontend env support through `FRONTEND_URL` and `CORS_ORIGINS`.
- Added Swagger DTO examples for high-use frontend surfaces: auth, dashboard filters, pagination/list filters, employees, clients, projects, tasks, and invoices.
- Added e2e assertion that `/api/docs-json` exposes frontend-critical paths and examples.
- Added security audit documentation at `docs/backend/security-audit.md`.
- Added frontend API consumption documentation at `docs/frontend/api-consumption.md`.

Latest Backend Security Cleanup & Frontend Readiness verification:

- `npm audit --omit=dev`: passed, 0 vulnerabilities.
- `npm run prisma:validate`: passed. Prisma also reported the existing Prisma 7 config deprecation notice.
- `npm run typecheck`: passed.
- `npm run lint`: passed with 0 errors and 675 warnings in existing Jest/Supertest/test typing patterns.
- `npm test -- --runInBand`: 23 suites, 104 tests passed.
- `npm run test:e2e -- --runInBand`: 1 suite, 21 tests passed.
- `npm run build`: passed.

## Not Started

- Frontend source code.
- Authentication screens.
- Dashboard UI.
- Integration providers.
- BullMQ queue wiring.
- File/document binary storage abstraction.
- Refactoring existing local approval flows into the generic approval engine.
- Business modules beyond foundation, Clients / CRM, Tasks & Projects, Attendance, Leave & Holidays, Payroll & Salary, Finance, Expenses & Vendor Payments, Purchase, Inventory & Asset Management, Documents, Files & Knowledge Base, Communication, Announcements & Notifications, Calendar, Meetings & Scheduling, Helpdesk / Internal Tickets, Performance, Goals & Appraisals, Recruitment & Onboarding, Sales, Leads & Quotations, Invoices, Billing & Receivables, Approvals Workflow Engine, and Dashboard, Reports & Analytics.
- Invoice PDF generation, email/WhatsApp delivery, full accounting ledger posting, payment gateway integration, bank files, and reconciliation.

## Next Build Milestone

Continue backend before frontend:

1. Add fuller CRUD coverage and tests for companies, branches, departments, designations, roles, permissions, and child-record update/delete if needed.
2. Adopt the request-context decorator in additional mutation-heavy modules when those controllers are next touched.
3. Add optional update/delete endpoints for attendance corrections, leave types, leave balances, leave requests, salary structures, salary assignments, advances, and payroll periods if product needs them.
4. Add targeted DB indexes from real query plans where list endpoints need more than existing company/status/date filters.
5. Monitor Nest platform-express releases and remove the `multer` override once Nest directly depends on a patched Multer version.
6. Add optional 2FA placeholders behind clear module boundaries if required.
7. Add BullMQ/Redis queue module and notification/file-service abstractions.
8. Refactor existing local approval flows into the generic approval engine only when explicitly scoped.
9. Add automatic dynamic approver resolution and escalation workers only when explicitly scoped.
10. Add accounting ledger integration only when the full accounting scope starts.
11. Add GST filing, purchase invoice posting, invoice/quotation PDF generation, payment gateway integration, reconciliation, and bank payment files only when explicitly scoped.
12. Frontend foundation can start from `/api/docs-json` and `docs/frontend/api-consumption.md` when explicitly approved.
