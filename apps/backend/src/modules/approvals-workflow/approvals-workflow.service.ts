import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import {
  ApprovalCommentDto,
  ApprovalDecisionDto,
  ApprovalRequestQueryDto,
  ApprovalWorkflowQueryDto,
  CreateApprovalWorkflowDto,
  DelegateApprovalDto,
  SubmitApprovalRequestDto,
  UpdateApprovalWorkflowDto,
} from './dto/approvals-workflow.dto';
import {
  ApprovalActionDto,
  ApprovalRequestStatusDto,
  ApprovalStepStatusDto,
} from './dto/approvals-workflow.enums';

@Injectable()
export class ApprovalsWorkflowService {
  constructor(private readonly prisma: PrismaService) {}

  async createWorkflow(
    companyId: string,
    actorId: string,
    dto: CreateApprovalWorkflowDto,
    ipAddress?: string,
    userAgent?: string | string[],
  ) {
    const existing = await this.prisma.approvalWorkflowDefinition.findFirst({
      where: { companyId, key: dto.key, deletedAt: null },
    });
    if (existing) {
      throw new ConflictException('Approval workflow key already exists');
    }

    const workflow = await this.prisma.approvalWorkflowDefinition.create({
      data: {
        companyId,
        key: dto.key,
        name: dto.name,
        description: dto.description,
        module: dto.module,
        entityType: dto.entityType,
        isDefault: dto.isDefault ?? false,
        createdById: actorId,
        steps: {
          create: dto.steps.map((step) => ({
            companyId,
            stepOrder: step.stepOrder,
            name: step.name,
            approverType: step.approverType,
            approverUserId: step.approverUserId,
            approverEmployeeId: step.approverEmployeeId,
            approverRoleId: step.approverRoleId,
            approverDepartmentId: step.approverDepartmentId,
            isRequired: step.isRequired ?? true,
            delegationAllowed: step.delegationAllowed ?? true,
            escalationAfterHours: step.escalationAfterHours,
            escalationMetadata:
              step.escalationMetadata as Prisma.InputJsonValue,
            createdById: actorId,
          })),
        },
      },
      include: { steps: true },
    });
    await this.audit(
      companyId,
      actorId,
      'approvals.workflows.create',
      'ApprovalWorkflowDefinition',
      workflow.id,
      undefined,
      workflow,
      ipAddress,
      userAgent,
    );
    return workflow;
  }

  async findWorkflows(companyId: string, query: ApprovalWorkflowQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.ApprovalWorkflowDefinitionWhereInput = {
      companyId,
      deletedAt: null,
      ...(query.entityType ? { entityType: query.entityType } : {}),
      ...(query.status ? { status: query.status as never } : {}),
      ...(query.search
        ? {
            OR: [
              { key: { contains: query.search, mode: 'insensitive' } },
              { name: { contains: query.search, mode: 'insensitive' } },
              { module: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.approvalWorkflowDefinition.findMany({
        where,
        include: { steps: { orderBy: { stepOrder: 'asc' } } },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [query.sortBy ?? 'createdAt']: query.sortOrder ?? 'desc' },
      }),
      this.prisma.approvalWorkflowDefinition.count({ where }),
    ]);
    return this.paginated(data, page, limit, total);
  }

  async updateWorkflow(
    companyId: string,
    workflowId: string,
    actorId: string,
    dto: UpdateApprovalWorkflowDto,
    ipAddress?: string,
    userAgent?: string | string[],
  ) {
    const current = await this.findWorkflowOrThrow(companyId, workflowId);
    const workflow = await this.prisma.approvalWorkflowDefinition.update({
      where: { id: workflowId },
      data: {
        name: dto.name,
        description: dto.description,
        isDefault: dto.isDefault,
        updatedById: actorId,
      },
      include: { steps: { orderBy: { stepOrder: 'asc' } } },
    });
    await this.audit(
      companyId,
      actorId,
      'approvals.workflows.update',
      'ApprovalWorkflowDefinition',
      workflowId,
      current,
      workflow,
      ipAddress,
      userAgent,
    );
    return workflow;
  }

  async deleteWorkflow(
    companyId: string,
    workflowId: string,
    actorId: string,
    ipAddress?: string,
    userAgent?: string | string[],
  ) {
    const current = await this.findWorkflowOrThrow(companyId, workflowId);
    const workflow = await this.prisma.approvalWorkflowDefinition.update({
      where: { id: workflowId },
      data: { deletedAt: new Date(), updatedById: actorId },
    });
    await this.audit(
      companyId,
      actorId,
      'approvals.workflows.delete',
      'ApprovalWorkflowDefinition',
      workflowId,
      current,
      workflow,
      ipAddress,
      userAgent,
    );
    return workflow;
  }

  async submitRequest(
    companyId: string,
    actorId: string,
    dto: SubmitApprovalRequestDto,
    ipAddress?: string,
    userAgent?: string | string[],
  ) {
    const workflow = await this.prisma.approvalWorkflowDefinition.findFirst({
      where: {
        id: dto.workflowDefinitionId,
        companyId,
        deletedAt: null,
      },
      include: {
        steps: { where: { deletedAt: null }, orderBy: { stepOrder: 'asc' } },
      },
    });
    if (!workflow) throw new NotFoundException('Approval workflow not found');
    if (workflow.steps.length === 0) {
      throw new ConflictException('Approval workflow has no active steps');
    }

    const firstStepOrder = workflow.steps[0].stepOrder;
    const request = await this.prisma.approvalRequest.create({
      data: {
        companyId,
        workflowDefinitionId: workflow.id,
        entityType: dto.entityType,
        entityId: dto.entityId,
        title: dto.title,
        description: dto.description,
        requestedByUserId: actorId,
        requestedByEmployeeId: dto.requestedByEmployeeId,
        status: ApprovalRequestStatusDto.PENDING,
        currentStepOrder: firstStepOrder,
        submittedAt: new Date(),
        metadata: dto.metadata as Prisma.InputJsonValue,
        escalationMetadata: dto.escalationMetadata as Prisma.InputJsonValue,
        createdById: actorId,
      },
    });
    await this.prisma.approvalStepInstance.createMany({
      data: workflow.steps.map((step) => ({
        companyId,
        requestId: request.id,
        workflowStepId: step.id,
        stepOrder: step.stepOrder,
        name: step.name,
        approverType: step.approverType,
        approverUserId: step.approverUserId,
        approverEmployeeId: step.approverEmployeeId,
        approverRoleId: step.approverRoleId,
        approverDepartmentId: step.approverDepartmentId,
        status: ApprovalStepStatusDto.PENDING,
        escalationDueAt: step.escalationAfterHours
          ? new Date(Date.now() + step.escalationAfterHours * 60 * 60 * 1000)
          : undefined,
        escalationMetadata: step.escalationMetadata as Prisma.InputJsonValue,
      })),
    });
    await this.recordAction(
      companyId,
      request.id,
      ApprovalActionDto.SUBMIT,
      actorId,
      undefined,
      undefined,
      dto.metadata,
    );
    await this.audit(
      companyId,
      actorId,
      'approvals.requests.submit',
      'ApprovalRequest',
      request.id,
      undefined,
      request,
      ipAddress,
      userAgent,
    );
    return request;
  }

  async findRequests(companyId: string, query: ApprovalRequestQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.ApprovalRequestWhereInput = {
      companyId,
      deletedAt: null,
      ...(query.workflowDefinitionId
        ? { workflowDefinitionId: query.workflowDefinitionId }
        : {}),
      ...(query.entityType ? { entityType: query.entityType } : {}),
      ...(query.entityId ? { entityId: query.entityId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: 'insensitive' } },
              { description: { contains: query.search, mode: 'insensitive' } },
              { entityId: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.approvalRequest.findMany({
        where,
        include: {
          workflowDefinition: true,
          stepInstances: { orderBy: { stepOrder: 'asc' } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [query.sortBy ?? 'createdAt']: query.sortOrder ?? 'desc' },
      }),
      this.prisma.approvalRequest.count({ where }),
    ]);
    return this.paginated(data, page, limit, total);
  }

  async findMyPendingApprovals(
    companyId: string,
    userId: string,
    query: ApprovalRequestQueryDto,
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const data = await this.prisma.approvalStepInstance.findMany({
      where: {
        companyId,
        status: ApprovalStepStatusDto.PENDING,
        OR: [{ approverUserId: userId }, { delegatedToUserId: userId }],
        request: {
          deletedAt: null,
          status: ApprovalRequestStatusDto.PENDING,
          ...(query.entityType ? { entityType: query.entityType } : {}),
          ...(query.entityId ? { entityId: query.entityId } : {}),
        },
      },
      include: {
        request: true,
        workflowStep: true,
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [query.sortBy ?? 'createdAt']: query.sortOrder ?? 'asc' },
    });
    return this.paginated(data, page, limit, data.length);
  }

  async approveStep(
    companyId: string,
    requestId: string,
    actorId: string,
    dto: ApprovalDecisionDto,
    ipAddress?: string,
    userAgent?: string | string[],
  ) {
    const request = await this.findRequestOrThrow(companyId, requestId);
    const step = await this.findStepInstanceOrThrow(
      companyId,
      requestId,
      dto.stepInstanceId,
    );
    const updatedStep = await this.prisma.approvalStepInstance.update({
      where: { id: dto.stepInstanceId },
      data: {
        status: ApprovalStepStatusDto.APPROVED,
        comment: dto.comment,
        decidedAt: new Date(),
        actedByUserId: actorId,
      },
    });
    await this.recordAction(
      companyId,
      requestId,
      ApprovalActionDto.APPROVE,
      actorId,
      dto.stepInstanceId,
      dto.comment,
      dto.metadata,
    );
    const remaining = await this.prisma.approvalStepInstance.findMany({
      where: { companyId, requestId, status: ApprovalStepStatusDto.PENDING },
      orderBy: { stepOrder: 'asc' },
    });
    const status =
      remaining.length === 0
        ? ApprovalRequestStatusDto.APPROVED
        : ApprovalRequestStatusDto.PENDING;
    const requestUpdate = await this.prisma.approvalRequest.update({
      where: { id: requestId },
      data: {
        status,
        currentStepOrder: remaining[0]?.stepOrder ?? step.stepOrder,
        completedAt:
          status === ApprovalRequestStatusDto.APPROVED ? new Date() : undefined,
        updatedById: actorId,
      },
    });
    await this.audit(
      companyId,
      actorId,
      'approvals.requests.approve',
      'ApprovalRequest',
      requestId,
      request,
      { request: requestUpdate, step: updatedStep },
      ipAddress,
      userAgent,
    );
    return { request: requestUpdate, step: updatedStep };
  }

  async rejectStep(
    companyId: string,
    requestId: string,
    actorId: string,
    dto: ApprovalDecisionDto,
    ipAddress?: string,
    userAgent?: string | string[],
  ) {
    const request = await this.findRequestOrThrow(companyId, requestId);
    const step = await this.findStepInstanceOrThrow(
      companyId,
      requestId,
      dto.stepInstanceId,
    );
    const updatedStep = await this.prisma.approvalStepInstance.update({
      where: { id: step.id },
      data: {
        status: ApprovalStepStatusDto.REJECTED,
        comment: dto.comment,
        decidedAt: new Date(),
        actedByUserId: actorId,
      },
    });
    await this.recordAction(
      companyId,
      requestId,
      ApprovalActionDto.REJECT,
      actorId,
      step.id,
      dto.comment,
      dto.metadata,
    );
    const requestUpdate = await this.prisma.approvalRequest.update({
      where: { id: requestId },
      data: {
        status: ApprovalRequestStatusDto.REJECTED,
        completedAt: new Date(),
        updatedById: actorId,
      },
    });
    await this.audit(
      companyId,
      actorId,
      'approvals.requests.reject',
      'ApprovalRequest',
      requestId,
      request,
      { request: requestUpdate, step: updatedStep },
      ipAddress,
      userAgent,
    );
    return { request: requestUpdate, step: updatedStep };
  }

  async cancelRequest(
    companyId: string,
    requestId: string,
    actorId: string,
    dto: ApprovalCommentDto,
    ipAddress?: string,
    userAgent?: string | string[],
  ) {
    const request = await this.findRequestOrThrow(companyId, requestId);
    const requestUpdate = await this.prisma.approvalRequest.update({
      where: { id: requestId },
      data: {
        status: ApprovalRequestStatusDto.CANCELLED,
        cancelledAt: new Date(),
        updatedById: actorId,
      },
    });
    await this.recordAction(
      companyId,
      requestId,
      ApprovalActionDto.CANCEL,
      actorId,
      undefined,
      dto.comment,
      dto.metadata,
    );
    await this.audit(
      companyId,
      actorId,
      'approvals.requests.cancel',
      'ApprovalRequest',
      requestId,
      request,
      requestUpdate,
      ipAddress,
      userAgent,
    );
    return requestUpdate;
  }

  async delegateStep(
    companyId: string,
    requestId: string,
    actorId: string,
    dto: DelegateApprovalDto,
    ipAddress?: string,
    userAgent?: string | string[],
  ) {
    const request = await this.findRequestOrThrow(companyId, requestId);
    const step = await this.findStepInstanceOrThrow(
      companyId,
      requestId,
      dto.stepInstanceId,
    );
    if (!dto.delegatedToUserId && !dto.delegatedToEmployeeId) {
      throw new ConflictException('Delegation target is required');
    }
    const updatedStep = await this.prisma.approvalStepInstance.update({
      where: { id: step.id },
      data: {
        delegatedToUserId: dto.delegatedToUserId,
        delegatedToEmployeeId: dto.delegatedToEmployeeId,
        delegatedAt: new Date(),
        delegationReason: dto.comment,
      },
    });
    await this.recordAction(
      companyId,
      requestId,
      ApprovalActionDto.DELEGATE,
      actorId,
      step.id,
      dto.comment,
      {
        ...dto.metadata,
        delegatedToUserId: dto.delegatedToUserId,
        delegatedToEmployeeId: dto.delegatedToEmployeeId,
      },
    );
    await this.audit(
      companyId,
      actorId,
      'approvals.requests.delegate',
      'ApprovalStepInstance',
      step.id,
      request,
      updatedStep,
      ipAddress,
      userAgent,
    );
    return updatedStep;
  }

  async findEntityHistory(
    companyId: string,
    entityType: string,
    entityId: string,
  ) {
    const requests = await this.prisma.approvalRequest.findMany({
      where: {
        companyId,
        entityType:
          entityType as Prisma.EnumApprovalEntityTypeFilter<'ApprovalRequest'>,
        entityId,
        deletedAt: null,
      },
      include: { stepInstances: { orderBy: { stepOrder: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
    const actions = await this.prisma.approvalActionRecord.findMany({
      where: {
        companyId,
        request: { companyId, entityType: entityType as never, entityId },
      },
      orderBy: { createdAt: 'asc' },
    });
    return { entityType, entityId, requests, actions };
  }

  private async findWorkflowOrThrow(companyId: string, id: string) {
    const workflow = await this.prisma.approvalWorkflowDefinition.findFirst({
      where: { id, companyId, deletedAt: null },
      include: { steps: { orderBy: { stepOrder: 'asc' } } },
    });
    if (!workflow) throw new NotFoundException('Approval workflow not found');
    return workflow;
  }

  private async findRequestOrThrow(companyId: string, id: string) {
    const request = await this.prisma.approvalRequest.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!request) throw new NotFoundException('Approval request not found');
    return request;
  }

  private async findStepInstanceOrThrow(
    companyId: string,
    requestId: string,
    id: string,
  ) {
    const step = await this.prisma.approvalStepInstance.findFirst({
      where: {
        id,
        companyId,
        requestId,
        status: ApprovalStepStatusDto.PENDING,
      },
    });
    if (!step) throw new NotFoundException('Pending approval step not found');
    return step;
  }

  private async recordAction(
    companyId: string,
    requestId: string,
    action: ApprovalActionDto,
    actorUserId?: string,
    stepInstanceId?: string,
    comment?: string,
    metadata?: Record<string, unknown>,
  ) {
    return this.prisma.approvalActionRecord.create({
      data: {
        companyId,
        requestId,
        stepInstanceId,
        action,
        actorUserId,
        comment,
        metadata: metadata as Prisma.InputJsonValue,
      },
    });
  }

  private paginated<T>(data: T[], page: number, limit: number, total: number) {
    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  private async audit(
    companyId: string,
    actorId: string | undefined,
    action: string,
    entityType: string,
    entityId?: string,
    oldValue?: unknown,
    newValue?: unknown,
    ipAddress?: string,
    userAgent?: string | string[],
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
        userAgent: Array.isArray(userAgent) ? userAgent.join(',') : userAgent,
      },
    });
  }
}
