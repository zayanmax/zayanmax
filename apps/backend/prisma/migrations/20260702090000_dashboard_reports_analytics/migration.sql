-- CreateEnum
CREATE TYPE "ReportExportFormat" AS ENUM ('CSV', 'XLSX', 'PDF');

-- CreateEnum
CREATE TYPE "ReportExportStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "ReportExportRequest" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "requestedByUserId" UUID,
    "reportType" TEXT NOT NULL,
    "requestedFilters" JSONB,
    "format" "ReportExportFormat" NOT NULL,
    "status" "ReportExportStatus" NOT NULL DEFAULT 'PENDING',
    "fileName" TEXT,
    "storageKey" TEXT,
    "mimeType" TEXT,
    "fileSize" INTEGER,
    "failureReason" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processingAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ReportExportRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReportExportRequest_companyId_idx" ON "ReportExportRequest"("companyId");

-- CreateIndex
CREATE INDEX "ReportExportRequest_requestedByUserId_idx" ON "ReportExportRequest"("requestedByUserId");

-- CreateIndex
CREATE INDEX "ReportExportRequest_reportType_idx" ON "ReportExportRequest"("reportType");

-- CreateIndex
CREATE INDEX "ReportExportRequest_format_idx" ON "ReportExportRequest"("format");

-- CreateIndex
CREATE INDEX "ReportExportRequest_status_idx" ON "ReportExportRequest"("status");

-- CreateIndex
CREATE INDEX "ReportExportRequest_requestedAt_idx" ON "ReportExportRequest"("requestedAt");

-- CreateIndex
CREATE INDEX "ReportExportRequest_createdAt_idx" ON "ReportExportRequest"("createdAt");

-- AddForeignKey
ALTER TABLE "ReportExportRequest" ADD CONSTRAINT "ReportExportRequest_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportExportRequest" ADD CONSTRAINT "ReportExportRequest_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
