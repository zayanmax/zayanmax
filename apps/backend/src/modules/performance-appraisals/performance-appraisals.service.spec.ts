import { ConflictException } from '@nestjs/common';
import { PerformanceAppraisalsService } from './performance-appraisals.service';
import { EmployeeGoalStatusDto } from './dto/performance-appraisals.enums';

describe('PerformanceAppraisalsService', () => {
  const prisma = {
    performanceCycle: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    employeeGoal: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    goalProgressUpdate: { create: jest.fn() },
    kpiCategory: { findFirst: jest.fn(), create: jest.fn() },
    employeeKpiRecord: { create: jest.fn(), findMany: jest.fn() },
    reviewTemplate: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    employeeReview: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    reviewResponse: { create: jest.fn() },
    feedbackRecord: {
      create: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
    },
    oneOnOneMeetingNote: { create: jest.fn(), count: jest.fn() },
    promotionRecommendation: { create: jest.fn(), findMany: jest.fn() },
    employee: { findMany: jest.fn() },
    auditLog: { create: jest.fn() },
  };

  beforeEach(() => jest.clearAllMocks());

  it('prevents duplicate active performance cycles per company', async () => {
    prisma.performanceCycle.findFirst.mockResolvedValue({ id: 'cycle-id' });
    const service = new PerformanceAppraisalsService(prisma as never);

    await expect(
      service.createCycle('company-id', 'actor-id', {
        name: 'FY 2035',
        startDate: '2035-01-01',
        endDate: '2035-12-31',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('creates goals, progress updates, and status changes with audit logs', async () => {
    prisma.employeeGoal.create.mockResolvedValue({
      id: 'goal-id',
      title: 'Improve quality',
      status: EmployeeGoalStatusDto.DRAFT,
    });
    prisma.employeeGoal.findFirst.mockResolvedValue({
      id: 'goal-id',
      progress: 10,
      status: EmployeeGoalStatusDto.ACTIVE,
    });
    prisma.goalProgressUpdate.create.mockResolvedValue({
      id: 'progress-id',
      progress: 50,
    });
    prisma.employeeGoal.update
      .mockResolvedValueOnce({ id: 'goal-id', progress: 50 })
      .mockResolvedValueOnce({
        id: 'goal-id',
        status: EmployeeGoalStatusDto.COMPLETED,
      });
    const service = new PerformanceAppraisalsService(prisma as never);

    await service.createGoal('company-id', 'actor-id', {
      cycleId: 'cycle-id',
      employeeId: 'employee-id',
      title: 'Improve quality',
      description: 'Reduce rework',
      targetValue: '95%',
      weight: 30,
      dueDate: '2035-06-30',
    });
    await service.addGoalProgress('company-id', 'goal-id', 'actor-id', {
      employeeId: 'employee-id',
      progress: 50,
      comment: 'Mid-cycle progress',
    });
    await service.changeGoalStatus('company-id', 'goal-id', 'actor-id', {
      status: EmployeeGoalStatusDto.COMPLETED,
    });

    expect(prisma.employeeGoal.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          companyId: 'company-id',
          cycleId: 'cycle-id',
          employeeId: 'employee-id',
          title: 'Improve quality',
        }),
      }),
    );
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: 'performance.goals.create' }),
      }),
    );
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: 'performance.goals.progress' }),
      }),
    );
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: 'performance.goals.status' }),
      }),
    );
  });

  it('creates KPI records, review templates, reviews, and responses', async () => {
    prisma.kpiCategory.findFirst.mockResolvedValue(null);
    prisma.kpiCategory.create.mockResolvedValue({ id: 'category-id' });
    prisma.employeeKpiRecord.create.mockResolvedValue({ id: 'kpi-id' });
    prisma.reviewTemplate.create.mockResolvedValue({
      id: 'template-id',
      questions: [{ questionText: 'What went well?' }],
    });
    prisma.employeeReview.create.mockResolvedValue({ id: 'review-id' });
    prisma.employeeReview.findFirst.mockResolvedValue({ id: 'review-id' });
    prisma.reviewResponse.create.mockResolvedValue({ id: 'response-id' });
    const service = new PerformanceAppraisalsService(prisma as never);

    await service.createKpiCategory('company-id', 'actor-id', {
      name: 'Quality',
    });
    await service.createEmployeeKpi('company-id', 'actor-id', {
      cycleId: 'cycle-id',
      employeeId: 'employee-id',
      categoryId: 'category-id',
      title: 'Quality score',
      score: 92,
      maxScore: 100,
    });
    await service.createReviewTemplate('company-id', 'actor-id', {
      name: 'Annual Review',
      questions: [{ questionText: 'What went well?', sortOrder: 1 }],
    });
    await service.createEmployeeReview('company-id', 'actor-id', {
      cycleId: 'cycle-id',
      employeeId: 'employee-id',
      templateId: 'template-id',
      managerEmployeeId: 'manager-id',
    });
    await service.addReviewResponse('company-id', 'review-id', 'actor-id', {
      questionId: 'question-id',
      responseText: 'Delivered major goals.',
      score: 4,
    });

    expect(prisma.reviewTemplate.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          questions: {
            create: [
              expect.objectContaining({ questionText: 'What went well?' }),
            ],
          },
        }),
      }),
    );
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: 'performance.reviews.create' }),
      }),
    );
  });

  it('creates feedback, one-on-one notes, promotion metadata, and summaries', async () => {
    prisma.feedbackRecord.create.mockResolvedValue({ id: 'feedback-id' });
    prisma.oneOnOneMeetingNote.create.mockResolvedValue({ id: 'note-id' });
    prisma.promotionRecommendation.create.mockResolvedValue({
      id: 'promotion-id',
    });
    prisma.employeeGoal.findMany.mockResolvedValue([{ id: 'goal-id' }]);
    prisma.employeeKpiRecord.findMany.mockResolvedValue([{ id: 'kpi-id' }]);
    prisma.employeeReview.findMany.mockResolvedValue([{ id: 'review-id' }]);
    prisma.feedbackRecord.count.mockResolvedValue(1);
    prisma.oneOnOneMeetingNote.count.mockResolvedValue(1);
    prisma.promotionRecommendation.findMany.mockResolvedValue([
      { id: 'promotion-id' },
    ]);
    const service = new PerformanceAppraisalsService(prisma as never);

    await service.createFeedback('company-id', 'actor-id', {
      employeeId: 'employee-id',
      feedbackText: 'Strong ownership.',
    });
    await service.createOneOnOneNote('company-id', 'actor-id', {
      employeeId: 'employee-id',
      managerEmployeeId: 'manager-id',
      meetingDate: '2035-06-20',
      title: 'Monthly 1:1',
    });
    await service.createPromotionRecommendation('company-id', 'actor-id', {
      employeeId: 'employee-id',
      recommendationText: 'Ready for senior role.',
    });
    const summary = await service.employeeSummary('company-id', 'employee-id');

    expect(summary).toEqual(
      expect.objectContaining({
        employeeId: 'employee-id',
        feedbackCount: 1,
        oneOnOneCount: 1,
      }),
    );
  });

  it('returns manager team performance from direct reports', async () => {
    prisma.employee.findMany.mockResolvedValue([
      { id: 'employee-id', firstName: 'Team', lastName: 'Member' },
    ]);
    prisma.employeeGoal.findMany.mockResolvedValue([]);
    prisma.employeeReview.findMany.mockResolvedValue([]);
    const service = new PerformanceAppraisalsService(prisma as never);

    const result = await service.managerTeamPerformance(
      'company-id',
      'manager-id',
    );

    expect(result.managerEmployeeId).toBe('manager-id');
    expect(prisma.employee.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          companyId: 'company-id',
          reportingManagerId: 'manager-id',
          deletedAt: null,
        },
      }),
    );
  });
});
