import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PayrollService } from './payroll.service';
import {
  PayrollComponentTypeDto,
  PayrollRunStatusDto,
} from './dto/payroll.enums';

describe('PayrollService', () => {
  const prisma = {
    employee: {
      findFirst: jest.fn(),
    },
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
      findFirst: jest.fn(),
      updateMany: jest.fn(),
      update: jest.fn(),
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
      updateMany: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    attendanceRecord: {
      findMany: jest.fn(),
    },
    holiday: {
      findMany: jest.fn(),
    },
    leaveRequest: {
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
      count: jest.fn(),
      updateMany: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(() => {
    jest.resetAllMocks();
    prisma.auditLog.create.mockResolvedValue({ id: 'audit-id' });
    prisma.$transaction.mockImplementation(
      async (callback: (transaction: typeof prisma) => unknown) =>
        callback(prisma),
    );
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
    prisma.employee.findFirst.mockResolvedValue({ id: 'employee-id' });
    prisma.salaryStructure.findFirst.mockResolvedValue({ id: 'structure-id' });
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
      { date: new Date('2026-06-01T00:00:00.000Z'), status: 'PRESENT' },
      { date: new Date('2026-06-02T00:00:00.000Z'), status: 'HALF_DAY' },
      { date: new Date('2026-06-03T00:00:00.000Z'), status: 'LEAVE' },
      { date: new Date('2026-06-04T00:00:00.000Z'), status: 'ABSENT' },
    ]);
    prisma.holiday.findMany.mockResolvedValue([]);
    prisma.leaveRequest.findMany.mockResolvedValue([]);
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

  it('applies a legal payroll run status transition with a dedicated audit action', async () => {
    prisma.payrollRun.findFirst.mockResolvedValue({
      id: 'run-id',
      status: PayrollRunStatusDto.DRAFT,
    });
    prisma.payrollRun.update.mockResolvedValue({
      id: 'run-id',
      status: PayrollRunStatusDto.PROCESSING,
    });

    const service = new PayrollService(prisma as never);
    const result = await service.changePayrollRunStatus(
      'company-id',
      'run-id',
      'actor-id',
      { status: PayrollRunStatusDto.PROCESSING },
    );

    expect(result.status).toBe('PROCESSING');
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'payroll.runs.processing',
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

  it('rejects a salary assignment for an employee outside the company', async () => {
    prisma.employee.findFirst.mockResolvedValue(null);
    const service = new PayrollService(prisma as never);

    await expect(
      service.assignSalary('company-id', 'actor-id', {
        employeeId: 'foreign-employee-id',
        salaryStructureId: 'structure-id',
        effectiveFrom: '2026-08-01',
        monthlyGross: 50000,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.employeeSalaryAssignment.create).not.toHaveBeenCalled();
  });

  it('rejects a salary assignment for a structure outside the company', async () => {
    prisma.employee.findFirst.mockResolvedValue({ id: 'employee-id' });
    prisma.salaryStructure.findFirst.mockResolvedValue(null);
    const service = new PayrollService(prisma as never);

    await expect(
      service.assignSalary('company-id', 'actor-id', {
        employeeId: 'employee-id',
        salaryStructureId: 'foreign-structure-id',
        effectiveFrom: '2026-08-01',
        monthlyGross: 50000,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.employeeSalaryAssignment.create).not.toHaveBeenCalled();
  });

  it('rejects a reversed salary assignment date range', async () => {
    const service = new PayrollService(prisma as never);

    await expect(
      service.assignSalary('company-id', 'actor-id', {
        employeeId: 'employee-id',
        salaryStructureId: 'structure-id',
        effectiveFrom: '2026-09-01',
        effectiveTo: '2026-08-31',
        monthlyGross: 50000,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects overlapping active salary assignment ranges', async () => {
    prisma.employee.findFirst.mockResolvedValue({ id: 'employee-id' });
    prisma.salaryStructure.findFirst.mockResolvedValue({ id: 'structure-id' });
    prisma.employeeSalaryAssignment.findFirst.mockResolvedValue({
      id: 'existing-assignment-id',
    });
    const service = new PayrollService(prisma as never);

    await expect(
      service.assignSalary('company-id', 'actor-id', {
        employeeId: 'employee-id',
        salaryStructureId: 'structure-id',
        effectiveFrom: '2026-08-15',
        effectiveTo: '2026-09-15',
        monthlyGross: 50000,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.employeeSalaryAssignment.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          employeeId: 'employee-id',
          effectiveFrom: { lte: new Date('2026-09-15T00:00:00.000Z') },
        }),
      }),
    );
  });

  it('rejects a salary advance for an employee outside the company', async () => {
    prisma.employee.findFirst.mockResolvedValue(null);
    const service = new PayrollService(prisma as never);

    await expect(
      service.createSalaryAdvance('company-id', 'actor-id', {
        employeeId: 'foreign-employee-id',
        amount: 12000,
        installmentAmount: 2000,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.salaryAdvance.create).not.toHaveBeenCalled();
  });

  it('rejects an advance installment greater than the advance amount', async () => {
    const service = new PayrollService(prisma as never);

    await expect(
      service.createSalaryAdvance('company-id', 'actor-id', {
        employeeId: 'employee-id',
        amount: 1000,
        installmentAmount: 1200,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects an empty or duplicate-code salary structure', async () => {
    const service = new PayrollService(prisma as never);

    await expect(
      service.createSalaryStructure('company-id', 'actor-id', {
        name: 'Empty structure',
        components: [],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expect(
      service.createSalaryStructure('company-id', 'actor-id', {
        name: 'Duplicate components',
        components: [
          {
            name: 'Basic',
            code: 'basic',
            type: PayrollComponentTypeDto.EARNING,
            amount: 10000,
          },
          {
            name: 'Basic duplicate',
            code: 'BASIC',
            type: PayrollComponentTypeDto.EARNING,
            amount: 5000,
          },
        ],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects a percentage component over one hundred percent', async () => {
    const service = new PayrollService(prisma as never);

    await expect(
      service.createSalaryStructure('company-id', 'actor-id', {
        name: 'Invalid percentage',
        components: [
          {
            name: 'Allowance',
            code: 'ALLOWANCE',
            type: PayrollComponentTypeDto.EARNING,
            calculationType: 'PERCENTAGE' as never,
            amount: 101,
          },
        ],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects reversed and overlapping payroll periods', async () => {
    const service = new PayrollService(prisma as never);

    await expect(
      service.createPayrollPeriod('company-id', 'actor-id', {
        name: 'Invalid period',
        startDate: '2026-09-01',
        endDate: '2026-08-01',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    prisma.payrollPeriod.findFirst.mockResolvedValue({ id: 'overlap-id' });
    await expect(
      service.createPayrollPeriod('company-id', 'actor-id', {
        name: 'Overlapping period',
        startDate: '2026-08-15',
        endDate: '2026-09-15',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects a pay date before the payroll period ends', async () => {
    const service = new PayrollService(prisma as never);

    await expect(
      service.createPayrollPeriod('company-id', 'actor-id', {
        name: 'August 2026',
        startDate: '2026-08-01',
        endDate: '2026-08-31',
        payDate: '2026-08-25',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects payslip access for an employee outside the company', async () => {
    prisma.employee.findFirst.mockResolvedValue(null);
    const service = new PayrollService(prisma as never);

    await expect(
      service.findPayslips('company-id', 'foreign-employee-id', {
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.payslip.findMany).not.toHaveBeenCalled();
  });

  it('calculates percentage components from monthly gross and overlays paid leave and holidays', async () => {
    prisma.payrollRun.findFirst.mockResolvedValue(null);
    prisma.payrollPeriod.findFirst.mockResolvedValue({
      id: 'period-id',
      startDate: new Date('2026-08-01T00:00:00.000Z'),
      endDate: new Date('2026-08-05T00:00:00.000Z'),
    });
    prisma.employeeSalaryAssignment.findMany.mockResolvedValue([
      {
        id: 'assignment-id',
        employeeId: 'employee-id',
        salaryStructureId: 'structure-id',
        monthlyGross: 10000,
        salaryStructure: {
          components: [
            {
              name: 'Basic',
              code: 'BASIC',
              type: 'EARNING',
              calculationType: 'PERCENTAGE',
              amount: 100,
            },
            {
              name: 'Allowance',
              code: 'ALLOWANCE',
              type: 'EARNING',
              calculationType: 'FIXED',
              amount: 500,
            },
            {
              name: 'Tax',
              code: 'TAX',
              type: 'DEDUCTION',
              calculationType: 'PERCENTAGE',
              amount: 10,
            },
            {
              name: 'Fixed deduction',
              code: 'FIXED_DEDUCTION',
              type: 'DEDUCTION',
              calculationType: 'FIXED',
              amount: 100,
            },
          ],
        },
      },
    ]);
    prisma.attendanceRecord.findMany.mockResolvedValue([
      { date: new Date('2026-08-01T00:00:00.000Z'), status: 'PRESENT' },
      { date: new Date('2026-08-02T00:00:00.000Z'), status: 'HALF_DAY' },
      { date: new Date('2026-08-03T00:00:00.000Z'), status: 'ABSENT' },
    ]);
    prisma.holiday.findMany.mockResolvedValue([
      { date: new Date('2026-08-05T00:00:00.000Z') },
    ]);
    prisma.leaveRequest.findMany.mockResolvedValue([
      {
        fromDate: new Date('2026-08-04T00:00:00.000Z'),
        toDate: new Date('2026-08-04T00:00:00.000Z'),
        leaveType: { paid: true },
      },
    ]);
    prisma.salaryAdvance.findMany.mockResolvedValue([
      {
        id: 'advance-one',
        requestedAt: new Date('2026-07-01T00:00:00.000Z'),
        installmentAmount: 1000,
        balanceAmount: 600,
      },
      {
        id: 'advance-two',
        requestedAt: new Date('2026-07-02T00:00:00.000Z'),
        installmentAmount: 7000,
        balanceAmount: 7000,
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
    });
    prisma.payslip.create.mockResolvedValue({ id: 'payslip-id' });

    const service = new PayrollService(prisma as never);
    await service.createPayrollRun('company-id', 'actor-id', {
      payrollPeriodId: 'period-id',
    });

    expect(prisma.payrollEmployeeLineItem.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          workingDays: 5,
          payableDays: 3.5,
          leaveDays: 1,
          absentDays: 1.5,
          grossEarnings: 7350,
          totalDeductions: 7350,
          advanceDeduction: 6580,
          netPay: 0,
          earnings: [
            expect.objectContaining({ code: 'BASIC', amount: 7000 }),
            expect.objectContaining({ code: 'ALLOWANCE', amount: 350 }),
          ],
          deductions: expect.arrayContaining([
            expect.objectContaining({ code: 'TAX', amount: 700 }),
            expect.objectContaining({
              kind: 'ADVANCE',
              advanceId: 'advance-one',
              amount: 600,
            }),
            expect.objectContaining({
              kind: 'ADVANCE',
              advanceId: 'advance-two',
              amount: 5980,
            }),
          ]),
        }),
      }),
    );
  });

  it('records approved unpaid leave without adding a payable day', async () => {
    prisma.payrollRun.findFirst.mockResolvedValue(null);
    prisma.payrollPeriod.findFirst.mockResolvedValue({
      id: 'period-id',
      startDate: new Date('2026-08-01T00:00:00.000Z'),
      endDate: new Date('2026-08-01T00:00:00.000Z'),
    });
    prisma.employeeSalaryAssignment.findMany.mockResolvedValue([
      {
        id: 'assignment-id',
        employeeId: 'employee-id',
        salaryStructureId: 'structure-id',
        monthlyGross: 10000,
        salaryStructure: { components: [] },
      },
    ]);
    prisma.attendanceRecord.findMany.mockResolvedValue([]);
    prisma.holiday.findMany.mockResolvedValue([]);
    prisma.leaveRequest.findMany.mockResolvedValue([
      {
        fromDate: new Date('2026-08-01T00:00:00.000Z'),
        toDate: new Date('2026-08-01T00:00:00.000Z'),
        leaveType: { paid: false },
      },
    ]);
    prisma.salaryAdvance.findMany.mockResolvedValue([]);
    prisma.payrollRun.create.mockResolvedValue({ id: 'run-id' });
    prisma.payrollEmployeeLineItem.create.mockResolvedValue({ id: 'line-id' });
    prisma.payslip.create.mockResolvedValue({ id: 'payslip-id' });

    const service = new PayrollService(prisma as never);
    await service.createPayrollRun('company-id', 'actor-id', {
      payrollPeriodId: 'period-id',
    });

    expect(prisma.payrollEmployeeLineItem.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          workingDays: 1,
          payableDays: 0,
          leaveDays: 1,
          absentDays: 0,
          grossEarnings: 0,
          netPay: 0,
        }),
      }),
    );
  });

  it('writes run, employee lines, payslips, and audit through one transaction client', async () => {
    prisma.payrollRun.findFirst.mockResolvedValue(null);
    prisma.payrollPeriod.findFirst.mockResolvedValue({
      id: 'period-id',
      startDate: new Date('2026-08-01T00:00:00.000Z'),
      endDate: new Date('2026-08-01T00:00:00.000Z'),
    });
    prisma.employeeSalaryAssignment.findMany.mockResolvedValue([]);
    const tx = {
      ...prisma,
      payrollRun: {
        ...prisma.payrollRun,
        create: jest.fn().mockResolvedValue({ id: 'run-id', status: 'DRAFT' }),
      },
      auditLog: { create: jest.fn().mockResolvedValue({ id: 'audit-id' }) },
    };
    prisma.$transaction.mockImplementationOnce(
      async (callback: (transaction: typeof tx) => unknown) => callback(tx),
    );

    const service = new PayrollService(prisma as never);
    await service.createPayrollRun('company-id', 'actor-id', {
      payrollPeriodId: 'period-id',
    });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.payrollRun.create).toHaveBeenCalledTimes(1);
    expect(tx.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: 'payroll.runs.create' }),
      }),
    );
    expect(prisma.payrollRun.create).not.toHaveBeenCalled();
  });

  it('does not commit a partial run when payslip creation fails', async () => {
    prisma.payrollRun.findFirst.mockResolvedValue(null);
    prisma.payrollPeriod.findFirst.mockResolvedValue({
      id: 'period-id',
      startDate: new Date('2026-08-01T00:00:00.000Z'),
      endDate: new Date('2026-08-01T00:00:00.000Z'),
    });
    prisma.employeeSalaryAssignment.findMany.mockResolvedValue([
      {
        id: 'assignment-id',
        employeeId: 'employee-id',
        salaryStructureId: 'structure-id',
        monthlyGross: 10000,
        salaryStructure: { components: [] },
      },
    ]);
    prisma.attendanceRecord.findMany.mockResolvedValue([
      { date: new Date('2026-08-01T00:00:00.000Z'), status: 'PRESENT' },
    ]);
    prisma.holiday.findMany.mockResolvedValue([]);
    prisma.leaveRequest.findMany.mockResolvedValue([]);
    prisma.salaryAdvance.findMany.mockResolvedValue([]);

    const committed = { runs: 0, lines: 0, payslips: 0 };
    prisma.$transaction.mockImplementationOnce(async (callback: (tx: never) => unknown) => {
      const staged = { runs: 0, lines: 0, payslips: 0 };
      const tx = {
        ...prisma,
        payrollRun: {
          ...prisma.payrollRun,
          create: jest.fn().mockImplementation(async () => {
            staged.runs += 1;
            return { id: 'run-id', status: 'DRAFT' };
          }),
        },
        payrollEmployeeLineItem: {
          create: jest.fn().mockImplementation(async () => {
            staged.lines += 1;
            return { id: 'line-id', employeeId: 'employee-id' };
          }),
        },
        payslip: {
          ...prisma.payslip,
          create: jest.fn().mockRejectedValue(new Error('payslip write failed')),
        },
      };
      const result = await callback(tx as never);
      Object.assign(committed, staged);
      return result;
    });

    const service = new PayrollService(prisma as never);
    await expect(
      service.createPayrollRun('company-id', 'actor-id', {
        payrollPeriodId: 'period-id',
      }),
    ).rejects.toThrow('payslip write failed');
    expect(committed).toEqual({ runs: 0, lines: 0, payslips: 0 });
  });

  it.each([
    ['DRAFT', 'APPROVED'],
    ['DRAFT', 'PAID'],
    ['PROCESSING', 'PAID'],
    ['APPROVED', 'DRAFT'],
    ['APPROVED', 'CANCELLED'],
    ['PAID', 'PROCESSING'],
    ['PAID', 'CANCELLED'],
    ['CANCELLED', 'APPROVED'],
  ] as const)('rejects illegal payroll transition %s to %s', async (from, to) => {
    prisma.payrollRun.findFirst.mockResolvedValue({ id: 'run-id', status: from });
    const service = new PayrollService(prisma as never);

    await expect(
      service.changePayrollRunStatus('company-id', 'run-id', 'actor-id', {
        status: to as PayrollRunStatusDto,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.payrollRun.update).not.toHaveBeenCalled();
  });

  it.each([
    ['DRAFT', 'PROCESSING'],
    ['DRAFT', 'CANCELLED'],
    ['PROCESSING', 'APPROVED'],
    ['PROCESSING', 'CANCELLED'],
  ] as const)('allows legal payroll transition %s to %s', async (from, to) => {
    prisma.payrollRun.findFirst.mockResolvedValue({ id: 'run-id', status: from });
    prisma.payrollRun.update.mockResolvedValue({ id: 'run-id', status: to });
    const service = new PayrollService(prisma as never);

    const result = await service.changePayrollRunStatus(
      'company-id',
      'run-id',
      'actor-id',
      { status: to as PayrollRunStatusDto },
    );

    expect(result.status).toBe(to);
  });

  it.each(['APPROVED', 'PAID', 'CANCELLED'] as const)(
    'prevents note mutation after a run reaches %s',
    async (status) => {
      prisma.payrollRun.findFirst.mockResolvedValue({ id: 'run-id', status });
      const service = new PayrollService(prisma as never);

      await expect(
        service.updatePayrollRun('company-id', 'run-id', 'actor-id', {
          notes: 'Changed after authority',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.payrollRun.update).not.toHaveBeenCalled();
    },
  );

  it('posts planned advance recoveries and publishes payslips only when an approved run is paid', async () => {
    const approvedRun = {
      id: 'run-id',
      companyId: 'company-id',
      status: PayrollRunStatusDto.APPROVED,
      lineItems: [
        {
          employeeId: 'employee-id',
          deductions: [
            {
              kind: 'ADVANCE',
              advanceId: 'advance-one',
              amount: 600,
            },
            {
              kind: 'ADVANCE',
              advanceId: 'advance-two',
              amount: 1000,
            },
          ],
        },
      ],
    };
    prisma.payrollRun.findFirst
      .mockResolvedValueOnce(approvedRun)
      .mockResolvedValueOnce({ ...approvedRun, status: PayrollRunStatusDto.PAID });
    prisma.payrollRun.updateMany.mockResolvedValue({ count: 1 });
    prisma.salaryAdvance.findFirst
      .mockResolvedValueOnce({
        id: 'advance-one',
        employeeId: 'employee-id',
        paidAmount: 0,
        balanceAmount: 600,
        status: 'ACTIVE',
      })
      .mockResolvedValueOnce({
        id: 'advance-two',
        employeeId: 'employee-id',
        paidAmount: 500,
        balanceAmount: 3000,
        status: 'ACTIVE',
      });
    prisma.salaryAdvance.updateMany.mockResolvedValue({ count: 1 });
    prisma.payslip.updateMany.mockResolvedValue({ count: 1 });

    const service = new PayrollService(prisma as never);
    const result = await service.changePayrollRunStatus(
      'company-id',
      'run-id',
      'actor-id',
      { status: PayrollRunStatusDto.PAID },
    );

    expect(result.status).toBe(PayrollRunStatusDto.PAID);
    expect(prisma.payrollRun.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 'run-id',
          companyId: 'company-id',
          status: PayrollRunStatusDto.APPROVED,
        }),
      }),
    );
    expect(prisma.salaryAdvance.updateMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: expect.objectContaining({ id: 'advance-one', status: 'ACTIVE' }),
        data: expect.objectContaining({
          paidAmount: { increment: 600 },
          balanceAmount: { decrement: 600 },
          status: 'SETTLED',
        }),
      }),
    );
    expect(prisma.salaryAdvance.updateMany).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        data: expect.objectContaining({
          paidAmount: { increment: 1000 },
          balanceAmount: { decrement: 1000 },
          status: 'ACTIVE',
        }),
      }),
    );
    expect(prisma.payslip.updateMany).toHaveBeenCalledWith({
      where: { companyId: 'company-id', payrollRunId: 'run-id' },
      data: { status: 'PUBLISHED' },
    });
  });

  it('rejects a repeated paid transition before recovering an advance twice', async () => {
    prisma.payrollRun.findFirst.mockResolvedValue({
      id: 'run-id',
      status: PayrollRunStatusDto.PAID,
      lineItems: [],
    });
    const service = new PayrollService(prisma as never);

    await expect(
      service.changePayrollRunStatus('company-id', 'run-id', 'actor-id', {
        status: PayrollRunStatusDto.PAID,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.salaryAdvance.updateMany).not.toHaveBeenCalled();
  });

  it('rejects paid posting when a planned advance is not in the run company', async () => {
    prisma.payrollRun.findFirst.mockResolvedValue({
      id: 'run-id',
      status: PayrollRunStatusDto.APPROVED,
      lineItems: [
        {
          employeeId: 'employee-id',
          deductions: [
            {
              kind: 'ADVANCE',
              advanceId: 'foreign-advance-id',
              amount: 500,
            },
          ],
        },
      ],
    });
    prisma.payrollRun.updateMany.mockResolvedValue({ count: 1 });
    prisma.salaryAdvance.findFirst.mockResolvedValue(null);
    const service = new PayrollService(prisma as never);

    await expect(
      service.changePayrollRunStatus('company-id', 'run-id', 'actor-id', {
        status: PayrollRunStatusDto.PAID,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.salaryAdvance.updateMany).not.toHaveBeenCalled();
  });

  it('rolls back the paid transition when payslip publication fails', async () => {
    const approvedRun = {
      id: 'run-id',
      status: PayrollRunStatusDto.APPROVED,
      lineItems: [
        {
          employeeId: 'employee-id',
          deductions: [
            {
              kind: 'ADVANCE',
              advanceId: 'advance-id',
              amount: 500,
            },
          ],
        },
      ],
    };
    prisma.payrollRun.findFirst.mockResolvedValue(approvedRun);
    const committed = { runPaid: false, recovered: 0 };
    prisma.$transaction.mockImplementationOnce(async (callback: (tx: never) => unknown) => {
      const staged = { runPaid: false, recovered: 0 };
      const tx = {
        ...prisma,
        payrollRun: {
          ...prisma.payrollRun,
          updateMany: jest.fn().mockImplementation(async () => {
            staged.runPaid = true;
            return { count: 1 };
          }),
        },
        salaryAdvance: {
          ...prisma.salaryAdvance,
          findFirst: jest.fn().mockResolvedValue({
            id: 'advance-id',
            employeeId: 'employee-id',
            balanceAmount: 1000,
            status: 'ACTIVE',
          }),
          updateMany: jest.fn().mockImplementation(async () => {
            staged.recovered += 500;
            return { count: 1 };
          }),
        },
        payslip: {
          ...prisma.payslip,
          updateMany: jest.fn().mockRejectedValue(new Error('publish failed')),
        },
      };
      const result = await callback(tx as never);
      Object.assign(committed, staged);
      return result;
    });

    const service = new PayrollService(prisma as never);
    await expect(
      service.changePayrollRunStatus('company-id', 'run-id', 'actor-id', {
        status: PayrollRunStatusDto.PAID,
      }),
    ).rejects.toThrow('publish failed');
    expect(committed).toEqual({ runPaid: false, recovered: 0 });
  });

  it('rounds run aggregates after summing all employee lines', async () => {
    prisma.payrollRun.findFirst.mockResolvedValue(null);
    prisma.payrollPeriod.findFirst.mockResolvedValue({
      id: 'period-id',
      startDate: new Date('2026-08-01T00:00:00.000Z'),
      endDate: new Date('2026-08-01T00:00:00.000Z'),
    });
    prisma.employeeSalaryAssignment.findMany.mockResolvedValue([
      {
        id: 'assignment-one',
        employeeId: 'employee-one',
        salaryStructureId: 'structure-id',
        monthlyGross: 0.1,
        salaryStructure: { components: [] },
      },
      {
        id: 'assignment-two',
        employeeId: 'employee-two',
        salaryStructureId: 'structure-id',
        monthlyGross: 0.2,
        salaryStructure: { components: [] },
      },
    ]);
    prisma.attendanceRecord.findMany.mockResolvedValue([
      { date: new Date('2026-08-01T00:00:00.000Z'), status: 'PRESENT' },
    ]);
    prisma.holiday.findMany.mockResolvedValue([]);
    prisma.leaveRequest.findMany.mockResolvedValue([]);
    prisma.salaryAdvance.findMany.mockResolvedValue([]);
    prisma.payrollRun.create.mockResolvedValue({ id: 'run-id' });
    prisma.payrollEmployeeLineItem.create.mockResolvedValue({ id: 'line-id' });
    prisma.payslip.create.mockResolvedValue({ id: 'payslip-id' });

    const service = new PayrollService(prisma as never);
    await service.createPayrollRun('company-id', 'actor-id', {
      payrollPeriodId: 'period-id',
    });

    expect(prisma.payrollRun.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          totalGross: 0.3,
          totalDeductions: 0,
          totalNet: 0.3,
        }),
      }),
    );
  });
});
