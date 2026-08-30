# ZayanMax Demo Status

Last verified: 2026-08-29
Local demo URL: `http://localhost:3000/demo`
Backend API: `http://localhost:4000/api/v1`
Swagger UI: `http://localhost:4000/api/docs`

## Readiness summary

ZayanMax is ready for a local 10–15 minute product demonstration. The NestJS API, PostgreSQL database, Redis service, Next.js portal, authentication flow, real business-module data, and presenter-only completion screens have been exercised together.

The product remains a development system, not a production release. External delivery providers, generated files, binary document storage, background workers, production deployment infrastructure, and security hardening remain outside this demo-completion scope.

## Demo login

- Email: `admin@zayan.test`
- Password: `Password123`
- Role: Super Admin
- Scope: seeded local company only

These are local development credentials. Never reuse them in a shared or production environment.

## What is demo-ready

### Real backend/API-backed areas

- Dashboard and HR dashboard summaries
- Employees, branches, departments, and designations
- Clients and client contacts
- Projects, project members, tasks, and task assignees
- Leads, opportunity pipeline, and quotations
- Invoices, receipts, allocations, and receivables
- Expense claims, categories, vendors, and vendor bills
- Purchase requests, purchase orders, inventory, and stock movements
- Assets and employee asset assignments
- Documents, versions, and knowledge-base articles
- Announcements and internal notifications
- Calendar events, attendees, resources, and bookings
- Existing backend APIs for attendance/leave, payroll, performance, recruitment, helpdesk, approvals, reports, users, roles, permissions, audit logs, and settings

### Presenter-data completion screens

The following routes are intentionally backed by browser-local demo data so they remain fast, coherent, and safe during a presentation:

- `/attendance`
- `/leave`
- `/payroll`
- `/performance`
- `/recruitment`
- `/helpdesk`
- `/approvals`
- `/reports`
- `/settings`
- `/settings/company`
- `/settings/users`
- `/settings/roles`
- `/settings/permissions`
- `/settings/audit-logs`

The `/demo` route is the presenter launchpad and labels API-backed and presenter-data destinations explicitly.

Presenter screens support:

- KPI cards and believable starter records
- Search and status filtering
- Creating a record in a modal
- Advancing records through status stages
- Deleting presenter records
- Resetting a module or all presenter data
- CSV export
- Browser-local persistence between page visits

## Demo dataset

Run `npm run prisma:seed:demo` from `apps/backend` to create or refresh the additive demo dataset. The script uses stable identifiers and upserts; it does not reset the database or duplicate its own records.

The current local company contains at least:

| Area | Current active count |
| --- | ---: |
| Branches | 3 |
| Departments | 8 |
| Employees | 33 |
| Clients | 12 |
| Projects | 8 |
| Tasks | 33 |
| Leads | 13 |
| Quotations | 8 |
| Invoices | 10 |
| Expense claims | 9 |
| Vendors | 7 |
| Purchase requests | 6 |
| Inventory items | 16 |
| Assets | 11 |
| Documents | 6 |
| Knowledge-base articles | 5 |
| Announcements | 4 |
| Internal notifications | 7 |
| Calendar events | 7 |

Counts include any compatible records that already existed in the local seeded company. Running the demo seed repeatedly keeps these counts stable unless a user adds or removes records independently.

## Start from a clean local checkout

### Backend and dependencies

```powershell
Set-Location apps/backend
docker compose up -d postgres redis
npm install
npm run prisma:generate
npx prisma migrate deploy
npm run prisma:seed
npm run prisma:seed:demo
npm run start:dev
```

### Frontend

In a second terminal:

```powershell
Set-Location apps/frontend
npm install
Copy-Item .env.example .env.local
npm run dev
```

The checked-in frontend environment example points to `http://localhost:4000/api/v1`.

The supplied helper script at `C:\Users\naveenxd\Downloads\zayanmax-demo-ready-patch\start-zayanmax-demo.ps1` also runs migrations, the base seed, and the demo seed before launching both applications.

## Presenter reset procedure

### Reset browser-local presenter data

Use either:

1. `Reset presenter data` on `/demo` to reset every presenter module.
2. `Reset data` on an individual presenter screen to reset only that module.

This does not modify PostgreSQL records.

### Refresh real backend demo data

```powershell
Set-Location apps/backend
npm run prisma:seed
npm run prisma:seed:demo
```

Both commands are additive/idempotent for their own seeded records. They are not destructive database resets.

## Recommended 10–15 minute presentation

1. Open `/demo` and explain the system coverage map.
2. Open `/dashboard` to show company KPIs, project/task progress, receivables, inventory, and upcoming work.
3. Open `/employees`, `/clients`, and `/projects` to show real API-backed master and operational records.
4. Open `/sales/leads`, `/sales/quotations`, and `/billing/invoices` to explain lead-to-cash.
5. Open `/attendance` or `/leave`; demonstrate search, a status filter, record creation, status advancement, and reset.
6. Open `/helpdesk` and `/approvals` to demonstrate operational workflows.
7. Finish on `/reports`, export CSV, then show `/settings/roles`, `/settings/permissions`, and `/settings/audit-logs`.

## Verification evidence

- All 15 requested new routes returned HTTP 200 in an authenticated browser session.
- All 15 routes rendered the expected H1 and had no horizontal viewport overflow at 1366×768.
- `/demo` was visually checked at 1366×768 and 1920×1080.
- Fresh route sweeps after the breadcrumb fix produced no browser console errors or warnings.
- Presenter search narrowed attendance to one matching record.
- Presenter status filtering returned the expected subset.
- A new attendance record was created and persisted locally.
- Status advancement changed the new record and updated KPI/filter counts.
- Reset restored the five original attendance presenter records.
- CSV export downloaded `zayanmax-attendance-demo.csv`.
- The real login API returned an admin session with all seeded permissions.
- Sixteen representative authenticated API endpoints returned HTTP 200 with populated data.
- `npm run prisma:seed:demo` was run repeatedly with identical counts.
- Backend Prisma validation, typecheck, lint, build, 109 unit tests, and 21 database-backed end-to-end tests passed.
- Frontend typecheck, zero-warning lint, and the 100-route Next.js production build passed.

Browser captures:

- `output/playwright/demo-1366x768-clean.png`
- `output/playwright/demo-1920x1080.png`

## Known non-blocking limitations

- Presenter-data screens are intentionally local browser demonstrations; they do not write to the corresponding backend domain tables.
- Redis is available locally but background queues/workers are not implemented.
- Document/task/client attachments and document versions currently store metadata; binary storage and downloads are not implemented.
- Notification/reminder records do not invoke real email, SMS, WhatsApp, push, or scheduler providers.
- Report export requests do not have a backend file-generation worker; the presenter reports screen provides immediate client-side CSV export for the demo.
- Invoice, quotation, and payslip PDFs are not generated.
- No payment gateway, accounting ledger, GST filing, biometric device, or external calendar integration is wired.
- Production deployment, observability, backups, secret management, and dependency remediation remain separate work.

## Final presenter checklist

- [ ] Docker Desktop is running.
- [ ] PostgreSQL container is healthy on host port 5434.
- [ ] Redis container is healthy on host port 6379.
- [ ] Backend health returns 200 at `/api/v1/health`.
- [ ] Swagger loads at `/api/docs`.
- [ ] Frontend loads at port 3000.
- [ ] Login succeeds with the development account.
- [ ] `/demo` shows “Demo route coverage ready”.
- [ ] Dashboard shows populated company data.
- [ ] Presenter records are reset before the audience joins.
- [ ] Browser zoom is 100% and the sidebar starts at the top.
- [ ] No production or customer database is connected.
