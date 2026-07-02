import { ConflictException, NotFoundException } from '@nestjs/common';
import { PayrollService } from './payroll.service';
import {
  PayrollComponentTypeDto,
  PayrollRunStatusDto,
} from './dto/payroll.enums';

describe('PayrollService', () => {
  const prisma = {
    salaryStructure: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    employeeSalaryAssignment: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    salaryAdvance: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    payrollPeriod: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    payrollRun: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    attendanceRecord: {
      findMany: jest.fn(),
    },
    salaryStructureComponent: {
      findMany: jest.fn(),
    },
    payrollEmployeeLineItem: {
      create: jest.fn(),
    },
    payslip: {
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

  it('creates salary structures with earning and deduction components', async () => {
    prisma.salaryStructure.findFirst.mockResolvedValue(null);
    prisma.salaryStructure.create.mockResolvedValue({
      id: 'structure-id',
      companyId: 'company-id',
      name: 'Staff Salary',
      components: [],
    });

    const service = new PayrollService(prisma as never);
    const result = await service.createSalaryStructure(
      'company-id',
      'actor-id',
      {
        name: 'Staff Salary',
        description: 'Default staff structure',
        components: [
          {
            name: 'Basic',
            code: 'BASIC',
            type: PayrollComponentTypeDto.EARNING,
            amount: 30000,
          },
          {
            name: 'Professional Tax',
            code: 'PT',
            type: PayrollComponentTypeDto.DEDUCTION,
            amount: 200,
          },
        ],
      },
    );

    expect(result.id).toBe('structure-id');
    expect(prisma.salaryStructure.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          companyId: 'company-id',
          name: 'Staff Salary',
          createdById: 'actor-id',
          components: expect.objectContaining({
            create: expect.arrayContaining([
              expect.objectContaining({ code: 'BASIC', amount: 30000 }),
              expect.objectContaining({ code: 'PT', amount: 200 }),
            ]),
          }),
        }),
      }),
    );
  });

  it('creates employee salary assignments and audits the action', async () => {
    prisma.employeeSalaryAssignment.findFirst.mockResolvedValue(null);
    prisma.employeeSalaryAssignment.create.mockResolvedValue({
      id: 'assignment-id',
      companyId: 'company-id',
      employeeId: 'employee-id',
    });

    const service = new PayrollService(prisma as never);
    const result = await service.assignSalary('company-id', 'actor-id', {
      employeeId: 'employee-id',
      salaryStructureId: 'structure-id',
      effectiveFrom: '2026-06-01',
      monthlyGross: 50000,
    });

    expect(result.id).toBe('assignment-id');
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'payroll.salary_assignments.create',
          entityType: 'EmployeeSalaryAssignment',
          entityId: 'assignment-id',
        }),
      }),
    );
  });

  it('rejects duplicate payroll runs per company and period', async () => {
    prisma.payrollRun.findFirst.mockResolvedValue({ id: 'existing-run-id' });
    const service = new PayrollService(prisma as never);

    await expect(
      service.createPayrollRun('company-id', 'actor-id', {
        payrollPeriodId: 'period-id',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('creates payroll runs with attendance-based payable days and payslip metadata', async () => {
    prisma.payrollRun.findFirst.mockResolvedValue(null);
    prisma.payrollPeriod.findFirst.mockResolvedValue({
      id: 'period-id',
      startDate: new Date('2026-06-01T00:00:00.000Z'),
      endDate: new Date('2026-06-30T00:00:00.000Z'),
    });
    prisma.employeeSalaryAssignment.findMany.mockResolvedValue([
      {
        id: 'assignment-id',
        employeeId: 'employee-id',
        salaryStructureId: 'structure-id',
        monthlyGross: 30000,
        salaryStructure: {
          components: [
            {
              name: 'Basic',
              code: 'BASIC',
              type: 'EARNING',
              amount: 30000,
            },
          ],
        },
      },
    ]);
    prisma.attendanceRecord.findMany.mockResolvedValue([
      { employeeId: 'employee-id', status: 'PRESENT' },
      { employeeId: 'employee-id', status: 'HALF_DAY' },
      { employeeId: 'employee-id', status: 'LEAVE' },
      { employeeId: 'employee-id', status: 'ABSENT' },
    ]);
    prisma.salaryAdvance.findMany.mockResolvedValue([
      {
        id: 'advance-id',
        employeeId: 'employee-id',
        installmentAmount: 1000,
        balanceAmount: 2500,
      },
    ]);
    prisma.payrollRun.create.mockResolvedValue({
      id: 'run-id',
      payrollPeriodId: 'period-id',
      status: 'DRAFT',
    });
    prisma.payrollEmployeeLineItem.create.mockResolvedValue({
      id: 'line-id',
      employeeId: 'employee-id',
      netPay: 2500,
    });
    prisma.payslip.create.mockResolvedValue({ id: 'payslip-id' });

    const service = new PayrollService(prisma as never);
    const result = await service.createPayrollRun('company-id', 'actor-id', {
      payrollPeriodId: 'period-id',
    });

    expect(result.id).toBe('run-id');
    expect(prisma.payrollEmployeeLineItem.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          payableDays: 2.5,
          workingDays: 30,
          grossEarnings: 2500,
          advanceDeduction: 1000,
          netPay: 1500,
        }),
      }),
    );
    expect(prisma.payslip.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          payrollRunId: 'run-id',
          employeeId: 'employee-id',
          payrollLineItemId: 'line-id',
        }),
      }),
    );
  });

  it('applies payroll run status transitions with dedicated audit actions', async () => {
    prisma.payrollRun.findFirst.mockResolvedValue({
      id: 'run-id',
      status: PayrollRunStatusDto.DRAFT,
    });
    prisma.payrollRun.update.mockResolvedValue({
      id: 'run-id',
      status: PayrollRunStatusDto.APPROVED,
    });

    const service = new PayrollService(prisma as never);
    const result = await service.changePayrollRunStatus(
      'company-id',
      'run-id',
      'actor-id',
      { status: PayrollRunStatusDto.APPROVED },
    );

    expect(result.status).toBe('APPROVED');
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'payroll.runs.approve',
          entityType: 'PayrollRun',
          entityId: 'run-id',
        }),
      }),
    );
  });

  it('throws when approving a missing payroll run', async () => {
    prisma.payrollRun.findFirst.mockResolvedValue(null);
    const service = new PayrollService(prisma as never);

    await expect(
      service.changePayrollRunStatus('company-id', 'missing-id', 'actor-id', {
        status: PayrollRunStatusDto.APPROVED,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
