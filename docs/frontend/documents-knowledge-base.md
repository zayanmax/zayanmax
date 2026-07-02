# Documents, Files & Knowledge Base Frontend

Last updated: 2026-07-02

## Scope

Implemented frontend screens for metadata-only Documents, Files & Knowledge Base workflows under `apps/frontend`.

Included:

- Documents overview at `/documents`.
- Document folder list/detail at `/documents/folders` and `/documents/folders/[id]`.
- Document category list/create at `/documents/categories`.
- Document tag list/create at `/documents/tags`.
- Document record list/create/edit/detail at `/documents/records`, `/documents/records/new`, `/documents/records/[id]`, and `/documents/records/[id]/edit`.
- Document version metadata creation on the document detail page.
- Knowledge base category list/create at `/knowledge-base/categories`.
- Knowledge base article list/create/edit/detail at `/knowledge-base`, `/knowledge-base/articles`, `/knowledge-base/articles/new`, `/knowledge-base/articles/[id]`, and `/knowledge-base/articles/[id]/edit`.
- Article status actions for publish, archive, and draft restore where supported.
- Permission-aware navigation entries for Documents and Knowledge Base.

## Permissions

Frontend guards use existing backend permission keys:

- `documents.view` for read screens.
- `documents.upload` for document record and version metadata creation.
- `documents.manage` for folder/category/tag/article management, document update, status changes, and delete actions.

## Backend Fit

The frontend uses the backend as source of truth and keeps the module metadata-only:

- No binary upload.
- No external storage integration.
- No OCR.
- No document preview.
- No public sharing.
- No real-time notifications.

Frontend-blocking read endpoints were added to the backend:

- `GET /api/v1/document-folders/:id`
- `GET /api/v1/documents/:id`
- `GET /api/v1/knowledge-base/articles/:id`

Taxonomy limitations currently reflected in the UI:

- Document categories and tags support list/create only.
- Knowledge base categories support list/create only.
- Article tags are assigned during create; backend update for article tags is not exposed yet.
- Document tags, links, folder, and initial file metadata are assigned during create; backend update only supports core document metadata.

## Files

Feature folders:

- `apps/frontend/src/features/documents`
- `apps/frontend/src/features/knowledge-base`

Route folders:

- `apps/frontend/src/app/(app)/documents`
- `apps/frontend/src/app/(app)/knowledge-base`

Shared components reused:

- `DataTable`
- `SearchFilterBar`
- `PaginationControls`
- `DataCard`
- `StatusBadge`
- `ConfirmDialog`
- `PermissionGuard`
- `FormFieldWrapper`
- `SelectField`

## Verification

Latest frontend verification for this pass:

- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm run build`: passed.

Latest backend verification for this pass:

- `npm run prisma:validate`: passed. Prisma reported the existing Prisma 7 config deprecation notice.
- `npm run typecheck`: passed.
- `npm run lint`: passed with existing test-harness warnings.
- `npm test -- --runInBand`: 23 suites, 107 tests passed.
- `npm run test:e2e -- --runInBand`: 1 suite, 21 tests passed.
- `npm run build`: passed.

Full frontend verification command set:

```bash
cd apps/frontend
npm run typecheck
npm run lint
npm run build
```

Backend verification command set:

```bash
cd apps/backend
npm run prisma:validate
npm run typecheck
npm run lint
npm test -- --runInBand
npm run test:e2e -- --runInBand
npm run build
```
