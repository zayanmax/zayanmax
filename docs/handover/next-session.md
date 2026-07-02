# Next Session Handover

Start here before writing code.

## Product

Zayan Max is an internal office management system. Build it as a modular ERP-style company operating system with shared auth, permissions, audit logs, files, notifications, approvals, and reporting.

## Current Implementation State

Backend foundation has been implemented in `apps/backend`.

The project now has:

- NestJS app.
- Prisma schema and initial migration.
- Docker Compose for local PostgreSQL and Redis.
- Config/env validation.
- Standard API response and error handling.
- JWT auth foundation.
- Permission-key based RBAC guard/decorator.
- Users, roles, permissions, companies, branches, departments, designations, employees, and audit logs modules.
- Clients / CRM module with clients, contacts, activities, notes, and document metadata.
- Tasks & Projects module with projects, members, tasks, subtasks, comments, attachment metadata, assignees, and kanban listing.
- Attendance, Leave & Holidays module with shifts, attendance, corrections, leave types, balances, requests, local leave review, holidays, monthly summaries, and employee reports.
- Payroll & Salary module with salary structures, components, salary assignments, advances, periods, payroll runs, line items, attendance-based payable days, status transitions, and payslip metadata.
- Finance, Expenses & Vendor Payments module with expenses, vendors, vendor bills, payments, petty cash, payment modes, and dashboard summary.
- Purchase, Inventory & Asset Management module with purchase requests, purchase orders, goods received notes, inventory categories/items, stock movements, stock adjustments, asset categories, assets, assignments, and maintenance records.
- Documents, Files & Knowledge Base module with folders, document records, version metadata, file metadata, entity links, categories, tags, expiry/reminder fields, KB categories, and KB articles.
- Communication, Announcements & Notifications module with company announcements, audience targeting, read receipts, in-app notification records, delivery metadata, preferences, templates, and reminder metadata.
- Calendar, Meetings & Scheduling module with calendar events, attendees, RSVP responses, resources, resource bookings, recurring metadata, reminder metadata, entity links, and calendar views.
- Helpdesk / Internal Tickets module with ticket categories, subcategories, tickets, assignments, comments, internal notes, attachment metadata, SLA metadata, entity links, my tickets, and queue views.
- Performance, Goals & Appraisals module with cycles, goals, progress updates, KPIs, review templates/questions, employee reviews/responses, feedback, one-on-one notes, promotion metadata, employee summaries, and manager team summaries.
- Recruitment & Onboarding module with job openings, candidates, source tracking, pipeline stages, applications, interview metadata/feedback, offer metadata, onboarding checklists/items, and explicit candidate-to-employee conversion.
- Sales, Leads & Quotations module with lead sources/stages, leads, activities, notes, assignments, explicit lead-to-client conversion, opportunities, quotations, quotation items, and quotation version metadata.
- Invoices, Billing & Receivables module with invoice series, invoices, invoice items, quotation conversion, payment receipts, receipt allocations, credit/debit note metadata, receivable summaries, client statements, and aging summaries.
- Approvals Workflow Engine module with workflow definitions, workflow steps, approval requests, step instances, action records, delegation metadata, escalation metadata, pending approvals, and entity history.
- Dashboard, Reports & Analytics module with company, HR, project/task, CRM/sales, finance, inventory/assets, helpdesk, approvals, and calendar dashboard summaries plus report registry and export request metadata.
- Backend platform hardening with Swagger/OpenAPI, health/readiness checks, session/device metadata foundation, password change, password reset token metadata, logout-all, request-context foundation, CORS frontend env support, and RBAC permission audit coverage.
- Frontend foundation in `apps/frontend` with Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui, Radix UI packages, Lucide React, TanStack Query, React Hook Form, Zod, Axios API client, Zustand auth state, protected dashboard shell, permission-aware navigation, auth pages, reusable UI foundations, and dashboard summary page.
- Employees and HR master data frontend screens with employee list/create/edit/detail plus branch, department, and designation list/create/edit settings pages.
- Clients and CRM frontend screens with client list/create/edit/detail, status change, soft-delete, contacts, activities, notes, and document metadata sections.
- Unit tests and e2e tests.

Employees, HR master data, and Clients / CRM frontend screens have been created. Other module CRUD screens have not been created yet.

## Recommended First Action

For backend checks, start in:

```text
apps/backend
```

Check current backend health:

```bash
docker compose up -d
npm run prisma:validate
npm test -- --runInBand
npm run test:e2e -- --runInBand
npm run typecheck
npm run build
npm run lint
```

The local database is intentionally mapped to host port `5434` because an existing local service was detected on `5432` with different credentials.

Seeded local admin:

```text
email: admin@zayan.test
password: Password123
```

For frontend checks, start in:

```text
apps/frontend
```

Run:

```bash
npm install
npm run typecheck
npm run lint
npm run build
```

Frontend environment:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api/v1
```

The frontend currently has auth flow, protected layout, permission-aware navigation, reusable UI foundations, dashboard summary cards, employee screens, HR master data screens, and Clients / CRM screens. Build the next module screen on top of the shared API client and layout rather than adding a second app shell.

Known frontend/backend fit notes:

- Employee list supports backend `search`, `status`, and pagination.
- Branch, department, and designation employee filters are client-side against the current paginated employee result because the backend employee list does not currently accept those filter query parameters.
- Employee status is displayed but not editable because the backend employee create/update DTO does not accept `status`.
- Branches, departments, and designations do not show delete actions because their backend controllers currently expose list/create/update only.
- Client owner filtering uses owners present in the current list result because there is no dedicated clients-owner lookup endpoint.
- Client document screens create metadata only; file upload is not implemented.
- Client child sections support create/list only because backend child routes do not expose edit/delete endpoints yet.

## Must-Follow Backend Rules

- All API routes use `/api/v1`.
- All primary keys are UUIDs.
- Business records are scoped by `companyId`.
- Use `branchId` where branch-specific records are needed.
- Use soft deletes where applicable.
- Validate request DTOs with `class-validator` and `class-transformer`.
- Keep business logic out of controllers.
- Do not hardcode role names for access checks.
- Audit critical actions.
- Keep third-party integrations under `src/integrations`.
- Queue non-critical external work through BullMQ.

## First Backend Scope

Foundation scope implemented:

- Auth
- Users
- Roles
- Permissions
- Companies
- Branches
- Departments
- Designations
- Employees
- Audit Logs

Clients / CRM scope implemented:

- Clients.
- Client contacts.
- Client activities.
- Client notes.
- Client document metadata only.
- Client status/type/owner support.
- Search, filters, pagination.
- Duplicate protection by company-scoped email, phone, or name.
- Audit logs for create/update/delete/status changes and child record creation.

Do not start frontend screens or unscoped modules from this older CRM checkpoint unless explicitly asked.

Tasks & Projects scope implemented:

- Projects.
- Project members.
- Project statuses.
- Tasks.
- Subtasks.
- Task comments.
- Task attachment metadata only.
- Task assignees.
- Task priorities and statuses.
- Start dates, due dates, and completion dates.
- Search, filters, pagination.
- Kanban-friendly task listing by status.
- Optional client relation for projects.
- Optional user/employee relations for project members and task assignees.
- Audit logs for create/update/delete/status changes/assignment changes.

Do not start invoices, payments, approvals, or frontend screens unless explicitly asked.

Attendance, Leave & Holidays scope implemented:

- Shifts.
- Attendance records.
- Check-in and check-out.
- Manual attendance entry.
- Attendance correction requests with local review.
- Attendance statuses: present, absent, late, half-day, work-from-home, holiday, and leave.
- Leave types.
- Leave balances.
- Leave requests.
- Local leave approval/rejection foundation.
- Holiday calendar.
- Monthly attendance summary.
- Employee attendance report.
- Search, filters, pagination.
- Duplicate attendance protection by company-scoped employee/date.
- Audit logs for attendance changes, correction review, leave requests, leave approvals/rejections, leave balances, shifts, and holiday changes.

Do not start generic approval workflow or frontend screens unless explicitly asked.

Payroll & Salary scope implemented:

- Salary structures.
- Earnings and deduction components.
- Employee salary assignment.
- Salary advances.
- Payroll periods.
- Payroll run creation.
- Payroll employee line items.
- Basic attendance/leave integration for payable days.
- Payslip generation metadata only.
- Payroll status flow: draft, processing, approved, paid, cancelled.
- Search, filters, pagination.
- Duplicate payroll protection by company-scoped payroll period.
- Audit logs for salary assignment, advance, payroll run create/update/approve/pay/cancel.

Do not start accounting ledger, PDF payslips, bank payment files, or frontend screens unless explicitly asked.

Finance, Expenses & Vendor Payments scope implemented:

- Expense categories.
- Expense claims.
- Expense claim items.
- Expense attachment metadata only.
- Expense status flow: draft, submitted, approved, rejected, paid, cancelled.
- Vendors.
- Vendor bills.
- Vendor bill items.
- Vendor payments.
- Petty cash accounts.
- Petty cash transactions.
- Payment modes.
- Basic finance dashboard summary endpoint.
- Search, filters, pagination.
- Duplicate vendor protection by company-scoped email, phone, or GSTIN.
- Duplicate vendor bill protection by vendor and bill number.
- Audit logs for expenses, approvals/rejections, vendor bills, payments, and petty cash transactions.

Do not start accounting ledger, GST filing, purchase invoice posting, PDF generation, or frontend screens unless explicitly asked.

Purchase, Inventory & Asset Management scope implemented:

- Purchase requests.
- Purchase request items.
- Purchase request status flow: draft, submitted, approved, rejected, ordered, cancelled.
- Purchase orders.
- Purchase order items.
- Purchase order status flow: draft, sent, partially received, received, cancelled.
- Goods received notes.
- Inventory categories.
- Inventory items.
- Stock movements.
- Stock adjustment.
- Low stock threshold support.
- Asset categories.
- Assets.
- Asset assignment to employees.
- Asset maintenance records.
- Warranty and serial number fields.
- Search, filters, pagination.
- Duplicate protection for asset tags, serial numbers, SKU/item codes, purchase order numbers, and category names where sensible.
- Audit logs for purchase requests, purchase orders, goods received notes, stock movements, asset assignments, and maintenance.

Do not start full approval workflow, accounting ledger posting, invoice posting, PDF generation, or frontend screens unless explicitly asked.

Documents, Files & Knowledge Base scope implemented:

- Document folders.
- Document records.
- Document versions metadata.
- File metadata only, with no binary upload handling.
- Folder hierarchy with generated paths.
- Owner user support.
- Department/company/private visibility metadata.
- Entity linking support for employees, clients, projects, tasks, vendors, and assets.
- Document categories.
- Document tags.
- Document expiry date and reminder date fields.
- Knowledge base categories.
- Knowledge base articles.
- Article status flow: draft, published, archived.
- Article tags.
- Search, filters, pagination.
- Duplicate protection for folder paths, document titles in folders, categories, and tags where sensible.
- Audit logs for folder/document/version/article create/update/delete/publish/archive.

Do not start actual file upload/storage, OCR, document preview, public sharing, full text indexing, or frontend screens unless explicitly asked.

Communication, Announcements & Notifications scope implemented:

- Company announcements.
- Announcement audience targeting for all company, branch, department, employee, and role.
- Announcement status flow: draft, published, archived.
- Announcement read receipts.
- Internal notifications.
- Notification types/categories.
- Notification read/unread state.
- Notification priority.
- Notification entity linking metadata for employee, client, project, task, attendance, leave, payroll, finance, purchase, inventory, asset, document, and knowledge base.
- Notification delivery channel metadata for in-app, email, SMS, WhatsApp, and push.
- Notification delivery status metadata: pending, sent, failed, skipped.
- Notification preferences per user.
- Notification templates metadata.
- Basic reminder records for future scheduled reminders.
- Search, filters, pagination.
- Audit logs for announcement create/update/publish/archive and notification preference changes.

Do not start real email/SMS/WhatsApp/push integrations, BullMQ workers, real notification sending, scheduled reminder execution, or frontend screens unless explicitly asked.

Calendar, Meetings & Scheduling scope implemented:

- Calendar events.
- Event types: meeting, task deadline, project milestone, holiday, interview, client meeting, reminder, birthday, work anniversary, and custom.
- Event status flow: scheduled, completed, cancelled, postponed.
- Event attendees.
- RSVP status flow: pending, accepted, declined, tentative.
- Meeting room/resource metadata.
- Resource bookings.
- Recurring event metadata.
- Event reminder metadata.
- Entity linking support for employee, client, project, task, leave, holiday, and document.
- Conflict checks for active overlapping room/resource bookings.
- My calendar endpoint.
- Company calendar endpoint.
- Search, filters, pagination.
- Audit logs for event create/update/delete/cancel, attendee RSVP responses, resource creation, and resource booking creation.

Do not start Google Calendar integration, real reminder delivery, BullMQ workers, recurrence execution, or frontend screens unless explicitly asked.

Helpdesk / Internal Tickets scope implemented:

- Ticket categories.
- Ticket subcategories.
- Tickets.
- Ticket status flow: open, in progress, waiting for employee, waiting for admin, resolved, closed, cancelled.
- Ticket priorities: low, medium, high, urgent.
- Ticket sources: employee, admin, system.
- Ticket assignment to user, employee, and team-name placeholder.
- Ticket comments.
- Ticket internal notes.
- Ticket attachments metadata only.
- SLA metadata for first response due, resolution due, and breach flags.
- Entity linking metadata for employee, asset, document, payroll, attendance, leave, finance, purchase, and inventory.
- My tickets endpoint.
- Department/category queue endpoint.
- Search, filters, pagination.
- Audit logs for ticket create/update/status/assignment/comment/note/close/delete and attachment metadata creation.

Do not start real SLA workers, real notifications, file upload/storage, automatic routing, or frontend screens unless explicitly asked.

Performance, Goals & Appraisals scope implemented:

- Performance cycles.
- Employee goals.
- Goal status flow: draft, active, completed, cancelled.
- Goal progress updates.
- KPI categories.
- Employee KPI records.
- Review templates.
- Review template questions.
- Employee reviews.
- Review status flow: draft, self review, manager review, HR review, completed, cancelled.
- Review responses.
- Feedback records.
- 1-on-1 meeting notes metadata only.
- Promotion/recommendation metadata.
- Search, filters, pagination.
- Employee performance summary endpoint.
- Manager team performance endpoint.
- Audit logs for goal/review/feedback/status changes and primary create actions.

Do not start payroll appraisal increments, calendar meeting creation, notifications, automated appraisal workflows, or frontend screens unless explicitly asked.

Recruitment & Onboarding scope implemented:

- Job openings.
- Job opening status flow: draft, open, paused, closed, cancelled.
- Candidate profiles.
- Candidate source tracking.
- Candidate pipeline stages.
- Candidate applications.
- Application status flow: applied, screening, interview, offered, hired, rejected, withdrawn.
- Interview rounds metadata.
- Interview feedback.
- Offer letters metadata only.
- Offer status flow: draft, sent, accepted, declined, expired, cancelled.
- Onboarding checklists.
- Onboarding checklist items.
- Candidate-to-employee conversion foundation through an explicit endpoint.
- Search, filters, pagination.
- Duplicate candidate protection by company-scoped email or phone.
- Audit logs for job/candidate/application/interview/offer/onboarding/status changes.

Do not start frontend screens, PDF offer generation, email/notification sending, calendar interview event integration, or automatic employee creation unless explicitly asked.

Sales, Leads & Quotations scope implemented:

- Leads.
- Lead sources.
- Lead stages.
- Lead status flow: new, contacted, qualified, proposal, negotiation, won, lost, archived.
- Lead activities.
- Lead notes.
- Lead assignment to user and employee.
- Lead-to-client conversion foundation through an explicit endpoint.
- Sales opportunities.
- Opportunity stages.
- Opportunity status flow: open, won, lost, cancelled.
- Quotations.
- Quotation items.
- Quotation status flow: draft, sent, accepted, rejected, expired, cancelled.
- Quotation version metadata.
- Search, filters, pagination.
- Duplicate lead protection by company-scoped email or phone.
- Audit logs for lead/opportunity/quotation create/update/delete/status/assignment/conversion changes and child metadata creation.

Do not start frontend screens, quotation PDF generation, email/WhatsApp sending, invoices, payments, or accounting ledger posting unless explicitly asked.

Invoices, Billing & Receivables scope implemented:

- Invoice series and numbering configuration.
- Invoices.
- Invoice items.
- Invoice tax and discount metadata.
- Invoice status flow: draft, issued, partially paid, paid, overdue, cancelled, written off.
- Quotation-to-invoice conversion foundation.
- Required client relation for invoices.
- Optional project and opportunity relation for invoices.
- Payment receipts.
- Receipt allocation to invoices with paid amount, balance amount, and status updates.
- Credit note metadata only.
- Debit note metadata only.
- Outstanding receivables summary endpoint.
- Client statement endpoint.
- Invoice aging summary endpoint.
- Search, filters, pagination.
- Duplicate invoice number protection by company.
- Audit logs for invoice create/update/issue/cancel/payment/write-off/credit-note/debit-note actions.

Do not start frontend screens, invoice PDF generation, email/WhatsApp sending, full accounting ledger posting, payment gateway integration, bank files, or reconciliation unless explicitly asked.

Approvals Workflow Engine scope implemented:

- Approval workflow definitions.
- Approval workflow steps.
- Step approver types: user, employee, role, department head, reporting manager, finance manager, HR manager, admin.
- Approval request records.
- Approval request entity linking for leave, attendance correction, expense claim, purchase request, payroll run, vendor bill, invoice, quotation, asset assignment, document, and custom records.
- Approval request status flow: draft, pending, approved, rejected, cancelled.
- Approval step instance records.
- Step status flow: pending, approved, rejected, skipped.
- Approval actions and comments.
- Delegation metadata.
- Escalation metadata only.
- My pending approvals endpoint.
- Approval history endpoint per entity.
- Search, filters, pagination.
- Audit logs for workflow create/update/delete, request submit, approve, reject, cancel, and delegate.

Do not start frontend screens, refactor existing local approval flows, send notifications, implement real escalation workers, resolve dynamic approver types automatically, or enqueue BullMQ jobs unless explicitly asked.

Dashboard, Reports & Analytics scope implemented:

- Main company dashboard summary.
- HR dashboard summary.
- Project/task dashboard summary.
- CRM/sales dashboard summary.
- Finance dashboard summary.
- Inventory/assets dashboard summary.
- Helpdesk dashboard summary.
- Approval dashboard summary.
- Calendar dashboard summary.
- Date range filters on dashboard summary endpoints.
- Reports registry with report type, name, module, description, permission key, and filter metadata.
- Generic report metadata lookup.
- Export request metadata creation for CSV, XLSX, and PDF requests.
- Export request status metadata: pending, processing, completed, failed.
- Export request file placeholders only.
- Export request search, filters, sorting, and pagination.
- Report export request metadata table.

Do not start frontend screens, actual CSV/XLSX/PDF generation, BullMQ export workers, real-time dashboard updates, scheduled reports, or file storage integration unless explicitly asked.

Backend Stabilization, API Documentation & Platform Hardening scope implemented:

- Swagger UI at `/api/docs`.
- OpenAPI JSON at `/api/docs-json`.
- Swagger bearer JWT auth support.
- Standard response and error schemas in OpenAPI metadata.
- Health summary endpoint at `/api/v1/health`.
- Liveness endpoint at `/api/v1/health/live`.
- Readiness endpoint at `/api/v1/health/ready`.
- Prisma database readiness check.
- Redis TCP readiness check.
- Version/build metadata placeholders through `BUILD_VERSION` and `BUILD_SHA`.
- Session/device metadata table through `UserSession`.
- Password reset token metadata table through `PasswordResetToken`.
- Login now returns `sessionId`.
- Refresh accepts optional `sessionId`.
- Logout-all endpoint exists.
- Password change endpoint exists.
- Password reset request/confirm metadata endpoints exist, with no real delivery provider.
- RBAC audit confirmed seeded permissions cover implemented controller permission keys.
- Focused e2e tests cover Swagger/health, denied access, and auth session/password flows.

Do not start real password reset delivery, OAuth, 2FA, Redis-backed session cache, or frontend auth screens unless explicitly asked.

## Completed Validation

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

Foundation validation passed.

Latest Clients / CRM validation:

- `npm run prisma:validate`: passed.
- `npm run typecheck`: passed.
- `npm run lint`: passed with warnings only in Jest/Supertest test-harness typing.
- `npm test -- --runInBand`: 6 suites, 18 tests passed.
- `npm run test:e2e -- --runInBand`: 1 suite, 3 tests passed.
- `npm run build`: passed.

Latest Tasks & Projects validation:

- `npm run prisma:validate`: passed.
- `npm run typecheck`: passed.
- `npm run lint`: passed with warnings only in Jest/Supertest test-harness typing.
- `npm test -- --runInBand`: 7 suites, 28 tests passed.
- `npm run test:e2e -- --runInBand`: 1 suite, 4 tests passed.
- `npm run build`: passed.

Latest Attendance, Leave & Holidays validation:

- `npx prisma migrate dev --skip-seed`: applied `20260613000000_attendance_leave`.
- `npm run prisma:seed`: passed.
- `npm run prisma:validate`: passed.
- `npm run typecheck`: passed.
- `npm run lint`: passed with warnings only in Jest/Supertest test-harness typing.
- `npm test -- --runInBand`: 8 suites, 35 tests passed.
- `npm run test:e2e -- --runInBand`: 1 suite, 5 tests passed.
- `npm run build`: passed.

Latest Payroll & Salary validation:

- `npx prisma migrate dev --name payroll_salary --skip-seed`: created and applied `20260613072051_payroll_salary`.
- `npm run prisma:validate`: passed.
- `npm run typecheck`: passed.
- `npm run lint`: passed with warnings only in Jest/Supertest test-harness typing.
- `npm test -- --runInBand`: 9 suites, 41 tests passed.
- `npm run test:e2e -- --runInBand`: 1 suite, 6 tests passed.
- `npm run build`: passed.

Latest Finance, Expenses & Vendor Payments validation:

- `npx prisma migrate dev --name finance_expenses_vendor_payments --skip-seed`: created and applied `20260613073700_finance_expenses_vendor_payments`.
- `npm run prisma:validate`: passed.
- `npm run typecheck`: passed.
- `npm run lint`: passed with warnings only in Jest/Supertest test-harness typing.
- `npm test -- --runInBand`: 10 suites, 48 tests passed.
- `npm run test:e2e -- --runInBand`: 1 suite, 7 tests passed.
- `npm run build`: passed.

Latest Purchase, Inventory & Asset Management validation:

- `npx prisma migrate dev --name purchase_inventory_assets --skip-seed`: created and applied `20260613083953_purchase_inventory_assets`.
- `npm run prisma:validate`: passed.
- `npm run typecheck`: passed.
- `npm run lint`: passed with warnings only in Jest/Supertest test-harness typing.
- `npm test -- --runInBand`: 11 suites, 55 tests passed.
- `npm run test:e2e -- --runInBand`: 1 suite, 8 tests passed.
- `npm run build`: passed.

Latest Documents, Files & Knowledge Base validation:

- `npx prisma migrate dev --name documents_knowledge_base --skip-seed`: created and applied `20260613093710_documents_knowledge_base`.
- Focused red step verified with `npm test -- --runInBand --testPathPatterns documents-knowledge-base`: failed before implementation because the service module did not exist.
- `npm run prisma:validate`: passed.
- `npm run typecheck`: passed.
- `npm run lint`: passed with warnings only in Jest/Supertest test-harness typing.
- `npm test -- --runInBand`: 12 suites, 61 tests passed.
- `npm run test:e2e -- --runInBand`: 1 suite, 9 tests passed.
- `npm run build`: passed.

Latest Communication, Announcements & Notifications validation:

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

Latest Calendar, Meetings & Scheduling validation:

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

Latest Helpdesk / Internal Tickets validation:

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

Latest Performance, Goals & Appraisals validation:

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

Latest Recruitment & Onboarding validation:

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

Latest Sales, Leads & Quotations validation:

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

Latest Invoices, Billing & Receivables validation:

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

Latest Approvals Workflow Engine validation:

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

Latest Dashboard, Reports & Analytics validation:

- `npx prisma migrate dev --name dashboard_reports_analytics --skip-seed`: applied `20260702090000_dashboard_reports_analytics`.
- `npm run prisma:validate`: passed.
- `npm run typecheck`: passed.
- `npm run lint`: passed with warnings only in existing Jest/Supertest test-harness typing plus the new dashboard-reports spec warning.
- `npm test -- --runInBand`: 21 suites, 97 tests passed.
- `npm run test:e2e -- --runInBand`: 1 suite, 18 tests passed.
- `npm run build`: passed.

Latest Backend Platform Hardening validation:

- `npm run prisma:validate`: passed.
- `npm run typecheck`: passed.
- `npm run lint`: passed with warnings in test typing.
- `npm test -- --runInBand`: 21 suites, 100 tests passed.
- `npm run test:e2e -- --runInBand`: 1 suite, 21 tests passed.
- `npm run build`: passed.
- `npm audit --omit=dev`: still reports high-severity Multer advisories inherited through Nest platform packages; the forced npm fix would be breaking and was not applied.

Latest Backend Security Cleanup & Frontend Readiness validation:

- `npm audit --omit=dev`: passed, 0 vulnerabilities.
- `npm run prisma:validate`: passed.
- `npm run typecheck`: passed.
- `npm run lint`: passed with 0 errors and 675 warnings in existing Jest/Supertest/test typing patterns.
- `npm test -- --runInBand`: 23 suites, 104 tests passed.
- `npm run test:e2e -- --runInBand`: 1 suite, 21 tests passed.
- `npm run build`: passed.

Lint exits successfully with warnings in Jest/Supertest typing only.

## What Changed

- Runnable backend was placed in `apps/backend` to avoid overwriting the existing top-level `backend/` documentation.
- Prisma was pinned to the 6.x line and audit-fixed to 6.19.3 in the lockfile.
- Local Docker PostgreSQL uses `localhost:5434`.
- A first migration exists at `apps/backend/prisma/migrations/20260612111029_init`.
- The API health endpoint is `GET /api/v1`.
- Auth endpoints include:
  - `POST /api/v1/auth/login`
  - `POST /api/v1/auth/refresh`
  - `POST /api/v1/auth/logout`
  - `GET /api/v1/auth/me`
- Employee endpoints include standard CRUD under `/api/v1/employees`.
- A second migration exists at `apps/backend/prisma/migrations/20260612122445_clients_crm`.
- Clients endpoints exist under `/api/v1/clients`.
- Clients module docs exist at `docs/modules/clients.md`.
- A third migration exists at `apps/backend/prisma/migrations/20260612131444_tasks_projects`.
- Projects endpoints exist under `/api/v1/projects`.
- Tasks endpoints exist under `/api/v1/tasks`.
- Tasks & Projects module docs exist at `docs/modules/tasks-projects.md`.
- A fourth migration exists at `apps/backend/prisma/migrations/20260613000000_attendance_leave`.
- Shift endpoints exist under `/api/v1/shifts`.
- Attendance endpoints exist under `/api/v1/attendance`.
- Leave endpoints exist under `/api/v1/leaves`.
- Holiday endpoints exist under `/api/v1/holidays`.
- Attendance, Leave & Holidays module docs exist at `docs/modules/attendance-leave.md`.
- A fifth migration exists at `apps/backend/prisma/migrations/20260613072051_payroll_salary`.
- Payroll endpoints exist under `/api/v1/payroll`.
- Payroll & Salary module docs exist at `docs/modules/payroll.md`.
- A sixth migration exists at `apps/backend/prisma/migrations/20260613073700_finance_expenses_vendor_payments`.
- Finance endpoints exist under `/api/v1/finance`.
- Vendor endpoints exist under `/api/v1/vendors`.
- Finance module docs exist at `docs/modules/finance-expenses.md`.
- A seventh migration exists at `apps/backend/prisma/migrations/20260613083953_purchase_inventory_assets`.
- Purchase endpoints exist under `/api/v1/purchases`.
- Inventory endpoints exist under `/api/v1/inventory`.
- Asset endpoints exist under `/api/v1/assets`.
- Purchase, Inventory & Asset Management module docs exist at `docs/modules/purchase-inventory-assets.md`.
- An eighth migration exists at `apps/backend/prisma/migrations/20260613093710_documents_knowledge_base`.
- Document folder endpoints exist under `/api/v1/document-folders`.
- Document taxonomy endpoints exist under `/api/v1/document-categories` and `/api/v1/document-tags`.
- Document metadata endpoints exist under `/api/v1/documents`.
- Knowledge base endpoints exist under `/api/v1/knowledge-base`.
- Documents, Files & Knowledge Base module docs exist at `docs/modules/documents-knowledge-base.md`.
- A ninth migration exists at `apps/backend/prisma/migrations/20260613095226_communication_notifications`.
- Communication permissions exist in seed: `communications.view`, `communications.manage`.
- Notification permissions exist in seed: `notifications.view`, `notifications.manage`.
- Announcement endpoints exist under `/api/v1/announcements`.
- Notification metadata endpoints exist under `/api/v1/notifications`, `/api/v1/notification-types`, `/api/v1/notification-templates`, `/api/v1/notification-preferences`, and `/api/v1/reminders`.
- Communication, Announcements & Notifications module docs exist at `docs/modules/communication-notifications.md`.
- A tenth migration exists at `apps/backend/prisma/migrations/20260613134617_calendar_scheduling`.
- Calendar permissions exist in seed: `calendar.view`, `calendar.manage`.
- Calendar event endpoints exist under `/api/v1/calendar/events`, `/api/v1/calendar/my`, and `/api/v1/calendar/company`.
- Calendar resource endpoints exist under `/api/v1/calendar/resources`.
- Calendar resource booking endpoints exist under `/api/v1/calendar/resource-bookings` and `/api/v1/calendar/resources/:id/bookings`.
- Calendar, Meetings & Scheduling module docs exist at `docs/modules/calendar-scheduling.md`.
- An eleventh migration exists at `apps/backend/prisma/migrations/20260613140337_helpdesk_tickets`.
- Helpdesk permissions exist in seed: `helpdesk.view`, `helpdesk.manage`.
- Helpdesk category endpoints exist under `/api/v1/helpdesk/categories`.
- Helpdesk subcategory endpoints exist under `/api/v1/helpdesk/subcategories` and `/api/v1/helpdesk/categories/:id/subcategories`.
- Helpdesk ticket endpoints exist under `/api/v1/helpdesk/tickets`, `/api/v1/helpdesk/tickets/my`, and `/api/v1/helpdesk/tickets/queue`.
- Helpdesk ticket child endpoints exist under `/api/v1/helpdesk/tickets/:id/comments`, `/api/v1/helpdesk/tickets/:id/internal-notes`, and `/api/v1/helpdesk/tickets/:id/attachments`.
- Helpdesk / Internal Tickets module docs exist at `docs/modules/helpdesk-tickets.md`.
- A twelfth migration exists at `apps/backend/prisma/migrations/20260613141926_performance_appraisals`.
- Performance permissions exist in seed: `performance.view`, `performance.manage`.
- Performance cycle endpoints exist under `/api/v1/performance/cycles`.
- Performance goal endpoints exist under `/api/v1/performance/goals`.
- Performance KPI endpoints exist under `/api/v1/performance/kpi-categories` and `/api/v1/performance/kpis`.
- Performance review endpoints exist under `/api/v1/performance/review-templates` and `/api/v1/performance/reviews`.
- Performance metadata endpoints exist under `/api/v1/performance/feedback`, `/api/v1/performance/one-on-ones`, and `/api/v1/performance/promotion-recommendations`.
- Performance summary endpoints exist under `/api/v1/performance/employees/:employeeId/summary` and `/api/v1/performance/managers/:managerEmployeeId/team-summary`.
- Performance, Goals & Appraisals module docs exist at `docs/modules/performance-appraisals.md`.
- A thirteenth migration exists at `apps/backend/prisma/migrations/20260613144836_recruitment_onboarding`.
- Recruitment permissions exist in seed: `recruitment.view`, `recruitment.manage`.
- Recruitment job endpoints exist under `/api/v1/recruitment/jobs`.
- Recruitment candidate endpoints exist under `/api/v1/recruitment/candidates`.
- Recruitment pipeline stage endpoints exist under `/api/v1/recruitment/pipeline-stages`.
- Recruitment application endpoints exist under `/api/v1/recruitment/applications`.
- Recruitment interview endpoints exist under `/api/v1/recruitment/interviews`.
- Recruitment offer endpoints exist under `/api/v1/recruitment/offers`.
- Recruitment onboarding endpoints exist under `/api/v1/recruitment/onboarding-checklists` and `/api/v1/recruitment/onboarding-items/:id/complete`.
- Recruitment & Onboarding module docs exist at `docs/modules/recruitment-onboarding.md`.
- A fourteenth migration exists at `apps/backend/prisma/migrations/20260613175817_sales_leads_quotations`.
- Sales permissions exist in seed: `sales.view`, `sales.manage`.
- Sales lead source and stage endpoints exist under `/api/v1/sales/lead-sources` and `/api/v1/sales/lead-stages`.
- Sales lead endpoints exist under `/api/v1/sales/leads`, including `/api/v1/sales/leads/:id`.
- Sales opportunity endpoints exist under `/api/v1/sales/opportunities`, including `/api/v1/sales/opportunities/:id`, and `/api/v1/sales/opportunity-stages`.
- Sales quotation endpoints exist under `/api/v1/sales/quotations`, including `/api/v1/sales/quotations/:id`.
- Sales, Leads & Quotations module docs exist at `docs/modules/sales-leads-quotations.md`.
- A fifteenth migration exists at `apps/backend/prisma/migrations/20260613181910_invoices_billing_receivables`.
- Billing permissions exist in seed: `billing.view`, `billing.manage`.
- Billing invoice series endpoints exist under `/api/v1/billing/invoice-series`.
- Billing invoice endpoints exist under `/api/v1/billing/invoices`.
- Billing quotation conversion endpoint exists under `/api/v1/billing/quotations/:quotationId/convert-to-invoice`.
- Billing payment receipt endpoints exist under `/api/v1/billing/payment-receipts`.
- Billing credit and debit note endpoints exist under `/api/v1/billing/credit-notes` and `/api/v1/billing/debit-notes`.
- Billing receivable summary endpoints exist under `/api/v1/billing/receivables/summary`, `/api/v1/billing/clients/:clientId/statement`, and `/api/v1/billing/receivables/aging`.
- Invoices, Billing & Receivables module docs exist at `docs/modules/invoices-billing-receivables.md`.
- A sixteenth migration exists at `apps/backend/prisma/migrations/20260614090008_approvals_workflow_engine`.
- Approval permissions exist in seed: `approvals.view`, `approvals.manage`, `approvals.approve`.
- Approval workflow endpoints exist under `/api/v1/approvals/workflows`.
- Approval request endpoints exist under `/api/v1/approvals/requests`.
- Approval pending endpoint exists under `/api/v1/approvals/pending`.
- Approval entity history endpoint exists under `/api/v1/approvals/history/:entityType/:entityId`.
- Approvals Workflow Engine module docs exist at `docs/modules/approvals-workflow.md`.
- A seventeenth migration exists at `apps/backend/prisma/migrations/20260702090000_dashboard_reports_analytics`.
- Dashboard/report permissions exist in seed: `dashboard.view`, `reports.view`, `reports.export`.
- Dashboard summary endpoints exist under `/api/v1/dashboard/summary`, `/api/v1/dashboard/hr`, `/api/v1/dashboard/projects-tasks`, `/api/v1/dashboard/crm-sales`, `/api/v1/dashboard/finance`, `/api/v1/dashboard/inventory-assets`, `/api/v1/dashboard/helpdesk`, `/api/v1/dashboard/approvals`, and `/api/v1/dashboard/calendar`.
- Report registry and metadata endpoints exist under `/api/v1/reports/registry` and `/api/v1/reports/metadata/:reportType`.
- Report export request metadata endpoints exist under `/api/v1/reports/export-requests`.
- Dashboard, Reports & Analytics module docs exist at `docs/modules/dashboard-reports.md`.
- Swagger/OpenAPI docs exist at `/api/docs` and `/api/docs-json`.
- Health/readiness endpoints exist under `/api/v1/health`.
- An eighteenth migration exists at `apps/backend/prisma/migrations/20260702103000_platform_hardening_auth_sessions`.
- Auth endpoints now include `/api/v1/auth/logout-all`, `/api/v1/auth/change-password`, `/api/v1/auth/password-reset/request`, and `/api/v1/auth/password-reset/confirm`.
- Platform hardening docs exist at `docs/backend/platform-hardening.md`, `docs/api/swagger-openapi.md`, and `docs/security/auth-rbac.md`.
- Production audit is clean through a non-breaking `multer@2.2.0` npm override and Nest `11.1.27` patch alignment.
- Security audit details exist at `docs/backend/security-audit.md`.
- Frontend API consumption notes exist at `docs/frontend/api-consumption.md`.
- CORS frontend envs exist: `FRONTEND_URL` and `CORS_ORIGINS`.
- Request-context decorator exists at `apps/backend/src/common/decorators/request-context.decorator.ts`.

## Next Backend Work

1. Add more unit/e2e tests around role and permission management.
2. Add CRUD tests for branches, departments, designations, and companies.
3. Add optional update/delete routes for client contacts, notes, document metadata, project members, task assignees, comments, attachments, leave types, leave balances, attendance corrections, salary structures, salary assignments, advances, payroll periods, calendar attendees, resources, bookings, reminders, helpdesk categories, subcategories, comments, notes, attachments, performance metadata, recruitment metadata, sales child metadata, billing child metadata, and approval child metadata if product needs them.
4. Adopt the request-context decorator in additional mutation-heavy modules when those controllers are next touched.
5. Add targeted DB indexes from real query plans where list endpoints need more than existing company/status/date filters.
6. Monitor Nest platform-express releases and remove the `multer` override once Nest directly depends on a patched Multer version.
7. Add Redis/BullMQ queue module.
8. Add file/document binary storage abstraction before real client, task, or document binary uploads.
9. Add real password reset delivery only when email/SMS/WhatsApp provider scope starts.
10. Refactor existing local approval flows into the generic approval engine only when explicitly scoped.
11. Add automatic dynamic approver resolution and escalation workers only when explicitly scoped.
12. Add accounting ledger integration only when the full accounting scope starts.
13. Add GST filing, purchase invoice posting, invoice/quotation PDF generation, payment gateway integration, reconciliation, and bank payment files only when explicitly scoped.
14. Add real report export generation, BullMQ export workers, and file storage integration only when explicitly scoped.
15. Continue frontend module screens on top of the existing API contracts when explicitly scoped.

## Latest Frontend State

- Frontend foundation exists under `apps/frontend`.
- Authentication, protected shell, dashboard foundation, Employees + HR master data, Clients & CRM, Projects & Tasks, Sales / Leads / Quotations, Invoices / Billing / Receivables, Finance / Expenses / Vendor Payments, Purchase / Inventory / Asset Management, Documents / Knowledge Base, and Communication / Notifications frontend passes are implemented.
- Projects routes exist at `/projects`, `/projects/new`, `/projects/[id]`, and `/projects/[id]/edit`.
- Tasks routes exist at `/tasks`, `/tasks/new`, `/tasks/[id]`, `/tasks/[id]/edit`, and `/tasks/kanban`.
- Projects and Tasks use `projects.*` and `tasks.*` permissions from `/auth/me`.
- Task kanban is read-only in this pass; drag-and-drop status changes can be added later if desired.
- Project member and task assignee forms currently use employee lookup only because a dedicated frontend user picker is not available.
- Sales routes exist at `/sales/leads`, `/sales/opportunities`, and `/sales/quotations` with list, create, edit, and detail pages.
- Sales screens use `sales.view` for reads and `sales.manage` for mutations.
- Opportunity stage list lookup is still missing in the backend; the opportunity form uses a raw optional stage ID.
- Quotation edit is metadata-only because backend quotation update does not accept line item updates.
- Billing routes exist at `/billing`, `/billing/invoices`, `/billing/receipts`, and `/billing/client-statements` with overview, list, create, edit, detail, receipt, statement, and quotation-conversion flows.
- Billing screens use `billing.view` for reads and `billing.manage` for mutations.
- Invoice edit is metadata-only because backend invoice update does not accept line item updates.
- Billing date range filters are not exposed because billing list/summary endpoints do not currently accept date range filters.
- Latest billing frontend verification passed: `npm run typecheck`, `npm run lint`, and `npm run build`.
- Latest backend verification after billing read endpoints passed: `npm run prisma:validate`, `npm run typecheck`, `npm run lint`, `npm test -- --runInBand`, `npm run test:e2e -- --runInBand`, and `npm run build`.
- Finance routes exist at `/finance`, `/finance/expenses`, `/finance/expense-categories`, `/finance/vendors`, `/finance/vendor-bills`, `/finance/vendor-payments`, and `/finance/petty-cash` with overview, list, create, edit, detail, payment, and petty cash flows.
- Finance screens use `finance.view`/`finance.manage`; vendor screens use `vendors.view`/`vendors.manage`.
- Expense categories and petty cash accounts are list/create only because backend update/delete routes are not exposed.
- Latest finance frontend verification passed: `npm run typecheck`, `npm run lint`, and `npm run build`.
- Latest backend verification after finance detail/update endpoints passed: `npm run prisma:validate`, `npm run typecheck`, `npm run lint`, `npm test -- --runInBand`, `npm run test:e2e -- --runInBand`, and `npm run build`.
- Purchase routes exist at `/purchase`, `/purchase/requests`, `/purchase/orders`, and `/purchase/grn` with overview, list, create, edit, detail, receiving, and status-action flows.
- Inventory routes exist at `/inventory`, `/inventory/items`, `/inventory/categories`, `/inventory/stock-movements`, and `/inventory/stock-adjustments/new` with overview, list, create, edit, detail, category, movement, and adjustment flows.
- Asset routes exist at `/assets`, `/assets/categories`, `/assets/assignments`, and `/assets/maintenance` with list, create, edit, detail, assignment, and maintenance flows.
- Purchase screens use `purchases.view`/`purchases.manage`; inventory screens use `inventory.view`/`inventory.manage`; asset screens use `assets.view`/`assets.manage`.
- Backend gained minimal frontend-blocking read/update endpoints for purchase requests, purchase orders, GRNs, inventory categories/items/movements, asset categories/assets, and list endpoints for asset assignments and maintenance records.
- Latest purchase/inventory/assets frontend verification passed: `npm run typecheck`, `npm run lint`, and `npm run build`.
- Latest backend verification after purchase/inventory/assets detail/update endpoints passed: `npm run prisma:validate`, `npm run typecheck`, `npm run lint`, `npm test -- --runInBand`, `npm run test:e2e -- --runInBand`, and `npm run build`.
- Documents routes exist at `/documents`, `/documents/folders`, `/documents/categories`, `/documents/tags`, and `/documents/records` with overview, list, create, edit, detail, status, delete, and version metadata flows where supported.
- Knowledge Base routes exist at `/knowledge-base`, `/knowledge-base/articles`, and `/knowledge-base/categories` with article list/create/edit/detail/status actions and category list/create.
- Documents and Knowledge Base screens use `documents.view`, `documents.upload`, and `documents.manage`.
- Backend gained minimal frontend-blocking read endpoints for document folder detail, document record detail, and knowledge base article detail.
- Document categories, document tags, and KB categories remain list/create only because update/delete backend routes are not exposed.
- Document and article tag update flows are backend pending; tags are assigned during create only.
- Latest Documents/Knowledge Base frontend verification passed: `npm run typecheck`, `npm run lint`, and `npm run build`.
- Latest backend verification after Documents/Knowledge Base detail endpoints passed: `npm run prisma:validate`, `npm run typecheck`, `npm run lint`, `npm test -- --runInBand`, `npm run test:e2e -- --runInBand`, and `npm run build`.
- Communication routes exist at `/communication`, `/communication/announcements`, `/communication/announcements/new`, `/communication/announcements/[id]`, `/communication/announcements/[id]/edit`, `/communication/notification-templates`, and `/communication/reminders`.
- Notifications routes exist at `/notifications` and `/settings/notification-preferences`.
- Communication screens use `communications.view` for reads and `communications.manage` for create/update/status actions.
- Notifications screens use `notifications.view` for reads and `notifications.manage` for template create, preference update, and reminder create.
- Backend gained a minimal frontend-blocking read endpoint for announcement detail: `GET /api/v1/announcements/:id`.
- Announcement audience targeting is create-only because backend announcement update does not update audience rows.
- Notification templates and reminders are list/create only because backend update/delete routes are not exposed.
- Notification center supports individual read/unread actions only; there is no mark-all-read endpoint.
- Latest Communication/Notifications frontend verification passed: `npm run typecheck`, `npm run lint`, and `npm run build`.
- Latest backend verification after announcement detail endpoint passed: `npm run prisma:validate`, `npm run typecheck`, `npm run lint`, `npm test -- --runInBand`, `npm run test:e2e -- --runInBand`, and `npm run build`.

## Next Frontend Work

1. Build Calendar, Meetings & Resource Booking screens.
2. Add a reusable user lookup component if owner assignment should support direct user selection.
3. Add an opportunity stage list endpoint and frontend lookup if opportunity stages should be selectable by name.
4. Add quotation line item update support only if the backend API is extended.
5. Add real file upload only after the document/file storage abstraction is scoped.
