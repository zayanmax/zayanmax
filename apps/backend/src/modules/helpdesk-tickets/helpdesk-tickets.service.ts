import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import {
  AssignTicketDto,
  ChangeTicketStatusDto,
  CreateTicketCategoryDto,
  CreateTicketDto,
  CreateTicketSubcategoryDto,
  TicketAttachmentDto,
  TicketCategoryQueryDto,
  TicketCommentDto,
  TicketInternalNoteDto,
  TicketQueryDto,
  TicketSubcategoryQueryDto,
  UpdateTicketDto,
} from './dto/helpdesk-tickets.dto';
import {
  HelpdeskTicketPriorityDto,
  HelpdeskTicketSourceDto,
  HelpdeskTicketStatusDto,
} from './dto/helpdesk-tickets.enums';

@Injectable()
export class HelpdeskTicketsService {
  constructor(private readonly prisma: PrismaService) {}

  async createCategory(
    companyId: string,
    actorId: string,
    dto: CreateTicketCategoryDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const existing = await this.prisma.helpdeskTicketCategory.findFirst({
      where: { companyId, name: dto.name, deletedAt: null },
    });
    if (existing) throw new ConflictException('Ticket category exists');

    const category = await this.prisma.helpdeskTicketCategory.create({
      data: {
        companyId,
        departmentId: dto.departmentId,
        name: dto.name,
        description: dto.description,
        createdById: actorId,
      },
    });
    await this.audit(
      companyId,
      actorId,
      'helpdesk.categories.create',
      'HelpdeskTicketCategory',
      category.id,
      undefined,
      category,
      ipAddress,
      userAgent,
    );
    return category;
  }

  async findCategories(companyId: string, query: TicketCategoryQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.HelpdeskTicketCategoryWhereInput = {
      companyId,
      deletedAt: null,
      ...(query.status
        ? { status: query.status as Prisma.EnumRecordStatusFilter['equals'] }
        : {}),
      ...(query.departmentId ? { departmentId: query.departmentId } : {}),
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
      this.prisma.helpdeskTicketCategory.findMany({
        where,
        include: { subcategories: { where: { deletedAt: null } } },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [query.sortBy ?? 'createdAt']: query.sortOrder ?? 'desc' },
      }),
      this.prisma.helpdeskTicketCategory.count({ where }),
    ]);
    return this.paginated(data, page, limit, total);
  }

  async createSubcategory(
    companyId: string,
    categoryId: string,
    actorId: string,
    dto: CreateTicketSubcategoryDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const category = await this.prisma.helpdeskTicketCategory.findFirst({
      where: { id: categoryId, companyId, deletedAt: null },
    });
    if (!category) throw new NotFoundException('Ticket category not found');
    const existing = await this.prisma.helpdeskTicketSubcategory.findFirst({
      where: { companyId, categoryId, name: dto.name, deletedAt: null },
    });
    if (existing) throw new ConflictException('Ticket subcategory exists');

    const subcategory = await this.prisma.helpdeskTicketSubcategory.create({
      data: {
        companyId,
        categoryId,
        name: dto.name,
        description: dto.description,
        createdById: actorId,
      },
    });
    await this.audit(
      companyId,
      actorId,
      'helpdesk.subcategories.create',
      'HelpdeskTicketSubcategory',
      subcategory.id,
      undefined,
      subcategory,
      ipAddress,
      userAgent,
    );
    return subcategory;
  }

  async findSubcategories(companyId: string, query: TicketSubcategoryQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.HelpdeskTicketSubcategoryWhereInput = {
      companyId,
      deletedAt: null,
      ...(query.status
        ? { status: query.status as Prisma.EnumRecordStatusFilter['equals'] }
        : {}),
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
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
      this.prisma.helpdeskTicketSubcategory.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [query.sortBy ?? 'createdAt']: query.sortOrder ?? 'desc' },
      }),
      this.prisma.helpdeskTicketSubcategory.count({ where }),
    ]);
    return this.paginated(data, page, limit, total);
  }

  async createTicket(
    companyId: string,
    actorId: string,
    dto: CreateTicketDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const count = await this.prisma.helpdeskTicket.count({
      where: { companyId },
    });
    const ticketNumber = `HD-${String((count ?? 0) + 1).padStart(6, '0')}`;
    const ticket = await this.prisma.helpdeskTicket.create({
      data: {
        companyId,
        ticketNumber,
        requesterUserId: dto.requesterUserId ?? actorId,
        requesterEmployeeId: dto.requesterEmployeeId,
        departmentId: dto.departmentId,
        categoryId: dto.categoryId,
        subcategoryId: dto.subcategoryId,
        title: dto.title,
        description: dto.description,
        priority: dto.priority ?? HelpdeskTicketPriorityDto.MEDIUM,
        source: dto.source ?? HelpdeskTicketSourceDto.EMPLOYEE,
        assignedUserId: dto.assignedUserId,
        assignedEmployeeId: dto.assignedEmployeeId,
        assignedTeamName: dto.assignedTeamName,
        entityType: dto.entityType,
        entityId: dto.entityId,
        firstResponseDueAt: dto.firstResponseDueAt
          ? new Date(dto.firstResponseDueAt)
          : undefined,
        resolutionDueAt: dto.resolutionDueAt
          ? new Date(dto.resolutionDueAt)
          : undefined,
        createdById: actorId,
      },
      include: this.ticketInclude(),
    });
    await this.audit(
      companyId,
      actorId,
      'helpdesk.tickets.create',
      'HelpdeskTicket',
      ticket.id,
      undefined,
      ticket,
      ipAddress,
      userAgent,
    );
    return ticket;
  }

  async findTickets(companyId: string, query: TicketQueryDto) {
    return this.findTicketsByWhere(this.ticketWhere(companyId, query), query);
  }

  async findMyTickets(
    companyId: string,
    actorId: string,
    query: TicketQueryDto,
  ) {
    const where: Prisma.HelpdeskTicketWhereInput = {
      AND: [
        this.ticketWhere(companyId, query),
        {
          OR: [
            { requesterUserId: actorId },
            { assignedUserId: actorId },
            { createdById: actorId },
          ],
        },
      ],
    };
    return this.findTicketsByWhere(where, query);
  }

  async findQueue(companyId: string, query: TicketQueryDto) {
    return this.findTicketsByWhere(this.ticketWhere(companyId, query), query);
  }

  async updateTicket(
    companyId: string,
    id: string,
    actorId: string,
    dto: UpdateTicketDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const current = await this.findTicketOrThrow(companyId, id);
    const ticket = await this.prisma.helpdeskTicket.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        priority: dto.priority,
        departmentId: dto.departmentId,
        categoryId: dto.categoryId,
        subcategoryId: dto.subcategoryId,
        firstResponseDueAt: dto.firstResponseDueAt
          ? new Date(dto.firstResponseDueAt)
          : undefined,
        resolutionDueAt: dto.resolutionDueAt
          ? new Date(dto.resolutionDueAt)
          : undefined,
        firstResponseBreached: dto.firstResponseBreached,
        resolutionBreached: dto.resolutionBreached,
        updatedById: actorId,
      },
      include: this.ticketInclude(),
    });
    await this.audit(
      companyId,
      actorId,
      'helpdesk.tickets.update',
      'HelpdeskTicket',
      ticket.id,
      current,
      ticket,
      ipAddress,
      userAgent,
    );
    return ticket;
  }

  async changeTicketStatus(
    companyId: string,
    id: string,
    actorId: string,
    dto: ChangeTicketStatusDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const current = await this.findTicketOrThrow(companyId, id);
    const now = new Date();
    const ticket = await this.prisma.helpdeskTicket.update({
      where: { id },
      data: {
        status: dto.status,
        firstRespondedAt:
          dto.status === HelpdeskTicketStatusDto.IN_PROGRESS &&
          !current.firstRespondedAt
            ? now
            : undefined,
        resolvedAt:
          dto.status === HelpdeskTicketStatusDto.RESOLVED ? now : undefined,
        closedAt:
          dto.status === HelpdeskTicketStatusDto.CLOSED ? now : undefined,
        cancelledAt:
          dto.status === HelpdeskTicketStatusDto.CANCELLED ? now : undefined,
        updatedById: actorId,
      },
      include: this.ticketInclude(),
    });
    await this.audit(
      companyId,
      actorId,
      this.statusAuditAction(dto.status),
      'HelpdeskTicket',
      ticket.id,
      current,
      ticket,
      ipAddress,
      userAgent,
    );
    return ticket;
  }

  async assignTicket(
    companyId: string,
    id: string,
    actorId: string,
    dto: AssignTicketDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const current = await this.findTicketOrThrow(companyId, id);
    const ticket = await this.prisma.helpdeskTicket.update({
      where: { id },
      data: {
        assignedUserId: dto.assignedUserId,
        assignedEmployeeId: dto.assignedEmployeeId,
        assignedTeamName: dto.assignedTeamName,
        updatedById: actorId,
      },
      include: this.ticketInclude(),
    });
    await this.audit(
      companyId,
      actorId,
      'helpdesk.tickets.assign',
      'HelpdeskTicket',
      ticket.id,
      current,
      ticket,
      ipAddress,
      userAgent,
    );
    return ticket;
  }

  async removeTicket(
    companyId: string,
    id: string,
    actorId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const current = await this.findTicketOrThrow(companyId, id);
    const ticket = await this.prisma.helpdeskTicket.update({
      where: { id },
      data: { deletedAt: new Date(), updatedById: actorId },
    });
    await this.audit(
      companyId,
      actorId,
      'helpdesk.tickets.delete',
      'HelpdeskTicket',
      id,
      current,
      ticket,
      ipAddress,
      userAgent,
    );
    return ticket;
  }

  async addComment(
    companyId: string,
    ticketId: string,
    actorId: string,
    dto: TicketCommentDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    await this.findTicketOrThrow(companyId, ticketId);
    const comment = await this.prisma.helpdeskTicketComment.create({
      data: {
        companyId,
        ticketId,
        authorUserId: actorId,
        authorEmployeeId: dto.authorEmployeeId,
        commentText: dto.commentText,
        createdById: actorId,
      },
    });
    await this.audit(
      companyId,
      actorId,
      'helpdesk.tickets.comment',
      'HelpdeskTicketComment',
      comment.id,
      undefined,
      comment,
      ipAddress,
      userAgent,
    );
    return comment;
  }

  async addInternalNote(
    companyId: string,
    ticketId: string,
    actorId: string,
    dto: TicketInternalNoteDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    await this.findTicketOrThrow(companyId, ticketId);
    const note = await this.prisma.helpdeskTicketInternalNote.create({
      data: {
        companyId,
        ticketId,
        authorUserId: actorId,
        authorEmployeeId: dto.authorEmployeeId,
        noteText: dto.noteText,
        createdById: actorId,
      },
    });
    await this.audit(
      companyId,
      actorId,
      'helpdesk.tickets.note',
      'HelpdeskTicketInternalNote',
      note.id,
      undefined,
      note,
      ipAddress,
      userAgent,
    );
    return note;
  }

  async addAttachment(
    companyId: string,
    ticketId: string,
    actorId: string,
    dto: TicketAttachmentDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    await this.findTicketOrThrow(companyId, ticketId);
    const attachment = await this.prisma.helpdeskTicketAttachment.create({
      data: {
        companyId,
        ticketId,
        fileName: dto.fileName,
        storageKey: dto.storageKey,
        mimeType: dto.mimeType,
        size: dto.size,
        createdById: actorId,
      },
    });
    await this.audit(
      companyId,
      actorId,
      'helpdesk.tickets.attachment',
      'HelpdeskTicketAttachment',
      attachment.id,
      undefined,
      attachment,
      ipAddress,
      userAgent,
    );
    return attachment;
  }

  private async findTicketOrThrow(companyId: string, id: string) {
    const ticket = await this.prisma.helpdeskTicket.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!ticket) throw new NotFoundException('Helpdesk ticket not found');
    return ticket;
  }

  private async findTicketsByWhere(
    where: Prisma.HelpdeskTicketWhereInput,
    query: TicketQueryDto,
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const [data, total] = await Promise.all([
      this.prisma.helpdeskTicket.findMany({
        where,
        include: this.ticketInclude(),
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [query.sortBy ?? 'createdAt']: query.sortOrder ?? 'desc' },
      }),
      this.prisma.helpdeskTicket.count({ where }),
    ]);
    return this.paginated(data, page, limit, total);
  }

  private ticketWhere(
    companyId: string,
    query: TicketQueryDto,
  ): Prisma.HelpdeskTicketWhereInput {
    return {
      companyId,
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.priority ? { priority: query.priority } : {}),
      ...(query.source ? { source: query.source } : {}),
      ...(query.requesterUserId
        ? { requesterUserId: query.requesterUserId }
        : {}),
      ...(query.requesterEmployeeId
        ? { requesterEmployeeId: query.requesterEmployeeId }
        : {}),
      ...(query.assignedUserId ? { assignedUserId: query.assignedUserId } : {}),
      ...(query.assignedEmployeeId
        ? { assignedEmployeeId: query.assignedEmployeeId }
        : {}),
      ...(query.assignedTeamName
        ? { assignedTeamName: query.assignedTeamName }
        : {}),
      ...(query.departmentId ? { departmentId: query.departmentId } : {}),
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.subcategoryId ? { subcategoryId: query.subcategoryId } : {}),
      ...(query.entityType ? { entityType: query.entityType } : {}),
      ...(query.entityId ? { entityId: query.entityId } : {}),
      ...(query.search
        ? {
            OR: [
              { ticketNumber: { contains: query.search, mode: 'insensitive' } },
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
  }

  private ticketInclude() {
    return {
      category: true,
      subcategory: true,
      comments: { where: { deletedAt: null } },
      internalNotes: { where: { deletedAt: null } },
      attachments: { where: { deletedAt: null } },
    };
  }

  private statusAuditAction(status: HelpdeskTicketStatusDto) {
    if (status === HelpdeskTicketStatusDto.CLOSED) {
      return 'helpdesk.tickets.close';
    }
    return 'helpdesk.tickets.status';
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
