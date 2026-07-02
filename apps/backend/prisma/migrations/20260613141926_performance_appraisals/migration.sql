-- CreateEnum
CREATE TYPE "PerformanceCycleStatus" AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "EmployeeGoalStatus" AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "EmployeeReviewStatus" AS ENUM ('DRAFT', 'SELF_REVIEW', 'MANAGER_REVIEW', 'HR_REVIEW', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "PerformanceCycle" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "PerformanceCycleStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,

    CONSTRAINT "PerformanceCycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeGoal" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "cycleId" UUID,
    "employeeId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "targetValue" TEXT,
    "weight" DECIMAL(8,2),
    "progress" INTEGER NOT NULL DEFAULT 0,
    "status" "EmployeeGoalStatus" NOT NULL DEFAULT 'DRAFT',
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,

    CONSTRAINT "EmployeeGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoalProgressUpdate" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "goalId" UUID NOT NULL,
    "employeeId" UUID,
    "progress" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" UUID,

    CONSTRAINT "GoalProgressUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KpiCategory" (
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

    CONSTRAINT "KpiCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeKpiRecord" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "cycleId" UUID,
    "employeeId" UUID NOT NULL,
    "categoryId" UUID,
    "title" TEXT NOT NULL,
    "score" DECIMAL(8,2),
    "maxScore" DECIMAL(8,2) NOT NULL DEFAULT 100,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,

    CONSTRAINT "EmployeeKpiRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewTemplate" (
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

    CONSTRAINT "ReviewTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewTemplateQuestion" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "templateId" UUID NOT NULL,
    "questionText" TEXT NOT NULL,
    "responseType" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "weight" DECIMAL(8,2),
    "required" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,

    CONSTRAINT "ReviewTemplateQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeReview" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "cycleId" UUID,
    "employeeId" UUID NOT NULL,
    "templateId" UUID,
    "reviewerUserId" UUID,
    "managerEmployeeId" UUID,
    "status" "EmployeeReviewStatus" NOT NULL DEFAULT 'DRAFT',
    "overallScore" DECIMAL(8,2),
    "summary" TEXT,
    "promotionRecommended" BOOLEAN NOT NULL DEFAULT false,
    "promotionRecommendationText" TEXT,
    "incrementRecommended" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,

    CONSTRAINT "EmployeeReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewResponse" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "reviewId" UUID NOT NULL,
    "questionId" UUID,
    "responderUserId" UUID,
    "responseText" TEXT,
    "score" DECIMAL(8,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,

    CONSTRAINT "ReviewResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedbackRecord" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "feedbackByUserId" UUID,
    "feedbackByEmployeeId" UUID,
    "feedbackText" TEXT NOT NULL,
    "feedbackType" TEXT,
    "visibility" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,

    CONSTRAINT "FeedbackRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OneOnOneMeetingNote" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "managerEmployeeId" UUID,
    "meetingDate" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "actionItems" TEXT,
    "nextMeetingDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,

    CONSTRAINT "OneOnOneMeetingNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromotionRecommendation" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "reviewId" UUID,
    "recommendedByUserId" UUID,
    "recommendedByEmployeeId" UUID,
    "recommendationText" TEXT NOT NULL,
    "currentDesignation" TEXT,
    "recommendedDesignation" TEXT,
    "effectiveFrom" TIMESTAMP(3),
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,

    CONSTRAINT "PromotionRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PerformanceCycle_companyId_idx" ON "PerformanceCycle"("companyId");

-- CreateIndex
CREATE INDEX "PerformanceCycle_status_idx" ON "PerformanceCycle"("status");

-- CreateIndex
CREATE INDEX "PerformanceCycle_startDate_idx" ON "PerformanceCycle"("startDate");

-- CreateIndex
CREATE INDEX "PerformanceCycle_endDate_idx" ON "PerformanceCycle"("endDate");

-- CreateIndex
CREATE UNIQUE INDEX "PerformanceCycle_companyId_name_key" ON "PerformanceCycle"("companyId", "name");

-- CreateIndex
CREATE INDEX "EmployeeGoal_companyId_idx" ON "EmployeeGoal"("companyId");

-- CreateIndex
CREATE INDEX "EmployeeGoal_cycleId_idx" ON "EmployeeGoal"("cycleId");

-- CreateIndex
CREATE INDEX "EmployeeGoal_employeeId_idx" ON "EmployeeGoal"("employeeId");

-- CreateIndex
CREATE INDEX "EmployeeGoal_status_idx" ON "EmployeeGoal"("status");

-- CreateIndex
CREATE INDEX "EmployeeGoal_dueDate_idx" ON "EmployeeGoal"("dueDate");

-- CreateIndex
CREATE INDEX "GoalProgressUpdate_companyId_idx" ON "GoalProgressUpdate"("companyId");

-- CreateIndex
CREATE INDEX "GoalProgressUpdate_goalId_idx" ON "GoalProgressUpdate"("goalId");

-- CreateIndex
CREATE INDEX "GoalProgressUpdate_employeeId_idx" ON "GoalProgressUpdate"("employeeId");

-- CreateIndex
CREATE INDEX "GoalProgressUpdate_createdAt_idx" ON "GoalProgressUpdate"("createdAt");

-- CreateIndex
CREATE INDEX "KpiCategory_companyId_idx" ON "KpiCategory"("companyId");

-- CreateIndex
CREATE INDEX "KpiCategory_status_idx" ON "KpiCategory"("status");

-- CreateIndex
CREATE UNIQUE INDEX "KpiCategory_companyId_name_key" ON "KpiCategory"("companyId", "name");

-- CreateIndex
CREATE INDEX "EmployeeKpiRecord_companyId_idx" ON "EmployeeKpiRecord"("companyId");

-- CreateIndex
CREATE INDEX "EmployeeKpiRecord_cycleId_idx" ON "EmployeeKpiRecord"("cycleId");

-- CreateIndex
CREATE INDEX "EmployeeKpiRecord_employeeId_idx" ON "EmployeeKpiRecord"("employeeId");

-- CreateIndex
CREATE INDEX "EmployeeKpiRecord_categoryId_idx" ON "EmployeeKpiRecord"("categoryId");

-- CreateIndex
CREATE INDEX "ReviewTemplate_companyId_idx" ON "ReviewTemplate"("companyId");

-- CreateIndex
CREATE INDEX "ReviewTemplate_status_idx" ON "ReviewTemplate"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewTemplate_companyId_name_key" ON "ReviewTemplate"("companyId", "name");

-- CreateIndex
CREATE INDEX "ReviewTemplateQuestion_companyId_idx" ON "ReviewTemplateQuestion"("companyId");

-- CreateIndex
CREATE INDEX "ReviewTemplateQuestion_templateId_idx" ON "ReviewTemplateQuestion"("templateId");

-- CreateIndex
CREATE INDEX "ReviewTemplateQuestion_sortOrder_idx" ON "ReviewTemplateQuestion"("sortOrder");

-- CreateIndex
CREATE INDEX "EmployeeReview_companyId_idx" ON "EmployeeReview"("companyId");

-- CreateIndex
CREATE INDEX "EmployeeReview_cycleId_idx" ON "EmployeeReview"("cycleId");

-- CreateIndex
CREATE INDEX "EmployeeReview_employeeId_idx" ON "EmployeeReview"("employeeId");

-- CreateIndex
CREATE INDEX "EmployeeReview_templateId_idx" ON "EmployeeReview"("templateId");

-- CreateIndex
CREATE INDEX "EmployeeReview_managerEmployeeId_idx" ON "EmployeeReview"("managerEmployeeId");

-- CreateIndex
CREATE INDEX "EmployeeReview_status_idx" ON "EmployeeReview"("status");

-- CreateIndex
CREATE INDEX "ReviewResponse_companyId_idx" ON "ReviewResponse"("companyId");

-- CreateIndex
CREATE INDEX "ReviewResponse_reviewId_idx" ON "ReviewResponse"("reviewId");

-- CreateIndex
CREATE INDEX "ReviewResponse_questionId_idx" ON "ReviewResponse"("questionId");

-- CreateIndex
CREATE INDEX "ReviewResponse_responderUserId_idx" ON "ReviewResponse"("responderUserId");

-- CreateIndex
CREATE INDEX "FeedbackRecord_companyId_idx" ON "FeedbackRecord"("companyId");

-- CreateIndex
CREATE INDEX "FeedbackRecord_employeeId_idx" ON "FeedbackRecord"("employeeId");

-- CreateIndex
CREATE INDEX "FeedbackRecord_feedbackByUserId_idx" ON "FeedbackRecord"("feedbackByUserId");

-- CreateIndex
CREATE INDEX "FeedbackRecord_feedbackByEmployeeId_idx" ON "FeedbackRecord"("feedbackByEmployeeId");

-- CreateIndex
CREATE INDEX "FeedbackRecord_createdAt_idx" ON "FeedbackRecord"("createdAt");

-- CreateIndex
CREATE INDEX "OneOnOneMeetingNote_companyId_idx" ON "OneOnOneMeetingNote"("companyId");

-- CreateIndex
CREATE INDEX "OneOnOneMeetingNote_employeeId_idx" ON "OneOnOneMeetingNote"("employeeId");

-- CreateIndex
CREATE INDEX "OneOnOneMeetingNote_managerEmployeeId_idx" ON "OneOnOneMeetingNote"("managerEmployeeId");

-- CreateIndex
CREATE INDEX "OneOnOneMeetingNote_meetingDate_idx" ON "OneOnOneMeetingNote"("meetingDate");

-- CreateIndex
CREATE INDEX "PromotionRecommendation_companyId_idx" ON "PromotionRecommendation"("companyId");

-- CreateIndex
CREATE INDEX "PromotionRecommendation_employeeId_idx" ON "PromotionRecommendation"("employeeId");

-- CreateIndex
CREATE INDEX "PromotionRecommendation_reviewId_idx" ON "PromotionRecommendation"("reviewId");

-- CreateIndex
CREATE INDEX "PromotionRecommendation_recommendedByUserId_idx" ON "PromotionRecommendation"("recommendedByUserId");

-- CreateIndex
CREATE INDEX "PromotionRecommendation_recommendedByEmployeeId_idx" ON "PromotionRecommendation"("recommendedByEmployeeId");

-- CreateIndex
CREATE INDEX "PromotionRecommendation_status_idx" ON "PromotionRecommendation"("status");

-- AddForeignKey
ALTER TABLE "PerformanceCycle" ADD CONSTRAINT "PerformanceCycle_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeGoal" ADD CONSTRAINT "EmployeeGoal_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeGoal" ADD CONSTRAINT "EmployeeGoal_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "PerformanceCycle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeGoal" ADD CONSTRAINT "EmployeeGoal_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoalProgressUpdate" ADD CONSTRAINT "GoalProgressUpdate_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoalProgressUpdate" ADD CONSTRAINT "GoalProgressUpdate_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "EmployeeGoal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoalProgressUpdate" ADD CONSTRAINT "GoalProgressUpdate_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KpiCategory" ADD CONSTRAINT "KpiCategory_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeKpiRecord" ADD CONSTRAINT "EmployeeKpiRecord_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeKpiRecord" ADD CONSTRAINT "EmployeeKpiRecord_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "PerformanceCycle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeKpiRecord" ADD CONSTRAINT "EmployeeKpiRecord_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeKpiRecord" ADD CONSTRAINT "EmployeeKpiRecord_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "KpiCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewTemplate" ADD CONSTRAINT "ReviewTemplate_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewTemplateQuestion" ADD CONSTRAINT "ReviewTemplateQuestion_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewTemplateQuestion" ADD CONSTRAINT "ReviewTemplateQuestion_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ReviewTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeReview" ADD CONSTRAINT "EmployeeReview_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeReview" ADD CONSTRAINT "EmployeeReview_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "PerformanceCycle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeReview" ADD CONSTRAINT "EmployeeReview_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeReview" ADD CONSTRAINT "EmployeeReview_managerEmployeeId_fkey" FOREIGN KEY ("managerEmployeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeReview" ADD CONSTRAINT "EmployeeReview_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ReviewTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewResponse" ADD CONSTRAINT "ReviewResponse_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewResponse" ADD CONSTRAINT "ReviewResponse_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "EmployeeReview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewResponse" ADD CONSTRAINT "ReviewResponse_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "ReviewTemplateQuestion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedbackRecord" ADD CONSTRAINT "FeedbackRecord_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedbackRecord" ADD CONSTRAINT "FeedbackRecord_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedbackRecord" ADD CONSTRAINT "FeedbackRecord_feedbackByEmployeeId_fkey" FOREIGN KEY ("feedbackByEmployeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OneOnOneMeetingNote" ADD CONSTRAINT "OneOnOneMeetingNote_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OneOnOneMeetingNote" ADD CONSTRAINT "OneOnOneMeetingNote_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OneOnOneMeetingNote" ADD CONSTRAINT "OneOnOneMeetingNote_managerEmployeeId_fkey" FOREIGN KEY ("managerEmployeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionRecommendation" ADD CONSTRAINT "PromotionRecommendation_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionRecommendation" ADD CONSTRAINT "PromotionRecommendation_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionRecommendation" ADD CONSTRAINT "PromotionRecommendation_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "EmployeeReview"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromotionRecommendation" ADD CONSTRAINT "PromotionRecommendation_recommendedByEmployeeId_fkey" FOREIGN KEY ("recommendedByEmployeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
