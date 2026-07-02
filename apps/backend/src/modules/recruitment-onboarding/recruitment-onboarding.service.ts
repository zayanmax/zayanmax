import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import {
  ApplicationQueryDto,
  CandidateQueryDto,
  ChangeApplicationStatusDto,
  ChangeJobOpeningStatusDto,
  ChangeOfferStatusDto,
  CompleteOnboardingItemDto,
  ConvertCandidateToEmployeeDto,
  CreateApplicationDto,
  CreateCandidateDto,
  CreateInterviewRoundDto,
  CreateJobOpeningDto,
  CreateOfferLetterDto,
  CreateOnboardingChecklistDto,
  OnboardingChecklistItemDto,
  CreatePipelineStageDto,
  InterviewFeedbackDto,
  JobOpeningQueryDto,
  PipelineStageQueryDto,
} from './dto/recruitment-onboarding.dto';
import {
  ApplicationStatusDto,
  JobOpeningStatusDto,
  OfferStatusDto,
} from './dto/recruitment-onboarding.enums';

@Injectable()
export class RecruitmentOnboardingService {
  constructor(private readonly prisma: PrismaService) {}

  async createJobOpening(
    companyId: string,
    actorId: string,
    dto: CreateJobOpeningDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const job = await this.prisma.jobOpening.create({
      data: {
        companyId,
        branchId: dto.branchId,
        departmentId: dto.departmentId,
        designationId: dto.designationId,
        title: dto.title,
        description: dto.description,
        requirements: dto.requirements,
        location: dto.location,
        employmentType: dto.employmentType,
        openingsCount: dto.openingsCount ?? 1,
        createdById: actorId,
      },
    });
    await this.audit(
      companyId,
      actorId,
      'recruitment.jobs.create',
      'JobOpening',
      job.id,
      undefined,
      job,
      ipAddress,
      userAgent,
    );
    return job;
  }

  async findJobOpenings(companyId: string, query: JobOpeningQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.JobOpeningWhereInput = {
      companyId,
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.departmentId ? { departmentId: query.departmentId } : {}),
      ...(query.designationId ? { designationId: query.designationId } : {}),
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: 'insensitive' } },
              {
                description: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
              { location: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.jobOpening.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [query.sortBy ?? 'createdAt']: query.sortOrder ?? 'desc' },
      }),
      this.prisma.jobOpening.count({ where }),
    ]);
    return this.paginated(data, page, limit, total);
  }

  async changeJobStatus(
    companyId: string,
    jobId: string,
    actorId: string,
    dto: ChangeJobOpeningStatusDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const current = await this.findJobOrThrow(companyId, jobId);
    const now = new Date();
    const job = await this.prisma.jobOpening.update({
      where: { id: jobId },
      data: {
        status: dto.status,
        openedAt: dto.status === JobOpeningStatusDto.OPEN ? now : undefined,
        closedAt:
          dto.status === JobOpeningStatusDto.CLOSED ||
          dto.status === JobOpeningStatusDto.CANCELLED
            ? now
            : undefined,
        updatedById: actorId,
      },
    });
    await this.audit(
      companyId,
      actorId,
      'recruitment.jobs.status',
      'JobOpening',
      jobId,
      current,
      job,
      ipAddress,
      userAgent,
    );
    return job;
  }

  async createCandidate(
    companyId: string,
    actorId: string,
    dto: CreateCandidateDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const duplicateConditions = [
      dto.email ? { email: dto.email } : undefined,
      dto.phone ? { phone: dto.phone } : undefined,
    ].filter(Boolean) as Prisma.CandidateProfileWhereInput[];

    if (duplicateConditions.length) {
      const duplicate = await this.prisma.candidateProfile.findFirst({
        where: {
          companyId,
          deletedAt: null,
          OR: duplicateConditions,
        },
      });
      if (duplicate) throw new ConflictException('Candidate already exists');
    }

    const candidate = await this.prisma.candidateProfile.create({
      data: { companyId, ...dto, createdById: actorId },
    });
    await this.audit(
      companyId,
      actorId,
      'recruitment.candidates.create',
      'CandidateProfile',
      candidate.id,
      undefined,
      candidate,
      ipAddress,
      userAgent,
    );
    return candidate;
  }

  async findCandidates(companyId: string, query: CandidateQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.CandidateProfileWhereInput = {
      companyId,
      deletedAt: null,
      ...(query.source ? { source: query.source } : {}),
      ...(query.search
        ? {
            OR: [
              { firstName: { contains: query.search, mode: 'insensitive' } },
              { lastName: { contains: query.search, mode: 'insensitive' } },
              { email: { contains: query.search, mode: 'insensitive' } },
              { phone: { contains: query.search, mode: 'insensitive' } },
              { skills: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.candidateProfile.findMany({
        where,
        include: { applications: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [query.sortBy ?? 'createdAt']: query.sortOrder ?? 'desc' },
      }),
      this.prisma.candidateProfile.count({ where }),
    ]);
    return this.paginated(data, page, limit, total);
  }

  async createPipelineStage(
    companyId: string,
    actorId: string,
    dto: CreatePipelineStageDto,
  ) {
    const existing = await this.prisma.candidatePipelineStage.findFirst({
      where: { companyId, name: dto.name, deletedAt: null },
    });
    if (existing) throw new ConflictException('Pipeline stage exists');

    const stage = await this.prisma.candidatePipelineStage.create({
      data: {
        companyId,
        name: dto.name,
        description: dto.description,
        sortOrder: dto.sortOrder ?? 0,
        createdById: actorId,
      },
    });
    await this.audit(
      companyId,
      actorId,
      'recruitment.pipeline_stages.create',
      'CandidatePipelineStage',
      stage.id,
      undefined,
      stage,
    );
    return stage;
  }

  async findPipelineStages(companyId: string, query: PipelineStageQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.CandidatePipelineStageWhereInput = {
      companyId,
      deletedAt: null,
      ...(query.search
        ? { name: { contains: query.search, mode: 'insensitive' } }
        : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.candidatePipelineStage.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [query.sortBy ?? 'sortOrder']: query.sortOrder ?? 'asc' },
      }),
      this.prisma.candidatePipelineStage.count({ where }),
    ]);
    return this.paginated(data, page, limit, total);
  }

  async createApplication(
    companyId: string,
    actorId: string,
    dto: CreateApplicationDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const application = await this.prisma.candidateApplication.create({
      data: {
        companyId,
        candidateId: dto.candidateId,
        jobOpeningId: dto.jobOpeningId,
        stageId: dto.stageId,
        notes: dto.notes,
        createdById: actorId,
      },
    });
    await this.audit(
      companyId,
      actorId,
      'recruitment.applications.create',
      'CandidateApplication',
      application.id,
      undefined,
      application,
      ipAddress,
      userAgent,
    );
    return application;
  }

  async findApplications(companyId: string, query: ApplicationQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.CandidateApplicationWhereInput = {
      companyId,
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.candidateId ? { candidateId: query.candidateId } : {}),
      ...(query.jobOpeningId ? { jobOpeningId: query.jobOpeningId } : {}),
      ...(query.stageId ? { stageId: query.stageId } : {}),
      ...(query.search
        ? {
            OR: [
              {
                candidate: {
                  firstName: { contains: query.search, mode: 'insensitive' },
                },
              },
              {
                candidate: {
                  lastName: { contains: query.search, mode: 'insensitive' },
                },
              },
              {
                jobOpening: {
                  title: { contains: query.search, mode: 'insensitive' },
                },
              },
            ],
          }
        : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.candidateApplication.findMany({
        where,
        include: {
          candidate: true,
          jobOpening: true,
          stage: true,
          interviews: true,
          offerLetters: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [query.sortBy ?? 'createdAt']: query.sortOrder ?? 'desc' },
      }),
      this.prisma.candidateApplication.count({ where }),
    ]);
    return this.paginated(data, page, limit, total);
  }

  async changeApplicationStatus(
    companyId: string,
    applicationId: string,
    actorId: string,
    dto: ChangeApplicationStatusDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const current = await this.findApplicationOrThrow(companyId, applicationId);
    const application = await this.prisma.candidateApplication.update({
      where: { id: applicationId },
      data: {
        status: dto.status,
        rejectionReason: dto.rejectionReason,
        withdrawnReason: dto.withdrawnReason,
        statusChangedAt: new Date(),
        updatedById: actorId,
      },
    });
    await this.audit(
      companyId,
      actorId,
      'recruitment.applications.status',
      'CandidateApplication',
      applicationId,
      current,
      application,
      ipAddress,
      userAgent,
    );
    return application;
  }

  async createInterviewRound(
    companyId: string,
    actorId: string,
    dto: CreateInterviewRoundDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const interview = await this.prisma.interviewRound.create({
      data: {
        companyId,
        applicationId: dto.applicationId,
        roundName: dto.roundName,
        interviewType: dto.interviewType,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
        interviewerUserId: dto.interviewerUserId,
        interviewerEmployeeId: dto.interviewerEmployeeId,
        location: dto.location,
        meetingLink: dto.meetingLink,
        notes: dto.notes,
        createdById: actorId,
      },
    });
    await this.audit(
      companyId,
      actorId,
      'recruitment.interviews.create',
      'InterviewRound',
      interview.id,
      undefined,
      interview,
      ipAddress,
      userAgent,
    );
    return interview;
  }

  async createInterviewFeedback(
    companyId: string,
    interviewId: string,
    actorId: string,
    dto: InterviewFeedbackDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    await this.findInterviewOrThrow(companyId, interviewId);
    const feedback = await this.prisma.interviewFeedback.create({
      data: {
        companyId,
        interviewRoundId: interviewId,
        feedbackByUserId: actorId,
        feedbackByEmployeeId: dto.feedbackByEmployeeId,
        rating: dto.rating,
        feedback: dto.feedback,
        recommendation: dto.recommendation,
        createdById: actorId,
      },
    });
    await this.audit(
      companyId,
      actorId,
      'recruitment.interviews.feedback',
      'InterviewRound',
      interviewId,
      undefined,
      feedback,
      ipAddress,
      userAgent,
    );
    return feedback;
  }

  async createOfferLetter(
    companyId: string,
    actorId: string,
    dto: CreateOfferLetterDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const offer = await this.prisma.offerLetter.create({
      data: {
        companyId,
        applicationId: dto.applicationId,
        title: dto.title,
        offeredDesignation: dto.offeredDesignation,
        offeredSalary: dto.offeredSalary,
        joiningDate: dto.joiningDate ? new Date(dto.joiningDate) : undefined,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
        documentName: dto.documentName,
        documentUrl: dto.documentUrl,
        metadata: dto.metadata as Prisma.InputJsonValue,
        createdById: actorId,
      },
    });
    await this.audit(
      companyId,
      actorId,
      'recruitment.offers.create',
      'OfferLetter',
      offer.id,
      undefined,
      offer,
      ipAddress,
      userAgent,
    );
    return offer;
  }

  async changeOfferStatus(
    companyId: string,
    offerId: string,
    actorId: string,
    dto: ChangeOfferStatusDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const current = await this.findOfferOrThrow(companyId, offerId);
    const now = new Date();
    const offer = await this.prisma.offerLetter.update({
      where: { id: offerId },
      data: {
        status: dto.status,
        sentAt: dto.status === OfferStatusDto.SENT ? now : undefined,
        acceptedAt: dto.status === OfferStatusDto.ACCEPTED ? now : undefined,
        declinedAt: dto.status === OfferStatusDto.DECLINED ? now : undefined,
        updatedById: actorId,
      },
    });
    await this.audit(
      companyId,
      actorId,
      'recruitment.offers.status',
      'OfferLetter',
      offerId,
      current,
      offer,
      ipAddress,
      userAgent,
    );
    return offer;
  }

  async createOnboardingChecklist(
    companyId: string,
    actorId: string,
    dto: CreateOnboardingChecklistDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const checklist = await this.prisma.onboardingChecklist.create({
      data: {
        companyId,
        applicationId: dto.applicationId,
        candidateId: dto.candidateId,
        employeeId: dto.employeeId,
        title: dto.title,
        description: dto.description,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        createdById: actorId,
        items: dto.items?.length
          ? {
              create: dto.items.map((item) => ({
                companyId,
                title: item.title,
                description: item.description,
                sortOrder: item.sortOrder ?? 0,
                dueDate: item.dueDate ? new Date(item.dueDate) : undefined,
                createdById: actorId,
              })),
            }
          : undefined,
      },
      include: { items: true },
    });
    await this.audit(
      companyId,
      actorId,
      'recruitment.onboarding.create',
      'OnboardingChecklist',
      checklist.id,
      undefined,
      checklist,
      ipAddress,
      userAgent,
    );
    return checklist;
  }

  async addOnboardingChecklistItem(
    companyId: string,
    checklistId: string,
    actorId: string,
    dto: OnboardingChecklistItemDto,
  ) {
    await this.findChecklistOrThrow(companyId, checklistId);
    const item = await this.prisma.onboardingChecklistItem.create({
      data: {
        companyId,
        checklistId,
        title: dto.title,
        description: dto.description,
        sortOrder: dto.sortOrder ?? 0,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        createdById: actorId,
      },
    });
    await this.audit(
      companyId,
      actorId,
      'recruitment.onboarding.item.create',
      'OnboardingChecklistItem',
      item.id,
      undefined,
      item,
    );
    return item;
  }

  async completeOnboardingChecklistItem(
    companyId: string,
    itemId: string,
    actorId: string,
    dto: CompleteOnboardingItemDto,
  ) {
    const current = await this.prisma.onboardingChecklistItem.findFirst({
      where: { id: itemId, companyId, deletedAt: null },
    });
    if (!current) throw new NotFoundException('Onboarding item not found');

    const item = await this.prisma.onboardingChecklistItem.update({
      where: { id: itemId },
      data: {
        isCompleted: dto.isCompleted ?? true,
        completedAt: dto.isCompleted === false ? null : new Date(),
        completedById: dto.completedById ?? actorId,
        updatedById: actorId,
      },
    });
    await this.audit(
      companyId,
      actorId,
      'recruitment.onboarding.item.complete',
      'OnboardingChecklistItem',
      item.id,
      current,
      item,
    );
    return item;
  }

  async convertCandidateToEmployee(
    companyId: string,
    applicationId: string,
    actorId: string,
    dto: ConvertCandidateToEmployeeDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const application = await this.prisma.candidateApplication.findFirst({
      where: { id: applicationId, companyId, deletedAt: null },
      include: { candidate: true },
    });
    if (!application) throw new NotFoundException('Application not found');
    if (application.convertedEmployeeId) {
      throw new ConflictException('Candidate already converted');
    }

    const employee = await this.prisma.employee.create({
      data: {
        companyId,
        employeeCode: dto.employeeCode,
        firstName: application.candidate.firstName,
        lastName: application.candidate.lastName,
        email:
          application.candidate.email ??
          `${dto.employeeCode.toLowerCase()}@candidate.local`,
        phone: application.candidate.phone,
        branchId: dto.branchId,
        departmentId: dto.departmentId,
        designationId: dto.designationId,
        reportingManagerId: dto.reportingManagerId,
        joiningDate: new Date(dto.joiningDate),
        employmentType: dto.employmentType,
        createdById: actorId,
      },
    });

    const updatedApplication = await this.prisma.candidateApplication.update({
      where: { id: applicationId },
      data: {
        status: ApplicationStatusDto.HIRED,
        convertedEmployeeId: employee.id,
        convertedAt: new Date(),
        updatedById: actorId,
      },
    });
    await this.audit(
      companyId,
      actorId,
      'recruitment.convert',
      'CandidateApplication',
      applicationId,
      application,
      { employee, application: updatedApplication },
      ipAddress,
      userAgent,
    );
    return { employee, application: updatedApplication };
  }

  private async findJobOrThrow(companyId: string, id: string) {
    const job = await this.prisma.jobOpening.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!job) throw new NotFoundException('Job opening not found');
    return job;
  }

  private async findApplicationOrThrow(companyId: string, id: string) {
    const application = await this.prisma.candidateApplication.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!application) throw new NotFoundException('Application not found');
    return application;
  }

  private async findInterviewOrThrow(companyId: string, id: string) {
    const interview = await this.prisma.interviewRound.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!interview) throw new NotFoundException('Interview round not found');
    return interview;
  }

  private async findOfferOrThrow(companyId: string, id: string) {
    const offer = await this.prisma.offerLetter.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!offer) throw new NotFoundException('Offer letter not found');
    return offer;
  }

  private async findChecklistOrThrow(companyId: string, id: string) {
    const checklist = await this.prisma.onboardingChecklist.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!checklist)
      throw new NotFoundException('Onboarding checklist not found');
    return checklist;
  }

  private paginated<T>(data: T[], page: number, limit: number, total: number) {
    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private async audit(
    companyId: string,
    actorId: string | undefined,
    action: string,
    entity: string,
    entityId?: string,
    oldValues?: unknown,
    newValues?: unknown,
    ipAddress?: string,
    userAgent?: string | string[],
  ) {
    await this.prisma.auditLog.create({
      data: {
        companyId,
        actorId,
        action,
        entityType: entity,
        entityId,
        oldValue: oldValues as Prisma.InputJsonValue,
        newValue: newValues as Prisma.InputJsonValue,
        ipAddress,
        userAgent: Array.isArray(userAgent) ? userAgent.join(',') : userAgent,
      },
    });
  }
}
