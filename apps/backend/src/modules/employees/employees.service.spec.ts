import { ConflictException, NotFoundException } from '@nestjs/common';
import { EmployeesService } from './employees.service';

describe('EmployeesService', () => {
  const prisma = {
    employee: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      updateMany: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates employees scoped to a company and audits the action', async () => {
    prisma.employee.findFirst.mockResolvedValue(null);
    prisma.employee.create.mockResolvedValue({
      id: 'employee-id',
      companyId: 'company-id',
    });

    const service = new EmployeesService(prisma as never);
    const result = await service.create(
      'company-id',
      'actor-id',
      {
        employeeCode: 'EMP001',
        firstName: 'Zayan',
        lastName: 'Admin',
        email: 'employee@zayan.test',
        joiningDate: '2026-06-12',
      },
      '127.0.0.1',
      'jest',
    );

    expect(result).toEqual({ id: 'employee-id', companyId: 'company-id' });
    expect(prisma.employee.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          companyId: 'company-id',
          employeeCode: 'EMP001',
        }),
      }),
    );
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'employees.create',
          companyId: 'company-id',
          actorId: 'actor-id',
        }),
      }),
    );
  });

  it('rejects duplicate employee codes within a company', async () => {
    prisma.employee.findFirst.mockResolvedValue({ id: 'existing-id' });
    const service = new EmployeesService(prisma as never);

    await expect(
      service.create('company-id', 'actor-id', {
        employeeCode: 'EMP001',
        firstName: 'Zayan',
        lastName: 'Admin',
        email: 'employee@zayan.test',
        joiningDate: '2026-06-12',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('soft deletes employees using company scope', async () => {
    prisma.employee.updateMany.mockResolvedValue({ count: 1 });
    const service = new EmployeesService(prisma as never);

    await service.remove('company-id', 'employee-id', 'actor-id');

    expect(prisma.employee.updateMany).toHaveBeenCalledWith({
      where: { id: 'employee-id', companyId: 'company-id', deletedAt: null },
      data: { deletedAt: expect.any(Date), updatedById: 'actor-id' },
    });
  });

  it('throws when scoped soft delete cannot find the employee', async () => {
    prisma.employee.updateMany.mockResolvedValue({ count: 0 });
    const service = new EmployeesService(prisma as never);

    await expect(
      service.remove('company-id', 'employee-id', 'actor-id'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
