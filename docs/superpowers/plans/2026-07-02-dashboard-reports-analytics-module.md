# Dashboard, Reports & Analytics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add backend-only dashboard summary APIs plus report registry and export-request metadata.

**Architecture:** Follow the existing NestJS modular monolith pattern with one module under `apps/backend/src/modules/dashboard-reports`. Dashboard endpoints read existing company-scoped domain tables; report export requests persist metadata only in Prisma.

**Tech Stack:** NestJS, Prisma, PostgreSQL, Jest, Supertest, class-validator.

---

### Task 1: Tests First

**Files:**
- Create: `apps/backend/src/modules/dashboard-reports/dashboard-reports.service.spec.ts`
- Modify: `apps/backend/test/app.e2e-spec.ts`

- [ ] Add failing unit tests for dashboard summary aggregation, report registry metadata, export-request creation, and paginated export-request listing.
- [ ] Add failing e2e coverage for `GET /api/v1/dashboard/summary`, `GET /api/v1/reports/registry`, `GET /api/v1/reports/metadata/:reportType`, `POST /api/v1/reports/export-requests`, and `GET /api/v1/reports/export-requests`.
- [ ] Run focused tests and confirm failure because the module/endpoints do not exist.

### Task 2: Prisma Export Metadata

**Files:**
- Modify: `apps/backend/prisma/schema.prisma`
- Create: `apps/backend/prisma/migrations/20260702090000_dashboard_reports_analytics/migration.sql`

- [ ] Add `ReportExportFormat`, `ReportExportStatus`, and `ReportExportRequest` with `companyId`, `requestedByUserId`, `reportType`, `requestedFilters`, `format`, `status`, placeholder file metadata, timestamps, and indexes.
- [ ] Link `Company.reportExportRequests` and `User.reportExportRequests`.

### Task 3: Dashboard Reports Module

**Files:**
- Create: `apps/backend/src/modules/dashboard-reports/dto/dashboard-reports.dto.ts`
- Create: `apps/backend/src/modules/dashboard-reports/dashboard-reports.service.ts`
- Create: `apps/backend/src/modules/dashboard-reports/dashboard-reports.controller.ts`
- Create: `apps/backend/src/modules/dashboard-reports/dashboard-reports.module.ts`
- Modify: `apps/backend/src/app.module.ts`

- [ ] Implement date range DTOs, export request DTOs, and listing filters.
- [ ] Implement company, HR, project/task, CRM/sales, finance, inventory/assets, helpdesk, approvals, and calendar summaries.
- [ ] Implement report registry, generic metadata lookup, export-request create, and export-request list.
- [ ] Wire controller guards with `dashboard.view`, `reports.view`, and `reports.export`.

### Task 4: Docs

**Files:**
- Create: `docs/modules/dashboard-reports.md`
- Modify: `docs/api/api-contract.md`
- Modify: `docs/status/current-status.md`
- Modify: `docs/handover/next-session.md`

- [ ] Document scope, endpoints, filters, permissions, export metadata behavior, exclusions, and verification.

### Task 5: Verification

- [ ] Run `npm run prisma:validate`.
- [ ] Run `npm run typecheck`.
- [ ] Run `npm run lint`.
- [ ] Run `npm test -- --runInBand`.
- [ ] Run `npm run test:e2e -- --runInBand`.
- [ ] Run `npm run build`.
