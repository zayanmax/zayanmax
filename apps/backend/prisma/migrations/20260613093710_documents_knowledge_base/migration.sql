-- CreateEnum
CREATE TYPE "DocumentVisibility" AS ENUM ('COMPANY', 'DEPARTMENT', 'PRIVATE');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "DocumentLinkedEntityType" AS ENUM ('EMPLOYEE', 'CLIENT', 'PROJECT', 'TASK', 'VENDOR', 'ASSET');

-- CreateEnum
CREATE TYPE "KnowledgeArticleStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "DocumentFolder" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "parentFolderId" UUID,
    "departmentId" UUID,
    "ownerUserId" UUID,
    "name" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "description" TEXT,
    "visibility" "DocumentVisibility" NOT NULL DEFAULT 'COMPANY',
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,

    CONSTRAINT "DocumentFolder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentCategory" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,

    CONSTRAINT "DocumentCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentTag" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,

    CONSTRAINT "DocumentTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentRecord" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "folderId" UUID,
    "categoryId" UUID,
    "departmentId" UUID,
    "ownerUserId" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "visibility" "DocumentVisibility" NOT NULL DEFAULT 'COMPANY',
    "status" "DocumentStatus" NOT NULL DEFAULT 'ACTIVE',
    "expiresAt" TIMESTAMP(3),
    "reminderAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,

    CONSTRAINT "DocumentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentRecordTag" (
    "companyId" UUID NOT NULL,
    "documentId" UUID NOT NULL,
    "tagId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentRecordTag_pkey" PRIMARY KEY ("documentId","tagId")
);

-- CreateTable
CREATE TABLE "DocumentVersion" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "documentId" UUID NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "fileName" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "checksum" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,

    CONSTRAINT "DocumentVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentLink" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "documentId" UUID NOT NULL,
    "entityType" "DocumentLinkedEntityType" NOT NULL,
    "entityId" UUID NOT NULL,
    "employeeId" UUID,
    "clientId" UUID,
    "projectId" UUID,
    "taskId" UUID,
    "vendorId" UUID,
    "assetId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeBaseCategory" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "parentCategoryId" UUID,
    "name" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "description" TEXT,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,

    CONSTRAINT "KnowledgeBaseCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeBaseArticle" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "categoryId" UUID,
    "authorUserId" UUID,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "summary" TEXT,
    "content" TEXT NOT NULL,
    "status" "KnowledgeArticleStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,

    CONSTRAINT "KnowledgeBaseArticle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeBaseArticleTag" (
    "companyId" UUID NOT NULL,
    "articleId" UUID NOT NULL,
    "tagId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgeBaseArticleTag_pkey" PRIMARY KEY ("articleId","tagId")
);

-- CreateIndex
CREATE INDEX "DocumentFolder_companyId_idx" ON "DocumentFolder"("companyId");

-- CreateIndex
CREATE INDEX "DocumentFolder_parentFolderId_idx" ON "DocumentFolder"("parentFolderId");

-- CreateIndex
CREATE INDEX "DocumentFolder_departmentId_idx" ON "DocumentFolder"("departmentId");

-- CreateIndex
CREATE INDEX "DocumentFolder_ownerUserId_idx" ON "DocumentFolder"("ownerUserId");

-- CreateIndex
CREATE INDEX "DocumentFolder_visibility_idx" ON "DocumentFolder"("visibility");

-- CreateIndex
CREATE INDEX "DocumentFolder_status_idx" ON "DocumentFolder"("status");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentFolder_companyId_path_key" ON "DocumentFolder"("companyId", "path");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentFolder_companyId_parentFolderId_name_key" ON "DocumentFolder"("companyId", "parentFolderId", "name");

-- CreateIndex
CREATE INDEX "DocumentCategory_companyId_idx" ON "DocumentCategory"("companyId");

-- CreateIndex
CREATE INDEX "DocumentCategory_status_idx" ON "DocumentCategory"("status");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentCategory_companyId_name_key" ON "DocumentCategory"("companyId", "name");

-- CreateIndex
CREATE INDEX "DocumentTag_companyId_idx" ON "DocumentTag"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentTag_companyId_name_key" ON "DocumentTag"("companyId", "name");

-- CreateIndex
CREATE INDEX "DocumentRecord_companyId_idx" ON "DocumentRecord"("companyId");

-- CreateIndex
CREATE INDEX "DocumentRecord_folderId_idx" ON "DocumentRecord"("folderId");

-- CreateIndex
CREATE INDEX "DocumentRecord_categoryId_idx" ON "DocumentRecord"("categoryId");

-- CreateIndex
CREATE INDEX "DocumentRecord_departmentId_idx" ON "DocumentRecord"("departmentId");

-- CreateIndex
CREATE INDEX "DocumentRecord_ownerUserId_idx" ON "DocumentRecord"("ownerUserId");

-- CreateIndex
CREATE INDEX "DocumentRecord_visibility_idx" ON "DocumentRecord"("visibility");

-- CreateIndex
CREATE INDEX "DocumentRecord_status_idx" ON "DocumentRecord"("status");

-- CreateIndex
CREATE INDEX "DocumentRecord_expiresAt_idx" ON "DocumentRecord"("expiresAt");

-- CreateIndex
CREATE INDEX "DocumentRecord_reminderAt_idx" ON "DocumentRecord"("reminderAt");

-- CreateIndex
CREATE INDEX "DocumentRecord_createdAt_idx" ON "DocumentRecord"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentRecord_companyId_folderId_title_key" ON "DocumentRecord"("companyId", "folderId", "title");

-- CreateIndex
CREATE INDEX "DocumentRecordTag_companyId_idx" ON "DocumentRecordTag"("companyId");

-- CreateIndex
CREATE INDEX "DocumentRecordTag_tagId_idx" ON "DocumentRecordTag"("tagId");

-- CreateIndex
CREATE INDEX "DocumentVersion_companyId_idx" ON "DocumentVersion"("companyId");

-- CreateIndex
CREATE INDEX "DocumentVersion_documentId_idx" ON "DocumentVersion"("documentId");

-- CreateIndex
CREATE INDEX "DocumentVersion_createdAt_idx" ON "DocumentVersion"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentVersion_documentId_versionNumber_key" ON "DocumentVersion"("documentId", "versionNumber");

-- CreateIndex
CREATE INDEX "DocumentLink_companyId_idx" ON "DocumentLink"("companyId");

-- CreateIndex
CREATE INDEX "DocumentLink_documentId_idx" ON "DocumentLink"("documentId");

-- CreateIndex
CREATE INDEX "DocumentLink_entityType_idx" ON "DocumentLink"("entityType");

-- CreateIndex
CREATE INDEX "DocumentLink_entityId_idx" ON "DocumentLink"("entityId");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentLink_documentId_entityType_entityId_key" ON "DocumentLink"("documentId", "entityType", "entityId");

-- CreateIndex
CREATE INDEX "KnowledgeBaseCategory_companyId_idx" ON "KnowledgeBaseCategory"("companyId");

-- CreateIndex
CREATE INDEX "KnowledgeBaseCategory_parentCategoryId_idx" ON "KnowledgeBaseCategory"("parentCategoryId");

-- CreateIndex
CREATE INDEX "KnowledgeBaseCategory_status_idx" ON "KnowledgeBaseCategory"("status");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeBaseCategory_companyId_path_key" ON "KnowledgeBaseCategory"("companyId", "path");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeBaseCategory_companyId_parentCategoryId_name_key" ON "KnowledgeBaseCategory"("companyId", "parentCategoryId", "name");

-- CreateIndex
CREATE INDEX "KnowledgeBaseArticle_companyId_idx" ON "KnowledgeBaseArticle"("companyId");

-- CreateIndex
CREATE INDEX "KnowledgeBaseArticle_categoryId_idx" ON "KnowledgeBaseArticle"("categoryId");

-- CreateIndex
CREATE INDEX "KnowledgeBaseArticle_authorUserId_idx" ON "KnowledgeBaseArticle"("authorUserId");

-- CreateIndex
CREATE INDEX "KnowledgeBaseArticle_status_idx" ON "KnowledgeBaseArticle"("status");

-- CreateIndex
CREATE INDEX "KnowledgeBaseArticle_publishedAt_idx" ON "KnowledgeBaseArticle"("publishedAt");

-- CreateIndex
CREATE INDEX "KnowledgeBaseArticle_createdAt_idx" ON "KnowledgeBaseArticle"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeBaseArticle_companyId_slug_key" ON "KnowledgeBaseArticle"("companyId", "slug");

-- CreateIndex
CREATE INDEX "KnowledgeBaseArticleTag_companyId_idx" ON "KnowledgeBaseArticleTag"("companyId");

-- CreateIndex
CREATE INDEX "KnowledgeBaseArticleTag_tagId_idx" ON "KnowledgeBaseArticleTag"("tagId");

-- AddForeignKey
ALTER TABLE "DocumentFolder" ADD CONSTRAINT "DocumentFolder_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentFolder" ADD CONSTRAINT "DocumentFolder_parentFolderId_fkey" FOREIGN KEY ("parentFolderId") REFERENCES "DocumentFolder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentFolder" ADD CONSTRAINT "DocumentFolder_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentFolder" ADD CONSTRAINT "DocumentFolder_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentCategory" ADD CONSTRAINT "DocumentCategory_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentTag" ADD CONSTRAINT "DocumentTag_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentRecord" ADD CONSTRAINT "DocumentRecord_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentRecord" ADD CONSTRAINT "DocumentRecord_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "DocumentFolder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentRecord" ADD CONSTRAINT "DocumentRecord_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "DocumentCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentRecord" ADD CONSTRAINT "DocumentRecord_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentRecord" ADD CONSTRAINT "DocumentRecord_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentRecordTag" ADD CONSTRAINT "DocumentRecordTag_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "DocumentRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentRecordTag" ADD CONSTRAINT "DocumentRecordTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "DocumentTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentVersion" ADD CONSTRAINT "DocumentVersion_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentVersion" ADD CONSTRAINT "DocumentVersion_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "DocumentRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentLink" ADD CONSTRAINT "DocumentLink_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentLink" ADD CONSTRAINT "DocumentLink_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "DocumentRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentLink" ADD CONSTRAINT "DocumentLink_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentLink" ADD CONSTRAINT "DocumentLink_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentLink" ADD CONSTRAINT "DocumentLink_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentLink" ADD CONSTRAINT "DocumentLink_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentLink" ADD CONSTRAINT "DocumentLink_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentLink" ADD CONSTRAINT "DocumentLink_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeBaseCategory" ADD CONSTRAINT "KnowledgeBaseCategory_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeBaseCategory" ADD CONSTRAINT "KnowledgeBaseCategory_parentCategoryId_fkey" FOREIGN KEY ("parentCategoryId") REFERENCES "KnowledgeBaseCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeBaseArticle" ADD CONSTRAINT "KnowledgeBaseArticle_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeBaseArticle" ADD CONSTRAINT "KnowledgeBaseArticle_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "KnowledgeBaseCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeBaseArticle" ADD CONSTRAINT "KnowledgeBaseArticle_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeBaseArticleTag" ADD CONSTRAINT "KnowledgeBaseArticleTag_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "KnowledgeBaseArticle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeBaseArticleTag" ADD CONSTRAINT "KnowledgeBaseArticleTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "DocumentTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
