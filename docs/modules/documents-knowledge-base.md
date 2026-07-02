# Documents, Files & Knowledge Base Module

Last updated: 2026-06-13

## Scope

Implemented backend-only Documents, Files & Knowledge Base foundation.

Included:

- Document folders.
- Folder hierarchy with generated folder paths.
- Document records.
- Document version metadata.
- File metadata only.
- Owner user support.
- Department/company/private visibility metadata.
- Entity linking support for employees, clients, projects, tasks, vendors, and assets.
- Document categories.
- Document tags.
- Document expiry date and reminder date fields.
- Knowledge base categories.
- Knowledge base articles.
- Article status flow: `DRAFT`, `PUBLISHED`, `ARCHIVED`.
- Article tags.
- Search, filters, sorting, and pagination.
- Duplicate protection for folder paths, document titles in folders, categories, and tags where sensible.
- Audit logs for folder, document, version, and article create/update/delete/publish/archive operations.

Excluded for now:

- Frontend screens.
- Binary file upload or object storage integration.
- OCR.
- Document preview.
- Public sharing.
- Full text search indexing.

## Prisma Models

Added in `apps/backend/prisma/schema.prisma`:

- `DocumentFolder`
- `DocumentCategory`
- `DocumentTag`
- `DocumentRecord`
- `DocumentRecordTag`
- `DocumentVersion`
- `DocumentLink`
- `KnowledgeBaseCategory`
- `KnowledgeBaseArticle`
- `KnowledgeBaseArticleTag`

Added enums:

- `DocumentVisibility`
- `DocumentStatus`
- `DocumentLinkedEntityType`
- `KnowledgeArticleStatus`

Migration:

```text
apps/backend/prisma/migrations/20260613093710_documents_knowledge_base
```

## Permissions

Uses existing seeded permissions:

- `documents.view`
- `documents.upload`
- `documents.manage`

No role names are hardcoded for access checks.

## Endpoints

Folder routes:

- `GET /api/v1/document-folders`
- `POST /api/v1/document-folders`
- `PATCH /api/v1/document-folders/:id`
- `DELETE /api/v1/document-folders/:id`

Document metadata routes:

- `GET /api/v1/documents`
- `POST /api/v1/documents`
- `PATCH /api/v1/documents/:id`
- `PATCH /api/v1/documents/:id/status`
- `DELETE /api/v1/documents/:id`
- `POST /api/v1/documents/:id/versions`

Document taxonomy routes:

- `GET /api/v1/document-categories`
- `POST /api/v1/document-categories`
- `GET /api/v1/document-tags`
- `POST /api/v1/document-tags`

Knowledge base routes:

- `GET /api/v1/knowledge-base/categories`
- `POST /api/v1/knowledge-base/categories`
- `GET /api/v1/knowledge-base/articles`
- `POST /api/v1/knowledge-base/articles`
- `PATCH /api/v1/knowledge-base/articles/:id`
- `PATCH /api/v1/knowledge-base/articles/:id/status`
- `DELETE /api/v1/knowledge-base/articles/:id`

## Filters

All list endpoints support:

- `page`
- `limit`
- `search`
- `sortBy`
- `sortOrder`

Document folders also support:

- `parentFolderId`
- `departmentId`
- `visibility`

Documents also support:

- `folderId`
- `categoryId`
- `departmentId`
- `ownerUserId`
- `visibility`
- `status`
- `linkedEntityType`
- `linkedEntityId`

Knowledge base categories also support:

- `parentCategoryId`

Knowledge base articles also support:

- `categoryId`
- `status`

## Statuses And Visibility

Document visibility:

- `COMPANY`
- `DEPARTMENT`
- `PRIVATE`

Document status:

- `ACTIVE`
- `ARCHIVED`

Knowledge base article status:

- `DRAFT`
- `PUBLISHED`
- `ARCHIVED`

Document linked entity types:

- `EMPLOYEE`
- `CLIENT`
- `PROJECT`
- `TASK`
- `VENDOR`
- `ASSET`

## Duplicate Rules

- Folder create rejects another active folder in the same `companyId` with the same generated path.
- Document create rejects another active document in the same `companyId` and folder with the same title.
- Document category create rejects another active category by `companyId + name`.
- Document tag create rejects another active tag by `companyId + name`.
- Knowledge base category create rejects another active category in the same `companyId` with the same generated path.

## Metadata-Only File Behavior

Document create can create an initial `DocumentVersion` when file metadata is supplied:

- `fileName`
- `storageKey`
- `mimeType`
- `size`
- `checksum`

`POST /api/v1/documents/:id/versions` adds new version metadata and increments `versionNumber`. No binary is uploaded, moved, scanned, previewed, or shared by these APIs.

## Audit Logging

Audit actions:

- `documents.folders.create`
- `documents.folders.update`
- `documents.folders.delete`
- `documents.categories.create`
- `documents.tags.create`
- `documents.records.create`
- `documents.records.update`
- `documents.records.archive`
- `documents.records.delete`
- `documents.versions.create`
- `knowledge_base.categories.create`
- `knowledge_base.articles.create`
- `knowledge_base.articles.update`
- `knowledge_base.articles.publish`
- `knowledge_base.articles.archive`
- `knowledge_base.articles.delete`

## Tests

Unit tests:

```text
apps/backend/src/modules/documents-knowledge-base/documents-knowledge-base.service.spec.ts
```

E2E coverage:

```text
apps/backend/test/app.e2e-spec.ts
```

Covered flows include folder hierarchy, duplicate folder rejection, document category/tag creation, document record creation with initial version metadata and entity link, duplicate document title rejection, additional version metadata, document archive, KB category creation and duplicate rejection, KB article create/publish/archive, and filtered list endpoints.
