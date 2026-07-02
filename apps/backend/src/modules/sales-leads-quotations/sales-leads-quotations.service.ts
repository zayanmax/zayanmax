import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import {
  AddQuotationVersionDto,
  AssignLeadDto,
  ChangeLeadStatusDto,
  ChangeOpportunityStatusDto,
  ChangeQuotationStatusDto,
  ConvertLeadDto,
  CreateLeadActivityDto,
  CreateLeadDto,
  CreateLeadNoteDto,
  CreateLeadSourceDto,
  CreateLeadStageDto,
  CreateOpportunityDto,
  CreateOpportunityStageDto,
  CreateQuotationDto,
  LeadQueryDto,
  LeadTaxonomyQueryDto,
  OpportunityQueryDto,
  QuotationQueryDto,
  UpdateLeadDto,
  UpdateOpportunityDto,
  UpdateQuotationDto,
} from './dto/sales-leads-quotations.dto';
import {
  LeadStatusDto,
  OpportunityStatusDto,
  QuotationStatusDto,
} from './dto/sales-leads-quotations.enums';

@Injectable()
export class SalesLeadsQuotationsService {
  constructor(private readonly prisma: PrismaService) {}

  async createLeadSource(
    companyId: string,
    actorId: string,
    dto: CreateLeadSourceDto,
  ) {
    const existing = await this.prisma.leadSource.findFirst({
      where: { companyId, name: dto.name, deletedAt: null },
    });
    if (existing) throw new ConflictException('Lead source exists');

    const source = await this.prisma.leadSource.create({
      data: { companyId, ...dto, createdById: actorId },
    });
    await this.audit(
      companyId,
      actorId,
      'sales.lead_sources.create',
      'LeadSource',
      source.id,
      undefined,
      source,
    );
    return source;
  }

  async findLeadSources(companyId: string, query: LeadTaxonomyQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.LeadSourceWhereInput = {
      companyId,
      deletedAt: null,
      ...(query.search
        ? { name: { contains: query.search, mode: 'insensitive' } }
        : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.leadSource.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [query.sortBy ?? 'createdAt']: query.sortOrder ?? 'desc' },
      }),
      this.prisma.leadSource.count({ where }),
    ]);
    return this.paginated(data, page, limit, total);
  }

  async createLeadStage(
    companyId: string,
    actorId: string,
    dto: CreateLeadStageDto,
  ) {
    const existing = await this.prisma.leadStage.findFirst({
      where: { companyId, name: dto.name, deletedAt: null },
    });
    if (existing) throw new ConflictException('Lead stage exists');

    const stage = await this.prisma.leadStage.create({
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
      'sales.lead_stages.create',
      'LeadStage',
      stage.id,
      undefined,
      stage,
    );
    return stage;
  }

  async findLeadStages(companyId: string, query: LeadTaxonomyQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.LeadStageWhereInput = {
      companyId,
      deletedAt: null,
      ...(query.search
        ? { name: { contains: query.search, mode: 'insensitive' } }
        : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.leadStage.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [query.sortBy ?? 'sortOrder']: query.sortOrder ?? 'asc' },
      }),
      this.prisma.leadStage.count({ where }),
    ]);
    return this.paginated(data, page, limit, total);
  }

  async createLead(
    companyId: string,
    actorId: string,
    dto: CreateLeadDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    await this.ensureNoDuplicateLead(companyId, dto);
    const lead = await this.prisma.salesLead.create({
      data: { companyId, ...dto, createdById: actorId },
    });
    await this.audit(
      companyId,
      actorId,
      'sales.leads.create',
      'SalesLead',
      lead.id,
      undefined,
      lead,
      ipAddress,
      userAgent,
    );
    return lead;
  }

  async findLeads(companyId: string, query: LeadQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.SalesLeadWhereInput = {
      companyId,
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.sourceId ? { sourceId: query.sourceId } : {}),
      ...(query.stageId ? { stageId: query.stageId } : {}),
      ...(query.assignedUserId ? { assignedUserId: query.assignedUserId } : {}),
      ...(query.assignedEmployeeId
        ? { assignedEmployeeId: query.assignedEmployeeId }
        : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { companyName: { contains: query.search, mode: 'insensitive' } },
              { email: { contains: query.search, mode: 'insensitive' } },
              { phone: { contains: query.search, mode: 'insensitive' } },
              { industry: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.salesLead.findMany({
        where,
        include: {
          source: true,
          stage: true,
          assignedUser: { select: { id: true, email: true } },
          assignedEmployee: true,
          convertedClient: true,
          _count: { select: { activities: true, leadNotes: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [query.sortBy ?? 'createdAt']: query.sortOrder ?? 'desc' },
      }),
      this.prisma.salesLead.count({ where }),
    ]);
    return this.paginated(data, page, limit, total);
  }

  async findLead(companyId: string, leadId: string) {
    const lead = await this.prisma.salesLead.findFirst({
      where: { id: leadId, companyId, deletedAt: null },
      include: {
        source: true,
        stage: true,
        assignedUser: { select: { id: true, email: true } },
        assignedEmployee: true,
        convertedClient: true,
        activities: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
        },
        leadNotes: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
        },
        opportunities: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
        },
        quotations: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!lead) throw new NotFoundException('Lead not found');
    return lead;
  }

  async updateLead(
    companyId: string,
    leadId: string,
    actorId: string,
    dto: UpdateLeadDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const current = await this.findLeadOrThrow(companyId, leadId);
    await this.ensureNoDuplicateLead(companyId, dto, leadId);
    const lead = await this.prisma.salesLead.update({
      where: { id: leadId },
      data: { ...dto, updatedById: actorId },
    });
    await this.audit(
      companyId,
      actorId,
      'sales.leads.update',
      'SalesLead',
      leadId,
      current,
      lead,
      ipAddress,
      userAgent,
    );
    return lead;
  }

  async deleteLead(
    companyId: string,
    leadId: string,
    actorId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const current = await this.findLeadOrThrow(companyId, leadId);
    const lead = await this.prisma.salesLead.update({
      where: { id: leadId },
      data: { deletedAt: new Date(), updatedById: actorId },
    });
    await this.audit(
      companyId,
      actorId,
      'sales.leads.delete',
      'SalesLead',
      leadId,
      current,
      lead,
      ipAddress,
      userAgent,
    );
    return { deleted: true };
  }

  async addLeadActivity(
    companyId: string,
    leadId: string,
    actorId: string,
    dto: CreateLeadActivityDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    await this.findLeadOrThrow(companyId, leadId);
    const activity = await this.prisma.leadActivity.create({
      data: {
        companyId,
        leadId,
        activityType: dto.activityType,
        title: dto.title,
        description: dto.description,
        activityAt: dto.activityAt ? new Date(dto.activityAt) : undefined,
        createdById: actorId,
      },
    });
    await this.audit(
      companyId,
      actorId,
      'sales.leads.activities.create',
      'LeadActivity',
      activity.id,
      undefined,
      activity,
      ipAddress,
      userAgent,
    );
    return activity;
  }

  async addLeadNote(
    companyId: string,
    leadId: string,
    actorId: string,
    dto: CreateLeadNoteDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    await this.findLeadOrThrow(companyId, leadId);
    const note = await this.prisma.leadNote.create({
      data: { companyId, leadId, note: dto.note, createdById: actorId },
    });
    await this.audit(
      companyId,
      actorId,
      'sales.leads.notes.create',
      'LeadNote',
      note.id,
      undefined,
      note,
      ipAddress,
      userAgent,
    );
    return note;
  }

  async assignLead(
    companyId: string,
    leadId: string,
    actorId: string,
    dto: AssignLeadDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const current = await this.findLeadOrThrow(companyId, leadId);
    const lead = await this.prisma.salesLead.update({
      where: { id: leadId },
      data: { ...dto, updatedById: actorId },
    });
    await this.audit(
      companyId,
      actorId,
      'sales.leads.assignment',
      'SalesLead',
      leadId,
      current,
      lead,
      ipAddress,
      userAgent,
    );
    return lead;
  }

  async changeLeadStatus(
    companyId: string,
    leadId: string,
    actorId: string,
    dto: ChangeLeadStatusDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const current = await this.findLeadOrThrow(companyId, leadId);
    const lead = await this.prisma.salesLead.update({
      where: { id: leadId },
      data: {
        status: dto.status,
        lostReason: dto.lostReason,
        updatedById: actorId,
      },
    });
    await this.audit(
      companyId,
      actorId,
      'sales.leads.status',
      'SalesLead',
      leadId,
      current,
      lead,
      ipAddress,
      userAgent,
    );
    return lead;
  }

  async convertLeadToClient(
    companyId: string,
    leadId: string,
    actorId: string,
    dto: ConvertLeadDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const lead = await this.findLeadOrThrow(companyId, leadId);
    if (lead.convertedClientId) throw new ConflictException('Lead converted');

    const client = await this.prisma.client.create({
      data: {
        companyId,
        type: dto.clientType ?? 'COMPANY',
        name: lead.companyName ?? lead.name,
        email: lead.email,
        phone: lead.phone,
        website: lead.website,
        industry: dto.industry ?? lead.industry,
        companySize: dto.companySize,
        taxNumber: dto.taxNumber,
        billingAddress: dto.billingAddress,
        status: 'PROSPECT',
        ownerId: lead.assignedUserId,
        createdById: actorId,
      },
    });

    const updatedLead = await this.prisma.salesLead.update({
      where: { id: leadId },
      data: {
        convertedClientId: client.id,
        convertedAt: new Date(),
        status: LeadStatusDto.WON,
        updatedById: actorId,
      },
    });
    await this.audit(
      companyId,
      actorId,
      'sales.leads.convert',
      'SalesLead',
      leadId,
      lead,
      { client, lead: updatedLead },
      ipAddress,
      userAgent,
    );
    return { client, lead: updatedLead };
  }

  async createOpportunityStage(
    companyId: string,
    actorId: string,
    dto: CreateOpportunityStageDto,
  ) {
    const existing = await this.prisma.opportunityStage.findFirst({
      where: { companyId, name: dto.name, deletedAt: null },
    });
    if (existing) throw new ConflictException('Opportunity stage exists');

    const stage = await this.prisma.opportunityStage.create({
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
      'sales.opportunity_stages.create',
      'OpportunityStage',
      stage.id,
      undefined,
      stage,
    );
    return stage;
  }

  async createOpportunity(
    companyId: string,
    actorId: string,
    dto: CreateOpportunityDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const opportunity = await this.prisma.salesOpportunity.create({
      data: {
        companyId,
        leadId: dto.leadId,
        clientId: dto.clientId,
        stageId: dto.stageId,
        name: dto.name,
        description: dto.description,
        expectedValue: dto.expectedValue,
        probability: dto.probability,
        expectedCloseDate: dto.expectedCloseDate
          ? new Date(dto.expectedCloseDate)
          : undefined,
        assignedUserId: dto.assignedUserId,
        assignedEmployeeId: dto.assignedEmployeeId,
        createdById: actorId,
      },
    });
    await this.audit(
      companyId,
      actorId,
      'sales.opportunities.create',
      'SalesOpportunity',
      opportunity.id,
      undefined,
      opportunity,
      ipAddress,
      userAgent,
    );
    return opportunity;
  }

  async findOpportunities(companyId: string, query: OpportunityQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.SalesOpportunityWhereInput = {
      companyId,
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.leadId ? { leadId: query.leadId } : {}),
      ...(query.clientId ? { clientId: query.clientId } : {}),
      ...(query.stageId ? { stageId: query.stageId } : {}),
      ...(query.search
        ? { name: { contains: query.search, mode: 'insensitive' } }
        : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.salesOpportunity.findMany({
        where,
        include: { lead: true, client: true, stage: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [query.sortBy ?? 'createdAt']: query.sortOrder ?? 'desc' },
      }),
      this.prisma.salesOpportunity.count({ where }),
    ]);
    return this.paginated(data, page, limit, total);
  }

  async findOpportunity(companyId: string, opportunityId: string) {
    const opportunity = await this.prisma.salesOpportunity.findFirst({
      where: { id: opportunityId, companyId, deletedAt: null },
      include: {
        lead: true,
        client: true,
        stage: true,
        quotations: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!opportunity) throw new NotFoundException('Opportunity not found');
    return opportunity;
  }

  async updateOpportunity(
    companyId: string,
    opportunityId: string,
    actorId: string,
    dto: UpdateOpportunityDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const current = await this.findOpportunityOrThrow(companyId, opportunityId);
    const opportunity = await this.prisma.salesOpportunity.update({
      where: { id: opportunityId },
      data: {
        ...dto,
        expectedCloseDate: dto.expectedCloseDate
          ? new Date(dto.expectedCloseDate)
          : undefined,
        updatedById: actorId,
      },
    });
    await this.audit(
      companyId,
      actorId,
      'sales.opportunities.update',
      'SalesOpportunity',
      opportunityId,
      current,
      opportunity,
      ipAddress,
      userAgent,
    );
    return opportunity;
  }

  async changeOpportunityStatus(
    companyId: string,
    opportunityId: string,
    actorId: string,
    dto: ChangeOpportunityStatusDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const current = await this.findOpportunityOrThrow(companyId, opportunityId);
    const now = new Date();
    const opportunity = await this.prisma.salesOpportunity.update({
      where: { id: opportunityId },
      data: {
        status: dto.status,
        wonAt: dto.status === OpportunityStatusDto.WON ? now : undefined,
        lostAt: dto.status === OpportunityStatusDto.LOST ? now : undefined,
        cancelledAt:
          dto.status === OpportunityStatusDto.CANCELLED ? now : undefined,
        lostReason: dto.lostReason,
        updatedById: actorId,
      },
    });
    await this.audit(
      companyId,
      actorId,
      'sales.opportunities.status',
      'SalesOpportunity',
      opportunityId,
      current,
      opportunity,
      ipAddress,
      userAgent,
    );
    return opportunity;
  }

  async deleteOpportunity(
    companyId: string,
    opportunityId: string,
    actorId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const current = await this.findOpportunityOrThrow(companyId, opportunityId);
    const opportunity = await this.prisma.salesOpportunity.update({
      where: { id: opportunityId },
      data: { deletedAt: new Date(), updatedById: actorId },
    });
    await this.audit(
      companyId,
      actorId,
      'sales.opportunities.delete',
      'SalesOpportunity',
      opportunityId,
      current,
      opportunity,
      ipAddress,
      userAgent,
    );
    return { deleted: true };
  }

  async createQuotation(
    companyId: string,
    actorId: string,
    dto: CreateQuotationDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const existing = await this.prisma.quotation.findFirst({
      where: { companyId, quotationNumber: dto.quotationNumber },
    });
    if (existing) throw new ConflictException('Quotation exists');

    const totals = this.calculateQuotationTotals(dto.items);
    const quotation = await this.prisma.quotation.create({
      data: {
        companyId,
        opportunityId: dto.opportunityId,
        leadId: dto.leadId,
        clientId: dto.clientId,
        quotationNumber: dto.quotationNumber,
        title: dto.title,
        currency: dto.currency ?? 'INR',
        validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
        terms: dto.terms,
        notes: dto.notes,
        ...totals,
        createdById: actorId,
        items: {
          create: dto.items.map((item) => {
            const lineTotal =
              item.quantity * item.unitPrice -
              (item.discountAmount ?? 0) +
              (item.taxAmount ?? 0);
            return {
              companyId,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              discountAmount: item.discountAmount ?? 0,
              taxAmount: item.taxAmount ?? 0,
              lineTotal,
              sortOrder: item.sortOrder ?? 0,
              createdById: actorId,
            };
          }),
        },
      },
      include: { items: true },
    });
    await this.audit(
      companyId,
      actorId,
      'sales.quotations.create',
      'Quotation',
      quotation.id,
      undefined,
      quotation,
      ipAddress,
      userAgent,
    );
    return quotation;
  }

  async findQuotations(companyId: string, query: QuotationQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.QuotationWhereInput = {
      companyId,
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.opportunityId ? { opportunityId: query.opportunityId } : {}),
      ...(query.leadId ? { leadId: query.leadId } : {}),
      ...(query.clientId ? { clientId: query.clientId } : {}),
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: 'insensitive' } },
              {
                quotationNumber: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
            ],
          }
        : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.quotation.findMany({
        where,
        include: {
          items: true,
          versions: true,
          opportunity: true,
          client: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [query.sortBy ?? 'createdAt']: query.sortOrder ?? 'desc' },
      }),
      this.prisma.quotation.count({ where }),
    ]);
    return this.paginated(data, page, limit, total);
  }

  async findQuotation(companyId: string, quotationId: string) {
    const quotation = await this.prisma.quotation.findFirst({
      where: { id: quotationId, companyId, deletedAt: null },
      include: {
        items: { where: { deletedAt: null }, orderBy: { sortOrder: 'asc' } },
        versions: { orderBy: { versionNumber: 'desc' } },
        opportunity: true,
        lead: true,
        client: true,
      },
    });
    if (!quotation) throw new NotFoundException('Quotation not found');
    return quotation;
  }

  async updateQuotation(
    companyId: string,
    quotationId: string,
    actorId: string,
    dto: UpdateQuotationDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const current = await this.findQuotationOrThrow(companyId, quotationId);
    const quotation = await this.prisma.quotation.update({
      where: { id: quotationId },
      data: {
        ...dto,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
        updatedById: actorId,
      },
    });
    await this.audit(
      companyId,
      actorId,
      'sales.quotations.update',
      'Quotation',
      quotationId,
      current,
      quotation,
      ipAddress,
      userAgent,
    );
    return quotation;
  }

  async addQuotationVersion(
    companyId: string,
    quotationId: string,
    actorId: string,
    dto: AddQuotationVersionDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const current = await this.findQuotationOrThrow(companyId, quotationId);
    const version = await this.prisma.quotationVersion.create({
      data: {
        companyId,
        quotationId,
        versionNumber: dto.versionNumber,
        metadata: dto.metadata as Prisma.InputJsonValue,
        notes: dto.notes,
        createdById: actorId,
      },
    });
    await this.prisma.quotation.update({
      where: { id: quotationId },
      data: { versionNumber: dto.versionNumber, updatedById: actorId },
    });
    await this.audit(
      companyId,
      actorId,
      'sales.quotations.version',
      'Quotation',
      quotationId,
      current,
      version,
      ipAddress,
      userAgent,
    );
    return version;
  }

  async changeQuotationStatus(
    companyId: string,
    quotationId: string,
    actorId: string,
    dto: ChangeQuotationStatusDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const current = await this.findQuotationOrThrow(companyId, quotationId);
    const now = new Date();
    const quotation = await this.prisma.quotation.update({
      where: { id: quotationId },
      data: {
        status: dto.status,
        sentAt: dto.status === QuotationStatusDto.SENT ? now : undefined,
        acceptedAt:
          dto.status === QuotationStatusDto.ACCEPTED ? now : undefined,
        rejectedAt:
          dto.status === QuotationStatusDto.REJECTED ? now : undefined,
        expiredAt: dto.status === QuotationStatusDto.EXPIRED ? now : undefined,
        cancelledAt:
          dto.status === QuotationStatusDto.CANCELLED ? now : undefined,
        updatedById: actorId,
      },
    });
    await this.audit(
      companyId,
      actorId,
      'sales.quotations.status',
      'Quotation',
      quotationId,
      current,
      quotation,
      ipAddress,
      userAgent,
    );
    return quotation;
  }

  async deleteQuotation(
    companyId: string,
    quotationId: string,
    actorId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const current = await this.findQuotationOrThrow(companyId, quotationId);
    const quotation = await this.prisma.quotation.update({
      where: { id: quotationId },
      data: { deletedAt: new Date(), updatedById: actorId },
    });
    await this.audit(
      companyId,
      actorId,
      'sales.quotations.delete',
      'Quotation',
      quotationId,
      current,
      quotation,
      ipAddress,
      userAgent,
    );
    return { deleted: true };
  }

  private async ensureNoDuplicateLead(
    companyId: string,
    dto: { email?: string; phone?: string },
    excludeId?: string,
  ) {
    const conditions = [
      dto.email ? { email: dto.email } : undefined,
      dto.phone ? { phone: dto.phone } : undefined,
    ].filter(Boolean) as Prisma.SalesLeadWhereInput[];
    if (!conditions.length) return;

    const duplicate = await this.prisma.salesLead.findFirst({
      where: {
        companyId,
        deletedAt: null,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
        OR: conditions,
      },
    });
    if (duplicate) throw new ConflictException('Lead already exists');
  }

  private async findLeadOrThrow(companyId: string, id: string) {
    const lead = await this.prisma.salesLead.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!lead) throw new NotFoundException('Lead not found');
    return lead;
  }

  private async findOpportunityOrThrow(companyId: string, id: string) {
    const opportunity = await this.prisma.salesOpportunity.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!opportunity) throw new NotFoundException('Opportunity not found');
    return opportunity;
  }

  private async findQuotationOrThrow(companyId: string, id: string) {
    const quotation = await this.prisma.quotation.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!quotation) throw new NotFoundException('Quotation not found');
    return quotation;
  }

  private calculateQuotationTotals(items: CreateQuotationDto['items']) {
    const subTotal = items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );
    const discountTotal = items.reduce(
      (sum, item) => sum + (item.discountAmount ?? 0),
      0,
    );
    const taxTotal = items.reduce(
      (sum, item) => sum + (item.taxAmount ?? 0),
      0,
    );
    const grandTotal = subTotal - discountTotal + taxTotal;
    return { subTotal, discountTotal, taxTotal, grandTotal };
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
