# ZayanMax

ZayanMax is a modular office operations and business management platform. It brings employee administration, customer relationships, projects, finance, purchasing, documents, communication, scheduling, approvals, and reporting into one company-scoped system.

The repository contains a working NestJS API and a Next.js application. The product is under active development and is not yet a production release.

## What is implemented

### Backend

- JWT authentication, refresh sessions, password management, and role-based permissions
- Companies, branches, departments, designations, employees, and audit logs
- Clients, contacts, activities, notes, and document metadata
- Projects, tasks, members, assignees, comments, attachments, and Kanban data
- Attendance, leave, holidays, payroll, performance, and recruitment workflows
- Sales leads, opportunities, quotations, invoices, receipts, and receivables
- Expenses, vendors, vendor bills, petty cash, purchasing, inventory, and assets
- Documents, knowledge base, announcements, notifications, and reminders
- Calendar events, attendees, meeting resources, and resource bookings
- Helpdesk tickets, approval workflows, dashboards, report metadata, and health checks
- Company-scoped data access, permission guards, audit trails, validation, and Swagger/OpenAPI documentation

### Frontend

- Authentication and a permission-aware application shell
- Dashboard summary screens
- Employees and HR master data
- Clients and CRM
- Projects and tasks
- Sales, quotations, billing, and receivables
- Finance, expenses, vendors, and petty cash
- Purchasing, inventory, and asset management
- Documents and knowledge base
- Announcements, notifications, reminders, and preferences
- Calendar, meetings, and resource booking

## Technology

| Area | Technology |
| --- | --- |
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query |
| Backend | NestJS 11, TypeScript, Prisma 6 |
| Data | PostgreSQL 16 and Redis 7 |
| API | REST under `/api/v1` with Swagger/OpenAPI |
| Local services | Docker Compose |

## Repository layout

```text
apps/
  backend/     Runnable NestJS API, Prisma schema, migrations, and tests
  frontend/    Runnable Next.js application
```

The runnable applications are under `apps/`. Architecture notes, API references, implementation plans, prompts, status reports, and handover material are maintained separately on the [documentation branch](https://github.com/Naveen4703/zayanmax/tree/docs).

## Run locally

### Requirements

- Node.js and npm
- Docker Desktop with Docker Compose
- Git

### 1. Clone the repository

```powershell
git clone https://github.com/Naveen4703/zayanmax.git
Set-Location zayanmax
```

### 2. Start the backend

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

The API runs at `http://localhost:4000/api/v1`.

- Swagger UI: `http://localhost:4000/api/docs`
- OpenAPI JSON: `http://localhost:4000/api/docs-json`
- Health endpoint: `http://localhost:4000/api/v1/health`

The seed creates development data, including a local administrator account. Review `apps/backend/prisma/seed.ts` before using seeded credentials.

### 3. Start the frontend

Open a second PowerShell window from the repository root:

```powershell
Set-Location apps/frontend
Copy-Item .env.example .env.local
# Set NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api/v1 in .env.local
npm install
npm run dev
```

Open `http://localhost:3000`.

## Verification

Backend checks:

```powershell
Set-Location apps/backend
npm run prisma:validate
npm run typecheck
npm test -- --runInBand
npm run test:e2e -- --runInBand
npm run build
```

The end-to-end suite requires the local PostgreSQL service, applied migrations, and seed data.

Frontend checks:

```powershell
Set-Location apps/frontend
npm run typecheck
npm run lint
npm run build
```

## Railway deployment

Railway deployment uses the project-level Infrastructure-as-Code definition in
[`/.railway/railway.ts`](./.railway/railway.ts) with four resources: frontend,
backend, managed PostgreSQL, and managed Redis. Legacy `railway.json` and
`railway.toml` Config-as-Code files are not used.

- [Railway deployment guide](./docs/RAILWAY_DEPLOYMENT.md)
- [Railway variable matrix](./docs/RAILWAY_VARIABLES.md)
- [Railway readiness report](./RAILWAY_READINESS.md)

The repository is prepared locally only. Linking, planning, applying, pushing,
and deploying require a separate authorized operation.

## Current status

ZayanMax has broad backend coverage and working frontend flows through Calendar and resource booking. The next planned frontend area is Helpdesk.

The following infrastructure is not complete:

- Background queue workers and scheduled execution
- Binary file storage and real upload/download flows
- Email, WhatsApp, and push-notification delivery
- Real report export generation
- Payment gateway, reconciliation, and accounting-ledger integrations
- Invoice and quotation PDF generation
- Production deployment configuration and operational monitoring

See [current status](https://github.com/Naveen4703/zayanmax/blob/docs/docs/status/current-status.md) and [next-session handover](https://github.com/Naveen4703/zayanmax/blob/docs/docs/handover/next-session.md) for detailed implementation notes.

## Documentation

- [Documentation index](https://github.com/Naveen4703/zayanmax/tree/docs)
- [System architecture](https://github.com/Naveen4703/zayanmax/blob/docs/architecture/system-architecture.md)
- [System design](https://github.com/Naveen4703/zayanmax/blob/docs/architecture/system-design.md)
- [API contract](https://github.com/Naveen4703/zayanmax/blob/docs/docs/api/api-contract.md)
- [Swagger and OpenAPI](https://github.com/Naveen4703/zayanmax/blob/docs/docs/api/swagger-openapi.md)
- [Authentication and permissions](https://github.com/Naveen4703/zayanmax/blob/docs/docs/security/auth-rbac.md)
- [Backend platform hardening](https://github.com/Naveen4703/zayanmax/blob/docs/docs/backend/platform-hardening.md)

## Project note

This repository is currently maintained as an internal product codebase. Configuration values in `.env.example` files are development defaults and must be replaced with secure environment-specific values before deployment.
