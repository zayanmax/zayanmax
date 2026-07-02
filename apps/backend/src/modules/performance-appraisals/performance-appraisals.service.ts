import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import {
  ChangeGoalStatusDto,
  ChangeReviewStatusDto,
  CreateEmployeeKpiDto,
  CreateEmployeeReviewDto,
  CreateGoalDto,
  CreateKpiCategoryDto,
  CreatePerformanceCycleDto,
  CreateReviewTemplateDto,
  FeedbackDto,
  GoalProgressDto,
  GoalQueryDto,
  OneOnOneNoteDto,
  PerformanceCycleQueryDto,
  PromotionRecommendationDto,
  ReviewQueryDto,
  ReviewResponseDto,
  ReviewTemplateQueryDto,
} from './dto/performance-appraisals.dto';
import { EmployeeGoalStatusDto } from './dto/performance-appraisals.enums';

@Injectable()
export class PerformanceAppraisalsService {
  constructor(private readonly prisma: PrismaService) {}

  async createCycle(
    companyId: string,
    actorId: string,
    dto: CreatePerformanceCycleDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const existing = await this.prisma.performanceCycle.findFirst({
      where: { companyId, name: dto.name, deletedAt: null },
    });
    if (existing) throw new ConflictException('Performance cycle exists');

    const cycle = await this.prisma.performanceCycle.create({
      data: {
        companyId,
        name: dto.name,
        description: dto.description,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        createdById: actorId,
      },
    });
    await this.audit(
      companyId,
      actorId,
      'performance.cycles.create',
      'PerformanceCycle',
      cycle.id,
      undefined,
      cycle,
      ipAddress,
      userAgent,
    );
    return cycle;
  }

  async findCycles(companyId: string, query: PerformanceCycleQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.PerformanceCycleWhereInput = {
      companyId,
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              {
                description: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
            ],
          }
        : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.performanceCycle.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [query.sortBy ?? 'createdAt']: query.sortOrder ?? 'desc' },
      }),
      this.prisma.performanceCycle.count({ where }),
    ]);
    return this.paginated(data, page, limit, total);
  }

  async createGoal(
    companyId: string,
    actorId: string,
    dto: CreateGoalDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const goal = await this.prisma.employeeGoal.create({
      data: {
        companyId,
        cycleId: dto.cycleId,
        employeeId: dto.employeeId,
        title: dto.title,
        description: dto.description,
        targetValue: dto.targetValue,
        weight: dto.weight,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        createdById: actorId,
      },
      include: { progressUpdates: true },
    });
    await this.audit(
      companyId,
      actorId,
      'performance.goals.create',
      'EmployeeGoal',
      goal.id,
      undefined,
      goal,
      ipAddress,
      userAgent,
    );
    return goal;
  }

  async findGoals(companyId: string, query: GoalQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.EmployeeGoalWhereInput = {
      companyId,
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.cycleId ? { cycleId: query.cycleId } : {}),
      ...(query.employeeId ? { employeeId: query.employeeId } : {}),
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
            ],
          }
        : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.employeeGoal.findMany({
        where,
        include: { progressUpdates: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [query.sortBy ?? 'createdAt']: query.sortOrder ?? 'desc' },
      }),
      this.prisma.employeeGoal.count({ where }),
    ]);
    return this.paginated(data, page, limit, total);
  }

  async addGoalProgress(
    companyId: string,
    goalId: string,
    actorId: string,
    dto: GoalProgressDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const current = await this.findGoalOrThrow(companyId, goalId);
    const progress = await this.prisma.goalProgressUpdate.create({
      data: {
        companyId,
        goalId,
        employeeId: dto.employeeId ?? current.employeeId,
        progress: dto.progress,
        comment: dto.comment,
        createdById: actorId,
      },
    });
    const goal = await this.prisma.employeeGoal.update({
      where: { id: goalId },
      data: { progress: dto.progress, updatedById: actorId },
    });
    await this.audit(
      companyId,
      actorId,
      'performance.goals.progress',
      'EmployeeGoal',
      goalId,
      current,
      { goal, progress },
      ipAddress,
      userAgent,
    );
    return progress;
  }

  async changeGoalStatus(
    companyId: string,
    goalId: string,
    actorId: string,
    dto: ChangeGoalStatusDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const current = await this.findGoalOrThrow(companyId, goalId);
    const goal = await this.prisma.employeeGoal.update({
      where: { id: goalId },
      data: {
        status: dto.status,
        completedAt:
          dto.status === EmployeeGoalStatusDto.COMPLETED
            ? new Date()
            : undefined,
        updatedById: actorId,
      },
    });
    await this.audit(
      companyId,
      actorId,
      'performance.goals.status',
      'EmployeeGoal',
      goal.id,
      current,
      goal,
      ipAddress,
      userAgent,
    );
    return goal;
  }

  async createKpiCategory(
    companyId: string,
    actorId: string,
    dto: CreateKpiCategoryDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const existing = await this.prisma.kpiCategory.findFirst({
      where: { companyId, name: dto.name, deletedAt: null },
    });
    if (existing) throw new ConflictException('KPI category exists');
    const category = await this.prisma.kpiCategory.create({
      data: {
        companyId,
        name: dto.name,
        description: dto.description,
        createdById: actorId,
      },
    });
    await this.audit(
      companyId,
      actorId,
      'performance.kpis.categories.create',
      'KpiCategory',
      category.id,
      undefined,
      category,
      ipAddress,
      userAgent,
    );
    return category;
  }

  async createEmployeeKpi(
    companyId: string,
    actorId: string,
    dto: CreateEmployeeKpiDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const kpi = await this.prisma.employeeKpiRecord.create({
      data: {
        companyId,
        cycleId: dto.cycleId,
        employeeId: dto.employeeId,
        categoryId: dto.categoryId,
        title: dto.title,
        score: dto.score,
        maxScore: dto.maxScore ?? 100,
        notes: dto.notes,
        createdById: actorId,
      },
    });
    await this.audit(
      companyId,
      actorId,
      'performance.kpis.create',
      'EmployeeKpiRecord',
      kpi.id,
      undefined,
      kpi,
      ipAddress,
      userAgent,
    );
    return kpi;
  }

  async createReviewTemplate(
    companyId: string,
    actorId: string,
    dto: CreateReviewTemplateDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const template = await this.prisma.reviewTemplate.create({
      data: {
        companyId,
        name: dto.name,
        description: dto.description,
        createdById: actorId,
        questions: dto.questions?.length
          ? {
              create: dto.questions.map((question) => ({
                companyId,
                questionText: question.questionText,
                responseType: question.responseType,
                sortOrder: question.sortOrder ?? 0,
                weight: question.weight,
                required: question.required ?? false,
                createdById: actorId,
              })),
            }
          : undefined,
      },
      include: { questions: true },
    });
    await this.audit(
      companyId,
      actorId,
      'performance.review_templates.create',
      'ReviewTemplate',
      template.id,
      undefined,
      template,
      ipAddress,
      userAgent,
    );
    return template;
  }

  async findReviewTemplates(companyId: string, query: ReviewTemplateQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.ReviewTemplateWhereInput = {
      companyId,
      deletedAt: null,
      ...(query.status
        ? { status: query.status as Prisma.EnumRecordStatusFilter['equals'] }
        : {}),
      ...(query.search
        ? { name: { contains: query.search, mode: 'insensitive' } }
        : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.reviewTemplate.findMany({
        where,
        include: { questions: { where: { deletedAt: null } } },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [query.sortBy ?? 'createdAt']: query.sortOrder ?? 'desc' },
      }),
      this.prisma.reviewTemplate.count({ where }),
    ]);
    return this.paginated(data, page, limit, total);
  }

  async createEmployeeReview(
    companyId: string,
    actorId: string,
    dto: CreateEmployeeReviewDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const review = await this.prisma.employeeReview.create({
      data: {
        companyId,
        cycleId: dto.cycleId,
        employeeId: dto.employeeId,
        templateId: dto.templateId,
        reviewerUserId: dto.reviewerUserId ?? actorId,
        managerEmployeeId: dto.managerEmployeeId,
        overallScore: dto.overallScore,
        summary: dto.summary,
        promotionRecommended: dto.promotionRecommended ?? false,
        promotionRecommendationText: dto.promotionRecommendationText,
        incrementRecommended: dto.incrementRecommended ?? false,
        createdById: actorId,
      },
      include: { responses: true },
    });
    await this.audit(
      companyId,
      actorId,
      'performance.reviews.create',
      'EmployeeReview',
      review.id,
      undefined,
      review,
      ipAddress,
      userAgent,
    );
    return review;
  }

  async findReviews(companyId: string, query: ReviewQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.EmployeeReviewWhereInput = {
      companyId,
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.cycleId ? { cycleId: query.cycleId } : {}),
      ...(query.employeeId ? { employeeId: query.employeeId } : {}),
      ...(query.managerEmployeeId
        ? { managerEmployeeId: query.managerEmployeeId }
        : {}),
      ...(query.search
        ? { summary: { contains: query.search, mode: 'insensitive' } }
        : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.employeeReview.findMany({
        where,
        include: { responses: true, promotionRecommendations: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [query.sortBy ?? 'createdAt']: query.sortOrder ?? 'desc' },
      }),
      this.prisma.employeeReview.count({ where }),
    ]);
    return this.paginated(data, page, limit, total);
  }

  async changeReviewStatus(
    companyId: string,
    reviewId: string,
    actorId: string,
    dto: ChangeReviewStatusDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const current = await this.findReviewOrThrow(companyId, reviewId);
    const review = await this.prisma.employeeReview.update({
      where: { id: reviewId },
      data: { status: dto.status, updatedById: actorId },
    });
    await this.audit(
      companyId,
      actorId,
      'performance.reviews.status',
      'EmployeeReview',
      review.id,
      current,
      review,
      ipAddress,
      userAgent,
    );
    return review;
  }

  async addReviewResponse(
    companyId: string,
    reviewId: string,
    actorId: string,
    dto: ReviewResponseDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    await this.findReviewOrThrow(companyId, reviewId);
    const response = await this.prisma.reviewResponse.create({
      data: {
        companyId,
        reviewId,
        questionId: dto.questionId,
        responderUserId: actorId,
        responseText: dto.responseText,
        score: dto.score,
        createdById: actorId,
      },
    });
    await this.audit(
      companyId,
      actorId,
      'performance.reviews.response',
      'ReviewResponse',
      response.id,
      undefined,
      response,
      ipAddress,
      userAgent,
    );
    return response;
  }

  async createFeedback(
    companyId: string,
    actorId: string,
    dto: FeedbackDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const feedback = await this.prisma.feedbackRecord.create({
      data: {
        companyId,
        employeeId: dto.employeeId,
        feedbackByUserId: actorId,
        feedbackByEmployeeId: dto.feedbackByEmployeeId,
        feedbackText: dto.feedbackText,
        feedbackType: dto.feedbackType,
        visibility: dto.visibility,
        createdById: actorId,
      },
    });
    await this.audit(
      companyId,
      actorId,
      'performance.feedback.create',
      'FeedbackRecord',
      feedback.id,
      undefined,
      feedback,
      ipAddress,
      userAgent,
    );
    return feedback;
  }

  async createOneOnOneNote(
    companyId: string,
    actorId: string,
    dto: OneOnOneNoteDto,
  ) {
    return this.prisma.oneOnOneMeetingNote.create({
      data: {
        companyId,
        employeeId: dto.employeeId,
        managerEmployeeId: dto.managerEmployeeId,
        meetingDate: new Date(dto.meetingDate),
        title: dto.title,
        notes: dto.notes,
        actionItems: dto.actionItems,
        nextMeetingDate: dto.nextMeetingDate
          ? new Date(dto.nextMeetingDate)
          : undefined,
        createdById: actorId,
      },
    });
  }

  async createPromotionRecommendation(
    companyId: string,
    actorId: string,
    dto: PromotionRecommendationDto,
  ) {
    return this.prisma.promotionRecommendation.create({
      data: {
        companyId,
        employeeId: dto.employeeId,
        reviewId: dto.reviewId,
        recommendedByUserId: actorId,
        recommendedByEmployeeId: dto.recommendedByEmployeeId,
        recommendationText: dto.recommendationText,
        currentDesignation: dto.currentDesignation,
        recommendedDesignation: dto.recommendedDesignation,
        effectiveFrom: dto.effectiveFrom
          ? new Date(dto.effectiveFrom)
          : undefined,
        createdById: actorId,
      },
    });
  }

  async employeeSummary(companyId: string, employeeId: string) {
    const [goals, kpis, reviews, feedbackCount, oneOnOneCount, promotions] =
      await Promise.all([
        this.prisma.employeeGoal.findMany({
          where: { companyId, employeeId, deletedAt: null },
        }),
        this.prisma.employeeKpiRecord.findMany({
          where: { companyId, employeeId, deletedAt: null },
        }),
        this.prisma.employeeReview.findMany({
          where: { companyId, employeeId, deletedAt: null },
        }),
        this.prisma.feedbackRecord.count({
          where: { companyId, employeeId, deletedAt: null },
        }),
        this.prisma.oneOnOneMeetingNote.count({
          where: { companyId, employeeId, deletedAt: null },
        }),
        this.prisma.promotionRecommendation.findMany({
          where: { companyId, employeeId, deletedAt: null },
        }),
      ]);
    return {
      employeeId,
      goals,
      kpis,
      reviews,
      feedbackCount,
      oneOnOneCount,
      promotionRecommendations: promotions,
    };
  }

  async managerTeamPerformance(companyId: string, managerEmployeeId: string) {
    const employees = await this.prisma.employee.findMany({
      where: {
        companyId,
        reportingManagerId: managerEmployeeId,
        deletedAt: null,
      },
    });
    const employeeIds = employees.map((employee) => employee.id);
    const [goals, reviews] = await Promise.all([
      this.prisma.employeeGoal.findMany({
        where: { companyId, employeeId: { in: employeeIds }, deletedAt: null },
      }),
      this.prisma.employeeReview.findMany({
        where: { companyId, employeeId: { in: employeeIds }, deletedAt: null },
      }),
    ]);
    return { managerEmployeeId, employees, goals, reviews };
  }

  private async findGoalOrThrow(companyId: string, id: string) {
    const goal = await this.prisma.employeeGoal.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!goal) throw new NotFoundException('Employee goal not found');
    return goal;
  }

  private async findReviewOrThrow(companyId: string, id: string) {
    const review = await this.prisma.employeeReview.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!review) throw new NotFoundException('Employee review not found');
    return review;
  }

  private paginated<T>(data: T[], page: number, limit: number, total: number) {
    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  private async audit(
    companyId: string,
    actorId: string,
    action: string,
    entityType: string,
    entityId: string,
    oldValue?: unknown,
    newValue?: unknown,
    ipAddress?: string,
    userAgent?: string,
  ) {
    await this.prisma.auditLog.create({
      data: {
        companyId,
        actorId,
        action,
        entityType,
        entityId,
        oldValue: oldValue as Prisma.InputJsonValue,
        newValue: newValue as Prisma.InputJsonValue,
        ipAddress,
        userAgent,
      },
    });
  }
}
