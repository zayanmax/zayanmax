-- CreateEnum
CREATE TYPE "HelpdeskTicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'WAITING_FOR_EMPLOYEE', 'WAITING_FOR_ADMIN', 'RESOLVED', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "HelpdeskTicketPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "HelpdeskTicketSource" AS ENUM ('EMPLOYEE', 'ADMIN', 'SYSTEM');

-- CreateEnum
CREATE TYPE "HelpdeskEntityType" AS ENUM ('EMPLOYEE', 'ASSET', 'DOCUMENT', 'PAYROLL', 'ATTENDANCE', 'LEAVE', 'FINANCE', 'PURCHASE', 'INVENTORY');

-- CreateTable
CREATE TABLE "HelpdeskTicketCategory" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "departmentId" UUID,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,

    CONSTRAINT "HelpdeskTicketCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HelpdeskTicketSubcategory" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "categoryId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,

    CONSTRAINT "HelpdeskTicketSubcategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HelpdeskTicket" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "ticketNumber" TEXT NOT NULL,
    "requesterUserId" UUID,
    "requesterEmployeeId" UUID,
    "departmentId" UUID,
    "categoryId" UUID,
    "subcategoryId" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "HelpdeskTicketStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "HelpdeskTicketPriority" NOT NULL DEFAULT 'MEDIUM',
    "source" "HelpdeskTicketSource" NOT NULL DEFAULT 'EMPLOYEE',
    "assignedUserId" UUID,
    "assignedEmployeeId" UUID,
    "assignedTeamName" TEXT,
    "entityType" "HelpdeskEntityType",
    "entityId" UUID,
    "firstResponseDueAt" TIMESTAMP(3),
    "resolutionDueAt" TIMESTAMP(3),
    "firstResponseBreached" BOOLEAN NOT NULL DEFAULT false,
    "resolutionBreached" BOOLEAN NOT NULL DEFAULT false,
    "firstRespondedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,

    CONSTRAINT "HelpdeskTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HelpdeskTicketComment" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "ticketId" UUID NOT NULL,
    "authorUserId" UUID,
    "authorEmployeeId" UUID,
    "commentText" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,

    CONSTRAINT "HelpdeskTicketComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HelpdeskTicketInternalNote" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "ticketId" UUID NOT NULL,
    "authorUserId" UUID,
    "authorEmployeeId" UUID,
    "noteText" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,

    CONSTRAINT "HelpdeskTicketInternalNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HelpdeskTicketAttachment" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "ticketId" UUID NOT NULL,
    "fileName" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,

    CONSTRAINT "HelpdeskTicketAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HelpdeskTicketCategory_companyId_idx" ON "HelpdeskTicketCategory"("companyId");

-- CreateIndex
CREATE INDEX "HelpdeskTicketCategory_departmentId_idx" ON "HelpdeskTicketCategory"("departmentId");

-- CreateIndex
CREATE INDEX "HelpdeskTicketCategory_status_idx" ON "HelpdeskTicketCategory"("status");

-- CreateIndex
CREATE UNIQUE INDEX "HelpdeskTicketCategory_companyId_name_key" ON "HelpdeskTicketCategory"("companyId", "name");

-- CreateIndex
CREATE INDEX "HelpdeskTicketSubcategory_companyId_idx" ON "HelpdeskTicketSubcategory"("companyId");

-- CreateIndex
CREATE INDEX "HelpdeskTicketSubcategory_categoryId_idx" ON "HelpdeskTicketSubcategory"("categoryId");

-- CreateIndex
CREATE INDEX "HelpdeskTicketSubcategory_status_idx" ON "HelpdeskTicketSubcategory"("status");

-- CreateIndex
CREATE UNIQUE INDEX "HelpdeskTicketSubcategory_categoryId_name_key" ON "HelpdeskTicketSubcategory"("categoryId", "name");

-- CreateIndex
CREATE INDEX "HelpdeskTicket_companyId_idx" ON "HelpdeskTicket"("companyId");

-- CreateIndex
CREATE INDEX "HelpdeskTicket_ticketNumber_idx" ON "HelpdeskTicket"("ticketNumber");

-- CreateIndex
CREATE INDEX "HelpdeskTicket_requesterUserId_idx" ON "HelpdeskTicket"("requesterUserId");

-- CreateIndex
CREATE INDEX "HelpdeskTicket_requesterEmployeeId_idx" ON "HelpdeskTicket"("requesterEmployeeId");

-- CreateIndex
CREATE INDEX "HelpdeskTicket_departmentId_idx" ON "HelpdeskTicket"("departmentId");

-- CreateIndex
CREATE INDEX "HelpdeskTicket_categoryId_idx" ON "HelpdeskTicket"("categoryId");

-- CreateIndex
CREATE INDEX "HelpdeskTicket_subcategoryId_idx" ON "HelpdeskTicket"("subcategoryId");

-- CreateIndex
CREATE INDEX "HelpdeskTicket_status_idx" ON "HelpdeskTicket"("status");

-- CreateIndex
CREATE INDEX "HelpdeskTicket_priority_idx" ON "HelpdeskTicket"("priority");

-- CreateIndex
CREATE INDEX "HelpdeskTicket_source_idx" ON "HelpdeskTicket"("source");

-- CreateIndex
CREATE INDEX "HelpdeskTicket_assignedUserId_idx" ON "HelpdeskTicket"("assignedUserId");

-- CreateIndex
CREATE INDEX "HelpdeskTicket_assignedEmployeeId_idx" ON "HelpdeskTicket"("assignedEmployeeId");

-- CreateIndex
CREATE INDEX "HelpdeskTicket_assignedTeamName_idx" ON "HelpdeskTicket"("assignedTeamName");

-- CreateIndex
CREATE INDEX "HelpdeskTicket_entityType_idx" ON "HelpdeskTicket"("entityType");

-- CreateIndex
CREATE INDEX "HelpdeskTicket_entityId_idx" ON "HelpdeskTicket"("entityId");

-- CreateIndex
CREATE INDEX "HelpdeskTicket_firstResponseDueAt_idx" ON "HelpdeskTicket"("firstResponseDueAt");

-- CreateIndex
CREATE INDEX "HelpdeskTicket_resolutionDueAt_idx" ON "HelpdeskTicket"("resolutionDueAt");

-- CreateIndex
CREATE INDEX "HelpdeskTicket_createdAt_idx" ON "HelpdeskTicket"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "HelpdeskTicket_companyId_ticketNumber_key" ON "HelpdeskTicket"("companyId", "ticketNumber");

-- CreateIndex
CREATE INDEX "HelpdeskTicketComment_companyId_idx" ON "HelpdeskTicketComment"("companyId");

-- CreateIndex
CREATE INDEX "HelpdeskTicketComment_ticketId_idx" ON "HelpdeskTicketComment"("ticketId");

-- CreateIndex
CREATE INDEX "HelpdeskTicketComment_authorUserId_idx" ON "HelpdeskTicketComment"("authorUserId");

-- CreateIndex
CREATE INDEX "HelpdeskTicketComment_authorEmployeeId_idx" ON "HelpdeskTicketComment"("authorEmployeeId");

-- CreateIndex
CREATE INDEX "HelpdeskTicketComment_createdAt_idx" ON "HelpdeskTicketComment"("createdAt");

-- CreateIndex
CREATE INDEX "HelpdeskTicketInternalNote_companyId_idx" ON "HelpdeskTicketInternalNote"("companyId");

-- CreateIndex
CREATE INDEX "HelpdeskTicketInternalNote_ticketId_idx" ON "HelpdeskTicketInternalNote"("ticketId");

-- CreateIndex
CREATE INDEX "HelpdeskTicketInternalNote_authorUserId_idx" ON "HelpdeskTicketInternalNote"("authorUserId");

-- CreateIndex
CREATE INDEX "HelpdeskTicketInternalNote_authorEmployeeId_idx" ON "HelpdeskTicketInternalNote"("authorEmployeeId");

-- CreateIndex
CREATE INDEX "HelpdeskTicketInternalNote_createdAt_idx" ON "HelpdeskTicketInternalNote"("createdAt");

-- CreateIndex
CREATE INDEX "HelpdeskTicketAttachment_companyId_idx" ON "HelpdeskTicketAttachment"("companyId");

-- CreateIndex
CREATE INDEX "HelpdeskTicketAttachment_ticketId_idx" ON "HelpdeskTicketAttachment"("ticketId");

-- CreateIndex
CREATE INDEX "HelpdeskTicketAttachment_storageKey_idx" ON "HelpdeskTicketAttachment"("storageKey");

-- CreateIndex
CREATE INDEX "HelpdeskTicketAttachment_createdAt_idx" ON "HelpdeskTicketAttachment"("createdAt");

-- AddForeignKey
ALTER TABLE "HelpdeskTicketCategory" ADD CONSTRAINT "HelpdeskTicketCategory_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HelpdeskTicketCategory" ADD CONSTRAINT "HelpdeskTicketCategory_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HelpdeskTicketSubcategory" ADD CONSTRAINT "HelpdeskTicketSubcategory_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HelpdeskTicketSubcategory" ADD CONSTRAINT "HelpdeskTicketSubcategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "HelpdeskTicketCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HelpdeskTicket" ADD CONSTRAINT "HelpdeskTicket_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HelpdeskTicket" ADD CONSTRAINT "HelpdeskTicket_requesterUserId_fkey" FOREIGN KEY ("requesterUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HelpdeskTicket" ADD CONSTRAINT "HelpdeskTicket_requesterEmployeeId_fkey" FOREIGN KEY ("requesterEmployeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HelpdeskTicket" ADD CONSTRAINT "HelpdeskTicket_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HelpdeskTicket" ADD CONSTRAINT "HelpdeskTicket_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "HelpdeskTicketCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HelpdeskTicket" ADD CONSTRAINT "HelpdeskTicket_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "HelpdeskTicketSubcategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HelpdeskTicket" ADD CONSTRAINT "HelpdeskTicket_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HelpdeskTicket" ADD CONSTRAINT "HelpdeskTicket_assignedEmployeeId_fkey" FOREIGN KEY ("assignedEmployeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HelpdeskTicketComment" ADD CONSTRAINT "HelpdeskTicketComment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HelpdeskTicketComment" ADD CONSTRAINT "HelpdeskTicketComment_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "HelpdeskTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HelpdeskTicketComment" ADD CONSTRAINT "HelpdeskTicketComment_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HelpdeskTicketComment" ADD CONSTRAINT "HelpdeskTicketComment_authorEmployeeId_fkey" FOREIGN KEY ("authorEmployeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HelpdeskTicketInternalNote" ADD CONSTRAINT "HelpdeskTicketInternalNote_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HelpdeskTicketInternalNote" ADD CONSTRAINT "HelpdeskTicketInternalNote_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "HelpdeskTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HelpdeskTicketInternalNote" ADD CONSTRAINT "HelpdeskTicketInternalNote_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HelpdeskTicketInternalNote" ADD CONSTRAINT "HelpdeskTicketInternalNote_authorEmployeeId_fkey" FOREIGN KEY ("authorEmployeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HelpdeskTicketAttachment" ADD CONSTRAINT "HelpdeskTicketAttachment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HelpdeskTicketAttachment" ADD CONSTRAINT "HelpdeskTicketAttachment_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "HelpdeskTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
