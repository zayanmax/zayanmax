# Documents, Files & Knowledge Base Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build backend-only document metadata, folder hierarchy, document version metadata, entity linking, and knowledge base article management.

**Architecture:** Add a focused NestJS module under `apps/backend/src/modules/documents-knowledge-base` with DTOs, controller, and service. Persist metadata and structure only in Prisma using additive models, company scoping, soft deletes, owner/department visibility, audit logs, and existing `documents.*` permission keys.

**Tech Stack:** NestJS, TypeScript, Prisma, PostgreSQL, Jest, Supertest.

---

### Task 1: Tests First

**Files:**
- Create: `apps/backend/src/modules/documents-knowledge-base/documents-knowledge-base.service.spec.ts`
- Modify: `apps/backend/test/app.e2e-spec.ts`

- [ ] Add focused unit tests for folder hierarchy duplicate protection, document creation with tags/categories/links, version metadata creation, status update audit, KB category creation, article create/publish/archive, and duplicate KB category protection.
- [ ] Run focused unit tests and verify they fail because the module does not exist yet.
- [ ] Add E2E coverage for folder, duplicate folder, document category/tag/document, document version, document status, KB category/article/publish/archive, and filtered list endpoints.

### Task 2: Prisma Schema

**Files:**
- Modify: `apps/backend/prisma/schema.prisma`
- Create migration via Prisma.

- [ ] Add enums for document visibility, linked entity type, document status, and knowledge article status.
- [ ] Add models for document folders, categories, tags, documents, document-tag join rows, document links, document versions, KB categories, KB articles, article-tag join rows.
- [ ] Add useful relations to `Company`, `User`, `Department`, `Employee`, `Client`, `Project`, `Task`, `Vendor`, and `Asset`.
- [ ] Keep all storage/binary fields as metadata only.

### Task 3: NestJS Module

**Files:**
- Create: `apps/backend/src/modules/documents-knowledge-base/dto/documents-knowledge-base.dto.ts`
- Create: `apps/backend/src/modules/documents-knowledge-base/dto/documents-knowledge-base.enums.ts`
- Create: `apps/backend/src/modules/documents-knowledge-base/documents-knowledge-base.service.ts`
- Create: `apps/backend/src/modules/documents-knowledge-base/documents-knowledge-base.controller.ts`
- Create: `apps/backend/src/modules/documents-knowledge-base/documents-knowledge-base.module.ts`
- Modify: `apps/backend/src/app.module.ts`

- [ ] Add guarded routes under `/document-folders`, `/documents`, `/document-categories`, `/document-tags`, `/knowledge-base/categories`, and `/knowledge-base/articles`.
- [ ] Use `documents.view`, `documents.upload`, and `documents.manage` permission keys.
- [ ] Add duplicate protection for folder path/title and document title within a folder.
- [ ] Add audit logs for folder/document/version/article create/update/delete/publish/archive.

### Task 4: Documentation and Verification

**Files:**
- Create: `docs/modules/documents-knowledge-base.md`
- Modify: `docs/api/api-contract.md`
- Modify: `docs/status/current-status.md`
- Modify: `docs/handover/next-session.md`

- [ ] Document routes, permissions, models, statuses, duplicate rules, metadata-only file behavior, entity links, and exclusions.
- [ ] Run required verification commands from `apps/backend`.
