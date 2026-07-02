import { ConflictException } from '@nestjs/common';
import { ClientTypeDto } from '../clients/dto/create-client.dto';
import { SalesLeadsQuotationsService } from './sales-leads-quotations.service';
import {
  LeadStatusDto,
  OpportunityStatusDto,
  QuotationStatusDto,
} from './dto/sales-leads-quotations.enums';

describe('SalesLeadsQuotationsService', () => {
  const prisma = {
    leadSource: { findFirst: jest.fn(), create: jest.fn() },
    leadStage: { findFirst: jest.fn(), create: jest.fn() },
    salesLead: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    leadActivity: { create: jest.fn() },
    leadNote: { create: jest.fn() },
    client: { create: jest.fn() },
    opportunityStage: { findFirst: jest.fn(), create: jest.fn() },
    salesOpportunity: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    quotation: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    quotationVersion: { create: jest.fn() },
    auditLog: { create: jest.fn() },
  };

  beforeEach(() => jest.clearAllMocks());

  it('prevents duplicate leads by company scoped email or phone', async () => {
    prisma.salesLead.findFirst.mockResolvedValue({ id: 'lead-id' });
    const service = new SalesLeadsQuotationsService(prisma as never);

    await expect(
      service.createLead('company-id', 'actor-id', {
        name: 'Acme Lead',
        email: 'lead@example.com',
        phone: '9999999999',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('creates lead records, child activity/note, assignment, status, and conversion with audit logs', async () => {
    prisma.leadSource.findFirst.mockResolvedValue(null);
    prisma.leadSource.create.mockResolvedValue({ id: 'source-id' });
    prisma.leadStage.findFirst.mockResolvedValue(null);
    prisma.leadStage.create.mockResolvedValue({ id: 'stage-id' });
    prisma.salesLead.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 'lead-id',
        name: 'Acme Lead',
        email: 'lead@example.com',
        phone: '9999999999',
        status: LeadStatusDto.NEW,
      })
      .mockResolvedValueOnce({
        id: 'lead-id',
        name: 'Acme Lead',
        email: 'lead@example.com',
        phone: '9999999999',
        status: LeadStatusDto.CONTACTED,
      })
      .mockResolvedValueOnce({
        id: 'lead-id',
        name: 'Acme Lead',
        email: 'lead@example.com',
        phone: '9999999999',
      });
    prisma.salesLead.create.mockResolvedValue({ id: 'lead-id' });
    prisma.leadActivity.create.mockResolvedValue({ id: 'activity-id' });
    prisma.leadNote.create.mockResolvedValue({ id: 'note-id' });
    prisma.salesLead.update
      .mockResolvedValueOnce({ id: 'lead-id', assignedUserId: 'user-id' })
      .mockResolvedValueOnce({ id: 'lead-id', status: LeadStatusDto.QUALIFIED })
      .mockResolvedValueOnce({
        id: 'lead-id',
        convertedClientId: 'client-id',
        status: LeadStatusDto.WON,
      });
    prisma.client.create.mockResolvedValue({ id: 'client-id' });
    const service = new SalesLeadsQuotationsService(prisma as never);

    await service.createLeadSource('company-id', 'actor-id', {
      name: 'Website',
    });
    await service.createLeadStage('company-id', 'actor-id', {
      name: 'Qualified',
      sortOrder: 2,
    });
    await service.createLead('company-id', 'actor-id', {
      sourceId: 'source-id',
      stageId: 'stage-id',
      name: 'Acme Lead',
      email: 'lead@example.com',
      phone: '9999999999',
    });
    await service.addLeadActivity('company-id', 'lead-id', 'actor-id', {
      activityType: 'CALL',
      title: 'Discovery call',
    });
    await service.addLeadNote('company-id', 'lead-id', 'actor-id', {
      note: 'Interested in ERP package.',
    });
    await service.assignLead('company-id', 'lead-id', 'actor-id', {
      assignedUserId: 'user-id',
      assignedEmployeeId: 'employee-id',
    });
    await service.changeLeadStatus('company-id', 'lead-id', 'actor-id', {
      status: LeadStatusDto.QUALIFIED,
    });
    await service.convertLeadToClient('company-id', 'lead-id', 'actor-id', {
      clientType: ClientTypeDto.COMPANY,
      industry: 'Technology',
    });

    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: 'sales.leads.create' }),
      }),
    );
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: 'sales.leads.convert' }),
      }),
    );
  });

  it('creates opportunities, quotations with items, quotation versions, and status changes', async () => {
    prisma.opportunityStage.findFirst.mockResolvedValue(null);
    prisma.opportunityStage.create.mockResolvedValue({ id: 'opp-stage-id' });
    prisma.salesOpportunity.create.mockResolvedValue({ id: 'opportunity-id' });
    prisma.salesOpportunity.findFirst.mockResolvedValue({
      id: 'opportunity-id',
      status: OpportunityStatusDto.OPEN,
    });
    prisma.salesOpportunity.update.mockResolvedValue({
      id: 'opportunity-id',
      status: OpportunityStatusDto.WON,
    });
    prisma.quotation.create.mockResolvedValue({
      id: 'quotation-id',
      items: [{ id: 'item-id' }],
    });
    prisma.quotation.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 'quotation-id',
        status: QuotationStatusDto.DRAFT,
      })
      .mockResolvedValueOnce({
        id: 'quotation-id',
        status: QuotationStatusDto.DRAFT,
      });
    prisma.quotation.update.mockResolvedValue({
      id: 'quotation-id',
      status: QuotationStatusDto.SENT,
    });
    prisma.quotationVersion.create.mockResolvedValue({ id: 'version-id' });
    const service = new SalesLeadsQuotationsService(prisma as never);

    await service.createOpportunityStage('company-id', 'actor-id', {
      name: 'Proposal',
      sortOrder: 3,
    });
    await service.createOpportunity('company-id', 'actor-id', {
      leadId: 'lead-id',
      clientId: 'client-id',
      stageId: 'opp-stage-id',
      name: 'ERP Deal',
      expectedValue: 100000,
    });
    await service.changeOpportunityStatus(
      'company-id',
      'opportunity-id',
      'actor-id',
      { status: OpportunityStatusDto.WON },
    );
    await service.createQuotation('company-id', 'actor-id', {
      opportunityId: 'opportunity-id',
      clientId: 'client-id',
      quotationNumber: 'Q-100',
      title: 'ERP Quote',
      validUntil: '2035-05-01',
      items: [
        { description: 'Implementation', quantity: 1, unitPrice: 100000 },
      ],
    });
    await service.addQuotationVersion(
      'company-id',
      'quotation-id',
      'actor-id',
      {
        versionNumber: 2,
        metadata: { reason: 'discount' },
      },
    );
    await service.changeQuotationStatus(
      'company-id',
      'quotation-id',
      'actor-id',
      { status: QuotationStatusDto.SENT },
    );

    expect(prisma.quotation.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          items: {
            create: [
              expect.objectContaining({
                description: 'Implementation',
                quantity: 1,
              }),
            ],
          },
        }),
      }),
    );
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'sales.quotations.status',
        }),
      }),
    );
  });
});
