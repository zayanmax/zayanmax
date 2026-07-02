import { ConflictException } from '@nestjs/common';
import { ApprovalsWorkflowService } from './approvals-workflow.service';
import {
  ApprovalActionDto,
  ApprovalEntityTypeDto,
  ApprovalRequestStatusDto,
  ApprovalStepApproverTypeDto,
  ApprovalStepStatusDto,
} from './dto/approvals-workflow.enums';

describe('ApprovalsWorkflowService', () => {
  const prisma = {
    approvalWorkflowDefinition: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    approvalWorkflowStep: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      createMany: jest.fn(),
    },
    approvalRequest: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    approvalStepInstance: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      createMany: jest.fn(),
      update: jest.fn(),
    },
    approvalActionRecord: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    auditLog: { create: jest.fn() },
  };

  beforeEach(() => jest.clearAllMocks());

  it('prevents duplicate active workflow keys per company', async () => {
    prisma.approvalWorkflowDefinition.findFirst.mockResolvedValue({
      id: 'workflow-id',
    });
    const service = new ApprovalsWorkflowService(prisma as never);

    await expect(
      service.createWorkflow('company-id', 'actor-id', {
        key: 'expense-approval',
        name: 'Expense Approval',
        module: 'finance',
        entityType: ApprovalEntityTypeDto.EXPENSE_CLAIM,
        steps: [
          {
            stepOrder: 1,
            name: 'Finance review',
            approverType: ApprovalStepApproverTypeDto.FINANCE_MANAGER,
          },
        ],
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('submits requests, creates step instances, and records approve/delegate/cancel audits', async () => {
    prisma.approvalWorkflowDefinition.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 'workflow-id',
        key: 'invoice-approval',
        steps: [
          {
            id: 'step-id',
            stepOrder: 1,
            approverType: ApprovalStepApproverTypeDto.USER,
            approverUserId: 'approver-user-id',
          },
        ],
      });
    prisma.approvalWorkflowDefinition.create.mockResolvedValue({
      id: 'workflow-id',
      key: 'invoice-approval',
    });
    prisma.approvalRequest.create.mockResolvedValue({
      id: 'request-id',
      status: ApprovalRequestStatusDto.PENDING,
    });
    prisma.approvalRequest.findFirst
      .mockResolvedValueOnce({
        id: 'request-id',
        status: ApprovalRequestStatusDto.PENDING,
      })
      .mockResolvedValueOnce({
        id: 'request-id',
        status: ApprovalRequestStatusDto.PENDING,
      })
      .mockResolvedValueOnce({
        id: 'request-id',
        status: ApprovalRequestStatusDto.PENDING,
      });
    prisma.approvalStepInstance.findFirst
      .mockResolvedValueOnce({
        id: 'instance-id',
        requestId: 'request-id',
        status: ApprovalStepStatusDto.PENDING,
      })
      .mockResolvedValueOnce({
        id: 'instance-id-2',
        requestId: 'request-id',
        status: ApprovalStepStatusDto.PENDING,
      });
    prisma.approvalStepInstance.findMany.mockResolvedValue([]);
    prisma.approvalStepInstance.update
      .mockResolvedValueOnce({
        id: 'instance-id',
        status: ApprovalStepStatusDto.APPROVED,
      })
      .mockResolvedValueOnce({
        id: 'instance-id-2',
        delegatedToUserId: 'delegate-user-id',
      });
    prisma.approvalRequest.update
      .mockResolvedValueOnce({
        id: 'request-id',
        status: ApprovalRequestStatusDto.APPROVED,
      })
      .mockResolvedValueOnce({
        id: 'request-id',
        status: ApprovalRequestStatusDto.CANCELLED,
      });
    prisma.approvalActionRecord.create.mockResolvedValue({ id: 'action-id' });
    const service = new ApprovalsWorkflowService(prisma as never);

    await service.createWorkflow('company-id', 'actor-id', {
      key: 'invoice-approval',
      name: 'Invoice Approval',
      module: 'billing',
      entityType: ApprovalEntityTypeDto.INVOICE,
      steps: [
        {
          stepOrder: 1,
          name: 'Owner approval',
          approverType: ApprovalStepApproverTypeDto.USER,
          approverUserId: 'approver-user-id',
        },
      ],
    });
    await service.submitRequest('company-id', 'actor-id', {
      workflowDefinitionId: 'workflow-id',
      entityType: ApprovalEntityTypeDto.INVOICE,
      entityId: 'invoice-id',
      title: 'Approve invoice',
    });
    await service.approveStep('company-id', 'request-id', 'actor-id', {
      stepInstanceId: 'instance-id',
      comment: 'Approved',
    });
    await service.delegateStep('company-id', 'request-id', 'actor-id', {
      stepInstanceId: 'instance-id-2',
      delegatedToUserId: 'delegate-user-id',
      comment: 'Delegate while away',
    });
    await service.cancelRequest('company-id', 'request-id', 'actor-id', {
      comment: 'Cancelled by requester',
    });

    expect(prisma.approvalStepInstance.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: [
          expect.objectContaining({
            requestId: 'request-id',
            approverUserId: 'approver-user-id',
          }),
        ],
      }),
    );
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'approvals.requests.approve',
        }),
      }),
    );
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'approvals.requests.delegate',
        }),
      }),
    );
  });

  it('lists my pending approvals and entity approval history', async () => {
    prisma.approvalStepInstance.findMany.mockResolvedValue([
      {
        id: 'instance-id',
        approverUserId: 'approver-user-id',
        request: { id: 'request-id', title: 'Approve invoice' },
      },
    ]);
    prisma.approvalRequest.findMany.mockResolvedValue([
      { id: 'request-id', entityType: 'INVOICE', entityId: 'invoice-id' },
    ]);
    prisma.approvalActionRecord.findMany.mockResolvedValue([
      { id: 'action-id', action: ApprovalActionDto.APPROVE },
    ]);
    const service = new ApprovalsWorkflowService(prisma as never);

    const pending = await service.findMyPendingApprovals(
      'company-id',
      'approver-user-id',
      { page: 1, limit: 20 } as never,
    );
    const history = await service.findEntityHistory(
      'company-id',
      'INVOICE',
      'invoice-id',
    );

    expect(pending.data).toHaveLength(1);
    expect(history.requests).toHaveLength(1);
    expect(history.actions).toHaveLength(1);
  });
});
