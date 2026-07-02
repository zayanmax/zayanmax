# System Architecture

## Goal

Zayan Max is a full-fledged internal office management system for company operations. It should support HR, attendance, payroll, CRM, projects, finance, inventory, approvals, documents, helpdesk, reporting, and automation.

## Architecture Style

Use a modular monolith first, built with NestJS modules. This gives clean domain separation without the deployment complexity of microservices. Each module owns its domain logic, controllers, services, DTOs, and database models.

Microservices can be extracted later for heavy domains such as payroll processing, search, notifications, or reporting if needed.

## High-Level Components

```text
Client Apps
├── Web App: Next.js Admin/Employee Portal
├── Mobile App: React Native / Expo
└── External Integrations: WhatsApp, Email, Biometric, Calendar

API Layer
├── NestJS REST API
├── Authentication Middleware
├── RBAC / Permission Guards
├── Request Validation
└── Rate Limiting

Business Modules
├── HR & Employees
├── Attendance & Leave
├── Payroll
├── Projects & Tasks
├── Clients & CRM
├── Sales & Leads
├── Finance
├── Purchases & Vendors
├── Inventory & Assets
├── Documents
├── Approvals
├── Calendar
├── Helpdesk
├── Reports
└── Admin Settings

Infrastructure
├── PostgreSQL
├── Redis
├── BullMQ Workers
├── S3-compatible File Storage
├── Meilisearch / OpenSearch
└── Logging / Monitoring
```

## Core Shared Services

### Auth Service
Handles login, logout, refresh tokens, password reset, 2FA, sessions, and device tracking.

### Permission Service
Handles role-based and permission-based access.

### Approval Engine
Generic workflow engine used by leave, expense, purchase, document, salary advance, payment, and admin requests.

### Notification Service
Central place for in-app, email, WhatsApp, SMS, and push notifications.

### File Service
Handles uploads, downloads, document permissions, file metadata, virus scan hooks, and storage provider abstraction.

### Audit Log Service
Stores all sensitive system activity.

### Report Service
Generates exportable reports and dashboards.

## Recommended Request Flow

```text
Frontend Request
→ Auth Middleware
→ Permission Guard
→ Controller
→ DTO Validation
→ Service Business Logic
→ Repository / Prisma
→ Audit Log / Notification / Queue if needed
→ Response
```

## Multi-Branch Support

The system should support multiple company branches from the beginning. Most records should include `companyId` and optionally `branchId`.

## Multi-Tenant Readiness

Even if the system is initially for one company, use `companyId` in core tables to allow future SaaS/multi-company usage.
