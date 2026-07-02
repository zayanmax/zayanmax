import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { ChangeClientStatusDto } from './dto/change-client-status.dto';
import { ClientQueryDto } from './dto/client-query.dto';
import { CreateClientActivityDto } from './dto/create-client-activity.dto';
import { CreateClientContactDto } from './dto/create-client-contact.dto';
import { CreateClientDocumentDto } from './dto/create-client-document.dto';
import { CreateClientNoteDto } from './dto/create-client-note.dto';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    companyId: string,
    actorId: string,
    dto: CreateClientDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    await this.ensureNoDuplicate(companyId, dto);

    const client = await this.prisma.client.create({
      data: {
        companyId,
        type: dto.type,
        name: dto.name,
        email: this.normalizeEmail(dto.email),
        phone: dto.phone,
        website: dto.website,
        industry: dto.industry,
        companySize: dto.companySize,
        taxNumber: dto.taxNumber,
        billingAddress: dto.billingAddress,
        status: dto.status ?? 'ACTIVE',
        ownerId: dto.ownerId,
        createdById: actorId,
      },
    });

    await this.audit(
      companyId,
      actorId,
      'clients.create',
      client.id,
      undefined,
      client,
      ipAddress,
      userAgent,
    );
    return client;
  }

  async findAll(companyId: string, query: ClientQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.ClientWhereInput = {
      companyId,
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.type ? { type: query.type } : {}),
      ...(query.ownerId ? { ownerId: query.ownerId } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { email: { contains: query.search, mode: 'insensitive' } },
              { phone: { contains: query.search, mode: 'insensitive' } },
              { industry: { contains: query.search, mode: 'insensitive' } },
              { taxNumber: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.client.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [query.sortBy ?? 'createdAt']: query.sortOrder ?? 'desc' },
        include: {
          owner: { select: { id: true, email: true } },
          _count: {
            select: {
              contacts: true,
              notes: true,
              activities: true,
              documents: true,
            },
          },
        },
      }),
      this.prisma.client.count({ where }),
    ]);

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

  async findOne(companyId: string, id: string) {
    const client = await this.prisma.client.findFirst({
      where: { id, companyId, deletedAt: null },
      include: {
        owner: { select: { id: true, email: true } },
        contacts: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
        },
        notes: { where: { deletedAt: null }, orderBy: { createdAt: 'desc' } },
        activities: { orderBy: { createdAt: 'desc' } },
        documents: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    return client;
  }

  async update(
    companyId: string,
    id: string,
    actorId: string,
    dto: UpdateClientDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const oldValue = await this.findOne(companyId, id);
    await this.ensureNoDuplicate(companyId, dto, id);

    const client = await this.prisma.client.update({
      where: { id },
      data: {
        ...dto,
        email: this.normalizeEmail(dto.email),
        updatedById: actorId,
      },
    });

    await this.audit(
      companyId,
      actorId,
      'clients.update',
      id,
      oldValue,
      client,
      ipAddress,
      userAgent,
    );
    return client;
  }

  async changeStatus(
    companyId: string,
    id: string,
    actorId: string,
    dto: ChangeClientStatusDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const oldValue = await this.findOne(companyId, id);
    const client = await this.prisma.client.update({
      where: { id },
      data: {
        status: dto.status,
        updatedById: actorId,
      },
    });

    await this.audit(
      companyId,
      actorId,
      'clients.status_change',
      id,
      oldValue,
      client,
      ipAddress,
      userAgent,
    );
    return client;
  }

  async remove(
    companyId: string,
    id: string,
    actorId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const result = await this.prisma.client.updateMany({
      where: { id, companyId, deletedAt: null },
      data: { deletedAt: new Date(), updatedById: actorId },
    });

    if (result.count === 0) {
      throw new NotFoundException('Client not found');
    }

    await this.audit(
      companyId,
      actorId,
      'clients.delete',
      id,
      undefined,
      { deleted: true },
      ipAddress,
      userAgent,
    );
    return { deleted: true };
  }

  async addContact(
    companyId: string,
    clientId: string,
    actorId: string,
    dto: CreateClientContactDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    await this.assertClient(companyId, clientId);
    const contact = await this.prisma.clientContact.create({
      data: {
        companyId,
        clientId,
        name: dto.name,
        designation: dto.designation,
        email: this.normalizeEmail(dto.email),
        phone: dto.phone,
        isPrimary: dto.isPrimary ?? false,
        createdById: actorId,
      },
    });
    await this.audit(
      companyId,
      actorId,
      'clients.contacts.create',
      clientId,
      undefined,
      contact,
      ipAddress,
      userAgent,
    );
    return contact;
  }

  async listContacts(companyId: string, clientId: string) {
    await this.assertClient(companyId, clientId);
    return this.prisma.clientContact.findMany({
      where: { companyId, clientId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addActivity(
    companyId: string,
    clientId: string,
    actorId: string,
    dto: CreateClientActivityDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    await this.assertClient(companyId, clientId);
    const activity = await this.prisma.clientActivity.create({
      data: {
        companyId,
        clientId,
        type: dto.type,
        title: dto.title,
        description: dto.description,
        dueAt: dto.dueAt ? new Date(dto.dueAt) : undefined,
        completedAt: dto.completedAt ? new Date(dto.completedAt) : undefined,
        createdById: actorId,
      },
    });
    await this.audit(
      companyId,
      actorId,
      'clients.activities.create',
      clientId,
      undefined,
      activity,
      ipAddress,
      userAgent,
    );
    return activity;
  }

  async listActivities(companyId: string, clientId: string) {
    await this.assertClient(companyId, clientId);
    return this.prisma.clientActivity.findMany({
      where: { companyId, clientId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addNote(
    companyId: string,
    clientId: string,
    actorId: string,
    dto: CreateClientNoteDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    await this.assertClient(companyId, clientId);
    const note = await this.prisma.clientNote.create({
      data: {
        companyId,
        clientId,
        noteText: dto.noteText,
        createdById: actorId,
      },
    });
    await this.audit(
      companyId,
      actorId,
      'clients.notes.create',
      clientId,
      undefined,
      note,
      ipAddress,
      userAgent,
    );
    return note;
  }

  async listNotes(companyId: string, clientId: string) {
    await this.assertClient(companyId, clientId);
    return this.prisma.clientNote.findMany({
      where: { companyId, clientId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addDocument(
    companyId: string,
    clientId: string,
    actorId: string,
    dto: CreateClientDocumentDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    await this.assertClient(companyId, clientId);
    const document = await this.prisma.clientDocument.create({
      data: {
        companyId,
        clientId,
        fileName: dto.fileName,
        storageKey: dto.storageKey,
        mimeType: dto.mimeType,
        size: dto.size,
        category: dto.category ?? 'OTHER',
        createdById: actorId,
      },
    });
    await this.audit(
      companyId,
      actorId,
      'clients.documents.create',
      clientId,
      undefined,
      document,
      ipAddress,
      userAgent,
    );
    return document;
  }

  async listDocuments(companyId: string, clientId: string) {
    await this.assertClient(companyId, clientId);
    return this.prisma.clientDocument.findMany({
      where: { companyId, clientId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async ensureNoDuplicate(
    companyId: string,
    dto: Partial<CreateClientDto>,
    excludeId?: string,
  ) {
    const or: Prisma.ClientWhereInput[] = [
      ...(dto.email ? [{ email: this.normalizeEmail(dto.email) }] : []),
      ...(dto.phone ? [{ phone: dto.phone }] : []),
      ...(dto.name
        ? [{ name: { equals: dto.name, mode: 'insensitive' as const } }]
        : []),
    ];

    if (or.length === 0) {
      return;
    }

    const existing = await this.prisma.client.findFirst({
      where: {
        companyId,
        deletedAt: null,
        ...(excludeId ? { id: { not: excludeId } } : {}),
        OR: or,
      },
    });

    if (existing) {
      throw new ConflictException(
        'Client already exists with the same email, phone, or name',
      );
    }
  }

  private async assertClient(companyId: string, id: string) {
    const client = await this.prisma.client.findFirst({
      where: { id, companyId, deletedAt: null },
      select: { id: true },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }
  }

  private normalizeEmail(email?: string) {
    return email?.toLowerCase();
  }

  private audit(
    companyId: string,
    actorId: string,
    action: string,
    entityId: string,
    oldValue?: unknown,
    newValue?: unknown,
    ipAddress?: string,
    userAgent?: string,
  ) {
    return this.prisma.auditLog.create({
      data: {
        companyId,
        actorId,
        action,
        entityType: 'Client',
        entityId,
        oldValue: oldValue as Prisma.InputJsonValue,
        newValue: newValue as Prisma.InputJsonValue,
        ipAddress,
        userAgent,
      },
    });
  }
}
