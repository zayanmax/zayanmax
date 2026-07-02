# Zayan Max Build Notes

This folder is the handover area for AI/developer sessions.

The original project docs remain in the top-level folders:

- `architecture/`
- `backend/`
- `frontend/`
- `design/`
- `integrations/`
- `devops/`
- `codex/`

Use this `docs/` folder for working notes, current status, implementation decisions, and session handovers.

## Folder Map

- `api/` - API contract notes, endpoint status, request/response conventions.
- `db/` - Prisma/PostgreSQL model notes, migration status, seed data notes.
- `handover/` - session summaries and next-session instructions.
- `modules/` - module-by-module build notes.
- `notes/` - decisions, risks, open questions, and product notes.
- `status/` - current implementation status and milestone tracking.

## Build Direction

Build backend first, then frontend.

Backend starts as a NestJS modular monolith with Prisma, PostgreSQL, Redis, BullMQ, JWT auth, role/permission guards, audit logs, and `/api/v1` routes.

Frontend should be added after the backend foundation is stable, using Next.js, TypeScript, Tailwind CSS, shadcn/ui, TanStack Query, and the documented design system.
