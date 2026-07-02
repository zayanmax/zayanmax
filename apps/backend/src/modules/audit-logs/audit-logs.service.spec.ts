import { AuditLogsService } from './audit-logs.service';

describe('AuditLogsService', () => {
  it('creates audit log records with actor, entity, and request metadata', async () => {
    const prisma = {
      auditLog: {
        create: jest.fn(async ({ data }) => ({ id: 'audit-id', ...data })),
      },
    };
    const service = new AuditLogsService(prisma as never);

    const result = await service.record({
      companyId: 'company-id',
      actorId: 'actor-id',
      action: 'employees.update',
      entityType: 'Employee',
      entityId: 'employee-id',
      oldValue: { firstName: 'Old' },
      newValue: { firstName: 'New' },
      ipAddress: '127.0.0.1',
      userAgent: 'jest',
    });

    expect(result.id).toBe('audit-id');
    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: {
        companyId: 'company-id',
        actorId: 'actor-id',
        action: 'employees.update',
        entityType: 'Employee',
        entityId: 'employee-id',
        oldValue: { firstName: 'Old' },
        newValue: { firstName: 'New' },
        ipAddress: '127.0.0.1',
        userAgent: 'jest',
      },
    });
  });
});
