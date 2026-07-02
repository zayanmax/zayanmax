import { ConflictException } from '@nestjs/common';
import { RecruitmentOnboardingService } from './recruitment-onboarding.service';
import {
  ApplicationStatusDto,
  JobOpeningStatusDto,
  OfferStatusDto,
} from './dto/recruitment-onboarding.enums';

describe('RecruitmentOnboardingService', () => {
  const prisma = {
    jobOpening: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    candidateProfile: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    candidatePipelineStage: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    candidateApplication: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    interviewRound: { create: jest.fn(), findFirst: jest.fn() },
    interviewFeedback: { create: jest.fn() },
    offerLetter: { create: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
    onboardingChecklist: { create: jest.fn(), findFirst: jest.fn() },
    onboardingChecklistItem: { create: jest.fn(), update: jest.fn() },
    employee: { create: jest.fn() },
    auditLog: { create: jest.fn() },
  };

  beforeEach(() => jest.clearAllMocks());

  it('prevents duplicate candidates by company scoped email or phone', async () => {
    prisma.candidateProfile.findFirst.mockResolvedValue({ id: 'candidate-id' });
    const service = new RecruitmentOnboardingService(prisma as never);

    await expect(
      service.createCandidate('company-id', 'actor-id', {
        firstName: 'Asha',
        lastName: 'Rao',
        email: 'asha@example.com',
        phone: '9999999999',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('creates jobs, candidates, applications, and status changes with audit logs', async () => {
    prisma.jobOpening.create.mockResolvedValue({ id: 'job-id' });
    prisma.jobOpening.findFirst.mockResolvedValue({
      id: 'job-id',
      status: JobOpeningStatusDto.DRAFT,
    });
    prisma.jobOpening.update.mockResolvedValue({
      id: 'job-id',
      status: JobOpeningStatusDto.OPEN,
    });
    prisma.candidateProfile.findFirst.mockResolvedValue(null);
    prisma.candidateProfile.create.mockResolvedValue({ id: 'candidate-id' });
    prisma.candidatePipelineStage.create.mockResolvedValue({ id: 'stage-id' });
    prisma.candidateApplication.create.mockResolvedValue({
      id: 'application-id',
    });
    prisma.candidateApplication.findFirst.mockResolvedValue({
      id: 'application-id',
      status: ApplicationStatusDto.APPLIED,
    });
    prisma.candidateApplication.update.mockResolvedValue({
      id: 'application-id',
      status: ApplicationStatusDto.INTERVIEW,
    });
    const service = new RecruitmentOnboardingService(prisma as never);

    await service.createJobOpening('company-id', 'actor-id', {
      title: 'Backend Engineer',
      departmentId: 'department-id',
      openingsCount: 2,
    });
    await service.changeJobStatus('company-id', 'job-id', 'actor-id', {
      status: JobOpeningStatusDto.OPEN,
    });
    await service.createCandidate('company-id', 'actor-id', {
      firstName: 'Asha',
      lastName: 'Rao',
      email: 'asha@example.com',
      phone: '9999999999',
      source: 'LinkedIn',
    });
    await service.createPipelineStage('company-id', 'actor-id', {
      name: 'Screening',
      sortOrder: 1,
    });
    await service.createApplication('company-id', 'actor-id', {
      candidateId: 'candidate-id',
      jobOpeningId: 'job-id',
      stageId: 'stage-id',
    });
    await service.changeApplicationStatus(
      'company-id',
      'application-id',
      'actor-id',
      { status: ApplicationStatusDto.INTERVIEW },
    );

    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: 'recruitment.jobs.create' }),
      }),
    );
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'recruitment.applications.status',
        }),
      }),
    );
  });

  it('stores interview feedback, offer metadata, onboarding checklists, and conversion foundation', async () => {
    prisma.interviewRound.create.mockResolvedValue({ id: 'interview-id' });
    prisma.interviewRound.findFirst.mockResolvedValue({ id: 'interview-id' });
    prisma.interviewFeedback.create.mockResolvedValue({ id: 'feedback-id' });
    prisma.offerLetter.create.mockResolvedValue({ id: 'offer-id' });
    prisma.offerLetter.findFirst.mockResolvedValue({
      id: 'offer-id',
      status: OfferStatusDto.DRAFT,
    });
    prisma.offerLetter.update.mockResolvedValue({
      id: 'offer-id',
      status: OfferStatusDto.SENT,
    });
    prisma.onboardingChecklist.create.mockResolvedValue({
      id: 'checklist-id',
      items: [{ id: 'item-id', title: 'Collect ID proof' }],
    });
    prisma.employee.create.mockResolvedValue({ id: 'employee-id' });
    prisma.candidateApplication.findFirst.mockResolvedValue({
      id: 'application-id',
      candidateId: 'candidate-id',
      candidate: {
        firstName: 'Asha',
        lastName: 'Rao',
        email: 'asha@example.com',
        phone: '9999999999',
      },
    });
    prisma.candidateApplication.update.mockResolvedValue({
      id: 'application-id',
      convertedEmployeeId: 'employee-id',
      status: ApplicationStatusDto.HIRED,
    });
    const service = new RecruitmentOnboardingService(prisma as never);

    await service.createInterviewRound('company-id', 'actor-id', {
      applicationId: 'application-id',
      roundName: 'Technical',
      scheduledAt: '2035-01-10T10:00:00.000Z',
    });
    await service.createInterviewFeedback(
      'company-id',
      'interview-id',
      'actor-id',
      {
        rating: 4,
        feedback: 'Strong technical depth.',
        recommendation: 'advance',
      },
    );
    await service.createOfferLetter('company-id', 'actor-id', {
      applicationId: 'application-id',
      title: 'Backend Engineer Offer',
      offeredSalary: 1200000,
      joiningDate: '2035-02-01',
    });
    await service.changeOfferStatus('company-id', 'offer-id', 'actor-id', {
      status: OfferStatusDto.SENT,
    });
    await service.createOnboardingChecklist('company-id', 'actor-id', {
      applicationId: 'application-id',
      title: 'New hire onboarding',
      items: [{ title: 'Collect ID proof', sortOrder: 1 }],
    });
    await service.convertCandidateToEmployee(
      'company-id',
      'application-id',
      'actor-id',
      { employeeCode: 'EMP-100', joiningDate: '2035-02-01' },
    );

    expect(prisma.employee.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          companyId: 'company-id',
          employeeCode: 'EMP-100',
          firstName: 'Asha',
        }),
      }),
    );
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: 'recruitment.convert' }),
      }),
    );
  });
});
