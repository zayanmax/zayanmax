import { ConflictException } from '@nestjs/common';
import { HelpdeskTicketsService } from './helpdesk-tickets.service';
import {
  HelpdeskEntityTypeDto,
  HelpdeskTicketPriorityDto,
  HelpdeskTicketSourceDto,
  HelpdeskTicketStatusDto,
} from './dto/helpdesk-tickets.enums';

describe('HelpdeskTicketsService', () => {
  const prisma = {
    helpdeskTicketCategory: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    helpdeskTicketSubcategory: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    helpdeskTicket: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    helpdeskTicketComment: { create: jest.fn() },
    helpdeskTicketInternalNote: { create: jest.fn() },
    helpdeskTicketAttachment: { create: jest.fn() },
    auditLog: { create: jest.fn() },
  };

  beforeEach(() => jest.clearAllMocks());

  it('prevents duplicate active ticket categories per company', async () => {
    prisma.helpdeskTicketCategory.findFirst.mockResolvedValue({
      id: 'category-id',
    });
    const service = new HelpdeskTicketsService(prisma as never);

    await expect(
      service.createCategory('company-id', 'actor-id', {
        name: 'IT Support',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('creates tickets with assignment, SLA metadata, entity links, and audit logs', async () => {
    prisma.helpdeskTicket.create.mockResolvedValue({
      id: 'ticket-id',
      ticketNumber: 'HD-1',
      title: 'Laptop issue',
      status: HelpdeskTicketStatusDto.OPEN,
    });
    const service = new HelpdeskTicketsService(prisma as never);

    const result = await service.createTicket('company-id', 'actor-id', {
      requesterUserId: 'requester-user-id',
      requesterEmployeeId: 'requester-employee-id',
      departmentId: 'department-id',
      categoryId: 'category-id',
      subcategoryId: 'subcategory-id',
      title: 'Laptop issue',
      description: 'Laptop does not start.',
      priority: HelpdeskTicketPriorityDto.HIGH,
      source: HelpdeskTicketSourceDto.EMPLOYEE,
      assignedUserId: 'agent-user-id',
      assignedEmployeeId: 'agent-employee-id',
      assignedTeamName: 'IT',
      entityType: HelpdeskEntityTypeDto.ASSET,
      entityId: 'asset-id',
      firstResponseDueAt: '2035-06-20T09:30:00.000Z',
      resolutionDueAt: '2035-06-21T09:30:00.000Z',
    });

    expect(result.id).toBe('ticket-id');
    expect(prisma.helpdeskTicket.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          companyId: 'company-id',
          requesterUserId: 'requester-user-id',
          requesterEmployeeId: 'requester-employee-id',
          assignedUserId: 'agent-user-id',
          assignedEmployeeId: 'agent-employee-id',
          assignedTeamName: 'IT',
          entityType: HelpdeskEntityTypeDto.ASSET,
          entityId: 'asset-id',
          createdById: 'actor-id',
        }),
      }),
    );
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: 'helpdesk.tickets.create' }),
      }),
    );
  });

  it('audits status and assignment changes', async () => {
    prisma.helpdeskTicket.findFirst.mockResolvedValue({
      id: 'ticket-id',
      status: HelpdeskTicketStatusDto.OPEN,
    });
    prisma.helpdeskTicket.update
      .mockResolvedValueOnce({
        id: 'ticket-id',
        status: HelpdeskTicketStatusDto.CLOSED,
      })
      .mockResolvedValueOnce({
        id: 'ticket-id',
        assignedUserId: 'agent-user-id',
      });
    const service = new HelpdeskTicketsService(prisma as never);

    await service.changeTicketStatus('company-id', 'ticket-id', 'actor-id', {
      status: HelpdeskTicketStatusDto.CLOSED,
    });
    await service.assignTicket('company-id', 'ticket-id', 'actor-id', {
      assignedUserId: 'agent-user-id',
      assignedTeamName: 'IT',
    });

    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: 'helpdesk.tickets.close' }),
      }),
    );
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: 'helpdesk.tickets.assign' }),
      }),
    );
  });

  it('adds comments, internal notes, and attachment metadata with audit logs', async () => {
    prisma.helpdeskTicket.findFirst.mockResolvedValue({ id: 'ticket-id' });
    prisma.helpdeskTicketComment.create.mockResolvedValue({ id: 'comment-id' });
    prisma.helpdeskTicketInternalNote.create.mockResolvedValue({
      id: 'note-id',
    });
    prisma.helpdeskTicketAttachment.create.mockResolvedValue({
      id: 'attachment-id',
    });
    const service = new HelpdeskTicketsService(prisma as never);

    await service.addComment('company-id', 'ticket-id', 'actor-id', {
      commentText: 'We are checking this.',
    });
    await service.addInternalNote('company-id', 'ticket-id', 'actor-id', {
      noteText: 'Escalate if unresolved today.',
    });
    await service.addAttachment('company-id', 'ticket-id', 'actor-id', {
      fileName: 'screenshot.png',
      storageKey: 'tickets/ticket-id/screenshot.png',
      mimeType: 'image/png',
      size: 4096,
    });

    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: 'helpdesk.tickets.comment' }),
      }),
    );
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: 'helpdesk.tickets.note' }),
      }),
    );
  });

  it('scopes my tickets and queue listings with filters', async () => {
    prisma.helpdeskTicket.findMany.mockResolvedValue([]);
    prisma.helpdeskTicket.count.mockResolvedValue(0);
    const service = new HelpdeskTicketsService(prisma as never);

    await service.findMyTickets('company-id', 'actor-id', {
      page: 1,
      limit: 20,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      status: HelpdeskTicketStatusDto.OPEN,
    });
    await service.findQueue('company-id', {
      page: 1,
      limit: 20,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      departmentId: 'department-id',
      categoryId: 'category-id',
    });

    expect(prisma.helpdeskTicket.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          AND: [
            expect.objectContaining({
              companyId: 'company-id',
              status: HelpdeskTicketStatusDto.OPEN,
            }),
            expect.objectContaining({
              OR: expect.arrayContaining([
                { requesterUserId: 'actor-id' },
                { assignedUserId: 'actor-id' },
              ]),
            }),
          ],
        },
      }),
    );
    expect(prisma.helpdeskTicket.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          departmentId: 'department-id',
          categoryId: 'category-id',
        }),
      }),
    );
  });
});
