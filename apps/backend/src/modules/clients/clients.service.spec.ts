import { ConflictException, NotFoundException } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { ClientActivityTypeDto } from './dto/create-client-activity.dto';
import { ClientStatusDto, ClientTypeDto } from './dto/create-client.dto';

describe('ClientsService', () => {
  const prisma = {
    client: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    clientContact: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    clientActivity: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    clientNote: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    clientDocument: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates company-scoped clients and audits the action', async () => {
    prisma.client.findFirst.mockResolvedValue(null);
    prisma.client.create.mockResolvedValue({
      id: 'client-id',
      companyId: 'company-id',
      name: 'Acme Pvt Ltd',
      email: 'hello@acme.test',
    });

    const service = new ClientsService(prisma as never);
    const result = await service.create(
      'company-id',
      'actor-id',
      {
        type: ClientTypeDto.COMPANY,
        name: 'Acme Pvt Ltd',
        email: 'HELLO@ACME.TEST',
        phone: '9999999999',
        status: ClientStatusDto.ACTIVE,
        ownerId: 'owner-id',
      },
      '127.0.0.1',
      'jest',
    );

    expect(result.id).toBe('client-id');
    expect(prisma.client.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          companyId: 'company-id',
          name: 'Acme Pvt Ltd',
          email: 'hello@acme.test',
          phone: '9999999999',
          ownerId: 'owner-id',
          createdById: 'actor-id',
        }),
      }),
    );
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          companyId: 'company-id',
          actorId: 'actor-id',
          action: 'clients.create',
          entityType: 'Client',
          entityId: 'client-id',
        }),
      }),
    );
  });

  it('rejects duplicate clients by company-scoped email, phone, or name', async () => {
    prisma.client.findFirst.mockResolvedValue({ id: 'existing-client-id' });
    const service = new ClientsService(prisma as never);

    await expect(
      service.create('company-id', 'actor-id', {
        type: ClientTypeDto.COMPANY,
        name: 'Acme Pvt Ltd',
        email: 'hello@acme.test',
        phone: '9999999999',
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(prisma.client.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          companyId: 'company-id',
          deletedAt: null,
          OR: expect.arrayContaining([
            { email: 'hello@acme.test' },
            { phone: '9999999999' },
            { name: { equals: 'Acme Pvt Ltd', mode: 'insensitive' } },
          ]),
        }),
      }),
    );
  });

  it('lists clients with search, status, type, owner, and pagination', async () => {
    prisma.client.findMany.mockResolvedValue([{ id: 'client-id' }]);
    prisma.client.count.mockResolvedValue(1);
    const service = new ClientsService(prisma as never);

    const result = await service.findAll('company-id', {
      page: 2,
      limit: 10,
      search: 'acme',
      status: ClientStatusDto.ACTIVE,
      type: ClientTypeDto.COMPANY,
      ownerId: 'owner-id',
      sortBy: 'name',
      sortOrder: 'asc',
    });

    expect(result.meta).toEqual({
      page: 2,
      limit: 10,
      total: 1,
      totalPages: 1,
    });
    expect(prisma.client.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          companyId: 'company-id',
          deletedAt: null,
          status: 'ACTIVE',
          type: 'COMPANY',
          ownerId: 'owner-id',
        }),
        skip: 10,
        take: 10,
        orderBy: { name: 'asc' },
      }),
    );
  });

  it('changes client status and writes a dedicated audit action', async () => {
    prisma.client.findFirst.mockResolvedValue({
      id: 'client-id',
      companyId: 'company-id',
      status: 'ACTIVE',
    });
    prisma.client.update.mockResolvedValue({
      id: 'client-id',
      companyId: 'company-id',
      status: ClientStatusDto.INACTIVE,
    });
    const service = new ClientsService(prisma as never);

    const result = await service.changeStatus(
      'company-id',
      'client-id',
      'actor-id',
      {
        status: ClientStatusDto.INACTIVE,
      },
    );

    expect(result.status).toBe('INACTIVE');
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'clients.status_change',
          oldValue: expect.objectContaining({ status: 'ACTIVE' }),
          newValue: expect.objectContaining({ status: 'INACTIVE' }),
        }),
      }),
    );
  });

  it('soft deletes company-scoped clients and audits deletion', async () => {
    prisma.client.updateMany.mockResolvedValue({ count: 1 });
    const service = new ClientsService(prisma as never);

    await service.remove('company-id', 'client-id', 'actor-id');

    expect(prisma.client.updateMany).toHaveBeenCalledWith({
      where: { id: 'client-id', companyId: 'company-id', deletedAt: null },
      data: { deletedAt: expect.any(Date), updatedById: 'actor-id' },
    });
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: 'clients.delete' }),
      }),
    );
  });

  it('throws when deleting a missing scoped client', async () => {
    prisma.client.updateMany.mockResolvedValue({ count: 0 });
    const service = new ClientsService(prisma as never);

    await expect(
      service.remove('company-id', 'client-id', 'actor-id'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('adds contacts, notes, activities, and document metadata scoped through the parent client', async () => {
    prisma.client.findFirst.mockResolvedValue({
      id: 'client-id',
      companyId: 'company-id',
    });
    prisma.clientContact.create.mockResolvedValue({
      id: 'contact-id',
      clientId: 'client-id',
    });
    prisma.clientNote.create.mockResolvedValue({
      id: 'note-id',
      clientId: 'client-id',
    });
    prisma.clientActivity.create.mockResolvedValue({
      id: 'activity-id',
      clientId: 'client-id',
    });
    prisma.clientDocument.create.mockResolvedValue({
      id: 'document-id',
      clientId: 'client-id',
    });
    const service = new ClientsService(prisma as never);

    await service.addContact('company-id', 'client-id', 'actor-id', {
      name: 'Primary Contact',
      email: 'primary@acme.test',
      isPrimary: true,
    });
    await service.addNote('company-id', 'client-id', 'actor-id', {
      noteText: 'Important note',
    });
    await service.addActivity('company-id', 'client-id', 'actor-id', {
      type: ClientActivityTypeDto.FOLLOW_UP,
      title: 'Call client',
    });
    await service.addDocument('company-id', 'client-id', 'actor-id', {
      fileName: 'contract.pdf',
      storageKey: 'clients/client-id/contract.pdf',
      mimeType: 'application/pdf',
      size: 1024,
    });

    expect(prisma.clientContact.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          companyId: 'company-id',
          clientId: 'client-id',
        }),
      }),
    );
    expect(prisma.clientNote.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          companyId: 'company-id',
          clientId: 'client-id',
        }),
      }),
    );
    expect(prisma.clientActivity.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          companyId: 'company-id',
          clientId: 'client-id',
        }),
      }),
    );
    expect(prisma.clientDocument.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          companyId: 'company-id',
          clientId: 'client-id',
          fileName: 'contract.pdf',
        }),
      }),
    );
  });
});
