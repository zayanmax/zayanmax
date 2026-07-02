-- CreateEnum
CREATE TYPE "JobOpeningStatus" AS ENUM ('DRAFT', 'OPEN', 'PAUSED', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CandidateApplicationStatus" AS ENUM ('APPLIED', 'SCREENING', 'INTERVIEW', 'OFFERED', 'HIRED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "OfferLetterStatus" AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'CANCELLED');

-- CreateTable
CREATE TABLE "JobOpening" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "branchId" UUID,
    "departmentId" UUID,
    "designationId" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "requirements" TEXT,
    "location" TEXT,
    "employmentType" "EmploymentType",
    "openingsCount" INTEGER NOT NULL DEFAULT 1,
    "status" "JobOpeningStatus" NOT NULL DEFAULT 'DRAFT',
    "openedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,

    CONSTRAINT "JobOpening_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandidateProfile" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "source" TEXT,
    "sourceDetails" TEXT,
    "resumeUrl" TEXT,
    "currentTitle" TEXT,
    "currentCompany" TEXT,
    "skills" TEXT,
    "notes" TEXT,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,

    CONSTRAINT "CandidateProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandidatePipelineStage" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,

    CONSTRAINT "CandidatePipelineStage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandidateApplication" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "candidateId" UUID NOT NULL,
    "jobOpeningId" UUID NOT NULL,
    "stageId" UUID,
    "status" "CandidateApplicationStatus" NOT NULL DEFAULT 'APPLIED',
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "statusChangedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "withdrawnReason" TEXT,
    "notes" TEXT,
    "convertedEmployeeId" UUID,
    "convertedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,

    CONSTRAINT "CandidateApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterviewRound" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "applicationId" UUID NOT NULL,
    "roundName" TEXT NOT NULL,
    "interviewType" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "interviewerUserId" UUID,
    "interviewerEmployeeId" UUID,
    "location" TEXT,
    "meetingLink" TEXT,
    "status" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,

    CONSTRAINT "InterviewRound_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterviewFeedback" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "interviewRoundId" UUID NOT NULL,
    "feedbackByUserId" UUID,
    "feedbackByEmployeeId" UUID,
    "rating" INTEGER,
    "feedback" TEXT,
    "recommendation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,

    CONSTRAINT "InterviewFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfferLetter" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "applicationId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "offeredDesignation" TEXT,
    "offeredSalary" DECIMAL(12,2),
    "joiningDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "status" "OfferLetterStatus" NOT NULL DEFAULT 'DRAFT',
    "documentName" TEXT,
    "documentUrl" TEXT,
    "metadata" JSONB,
    "sentAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "declinedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,

    CONSTRAINT "OfferLetter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OnboardingChecklist" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "applicationId" UUID,
    "candidateId" UUID,
    "employeeId" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,

    CONSTRAINT "OnboardingChecklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OnboardingChecklistItem" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "checklistId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "completedById" UUID,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,

    CONSTRAINT "OnboardingChecklistItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "JobOpening_companyId_idx" ON "JobOpening"("companyId");

-- CreateIndex
CREATE INDEX "JobOpening_branchId_idx" ON "JobOpening"("branchId");

-- CreateIndex
CREATE INDEX "JobOpening_departmentId_idx" ON "JobOpening"("departmentId");

-- CreateIndex
CREATE INDEX "JobOpening_designationId_idx" ON "JobOpening"("designationId");

-- CreateIndex
CREATE INDEX "JobOpening_status_idx" ON "JobOpening"("status");

-- CreateIndex
CREATE INDEX "JobOpening_createdAt_idx" ON "JobOpening"("createdAt");

-- CreateIndex
CREATE INDEX "CandidateProfile_companyId_idx" ON "CandidateProfile"("companyId");

-- CreateIndex
CREATE INDEX "CandidateProfile_email_idx" ON "CandidateProfile"("email");

-- CreateIndex
CREATE INDEX "CandidateProfile_phone_idx" ON "CandidateProfile"("phone");

-- CreateIndex
CREATE INDEX "CandidateProfile_source_idx" ON "CandidateProfile"("source");

-- CreateIndex
CREATE INDEX "CandidateProfile_status_idx" ON "CandidateProfile"("status");

-- CreateIndex
CREATE UNIQUE INDEX "CandidateProfile_companyId_email_key" ON "CandidateProfile"("companyId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "CandidateProfile_companyId_phone_key" ON "CandidateProfile"("companyId", "phone");

-- CreateIndex
CREATE INDEX "CandidatePipelineStage_companyId_idx" ON "CandidatePipelineStage"("companyId");

-- CreateIndex
CREATE INDEX "CandidatePipelineStage_sortOrder_idx" ON "CandidatePipelineStage"("sortOrder");

-- CreateIndex
CREATE INDEX "CandidatePipelineStage_status_idx" ON "CandidatePipelineStage"("status");

-- CreateIndex
CREATE UNIQUE INDEX "CandidatePipelineStage_companyId_name_key" ON "CandidatePipelineStage"("companyId", "name");

-- CreateIndex
CREATE INDEX "CandidateApplication_companyId_idx" ON "CandidateApplication"("companyId");

-- CreateIndex
CREATE INDEX "CandidateApplication_candidateId_idx" ON "CandidateApplication"("candidateId");

-- CreateIndex
CREATE INDEX "CandidateApplication_jobOpeningId_idx" ON "CandidateApplication"("jobOpeningId");

-- CreateIndex
CREATE INDEX "CandidateApplication_stageId_idx" ON "CandidateApplication"("stageId");

-- CreateIndex
CREATE INDEX "CandidateApplication_status_idx" ON "CandidateApplication"("status");

-- CreateIndex
CREATE INDEX "CandidateApplication_appliedAt_idx" ON "CandidateApplication"("appliedAt");

-- CreateIndex
CREATE INDEX "CandidateApplication_convertedEmployeeId_idx" ON "CandidateApplication"("convertedEmployeeId");

-- CreateIndex
CREATE INDEX "InterviewRound_companyId_idx" ON "InterviewRound"("companyId");

-- CreateIndex
CREATE INDEX "InterviewRound_applicationId_idx" ON "InterviewRound"("applicationId");

-- CreateIndex
CREATE INDEX "InterviewRound_interviewerUserId_idx" ON "InterviewRound"("interviewerUserId");

-- CreateIndex
CREATE INDEX "InterviewRound_interviewerEmployeeId_idx" ON "InterviewRound"("interviewerEmployeeId");

-- CreateIndex
CREATE INDEX "InterviewRound_scheduledAt_idx" ON "InterviewRound"("scheduledAt");

-- CreateIndex
CREATE INDEX "InterviewFeedback_companyId_idx" ON "InterviewFeedback"("companyId");

-- CreateIndex
CREATE INDEX "InterviewFeedback_interviewRoundId_idx" ON "InterviewFeedback"("interviewRoundId");

-- CreateIndex
CREATE INDEX "InterviewFeedback_feedbackByUserId_idx" ON "InterviewFeedback"("feedbackByUserId");

-- CreateIndex
CREATE INDEX "InterviewFeedback_feedbackByEmployeeId_idx" ON "InterviewFeedback"("feedbackByEmployeeId");

-- CreateIndex
CREATE INDEX "OfferLetter_companyId_idx" ON "OfferLetter"("companyId");

-- CreateIndex
CREATE INDEX "OfferLetter_applicationId_idx" ON "OfferLetter"("applicationId");

-- CreateIndex
CREATE INDEX "OfferLetter_status_idx" ON "OfferLetter"("status");

-- CreateIndex
CREATE INDEX "OfferLetter_expiryDate_idx" ON "OfferLetter"("expiryDate");

-- CreateIndex
CREATE INDEX "OnboardingChecklist_companyId_idx" ON "OnboardingChecklist"("companyId");

-- CreateIndex
CREATE INDEX "OnboardingChecklist_applicationId_idx" ON "OnboardingChecklist"("applicationId");

-- CreateIndex
CREATE INDEX "OnboardingChecklist_candidateId_idx" ON "OnboardingChecklist"("candidateId");

-- CreateIndex
CREATE INDEX "OnboardingChecklist_employeeId_idx" ON "OnboardingChecklist"("employeeId");

-- CreateIndex
CREATE INDEX "OnboardingChecklist_status_idx" ON "OnboardingChecklist"("status");

-- CreateIndex
CREATE INDEX "OnboardingChecklistItem_companyId_idx" ON "OnboardingChecklistItem"("companyId");

-- CreateIndex
CREATE INDEX "OnboardingChecklistItem_checklistId_idx" ON "OnboardingChecklistItem"("checklistId");

-- CreateIndex
CREATE INDEX "OnboardingChecklistItem_isCompleted_idx" ON "OnboardingChecklistItem"("isCompleted");

-- CreateIndex
CREATE INDEX "OnboardingChecklistItem_status_idx" ON "OnboardingChecklistItem"("status");

-- AddForeignKey
ALTER TABLE "JobOpening" ADD CONSTRAINT "JobOpening_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobOpening" ADD CONSTRAINT "JobOpening_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobOpening" ADD CONSTRAINT "JobOpening_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobOpening" ADD CONSTRAINT "JobOpening_designationId_fkey" FOREIGN KEY ("designationId") REFERENCES "Designation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateProfile" ADD CONSTRAINT "CandidateProfile_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidatePipelineStage" ADD CONSTRAINT "CandidatePipelineStage_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateApplication" ADD CONSTRAINT "CandidateApplication_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateApplication" ADD CONSTRAINT "CandidateApplication_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "CandidateProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateApplication" ADD CONSTRAINT "CandidateApplication_jobOpeningId_fkey" FOREIGN KEY ("jobOpeningId") REFERENCES "JobOpening"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateApplication" ADD CONSTRAINT "CandidateApplication_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "CandidatePipelineStage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateApplication" ADD CONSTRAINT "CandidateApplication_convertedEmployeeId_fkey" FOREIGN KEY ("convertedEmployeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewRound" ADD CONSTRAINT "InterviewRound_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewRound" ADD CONSTRAINT "InterviewRound_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "CandidateApplication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewRound" ADD CONSTRAINT "InterviewRound_interviewerEmployeeId_fkey" FOREIGN KEY ("interviewerEmployeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewFeedback" ADD CONSTRAINT "InterviewFeedback_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewFeedback" ADD CONSTRAINT "InterviewFeedback_interviewRoundId_fkey" FOREIGN KEY ("interviewRoundId") REFERENCES "InterviewRound"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewFeedback" ADD CONSTRAINT "InterviewFeedback_feedbackByEmployeeId_fkey" FOREIGN KEY ("feedbackByEmployeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferLetter" ADD CONSTRAINT "OfferLetter_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferLetter" ADD CONSTRAINT "OfferLetter_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "CandidateApplication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnboardingChecklist" ADD CONSTRAINT "OnboardingChecklist_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnboardingChecklist" ADD CONSTRAINT "OnboardingChecklist_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "CandidateApplication"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnboardingChecklist" ADD CONSTRAINT "OnboardingChecklist_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "CandidateProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnboardingChecklist" ADD CONSTRAINT "OnboardingChecklist_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnboardingChecklistItem" ADD CONSTRAINT "OnboardingChecklistItem_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnboardingChecklistItem" ADD CONSTRAINT "OnboardingChecklistItem_checklistId_fkey" FOREIGN KEY ("checklistId") REFERENCES "OnboardingChecklist"("id") ON DELETE CASCADE ON UPDATE CASCADE;
