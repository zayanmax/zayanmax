-- CreateEnum
CREATE TYPE "CalendarEventType" AS ENUM ('MEETING', 'TASK_DEADLINE', 'PROJECT_MILESTONE', 'HOLIDAY', 'INTERVIEW', 'CLIENT_MEETING', 'REMINDER', 'BIRTHDAY', 'WORK_ANNIVERSARY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "CalendarEventStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'POSTPONED');

-- CreateEnum
CREATE TYPE "CalendarRsvpStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'TENTATIVE');

-- CreateEnum
CREATE TYPE "CalendarEntityType" AS ENUM ('EMPLOYEE', 'CLIENT', 'PROJECT', 'TASK', 'LEAVE', 'HOLIDAY', 'DOCUMENT');

-- CreateTable
CREATE TABLE "CalendarEvent" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "createdByUserId" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "eventType" "CalendarEventType" NOT NULL,
    "status" "CalendarEventStatus" NOT NULL DEFAULT 'SCHEDULED',
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    "location" TEXT,
    "isAllDay" BOOLEAN NOT NULL DEFAULT false,
    "recurrenceRule" TEXT,
    "recurrenceEndsAt" TIMESTAMP(3),
    "entityType" "CalendarEntityType",
    "entityId" UUID,
    "employeeId" UUID,
    "clientId" UUID,
    "projectId" UUID,
    "taskId" UUID,
    "leaveRequestId" UUID,
    "holidayId" UUID,
    "documentId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,

    CONSTRAINT "CalendarEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarEventAttendee" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "eventId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "employeeId" UUID,
    "rsvpStatus" "CalendarRsvpStatus" NOT NULL DEFAULT 'PENDING',
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,

    CONSTRAINT "CalendarEventAttendee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarResource" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "location" TEXT,
    "capacity" INTEGER,
    "description" TEXT,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,

    CONSTRAINT "CalendarResource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarResourceBooking" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "eventId" UUID NOT NULL,
    "resourceId" UUID NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,

    CONSTRAINT "CalendarResourceBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarEventReminder" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "eventId" UUID NOT NULL,
    "method" "NotificationDeliveryChannel" NOT NULL DEFAULT 'IN_APP',
    "remindAt" TIMESTAMP(3) NOT NULL,
    "minutesBefore" INTEGER,
    "message" TEXT,
    "status" "ReminderStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,

    CONSTRAINT "CalendarEventReminder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CalendarEvent_companyId_idx" ON "CalendarEvent"("companyId");

-- CreateIndex
CREATE INDEX "CalendarEvent_createdByUserId_idx" ON "CalendarEvent"("createdByUserId");

-- CreateIndex
CREATE INDEX "CalendarEvent_eventType_idx" ON "CalendarEvent"("eventType");

-- CreateIndex
CREATE INDEX "CalendarEvent_status_idx" ON "CalendarEvent"("status");

-- CreateIndex
CREATE INDEX "CalendarEvent_startAt_idx" ON "CalendarEvent"("startAt");

-- CreateIndex
CREATE INDEX "CalendarEvent_endAt_idx" ON "CalendarEvent"("endAt");

-- CreateIndex
CREATE INDEX "CalendarEvent_entityType_idx" ON "CalendarEvent"("entityType");

-- CreateIndex
CREATE INDEX "CalendarEvent_entityId_idx" ON "CalendarEvent"("entityId");

-- CreateIndex
CREATE INDEX "CalendarEvent_employeeId_idx" ON "CalendarEvent"("employeeId");

-- CreateIndex
CREATE INDEX "CalendarEvent_clientId_idx" ON "CalendarEvent"("clientId");

-- CreateIndex
CREATE INDEX "CalendarEvent_projectId_idx" ON "CalendarEvent"("projectId");

-- CreateIndex
CREATE INDEX "CalendarEvent_taskId_idx" ON "CalendarEvent"("taskId");

-- CreateIndex
CREATE INDEX "CalendarEvent_leaveRequestId_idx" ON "CalendarEvent"("leaveRequestId");

-- CreateIndex
CREATE INDEX "CalendarEvent_holidayId_idx" ON "CalendarEvent"("holidayId");

-- CreateIndex
CREATE INDEX "CalendarEvent_documentId_idx" ON "CalendarEvent"("documentId");

-- CreateIndex
CREATE INDEX "CalendarEvent_createdAt_idx" ON "CalendarEvent"("createdAt");

-- CreateIndex
CREATE INDEX "CalendarEventAttendee_companyId_idx" ON "CalendarEventAttendee"("companyId");

-- CreateIndex
CREATE INDEX "CalendarEventAttendee_eventId_idx" ON "CalendarEventAttendee"("eventId");

-- CreateIndex
CREATE INDEX "CalendarEventAttendee_userId_idx" ON "CalendarEventAttendee"("userId");

-- CreateIndex
CREATE INDEX "CalendarEventAttendee_employeeId_idx" ON "CalendarEventAttendee"("employeeId");

-- CreateIndex
CREATE INDEX "CalendarEventAttendee_rsvpStatus_idx" ON "CalendarEventAttendee"("rsvpStatus");

-- CreateIndex
CREATE UNIQUE INDEX "CalendarEventAttendee_eventId_userId_key" ON "CalendarEventAttendee"("eventId", "userId");

-- CreateIndex
CREATE INDEX "CalendarResource_companyId_idx" ON "CalendarResource"("companyId");

-- CreateIndex
CREATE INDEX "CalendarResource_status_idx" ON "CalendarResource"("status");

-- CreateIndex
CREATE INDEX "CalendarResource_name_idx" ON "CalendarResource"("name");

-- CreateIndex
CREATE UNIQUE INDEX "CalendarResource_companyId_name_key" ON "CalendarResource"("companyId", "name");

-- CreateIndex
CREATE INDEX "CalendarResourceBooking_companyId_idx" ON "CalendarResourceBooking"("companyId");

-- CreateIndex
CREATE INDEX "CalendarResourceBooking_eventId_idx" ON "CalendarResourceBooking"("eventId");

-- CreateIndex
CREATE INDEX "CalendarResourceBooking_resourceId_idx" ON "CalendarResourceBooking"("resourceId");

-- CreateIndex
CREATE INDEX "CalendarResourceBooking_status_idx" ON "CalendarResourceBooking"("status");

-- CreateIndex
CREATE INDEX "CalendarResourceBooking_startAt_idx" ON "CalendarResourceBooking"("startAt");

-- CreateIndex
CREATE INDEX "CalendarResourceBooking_endAt_idx" ON "CalendarResourceBooking"("endAt");

-- CreateIndex
CREATE INDEX "CalendarEventReminder_companyId_idx" ON "CalendarEventReminder"("companyId");

-- CreateIndex
CREATE INDEX "CalendarEventReminder_eventId_idx" ON "CalendarEventReminder"("eventId");

-- CreateIndex
CREATE INDEX "CalendarEventReminder_method_idx" ON "CalendarEventReminder"("method");

-- CreateIndex
CREATE INDEX "CalendarEventReminder_status_idx" ON "CalendarEventReminder"("status");

-- CreateIndex
CREATE INDEX "CalendarEventReminder_remindAt_idx" ON "CalendarEventReminder"("remindAt");

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_leaveRequestId_fkey" FOREIGN KEY ("leaveRequestId") REFERENCES "LeaveRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_holidayId_fkey" FOREIGN KEY ("holidayId") REFERENCES "Holiday"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "DocumentRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEventAttendee" ADD CONSTRAINT "CalendarEventAttendee_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEventAttendee" ADD CONSTRAINT "CalendarEventAttendee_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "CalendarEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEventAttendee" ADD CONSTRAINT "CalendarEventAttendee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEventAttendee" ADD CONSTRAINT "CalendarEventAttendee_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarResource" ADD CONSTRAINT "CalendarResource_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarResourceBooking" ADD CONSTRAINT "CalendarResourceBooking_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarResourceBooking" ADD CONSTRAINT "CalendarResourceBooking_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "CalendarEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarResourceBooking" ADD CONSTRAINT "CalendarResourceBooking_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "CalendarResource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEventReminder" ADD CONSTRAINT "CalendarEventReminder_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEventReminder" ADD CONSTRAINT "CalendarEventReminder_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "CalendarEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
