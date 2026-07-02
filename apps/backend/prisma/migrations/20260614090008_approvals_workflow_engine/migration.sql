-- CreateEnum
CREATE TYPE "ApprovalStepApproverType" AS ENUM ('USER', 'EMPLOYEE', 'ROLE', 'DEPARTMENT_HEAD', 'REPORTING_MANAGER', 'FINANCE_MANAGER', 'HR_MANAGER', 'ADMIN');

-- CreateEnum
CREATE TYPE "ApprovalEntityType" AS ENUM ('LEAVE', 'ATTENDANCE_CORRECTION', 'EXPENSE_CLAIM', 'PURCHASE_REQUEST', 'PAYROLL_RUN', 'VENDOR_BILL', 'INVOICE', 'QUOTATION', 'ASSET_ASSIGNMENT', 'DOCUMENT', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ApprovalRequestStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ApprovalStepStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "ApprovalAction" AS ENUM ('SUBMIT', 'APPROVE', 'REJECT', 'CANCEL', 'DELEGATE', 'COMMENT');

-- CreateTable
CREATE TABLE "ApprovalWorkflowDefinition" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "module" TEXT,
    "entityType" "ApprovalEntityType" NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,

    CONSTRAINT "ApprovalWorkflowDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalWorkflowStep" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "workflowDefinitionId" UUID NOT NULL,
    "stepOrder" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "approverType" "ApprovalStepApproverType" NOT NULL,
    "approverUserId" UUID,
    "approverEmployeeId" UUID,
    "approverRoleId" UUID,
    "approverDepartmentId" UUID,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "delegationAllowed" BOOLEAN NOT NULL DEFAULT true,
    "escalationAfterHours" INTEGER,
    "escalationMetadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,

    CONSTRAINT "ApprovalWorkflowStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalRequest" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "workflowDefinitionId" UUID,
    "entityType" "ApprovalEntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "requestedByUserId" UUID,
    "requestedByEmployeeId" UUID,
    "status" "ApprovalRequestStatus" NOT NULL DEFAULT 'DRAFT',
    "currentStepOrder" INTEGER NOT NULL DEFAULT 0,
    "submittedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "metadata" JSONB,
    "delegationMetadata" JSONB,
    "escalationMetadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,

    CONSTRAINT "ApprovalRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalStepInstance" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "requestId" UUID NOT NULL,
    "workflowStepId" UUID,
    "stepOrder" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "approverType" "ApprovalStepApproverType" NOT NULL,
    "approverUserId" UUID,
    "approverEmployeeId" UUID,
    "approverRoleId" UUID,
    "approverDepartmentId" UUID,
    "status" "ApprovalStepStatus" NOT NULL DEFAULT 'PENDING',
    "comment" TEXT,
    "decidedAt" TIMESTAMP(3),
    "actedByUserId" UUID,
    "delegatedToUserId" UUID,
    "delegatedToEmployeeId" UUID,
    "delegatedAt" TIMESTAMP(3),
    "delegationReason" TEXT,
    "escalationDueAt" TIMESTAMP(3),
    "escalationMetadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApprovalStepInstance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalActionRecord" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "requestId" UUID NOT NULL,
    "stepInstanceId" UUID,
    "action" "ApprovalAction" NOT NULL,
    "actorUserId" UUID,
    "actorEmployeeId" UUID,
    "comment" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApprovalActionRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ApprovalWorkflowDefinition_companyId_idx" ON "ApprovalWorkflowDefinition"("companyId");

-- CreateIndex
CREATE INDEX "ApprovalWorkflowDefinition_entityType_idx" ON "ApprovalWorkflowDefinition"("entityType");

-- CreateIndex
CREATE INDEX "ApprovalWorkflowDefinition_status_idx" ON "ApprovalWorkflowDefinition"("status");

-- CreateIndex
CREATE INDEX "ApprovalWorkflowDefinition_createdAt_idx" ON "ApprovalWorkflowDefinition"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ApprovalWorkflowDefinition_companyId_key_key" ON "ApprovalWorkflowDefinition"("companyId", "key");

-- CreateIndex
CREATE INDEX "ApprovalWorkflowStep_companyId_idx" ON "ApprovalWorkflowStep"("companyId");

-- CreateIndex
CREATE INDEX "ApprovalWorkflowStep_workflowDefinitionId_idx" ON "ApprovalWorkflowStep"("workflowDefinitionId");

-- CreateIndex
CREATE INDEX "ApprovalWorkflowStep_approverType_idx" ON "ApprovalWorkflowStep"("approverType");

-- CreateIndex
CREATE INDEX "ApprovalWorkflowStep_approverUserId_idx" ON "ApprovalWorkflowStep"("approverUserId");

-- CreateIndex
CREATE INDEX "ApprovalWorkflowStep_approverEmployeeId_idx" ON "ApprovalWorkflowStep"("approverEmployeeId");

-- CreateIndex
CREATE INDEX "ApprovalWorkflowStep_approverRoleId_idx" ON "ApprovalWorkflowStep"("approverRoleId");

-- CreateIndex
CREATE INDEX "ApprovalWorkflowStep_approverDepartmentId_idx" ON "ApprovalWorkflowStep"("approverDepartmentId");

-- CreateIndex
CREATE UNIQUE INDEX "ApprovalWorkflowStep_workflowDefinitionId_stepOrder_key" ON "ApprovalWorkflowStep"("workflowDefinitionId", "stepOrder");

-- CreateIndex
CREATE INDEX "ApprovalRequest_companyId_idx" ON "ApprovalRequest"("companyId");

-- CreateIndex
CREATE INDEX "ApprovalRequest_workflowDefinitionId_idx" ON "ApprovalRequest"("workflowDefinitionId");

-- CreateIndex
CREATE INDEX "ApprovalRequest_entityType_idx" ON "ApprovalRequest"("entityType");

-- CreateIndex
CREATE INDEX "ApprovalRequest_entityId_idx" ON "ApprovalRequest"("entityId");

-- CreateIndex
CREATE INDEX "ApprovalRequest_requestedByUserId_idx" ON "ApprovalRequest"("requestedByUserId");

-- CreateIndex
CREATE INDEX "ApprovalRequest_requestedByEmployeeId_idx" ON "ApprovalRequest"("requestedByEmployeeId");

-- CreateIndex
CREATE INDEX "ApprovalRequest_status_idx" ON "ApprovalRequest"("status");

-- CreateIndex
CREATE INDEX "ApprovalRequest_createdAt_idx" ON "ApprovalRequest"("createdAt");

-- CreateIndex
CREATE INDEX "ApprovalStepInstance_companyId_idx" ON "ApprovalStepInstance"("companyId");

-- CreateIndex
CREATE INDEX "ApprovalStepInstance_requestId_idx" ON "ApprovalStepInstance"("requestId");

-- CreateIndex
CREATE INDEX "ApprovalStepInstance_workflowStepId_idx" ON "ApprovalStepInstance"("workflowStepId");

-- CreateIndex
CREATE INDEX "ApprovalStepInstance_stepOrder_idx" ON "ApprovalStepInstance"("stepOrder");

-- CreateIndex
CREATE INDEX "ApprovalStepInstance_approverUserId_idx" ON "ApprovalStepInstance"("approverUserId");

-- CreateIndex
CREATE INDEX "ApprovalStepInstance_approverEmployeeId_idx" ON "ApprovalStepInstance"("approverEmployeeId");

-- CreateIndex
CREATE INDEX "ApprovalStepInstance_approverRoleId_idx" ON "ApprovalStepInstance"("approverRoleId");

-- CreateIndex
CREATE INDEX "ApprovalStepInstance_approverDepartmentId_idx" ON "ApprovalStepInstance"("approverDepartmentId");

-- CreateIndex
CREATE INDEX "ApprovalStepInstance_delegatedToUserId_idx" ON "ApprovalStepInstance"("delegatedToUserId");

-- CreateIndex
CREATE INDEX "ApprovalStepInstance_status_idx" ON "ApprovalStepInstance"("status");

-- CreateIndex
CREATE INDEX "ApprovalActionRecord_companyId_idx" ON "ApprovalActionRecord"("companyId");

-- CreateIndex
CREATE INDEX "ApprovalActionRecord_requestId_idx" ON "ApprovalActionRecord"("requestId");

-- CreateIndex
CREATE INDEX "ApprovalActionRecord_stepInstanceId_idx" ON "ApprovalActionRecord"("stepInstanceId");

-- CreateIndex
CREATE INDEX "ApprovalActionRecord_action_idx" ON "ApprovalActionRecord"("action");

-- CreateIndex
CREATE INDEX "ApprovalActionRecord_actorUserId_idx" ON "ApprovalActionRecord"("actorUserId");

-- CreateIndex
CREATE INDEX "ApprovalActionRecord_actorEmployeeId_idx" ON "ApprovalActionRecord"("actorEmployeeId");

-- CreateIndex
CREATE INDEX "ApprovalActionRecord_createdAt_idx" ON "ApprovalActionRecord"("createdAt");

-- AddForeignKey
ALTER TABLE "ApprovalWorkflowDefinition" ADD CONSTRAINT "ApprovalWorkflowDefinition_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalWorkflowStep" ADD CONSTRAINT "ApprovalWorkflowStep_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalWorkflowStep" ADD CONSTRAINT "ApprovalWorkflowStep_workflowDefinitionId_fkey" FOREIGN KEY ("workflowDefinitionId") REFERENCES "ApprovalWorkflowDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalWorkflowStep" ADD CONSTRAINT "ApprovalWorkflowStep_approverUserId_fkey" FOREIGN KEY ("approverUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalWorkflowStep" ADD CONSTRAINT "ApprovalWorkflowStep_approverEmployeeId_fkey" FOREIGN KEY ("approverEmployeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalWorkflowStep" ADD CONSTRAINT "ApprovalWorkflowStep_approverRoleId_fkey" FOREIGN KEY ("approverRoleId") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalWorkflowStep" ADD CONSTRAINT "ApprovalWorkflowStep_approverDepartmentId_fkey" FOREIGN KEY ("approverDepartmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_workflowDefinitionId_fkey" FOREIGN KEY ("workflowDefinitionId") REFERENCES "ApprovalWorkflowDefinition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_requestedByEmployeeId_fkey" FOREIGN KEY ("requestedByEmployeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalStepInstance" ADD CONSTRAINT "ApprovalStepInstance_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalStepInstance" ADD CONSTRAINT "ApprovalStepInstance_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "ApprovalRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalStepInstance" ADD CONSTRAINT "ApprovalStepInstance_workflowStepId_fkey" FOREIGN KEY ("workflowStepId") REFERENCES "ApprovalWorkflowStep"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalStepInstance" ADD CONSTRAINT "ApprovalStepInstance_approverUserId_fkey" FOREIGN KEY ("approverUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalStepInstance" ADD CONSTRAINT "ApprovalStepInstance_approverEmployeeId_fkey" FOREIGN KEY ("approverEmployeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalStepInstance" ADD CONSTRAINT "ApprovalStepInstance_approverRoleId_fkey" FOREIGN KEY ("approverRoleId") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalStepInstance" ADD CONSTRAINT "ApprovalStepInstance_approverDepartmentId_fkey" FOREIGN KEY ("approverDepartmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalStepInstance" ADD CONSTRAINT "ApprovalStepInstance_actedByUserId_fkey" FOREIGN KEY ("actedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalStepInstance" ADD CONSTRAINT "ApprovalStepInstance_delegatedToUserId_fkey" FOREIGN KEY ("delegatedToUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalStepInstance" ADD CONSTRAINT "ApprovalStepInstance_delegatedToEmployeeId_fkey" FOREIGN KEY ("delegatedToEmployeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalActionRecord" ADD CONSTRAINT "ApprovalActionRecord_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalActionRecord" ADD CONSTRAINT "ApprovalActionRecord_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "ApprovalRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalActionRecord" ADD CONSTRAINT "ApprovalActionRecord_stepInstanceId_fkey" FOREIGN KEY ("stepInstanceId") REFERENCES "ApprovalStepInstance"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalActionRecord" ADD CONSTRAINT "ApprovalActionRecord_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalActionRecord" ADD CONSTRAINT "ApprovalActionRecord_actorEmployeeId_fkey" FOREIGN KEY ("actorEmployeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
