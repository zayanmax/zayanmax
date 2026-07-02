-- CreateEnum
CREATE TYPE "AnnouncementStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AnnouncementAudienceType" AS ENUM ('ALL_COMPANY', 'BRANCH', 'DEPARTMENT', 'EMPLOYEE', 'ROLE');

-- CreateEnum
CREATE TYPE "NotificationCategory" AS ENUM ('GENERAL', 'SYSTEM', 'HR', 'ATTENDANCE', 'LEAVE', 'PAYROLL', 'FINANCE', 'PURCHASE', 'INVENTORY', 'ASSET', 'CLIENT', 'PROJECT', 'TASK', 'DOCUMENT', 'KNOWLEDGE_BASE');

-- CreateEnum
CREATE TYPE "NotificationPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "NotificationEntityType" AS ENUM ('EMPLOYEE', 'CLIENT', 'PROJECT', 'TASK', 'ATTENDANCE', 'LEAVE', 'PAYROLL', 'FINANCE', 'PURCHASE', 'INVENTORY', 'ASSET', 'DOCUMENT', 'KNOWLEDGE_BASE');

-- CreateEnum
CREATE TYPE "NotificationDeliveryChannel" AS ENUM ('IN_APP', 'EMAIL', 'SMS', 'WHATSAPP', 'PUSH');

-- CreateEnum
CREATE TYPE "NotificationDeliveryStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "ReminderStatus" AS ENUM ('PENDING', 'SENT', 'CANCELLED');

-- CreateTable
CREATE TABLE "CompanyAnnouncement" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "authorUserId" UUID,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" "AnnouncementStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,

    CONSTRAINT "CompanyAnnouncement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnnouncementAudience" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "announcementId" UUID NOT NULL,
    "audienceType" "AnnouncementAudienceType" NOT NULL,
    "branchId" UUID,
    "departmentId" UUID,
    "employeeId" UUID,
    "roleId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnnouncementAudience_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnnouncementReadReceipt" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "announcementId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnnouncementReadReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationType" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "NotificationCategory" NOT NULL,
    "description" TEXT,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,

    CONSTRAINT "NotificationType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InternalNotification" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "recipientUserId" UUID NOT NULL,
    "notificationTypeId" UUID,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "category" "NotificationCategory" NOT NULL DEFAULT 'GENERAL',
    "priority" "NotificationPriority" NOT NULL DEFAULT 'NORMAL',
    "entityType" "NotificationEntityType",
    "entityId" UUID,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,

    CONSTRAINT "InternalNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationDelivery" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "notificationId" UUID NOT NULL,
    "channel" "NotificationDeliveryChannel" NOT NULL,
    "status" "NotificationDeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationPreference" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "category" "NotificationCategory" NOT NULL DEFAULT 'GENERAL',
    "channel" "NotificationDeliveryChannel" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" UUID,

    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationTemplate" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "notificationTypeId" UUID,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "NotificationCategory" NOT NULL DEFAULT 'GENERAL',
    "channel" "NotificationDeliveryChannel" NOT NULL,
    "subject" TEXT,
    "bodyTemplate" TEXT NOT NULL,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,

    CONSTRAINT "NotificationTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReminderRecord" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "recipientUserId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "remindAt" TIMESTAMP(3) NOT NULL,
    "status" "ReminderStatus" NOT NULL DEFAULT 'PENDING',
    "category" "NotificationCategory" NOT NULL DEFAULT 'GENERAL',
    "priority" "NotificationPriority" NOT NULL DEFAULT 'NORMAL',
    "entityType" "NotificationEntityType",
    "entityId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,

    CONSTRAINT "ReminderRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CompanyAnnouncement_companyId_idx" ON "CompanyAnnouncement"("companyId");

-- CreateIndex
CREATE INDEX "CompanyAnnouncement_authorUserId_idx" ON "CompanyAnnouncement"("authorUserId");

-- CreateIndex
CREATE INDEX "CompanyAnnouncement_status_idx" ON "CompanyAnnouncement"("status");

-- CreateIndex
CREATE INDEX "CompanyAnnouncement_publishedAt_idx" ON "CompanyAnnouncement"("publishedAt");

-- CreateIndex
CREATE INDEX "CompanyAnnouncement_createdAt_idx" ON "CompanyAnnouncement"("createdAt");

-- CreateIndex
CREATE INDEX "AnnouncementAudience_companyId_idx" ON "AnnouncementAudience"("companyId");

-- CreateIndex
CREATE INDEX "AnnouncementAudience_announcementId_idx" ON "AnnouncementAudience"("announcementId");

-- CreateIndex
CREATE INDEX "AnnouncementAudience_audienceType_idx" ON "AnnouncementAudience"("audienceType");

-- CreateIndex
CREATE INDEX "AnnouncementAudience_branchId_idx" ON "AnnouncementAudience"("branchId");

-- CreateIndex
CREATE INDEX "AnnouncementAudience_departmentId_idx" ON "AnnouncementAudience"("departmentId");

-- CreateIndex
CREATE INDEX "AnnouncementAudience_employeeId_idx" ON "AnnouncementAudience"("employeeId");

-- CreateIndex
CREATE INDEX "AnnouncementAudience_roleId_idx" ON "AnnouncementAudience"("roleId");

-- CreateIndex
CREATE INDEX "AnnouncementReadReceipt_companyId_idx" ON "AnnouncementReadReceipt"("companyId");

-- CreateIndex
CREATE INDEX "AnnouncementReadReceipt_userId_idx" ON "AnnouncementReadReceipt"("userId");

-- CreateIndex
CREATE INDEX "AnnouncementReadReceipt_readAt_idx" ON "AnnouncementReadReceipt"("readAt");

-- CreateIndex
CREATE UNIQUE INDEX "AnnouncementReadReceipt_announcementId_userId_key" ON "AnnouncementReadReceipt"("announcementId", "userId");

-- CreateIndex
CREATE INDEX "NotificationType_companyId_idx" ON "NotificationType"("companyId");

-- CreateIndex
CREATE INDEX "NotificationType_category_idx" ON "NotificationType"("category");

-- CreateIndex
CREATE INDEX "NotificationType_status_idx" ON "NotificationType"("status");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationType_companyId_code_key" ON "NotificationType"("companyId", "code");

-- CreateIndex
CREATE INDEX "InternalNotification_companyId_idx" ON "InternalNotification"("companyId");

-- CreateIndex
CREATE INDEX "InternalNotification_recipientUserId_idx" ON "InternalNotification"("recipientUserId");

-- CreateIndex
CREATE INDEX "InternalNotification_notificationTypeId_idx" ON "InternalNotification"("notificationTypeId");

-- CreateIndex
CREATE INDEX "InternalNotification_category_idx" ON "InternalNotification"("category");

-- CreateIndex
CREATE INDEX "InternalNotification_priority_idx" ON "InternalNotification"("priority");

-- CreateIndex
CREATE INDEX "InternalNotification_entityType_idx" ON "InternalNotification"("entityType");

-- CreateIndex
CREATE INDEX "InternalNotification_entityId_idx" ON "InternalNotification"("entityId");

-- CreateIndex
CREATE INDEX "InternalNotification_isRead_idx" ON "InternalNotification"("isRead");

-- CreateIndex
CREATE INDEX "InternalNotification_createdAt_idx" ON "InternalNotification"("createdAt");

-- CreateIndex
CREATE INDEX "NotificationDelivery_companyId_idx" ON "NotificationDelivery"("companyId");

-- CreateIndex
CREATE INDEX "NotificationDelivery_notificationId_idx" ON "NotificationDelivery"("notificationId");

-- CreateIndex
CREATE INDEX "NotificationDelivery_channel_idx" ON "NotificationDelivery"("channel");

-- CreateIndex
CREATE INDEX "NotificationDelivery_status_idx" ON "NotificationDelivery"("status");

-- CreateIndex
CREATE INDEX "NotificationPreference_companyId_idx" ON "NotificationPreference"("companyId");

-- CreateIndex
CREATE INDEX "NotificationPreference_userId_idx" ON "NotificationPreference"("userId");

-- CreateIndex
CREATE INDEX "NotificationPreference_category_idx" ON "NotificationPreference"("category");

-- CreateIndex
CREATE INDEX "NotificationPreference_channel_idx" ON "NotificationPreference"("channel");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreference_companyId_userId_category_channel_key" ON "NotificationPreference"("companyId", "userId", "category", "channel");

-- CreateIndex
CREATE INDEX "NotificationTemplate_companyId_idx" ON "NotificationTemplate"("companyId");

-- CreateIndex
CREATE INDEX "NotificationTemplate_notificationTypeId_idx" ON "NotificationTemplate"("notificationTypeId");

-- CreateIndex
CREATE INDEX "NotificationTemplate_category_idx" ON "NotificationTemplate"("category");

-- CreateIndex
CREATE INDEX "NotificationTemplate_channel_idx" ON "NotificationTemplate"("channel");

-- CreateIndex
CREATE INDEX "NotificationTemplate_status_idx" ON "NotificationTemplate"("status");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationTemplate_companyId_code_key" ON "NotificationTemplate"("companyId", "code");

-- CreateIndex
CREATE INDEX "ReminderRecord_companyId_idx" ON "ReminderRecord"("companyId");

-- CreateIndex
CREATE INDEX "ReminderRecord_recipientUserId_idx" ON "ReminderRecord"("recipientUserId");

-- CreateIndex
CREATE INDEX "ReminderRecord_status_idx" ON "ReminderRecord"("status");

-- CreateIndex
CREATE INDEX "ReminderRecord_category_idx" ON "ReminderRecord"("category");

-- CreateIndex
CREATE INDEX "ReminderRecord_entityType_idx" ON "ReminderRecord"("entityType");

-- CreateIndex
CREATE INDEX "ReminderRecord_entityId_idx" ON "ReminderRecord"("entityId");

-- CreateIndex
CREATE INDEX "ReminderRecord_remindAt_idx" ON "ReminderRecord"("remindAt");

-- AddForeignKey
ALTER TABLE "CompanyAnnouncement" ADD CONSTRAINT "CompanyAnnouncement_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyAnnouncement" ADD CONSTRAINT "CompanyAnnouncement_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnouncementAudience" ADD CONSTRAINT "AnnouncementAudience_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnouncementAudience" ADD CONSTRAINT "AnnouncementAudience_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "CompanyAnnouncement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnouncementAudience" ADD CONSTRAINT "AnnouncementAudience_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnouncementAudience" ADD CONSTRAINT "AnnouncementAudience_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnouncementAudience" ADD CONSTRAINT "AnnouncementAudience_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnouncementAudience" ADD CONSTRAINT "AnnouncementAudience_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnouncementReadReceipt" ADD CONSTRAINT "AnnouncementReadReceipt_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnouncementReadReceipt" ADD CONSTRAINT "AnnouncementReadReceipt_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "CompanyAnnouncement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnnouncementReadReceipt" ADD CONSTRAINT "AnnouncementReadReceipt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationType" ADD CONSTRAINT "NotificationType_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternalNotification" ADD CONSTRAINT "InternalNotification_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternalNotification" ADD CONSTRAINT "InternalNotification_recipientUserId_fkey" FOREIGN KEY ("recipientUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternalNotification" ADD CONSTRAINT "InternalNotification_notificationTypeId_fkey" FOREIGN KEY ("notificationTypeId") REFERENCES "NotificationType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationDelivery" ADD CONSTRAINT "NotificationDelivery_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationDelivery" ADD CONSTRAINT "NotificationDelivery_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "InternalNotification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationTemplate" ADD CONSTRAINT "NotificationTemplate_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationTemplate" ADD CONSTRAINT "NotificationTemplate_notificationTypeId_fkey" FOREIGN KEY ("notificationTypeId") REFERENCES "NotificationType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReminderRecord" ADD CONSTRAINT "ReminderRecord_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReminderRecord" ADD CONSTRAINT "ReminderRecord_recipientUserId_fkey" FOREIGN KEY ("recipientUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
