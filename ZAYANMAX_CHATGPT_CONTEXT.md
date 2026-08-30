# ZayanMax Complete Project Context

> **Snapshot date:** 2026-08-29 (Asia/Kolkata)
> **Repository:** `https://github.com/zayanmax/zayanmax.git`
> **Application branch:** `main` at `bc2150ac9d6a3da3ad3816666411d9400c003b3d`
> **Documentation branch:** `docs` at `2bbaf3574cf8f80e73487bf20b2d4dedfbfea734`
> **Product maturity:** broad development implementation; not production-ready
> **License/package status:** backend package is private and `UNLICENSED`; frontend package is private; maintained as an internal product codebase

## 1. How to use this file

This is a self-contained context briefing for a ChatGPT conversation about ZayanMax. Upload this file or paste it into a new chat before asking for architecture advice, implementation plans, debugging help, product decisions, or handover notes.

Treat evidence in this order:

1. Current source code under `apps/backend` and `apps/frontend`.
2. This snapshot and its fresh verification results.
3. Architecture and module documents on the `docs` branch.
4. Historical plans and status notes, which may describe intended work or older verification.

In this document, **implemented** means source code exists in the current checkout and the relevant application currently compiles. It does not mean production deployment, operational readiness, or every possible CRUD operation is complete.

## 2. Executive summary

ZayanMax, displayed in the UI as **Zayan Max**, is a company-scoped office operations and business management platform. Its goal is to put employee administration, CRM, projects, sales, billing, finance, purchasing, inventory, assets, documents, communication, scheduling, approvals, helpdesk, dashboards, and reporting into one permission-controlled system.

The product is built as a **TypeScript modular monolith**:

- A NestJS REST API owns business logic and PostgreSQL access.
- A Next.js web application provides the administrator and employee portal.
- PostgreSQL stores transactional and metadata records.
- Redis is provisioned locally for future queues/background work but is not wired into application behavior yet.
- JWTs and permission keys control access.
- Almost all business records are explicitly scoped by `companyId`, with optional `branchId` where relevant.

The API covers nearly all planned business domains, while the frontend combines mature API-backed operational modules with an explicit presenter layer for the remaining demo surfaces. Attendance/Leave, Payroll, Performance, Recruitment, Helpdesk, Approvals, Reports, and key administration routes now have browser-local presenter screens; they are useful for demonstration but are not yet wired to their corresponding backend APIs.

## 3. Product purpose and boundaries

### What ZayanMax is

ZayanMax is intended to be an internal operating system for a company or a future multi-company SaaS product. It supports role-aware work by administrators, HR teams, managers, finance teams, sales teams, operations staff, and employees.

Core product themes:

- One company-scoped source of truth for people and operations.
- Modular business domains with consistent API conventions.
- Permission checks based on fine-grained permission keys rather than hard-coded role names.
- Auditable mutations and status transitions.
- Reusable metadata patterns for attachments, comments, activities, notifications, and approvals.
- Multi-branch and future multi-tenant readiness from the data model onward.

### What ZayanMax is not yet

ZayanMax is not yet a production SaaS deployment. It currently has no completed production hosting configuration, queue workers, real binary file storage, external notification delivery, payment gateway, accounting ledger, PDF generation, real report export generation, or operational monitoring stack.

The source contains metadata structures for several of these capabilities, but metadata records must not be confused with executed background jobs, delivered messages, stored files, or generated reports.

## 4. Current repository snapshot

| Item | Current value |
| --- | --- |
| Default application branch | `main` |
| Documentation branch | `docs` |
| Current `main` commit | `bc2150a` — `Move documentation to docs branch` |
| Remote synchronization before this file was added | `main` and `docs` both `0/0` ahead/behind their upstreams |
| Tracked files on `main` | 622 |
| Backend tracked files | 230 |
| Frontend tracked files | 390 |
| Backend source files | 196 |
| Frontend source files | 372 |
| Prisma migrations | 18 |
| Prisma models | 136 |
| Prisma enums | 66 |
| NestJS controllers | 32 |
| REST handler decorators | 343 |
| Seeded permission keys | 69 |
| Frontend `page.tsx` files | 122, including 82 static-path files and 40 dynamic-path files |

Application code is intentionally kept on `main`. Architecture notes, module documents, plans, prompts, status reports, and handover material are intentionally kept on `docs`.

## 5. High-level architecture

```text
Browser
  |
  | Next.js 16 + React 19 UI
  | TanStack Query + Axios + Zustand + React Hook Form/Zod
  v
NestJS REST API at /api/v1
  |
  | JWT authentication
  | Permission guards
  | DTO validation
  | Business services
  | Audit writes / metadata records
  v
Prisma ORM
  |
  v
PostgreSQL 16

Redis 7 is available in Docker Compose, but queues/workers are not wired.
External providers and S3-compatible storage are planned, not implemented.
```

### Architectural style

The backend is a modular monolith. Each business area has a NestJS module containing its controller, service, DTOs, tests, and Prisma-backed behavior. This preserves domain boundaries without adding microservice deployment complexity. Heavy domains such as notifications, report generation, search, or payroll could be extracted later if load or organizational needs justify it.

### Backend request lifecycle

The usual request path is:

```text
HTTP request
→ global /api/v1 prefix
→ Helmet/CORS/cookie-parser middleware
→ JWT guard
→ permission guard
→ DTO validation and transformation
→ controller
→ domain service
→ Prisma/PostgreSQL
→ audit/related metadata updates where implemented
→ global success response wrapper
```

Global validation uses `whitelist: true`, `forbidNonWhitelisted: true`, and `transform: true`. Unknown DTO properties are rejected.

Successful non-paginated responses use:

```json
{
  "success": true,
  "message": "Request completed successfully",
  "data": {}
}
```

Paginated responses use:

```json
{
  "success": true,
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 0,
    "totalPages": 0
  }
}
```

Errors use:

```json
{
  "success": false,
  "message": "Permission denied",
  "errorCode": "FORBIDDEN",
  "details": null
}
```

### Frontend architecture

The frontend uses the Next.js App Router. Its main layers are:

- `src/app`: route files and protected/auth layouts.
- `src/features`: domain-specific pages, API hooks, schemas, types, and UI composition.
- `src/components`: shared layout, forms, tables, feedback, and shadcn/Radix primitives.
- `src/lib/api`: the central Axios client and endpoint wrappers.
- `src/lib/auth`: local session storage, Zustand auth state, and session events.
- `src/config/navigation.ts`: permission-aware sidebar configuration.
- `src/providers`: TanStack Query and authentication initialization.

Server state is managed by TanStack Query. Local authentication/UI state uses Zustand and React state. Forms use React Hook Form with Zod validation.

The Axios client:

- Reads the API base URL from `NEXT_PUBLIC_API_BASE_URL`.
- Injects the access token into `Authorization: Bearer ...`.
- Unwraps the backend's standard response envelope.
- Maps backend errors into `ApiClientError`.
- Attempts one refresh-token request after a `401`.
- Clears the local session and triggers unauthorized handling when refresh fails.

### Data and tenancy architecture

Prisma 6 connects to PostgreSQL. The schema has 136 models and 66 enums across organizational, HR, CRM, project, sales, finance, document, communication, scheduling, approval, and reporting domains.

Most tenant-owned records have `companyId`; branch-aware records may also have `branchId`. Business services pass the authenticated user's `companyId` into their Prisma filters and writes. This is **application-level tenant scoping**. There is no PostgreSQL row-level security layer or centralized Prisma tenant middleware in the current code, so every new service/query must preserve explicit `companyId` filtering.

UUID identifiers, timestamps, company-scoped uniqueness constraints, indexes, and soft-delete fields are widely used. Soft deletion is common but not universal; behavior depends on the model and service.

### Authentication and authorization

- Login uses email/password with bcrypt password hashing.
- Access and refresh JWTs have separate secrets.
- Defaults are 15 minutes for access tokens and 30 days for refresh tokens.
- JWT payloads contain user ID, company ID, employee ID, email, and permission keys.
- Refresh tokens are bcrypt-hashed in the user/session records.
- Dedicated `UserSession` rows store session metadata, expiration, last use, and revocation.
- Logout revokes active sessions; logout-all is also exposed.
- Change-password and password-reset token records exist.
- Password reset delivery is metadata-only: no email/SMS/WhatsApp delivery provider is wired.
- The frontend stores access token, refresh token, session ID, and user data in browser `localStorage`.
- Authorization checks require every permission listed by a controller decorator.
- The seed creates a `Super Admin` role containing all 69 permission keys.

The permission families include dashboard, employees, attendance, leave, payroll, performance, recruitment, projects, tasks, clients, leads/sales, billing, finance, purchasing, vendors, inventory, assets, documents, calendar, communication, notifications, approvals, reports, helpdesk, settings, roles, permissions, and audit logs.

### API documentation and health

- REST base: `http://localhost:4000/api/v1`
- Swagger UI: `http://localhost:4000/api/docs`
- OpenAPI JSON: `http://localhost:4000/api/docs-json`
- General health: `GET /api/v1/health`
- Liveness: `GET /api/v1/health/live`
- Readiness: `GET /api/v1/health/ready`

## 6. Technology stack

| Layer | Technology |
| --- | --- |
| Frontend framework | Next.js 16.2.10, React 19.2.4, TypeScript 5 |
| Frontend styling/UI | Tailwind CSS 4, shadcn, Radix UI, Base UI, Lucide icons |
| Frontend data/forms | TanStack Query 5, Axios, Zustand 5, React Hook Form 7, Zod 4 |
| Backend framework | NestJS 11, TypeScript 5.7 |
| ORM/database | Prisma 6.19, PostgreSQL 16 |
| Authentication | Passport JWT, Nest JWT, bcrypt |
| API/runtime hardening | class-validator, class-transformer, Helmet, CORS, cookie-parser, Swagger |
| Local infrastructure | Docker Compose, PostgreSQL 16, Redis 7 |
| Backend testing | Jest 30, ts-jest, Supertest |
| Package manager | npm separately in `apps/backend` and `apps/frontend` |

There is no root workspace package manager, monorepo task runner, shared root `package.json`, or CI workflow in the current `main` tree.

## 7. Repository layout and branch policy

```text
ZayanMax/
├── apps/
│   ├── backend/
│   │   ├── prisma/
│   │   │   ├── migrations/       # 18 SQL migration directories
│   │   │   ├── schema.prisma     # 136-model data model
│   │   │   └── seed.ts           # company, permissions, role, dev admin
│   │   ├── src/
│   │   │   ├── common/           # guards, decorators, filters, interceptors, Swagger
│   │   │   ├── config/           # env and CORS validation
│   │   │   ├── database/         # Prisma module/service
│   │   │   └── modules/          # 27 NestJS domain modules
│   │   ├── test/                  # e2e suite
│   │   ├── .env.example
│   │   ├── docker-compose.yml
│   │   └── package.json
│   └── frontend/
│       ├── public/
│       ├── src/
│       │   ├── app/               # App Router pages/layouts
│       │   ├── components/        # shared UI and shell
│       │   ├── config/            # application/navigation config
│       │   ├── features/          # implemented domain screens
│       │   ├── lib/               # API/auth/permission helpers
│       │   ├── providers/
│       │   └── types/
│       ├── .env.example
│       └── package.json
├── README.md
└── ZAYANMAX_CHATGPT_CONTEXT.md    # this generated context file
```

The `docs` branch contains the documentation tree that was intentionally removed from `main`, including:

- `architecture/`
- `backend/`
- `design/`
- `devops/`
- `docs/api/`, `docs/backend/`, `docs/frontend/`, `docs/modules/`, `docs/security/`, `docs/status/`, and `docs/handover/`
- `integrations/`
- historical implementation plans and prompts

Do not assume a plan file proves implementation. Verify the corresponding code in `apps/`.

## 8. Domain implementation status

### Status legend

- **Implemented:** working source surface exists and current compilation/build verification passed.
- **Partial:** meaningful source exists, but workflow, CRUD coverage, or integration is incomplete.
- **Metadata-only:** database/API/UI can store descriptive records, but it does not perform the real external/binary/background action.
- **Not built:** no completed source surface for that layer.

| Domain | Backend status | Frontend status | Important boundaries |
| --- | --- | --- | --- |
| Authentication and sessions | Implemented | Implemented | Login, refresh, logout, logout-all, `/me`, password change, reset-token metadata; no real reset delivery or 2FA UI |
| Companies, branches, departments, designations | Implemented | Implemented plus presenter settings | Branch/department/designation screens are API-backed; company/settings landing is presenter data |
| Users, roles, permissions | Implemented | Presenter data | Permission keys are seeded and enforced; demo management screens are browser-local |
| Employees | Implemented | Implemented | List/create/detail/edit/delete and HR assignment fields |
| Attendance, shifts, leave, holidays | Implemented | Presenter data | Real APIs exist; demo screens use browser-local records and interactions |
| Payroll and salary | Implemented | Presenter data | Real APIs exist; demo screen is local; no ledger, bank file, or PDF payslips |
| Performance and appraisals | Implemented | Presenter data | Real APIs exist; demo screen uses browser-local goals/reviews |
| Recruitment and onboarding | Implemented | Presenter data | Real APIs exist; demo screen uses browser-local candidates and openings |
| Clients and CRM | Implemented | Implemented | Clients, contacts, activities, notes, and document metadata; child update/delete coverage is incomplete |
| Projects and tasks | Implemented | Implemented | Projects, members, tasks, subtasks, assignees, comments, attachment metadata; Kanban is read-only |
| Sales, leads, opportunities, quotations | Implemented | Implemented | Lead and quotation workflows exist; opportunity stage has create but no list endpoint, so UI uses a raw optional stage ID; quotation edits do not update line items |
| Invoices, receipts, receivables | Implemented | Implemented | Invoice lifecycle, quotation conversion, receipts/allocations, statements, aging, credit/debit note metadata; invoice edits do not update line items; no PDF/gateway/ledger |
| Finance, expenses, vendors, petty cash | Implemented | Implemented | Expense and vendor workflows, vendor bills/payments, petty cash; some lookup/master records are list/create only |
| Purchasing, inventory, assets | Implemented | Implemented | Requests, orders, GRN, stock movement/adjustment, asset assignment/maintenance; some child/master CRUD remains incomplete |
| Documents and knowledge base | Implemented as metadata | Implemented as metadata | Folder/category/tag/document/version/link/article records; no binary storage, upload/download, preview, OCR, or sharing |
| Communication and notifications | Implemented as metadata | Implemented as metadata | Announcements, read receipts, notification types/records/preferences/templates/reminders; no external sending, workers, scheduler, WebSocket delivery, or mark-all-read |
| Calendar and resource booking | Implemented | Implemented | Events, attendee RSVP, resources, bookings and reminder metadata; no Google Calendar sync or actual reminder execution; several child fields are create-time only |
| Helpdesk | Implemented | Presenter data | Real APIs exist; demo screen uses browser-local ticket workflows |
| Generic approvals | Implemented | Presenter data | Real APIs exist; demo screen uses browser-local approval workflows |
| Dashboards | Implemented | Implemented foundation | Summary endpoints and overview cards exist; deep role dashboards are incomplete |
| Reports and exports | Metadata-only | Presenter CSV export | Registry/export-request APIs exist; presenter CSV works locally; no backend worker/file generation |
| Audit logs and health | Implemented | Presenter audit viewer | Audit read API and health/live/ready endpoints exist; demo viewer is browser-local |

## 9. Implemented frontend route families

Completed route families include:

- Authentication: `/login`, `/forgot-password`, `/reset-password`, `/change-password`.
- Dashboard: `/dashboard`.
- Employees and HR masters: `/employees`, `/settings/branches`, `/settings/departments`, `/settings/designations`.
- CRM: `/clients` with create, detail, and edit routes.
- Projects and Tasks: `/projects`, `/tasks`, and `/tasks/kanban` with relevant create/detail/edit routes.
- Sales: `/sales/leads`, `/sales/opportunities`, and `/sales/quotations`.
- Billing: `/billing`, `/billing/invoices`, `/billing/receipts`, `/billing/client-statements`.
- Finance: `/finance`, expenses, categories, vendors, vendor bills/payments, and petty cash.
- Purchasing: `/purchase`, purchase requests/orders, and GRNs.
- Inventory and Assets: inventory items/categories/movements/adjustments and asset categories/assignments/maintenance.
- Documents and Knowledge Base: folders, records, categories, tags, articles, and KB categories.
- Communication: announcements, notification templates, reminders, notifications, and notification preferences.
- Calendar: overview, events, personal/company views, resources, and resource bookings.
- Demo completion: `/demo`, `/attendance`, `/leave`, `/payroll`, `/performance`, `/recruitment`, `/helpdesk`, `/approvals`, `/reports`, `/settings`, `/settings/company`, `/settings/users`, `/settings/roles`, `/settings/permissions`, and `/settings/audit-logs`.

The demo-completion routes render complete presenter workflows and are clearly labeled as browser-local presenter data. They support create, search, filter, status advancement, delete, reset, local persistence, and CSV export without pretending to persist to the backend.

## 10. Backend module and API map

All runtime routes are under `/api/v1` unless otherwise stated.

| Module | Main API namespaces |
| --- | --- |
| Auth | `/auth` |
| Companies and HR masters | `/companies`, `/branches`, `/departments`, `/designations`, `/employees` |
| Access control | `/users`, `/roles`, `/permissions`, `/audit-logs` |
| Attendance and leave | `/attendance`, `/shifts`, `/leaves`, `/holidays` |
| Payroll | `/payroll` |
| Performance | `/performance` |
| Recruitment | `/recruitment` |
| CRM | `/clients` |
| Projects and tasks | `/projects`, `/tasks` |
| Sales | `/sales` |
| Billing | `/billing` |
| Finance and vendors | `/finance`, `/vendors` |
| Purchasing, inventory, assets | `/purchases`, `/inventory`, `/assets` |
| Documents and knowledge base | `/document-folders`, `/document-categories`, `/document-tags`, `/documents`, `/knowledge-base` |
| Communication | `/announcements`, `/notification-types`, `/notifications`, `/notification-preferences`, `/notification-templates`, `/reminders` |
| Calendar | `/calendar` |
| Helpdesk | `/helpdesk` |
| Approvals | `/approvals` |
| Dashboard and reports | `/dashboard`, `/reports` |
| Health | `/health` |

Use Swagger/OpenAPI as the endpoint-level contract. The table above is a domain map, not a replacement for DTO and route definitions.

## 11. Key business workflows

### Login and authorized request

```text
Email/password login
→ bcrypt password verification
→ access JWT + refresh JWT + session record
→ frontend stores tokens/session/user in localStorage
→ Axios adds bearer access token
→ JWT strategy reconstructs CurrentUser
→ permission guard checks required keys
→ company-scoped service query
→ standardized API response
```

### Sales-to-cash

```text
Lead
→ opportunity
→ quotation and quotation version metadata
→ invoice or quotation-to-invoice conversion
→ payment receipt and allocation
→ receivable summary / aging / client statement
```

This is an operational billing workflow, not a complete accounting system. General-ledger posting, GST filing, reconciliation, payment gateway behavior, and PDFs are not implemented.

### Procure-to-stock and assets

```text
Purchase request
→ approval/status transition
→ purchase order
→ goods received note
→ stock movement / on-hand update

Inventory item
→ stock adjustment or movement

Asset
→ employee assignment
→ return / maintenance metadata
```

### Project execution

```text
Client
→ project
→ project members
→ tasks and subtasks
→ assignees, comments, attachment metadata, status changes
→ read-only Kanban grouping
```

### Documents and knowledge

```text
Folder/category/tag metadata
→ document metadata record
→ version/link metadata

Knowledge-base category
→ article
→ status and tag metadata
```

No binary content is stored by these flows yet.

### Communication and scheduling

```text
Announcement/notification/reminder/event record
→ in-app metadata and read state
→ future worker/provider delivery (not implemented)
```

Calendar resource collision and booking data are represented, but external calendar synchronization and actual scheduled reminder delivery are absent.

### Approvals and reports

The generic approval engine can define ordered steps, create requests, and record approve/reject/cancel/delegate actions. Existing modules that already have their own status transitions have not all been refactored to use this engine.

Report exports currently create and list export request metadata. No BullMQ worker renders CSV/PDF/XLSX files, stores them, or returns downloads.

## 12. Data model by domain

The complete Prisma schema is `apps/backend/prisma/schema.prisma`. Important model groups include:

- Organization/access: Company, Branch, Department, Designation, Employee, User, Role, Permission, RolePermission, UserRole, AuditLog, UserSession, PasswordResetToken.
- CRM/projects: Client, contacts/activities/notes/documents, Project, ProjectMember, Task, TaskAssignee, TaskComment, TaskAttachment.
- Attendance/leave: Shift, AttendanceRecord, AttendanceCorrectionRequest, LeaveType, LeaveBalance, LeaveRequest, Holiday.
- Payroll: SalaryStructure and components, employee assignments, advances, periods, runs, employee line items, Payslip.
- Finance: ExpenseCategory/Claim/Item/Attachment, Vendor, VendorBill/Item/Payment, PettyCashAccount/Transaction.
- Purchase/inventory/assets: PurchaseRequest/Item, PurchaseOrder/Item, GoodsReceivedNote/Item, InventoryCategory/Item, StockMovement, AssetCategory, Asset, Assignment, MaintenanceRecord.
- Documents/knowledge: folders, categories, tags, records, record tags, versions, links, KB categories/articles/tags.
- Communication/calendar: announcements/audiences/read receipts, notification types/records/deliveries/preferences/templates, reminders, events/attendees/resources/bookings/event reminders.
- Helpdesk: categories, subcategories, tickets, comments, internal notes, attachments.
- Performance/recruitment: cycles, goals, KPI records, review templates/responses, feedback, meetings, recommendations, jobs, candidates, stages, applications, interviews, offers, onboarding checklists/items.
- Sales/billing: lead sources/stages/leads/activities/notes, opportunity stages/opportunities, quotations/items/versions, invoice series/invoices/items, receipts/allocations, credit notes, debit notes.
- Approvals/reports: workflow definitions/steps, requests/step instances/action records, report export requests.

## 13. Local development

### Prerequisites

- Node.js and npm.
- Docker Desktop with Docker Compose.
- Git.

### Backend services and ports

Docker Compose defines:

- PostgreSQL 16 at host port `5434` and container port `5432`.
- Redis 7 at host port `6379`.

The nonstandard PostgreSQL host port avoids a previously detected local service on `5432`.

### Backend startup

```powershell
Set-Location apps/backend
Copy-Item .env.example .env
npm install
docker compose up -d postgres redis
npm run prisma:generate
npx prisma migrate deploy
npm run prisma:seed
npm run start:dev
```

The seed currently creates development-only credentials:

- Email: `admin@zayan.test`
- Password: `Password123`

These credentials and all example secrets must be replaced before any shared or production deployment.

### Frontend startup

```powershell
Set-Location apps/frontend
Copy-Item .env.example .env.local
# NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api/v1
npm install
npm run dev
```

Open `http://localhost:3000`.

`apps/frontend/.env.example` now points to the backend on port `4000`, matching the local architecture.

### Backend environment variables

Validated required variables:

- `DATABASE_URL`
- `REDIS_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `JWT_ACCESS_EXPIRES_IN`
- `JWT_REFRESH_EXPIRES_IN`

Other current/example variables include `NODE_ENV`, `PORT`, `BUILD_VERSION`, `BUILD_SHA`, `FRONTEND_URL`, `CORS_ORIGINS`, storage/S3 settings, SMTP settings, and WhatsApp provider settings. Storage, email, and WhatsApp settings are placeholders until provider implementations exist.

## 14. Fresh verification on 2026-08-29

The following checks were run against the current `main` checkout:

| Check | Result |
| --- | --- |
| `apps/backend: npm run prisma:validate` | Passed; schema valid. Prisma warns that `package.json#prisma` configuration is deprecated before Prisma 7. |
| `apps/backend: npm run typecheck` | Passed. |
| `apps/backend: npm test -- --runInBand` | Passed: 23 suites, 109 tests, 0 failures. |
| `apps/backend: npm run build` | Passed. |
| `apps/frontend: npm run typecheck` | Passed. |
| `apps/frontend: npm run lint` | Passed with `--max-warnings=0`. |
| `apps/frontend: npm run build` | Passed using Next.js 16.2.10/Turbopack. |
| `apps/backend: npm run test:e2e -- --runInBand` | Passed against the running local PostgreSQL/Redis stack: 1 suite, 21 tests, 0 failures. |
| `apps/backend: npm run prisma:seed:demo` twice | Passed with identical record counts; the seed is repeatable and additive. |
| Authenticated representative API sweep | 16 API surfaces returned HTTP 200 with populated data. |
| Browser route/interaction QA | All 15 demo-completion routes returned 200 with expected headings and no horizontal overflow; presenter create/search/filter/status/reset/CSV flows passed. |
| Frontend automated tests | No frontend test files or test script exist. Typecheck, lint, and production build are the current frontend gates. |

The checkout was clean and matched `origin/main` before the demo-completion work began. The context file, demo patch, demo seed, QA fix, status document, and browser evidence now intentionally make the working tree differ from the published commit until the user chooses to commit it.

### Current dependency audit status

Fresh `npm audit --omit=dev` checks do **not** pass:

- Backend: 6 vulnerabilities reported — 1 low and 5 high. Reported production-path packages include `body-parser`, `deepmerge-ts` through Prisma configuration, and `js-yaml` through Nest Swagger.
- Frontend: 11 vulnerabilities reported — 2 moderate and 9 high. Reported packages include Next.js 16.2.10 and its PostCSS/Sharp paths, plus Hono-related packages, `brace-expansion`, `fast-uri`, `ip-address`, `js-yaml`, `nanoid`, and `undici`.

Some fixes are available through normal `npm audit fix`; other suggested fixes require dependency changes outside the currently declared range. Dependency remediation must be planned and regression-tested rather than applying `--force` blindly.

## 15. Known gaps, risks, and technical debt

### Production and operations

- No production Dockerfile, deployment manifest, reverse proxy, Kubernetes/Helm setup, Vercel/Railway/Render configuration, or CI workflow is present on `main`.
- No centralized logging, metrics, tracing, alerting, backups, disaster recovery, or production secret-management configuration is implemented.
- Readiness endpoints exist, but operational monitoring around them does not.

### Integrations and background work

- Redis is configured but no BullMQ dependency/module, queue producer, worker, scheduler, or retry/dead-letter behavior is implemented.
- No SMTP/email, WhatsApp, SMS, push, biometric, Google Calendar, payment, or accounting provider is wired.
- Reminder, notification delivery, payslip, document, attachment, and report export records are often metadata-only.

### Files and generated output

- No S3-compatible storage adapter, signed URL flow, binary upload/download, antivirus scan hook, preview, OCR, or retention policy is implemented.
- Invoice, quotation, and payslip PDFs are not generated.
- Report export files are not generated.

### Security and tenancy

- Current dependency audits report unresolved vulnerabilities.
- Browser tokens are stored in `localStorage`; production hardening should explicitly review XSS exposure and alternative session/token storage designs.
- Tenant isolation is implemented by explicit service filters, not database RLS or centralized middleware. New code can create cross-company exposure if it omits `companyId` checks.
- Development credentials and placeholder JWT secrets exist in examples/seed data and must never be reused in a deployed environment.
- Two-factor authentication and real password-reset delivery are not implemented.

### API/product completeness

- Several master and child resources have only list/create or create-time support, not full update/delete/detail operations.
- Some domain-local approval statuses remain separate from the generic approval engine.
- Opportunity stages cannot currently be listed by the frontend.
- Quotation and invoice edit APIs do not update line items.
- Calendar attendees, resource bookings, linked entities, and reminders are largely create-time metadata.
- Calendar resource filtering in the event UI is client-side for only the loaded page because the backend event list lacks `resourceId` filtering.
- No mark-all-notifications-read endpoint exists.

### Frontend completeness

- Demo-completion screens for Attendance/Leave, Payroll, Performance, Recruitment, Helpdesk, Approvals, Reports, audit logs, role/permission management, and company settings currently use presenter-local data rather than their real backend APIs.
- Task Kanban has no drag-and-drop mutation flow.
- No reusable user picker exists; some assignment forms use employee lookup or raw IDs.
- There are no frontend unit, integration, or browser e2e tests.

### Developer experience

- Backend and frontend use separate npm installations with no root orchestration.
- Prisma configuration must move from `package.json` to `prisma.config.ts` before Prisma 7.

## 16. Recommended next milestones

Recommended order based on current code boundaries:

1. Resolve current backend/frontend dependency audit findings with controlled upgrades and full regression checks.
2. Add root-level developer orchestration and CI gates.
3. Replace the Helpdesk, Approvals, and Reports presenter stores with their existing backend APIs.
4. Replace Attendance/Leave, Payroll, Performance, and Recruitment presenter stores with their existing backend APIs.
5. Replace presenter administration records with real user, role, permission, audit, and company-settings queries.
6. Design and implement file storage before adding any real document/task/client attachment upload.
7. Introduce Redis/BullMQ workers for reminders, notification delivery, and report exports.
8. Add provider interfaces and one real delivery path at a time, starting with password reset/email if required.
9. Add invoice/quotation/payslip PDF generation and secure download storage.
10. Define the accounting, tax, payment, reconciliation, monitoring, deployment, backup, and security model before calling the system production-ready.

## 17. Rules for future ChatGPT work on ZayanMax

When advising or changing this project:

1. Inspect the actual checkout, branch, Git state, and current files before claiming status.
2. Keep runnable code on `main` and documentation/prompts on `docs` unless the user explicitly changes that policy.
3. Do not describe a docs plan, Prisma model, metadata record, or navigation link as a completed end-to-end feature.
4. Preserve the NestJS modular-monolith architecture unless there is measured evidence for extracting a service.
5. Preserve `/api/v1`, standard response envelopes, DTO validation, permission decorators, audit behavior, and explicit `companyId` scoping.
6. Never add a tenant-owned query without proving company scoping.
7. Reuse existing frontend feature patterns, shared UI, Axios client, TanStack Query, Zustand auth store, React Hook Form, and Zod.
8. Read the version-specific Next.js guidance in `apps/frontend/node_modules/next/dist/docs/` before changing Next.js code; the repository's `AGENTS.md` explicitly requires this.
9. Treat file, notification, reminder, report export, and payslip behavior as metadata-only until real storage/workers/providers exist.
10. Do not expose `.env` values or production secrets. Example/seed credentials are development-only.
11. Do not run automatic breaking dependency fixes without reviewing lockfile changes and running typecheck, tests, lint, builds, and e2e checks.
12. Do not claim production readiness from successful local compilation.
13. When reporting a push, verify local HEAD, upstream, remote SHA, divergence, and worktree state.
14. Keep changes focused and contract-preserving; add missing endpoints only when a UI or workflow needs them.

## 18. Verification commands for future work

Backend:

```powershell
Set-Location apps/backend
npm run prisma:validate
npm run typecheck
npm test -- --runInBand
npm run test:e2e -- --runInBand
npm run build
npm audit --omit=dev
```

The e2e suite requires PostgreSQL, migrations, and suitable seed/test data.

Frontend:

```powershell
Set-Location apps/frontend
npm run typecheck
npm run lint
npm run build
npm audit --omit=dev
```

Git publication evidence:

```powershell
git status --short --branch
git branch -vv
git remote -v
git rev-parse HEAD
git rev-parse '@{u}'
git rev-list --left-right --count HEAD...'@{u}'
git ls-remote --heads origin
```

## 19. Documentation references

Key files on `main`:

- `README.md`
- `apps/backend/package.json`
- `apps/backend/.env.example`
- `apps/backend/docker-compose.yml`
- `apps/backend/prisma/schema.prisma`
- `apps/backend/prisma/seed.ts`
- `apps/backend/src/main.ts`
- `apps/backend/src/app.module.ts`
- `apps/frontend/package.json`
- `apps/frontend/.env.example`
- `apps/frontend/src/config/navigation.ts`
- `apps/frontend/src/lib/api/client.ts`
- `apps/frontend/src/lib/auth/auth-store.ts`
- `apps/frontend/src/lib/auth/token-storage.ts`

Key documents on the `docs` branch:

- `architecture/system-architecture.md`
- `architecture/system-design.md`
- `backend/database-design.md`
- `backend/api-structure.md`
- `backend/modules.md`
- `docs/api/api-contract.md`
- `docs/api/swagger-openapi.md`
- `docs/backend/platform-hardening.md`
- `docs/backend/security-audit.md`
- `docs/frontend/api-consumption.md`
- `docs/status/current-status.md`
- `docs/handover/next-session.md`
- domain documents under `docs/modules/` and `docs/frontend/`

GitHub links:

- Application code: `https://github.com/Naveen4703/zayanmax/tree/main`
- Documentation index: `https://github.com/Naveen4703/zayanmax/tree/docs`
- System architecture: `https://github.com/Naveen4703/zayanmax/blob/docs/architecture/system-architecture.md`
- Current historical status document: `https://github.com/Naveen4703/zayanmax/blob/docs/docs/status/current-status.md`

## 20. Glossary

- **Company scope:** Tenant boundary represented by `companyId`.
- **Branch:** A company operating location, distinct from a Git branch.
- **Permission key:** Fine-grained authorization string such as `clients.view` or `billing.manage`.
- **Metadata-only:** A record describes an intended artifact/action, but no binary content, provider call, background execution, or generated output exists.
- **GRN:** Goods Received Note created when purchase-order items are received.
- **RBAC:** Role-based access control; roles aggregate permission keys.
- **DTO:** Validated API request object used by NestJS controllers.
- **Modular monolith:** One deployable backend organized into domain modules.
- **Soft delete:** Marking a record deleted with `deletedAt` instead of physically removing it.
- **RLS:** PostgreSQL row-level security; not currently used.

## 21. One-paragraph project briefing

ZayanMax is a TypeScript office-operations platform built as a NestJS 11 modular monolith with Prisma/PostgreSQL and a Next.js 16/React 19 web portal. The API has broad company-scoped coverage across HR, CRM, projects, sales, billing, finance, purchasing, inventory, assets, documents, communication, scheduling, helpdesk, approvals, dashboards, and report metadata. Major operational frontend modules are API-backed, while 15 explicit demo-completion routes provide browser-local presenter workflows for remaining HR, workflow, reporting, and administration surfaces. A separate deterministic Prisma demo seed populates coherent company data and can be rerun safely. File handling, external notification delivery, reminders, backend report generation, and payslips remain metadata-only because storage providers, workers, integrations, and generated outputs are not yet implemented. The system is demo-ready locally but remains a development implementation, not a production release.
