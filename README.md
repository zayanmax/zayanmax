# Zayan Max Internal Office Management System

This documentation bundle is prepared for Codex/developers to start building a full-fledged internal office management system.

## Recommended Stack

- Frontend: Next.js + React + TypeScript + Tailwind CSS + shadcn/ui
- Backend: NestJS + TypeScript
- Database: PostgreSQL
- ORM: Prisma
- Queue/Cache: Redis + BullMQ
- Storage: S3-compatible storage such as AWS S3, Cloudflare R2, or DigitalOcean Spaces
- Search: Meilisearch initially, Elasticsearch/OpenSearch if scale demands
- Mobile: React Native / Expo

## Document Index

1. `architecture/system-architecture.md`
2. `architecture/system-design.md`
3. `backend/project-structure.md`
4. `backend/modules.md`
5. `backend/api-structure.md`
6. `backend/database-design.md`
7. `backend/security-permissions.md`
8. `integrations/integration-rules.md`
9. `integrations/notifications.md`
10. `frontend/frontend-structure.md`
11. `design/design-system.md`
12. `devops/deployment.md`
13. `codex/codex-instructions.md`

## Product Direction

Build Zayan Max as a modular ERP-style company operating system. Every major business area should be isolated into modules but share common infrastructure: authentication, roles, approvals, audit logs, files, notifications, and reporting.
