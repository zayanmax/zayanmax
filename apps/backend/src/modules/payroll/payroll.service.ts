import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateSalaryStructureDto } from './dto/create-salary-structure.dto';
import {
  AssignSalaryDto,
  ChangePayrollRunStatusDto,
  CreatePayrollPeriodDto,
  CreatePayrollRunDto,
  CreateSalaryAdvanceDto,
  PayslipQueryDto,
  PayrollPeriodQueryDto,
  PayrollRunQueryDto,
  SalaryAdvanceQueryDto,
  SalaryAssignmentQueryDto,
  UpdatePayrollRunDto,
} from './dto/payroll.dto';
import { PayrollRunStatusDto } from './dto/payroll.enums';
import {
  componentFullAmount,
  prorateMoney,
  roundMoney,
  sumMoney,
} from './payroll-calculation';

type PayrollPeriodRange = {
  id: string;
  startDate: Date;
  endDate: Date;
};

type SalaryAssignmentForRun = {
  id: string;
  employeeId: string;
  salaryStructureId: string;
  monthlyGross: Prisma.Decimal | number;
  salaryStructure: {
    components: Array<{
      name: string;
      code: string;
      type: string;
      calculationType: string;
      amount: Prisma.Decimal | number;
    }>;
  };
};

type ComputedPayrollLine = Omit<
  Prisma.PayrollEmployeeLineItemUncheckedCreateInput,
  'id' | 'payrollRunId' | 'createdAt' | 'updatedAt'
>;

@Injectable()
export class PayrollService {
  constructor(private readonly prisma: PrismaService) {}

  async createSalaryStructure(
    companyId: string,
    actorId: string,
    dto: CreateSalaryStructureDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const name = dto.name.trim();
    if (!name) throw new BadRequestException('Structure name is required');
    if (dto.components.length === 0) {
      throw new BadRequestException(
        'Salary structure requires at least one component',
      );
    }
    const componentCodes = new Set<string>();
    const components = dto.components.map((component) => {
      const componentName = component.name.trim();
      const code = component.code.trim().toUpperCase();
      const calculationType: 'FIXED' | 'PERCENTAGE' =
        component.calculationType ?? 'FIXED';
      const amount = Number(component.amount);
      if (!componentName || !code) {
        throw new BadRequestException('Component name and code are required');
      }
      if (!Number.isFinite(amount) || amount < 0) {
        throw new BadRequestException('Component value cannot be negative');
      }
      if (calculationType === 'PERCENTAGE' && amount > 100) {
        throw new BadRequestException(
          'Percentage component cannot exceed 100%',
        );
      }
      if (componentCodes.has(code)) {
        throw new BadRequestException(`Duplicate component code: ${code}`);
      }
      componentCodes.add(code);
      return {
        name: componentName,
        code,
        type: component.type,
        calculationType,
        amount,
        taxable: component.taxable ?? true,
      };
    });
    const existing = await this.prisma.salaryStructure.findFirst({
      where: { companyId, name, deletedAt: null },
    });
    if (existing)
      throw new ConflictException('Salary structure already exists');

    const structure = await this.prisma.salaryStructure.create({
      data: {
        companyId,
        name,
        description: dto.description,
        createdById: actorId,
        components: {
          create: components.map((component) => ({
            companyId,
            name: component.name,
            code: component.code,
            type: component.type,
            calculationType: component.calculationType ?? 'FIXED',
            amount: component.amount,
            taxable: component.taxable ?? true,
          })),
        },
      },
      include: { components: true },
    });

    await this.audit(
      companyId,
      actorId,
      'payroll.salary_structures.create',
      'SalaryStructure',
      structure.id,
      undefined,
      structure,
      ipAddress,
      userAgent,
    );
    return structure;
  }

  async findSalaryStructures(companyId: string, query: PayrollPeriodQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.SalaryStructureWhereInput = {
      companyId,
      deletedAt: null,
      ...(query.search
        ? { name: { contains: query.search, mode: 'insensitive' } }
        : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.salaryStructure.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [query.sortBy ?? 'createdAt']: query.sortOrder ?? 'desc' },
        include: { components: true },
      }),
      this.prisma.salaryStructure.count({ where }),
    ]);
    return this.paginated(data, page, limit, total);
  }

  async assignSalary(
    companyId: string,
    actorId: string,
    dto: AssignSalaryDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const effectiveFrom = this.toDateOnly(dto.effectiveFrom)!;
    const effectiveTo = this.toDateOnly(dto.effectiveTo);
    if (effectiveTo && effectiveTo < effectiveFrom) {
      throw new BadRequestException(
        'Salary assignment end date cannot precede its start date',
      );
    }
    if (!Number.isFinite(dto.monthlyGross) || dto.monthlyGross < 0) {
      throw new BadRequestException('Monthly gross cannot be negative');
    }
    await this.requireCompanyEmployee(companyId, dto.employeeId);
    await this.requireCompanySalaryStructure(companyId, dto.salaryStructureId);
    const existing = await this.prisma.employeeSalaryAssignment.findFirst({
      where: {
        companyId,
        employeeId: dto.employeeId,
        status: 'ACTIVE',
        deletedAt: null,
        ...(effectiveTo ? { effectiveFrom: { lte: effectiveTo } } : {}),
        OR: [
          { effectiveTo: null },
          { effectiveTo: { gte: effectiveFrom } },
        ],
      },
    });
    if (existing) {
      throw new ConflictException('Active salary assignment already exists');
    }

    const assignment = await this.prisma.employeeSalaryAssignment.create({
      data: {
        companyId,
        employeeId: dto.employeeId,
        salaryStructureId: dto.salaryStructureId,
        effectiveFrom,
        effectiveTo,
        monthlyGross: dto.monthlyGross,
        createdById: actorId,
      },
    });
    await this.audit(
      companyId,
      actorId,
      'payroll.salary_assignments.create',
      'EmployeeSalaryAssignment',
      assignment.id,
      undefined,
      assignment,
      ipAddress,
      userAgent,
    );
    return assignment;
  }

  async findSalaryAssignments(
    companyId: string,
    query: SalaryAssignmentQueryDto,
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.EmployeeSalaryAssignmentWhereInput = {
      companyId,
      deletedAt: null,
      ...(query.employeeId ? { employeeId: query.employeeId } : {}),
      ...(query.salaryStructureId
        ? { salaryStructureId: query.salaryStructureId }
        : {}),
      ...(query.status ? { status: query.status } : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.employeeSalaryAssignment.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [query.sortBy ?? 'createdAt']: query.sortOrder ?? 'desc' },
        include: {
          employee: {
            select: {
              id: true,
              employeeCode: true,
              firstName: true,
              lastName: true,
            },
          },
          salaryStructure: { select: { id: true, name: true } },
        },
      }),
      this.prisma.employeeSalaryAssignment.count({ where }),
    ]);
    return this.paginated(data, page, limit, total);
  }

  async createSalaryAdvance(
    companyId: string,
    actorId: string,
    dto: CreateSalaryAdvanceDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    if (
      !Number.isFinite(dto.amount) ||
      !Number.isFinite(dto.installmentAmount) ||
      dto.amount <= 0 ||
      dto.installmentAmount <= 0
    ) {
      throw new BadRequestException(
        'Advance and installment amounts must be greater than zero',
      );
    }
    if (dto.installmentAmount > dto.amount) {
      throw new BadRequestException(
        'Installment amount cannot exceed advance amount',
      );
    }
    await this.requireCompanyEmployee(companyId, dto.employeeId);
    const advance = await this.prisma.salaryAdvance.create({
      data: {
        companyId,
        employeeId: dto.employeeId,
        amount: dto.amount,
        installmentAmount: dto.installmentAmount,
        balanceAmount: dto.amount,
        approvedAt: new Date(),
        notes: dto.notes,
        createdById: actorId,
      },
    });
    await this.audit(
      companyId,
      actorId,
      'payroll.advances.create',
      'SalaryAdvance',
      advance.id,
      undefined,
      advance,
      ipAddress,
      userAgent,
    );
    return advance;
  }

  async findSalaryAdvances(companyId: string, query: SalaryAdvanceQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.SalaryAdvanceWhereInput = {
      companyId,
      deletedAt: null,
      ...(query.employeeId ? { employeeId: query.employeeId } : {}),
      ...(query.status ? { status: query.status } : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.salaryAdvance.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [query.sortBy ?? 'createdAt']: query.sortOrder ?? 'desc' },
        include: {
          employee: {
            select: {
              id: true,
              employeeCode: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      this.prisma.salaryAdvance.count({ where }),
    ]);
    return this.paginated(data, page, limit, total);
  }

  async createPayrollPeriod(
    companyId: string,
    actorId: string,
    dto: CreatePayrollPeriodDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const startDate = this.toDateOnly(dto.startDate)!;
    const endDate = this.toDateOnly(dto.endDate)!;
    const payDate = this.toDateOnly(dto.payDate);
    if (endDate < startDate) {
      throw new BadRequestException(
        'Payroll period end date cannot precede its start date',
      );
    }
    if (payDate && payDate < endDate) {
      throw new BadRequestException(
        'Payroll pay date cannot precede the period end date',
      );
    }
    const existing = await this.prisma.payrollPeriod.findFirst({
      where: {
        companyId,
        deletedAt: null,
        startDate: { lte: endDate },
        endDate: { gte: startDate },
      },
    });
    if (existing) {
      throw new ConflictException('Payroll period overlaps an existing period');
    }

    const period = await this.prisma.payrollPeriod.create({
      data: {
        companyId,
        name: dto.name,
        startDate,
        endDate,
        payDate,
        createdById: actorId,
      },
    });
    await this.audit(
      companyId,
      actorId,
      'payroll.periods.create',
      'PayrollPeriod',
      period.id,
      undefined,
      period,
      ipAddress,
      userAgent,
    );
    return period;
  }

  async findPayrollPeriods(companyId: string, query: PayrollPeriodQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.PayrollPeriodWhereInput = {
      companyId,
      deletedAt: null,
      ...(query.search
        ? { name: { contains: query.search, mode: 'insensitive' } }
        : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.payrollPeriod.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [query.sortBy ?? 'startDate']: query.sortOrder ?? 'desc' },
      }),
      this.prisma.payrollPeriod.count({ where }),
    ]);
    return this.paginated(data, page, limit, total);
  }

  async createPayrollRun(
    companyId: string,
    actorId: string,
    dto: CreatePayrollRunDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const duplicate = await this.prisma.payrollRun.findFirst({
      where: {
        companyId,
        payrollPeriodId: dto.payrollPeriodId,
        deletedAt: null,
      },
    });
    if (duplicate) {
      throw new ConflictException('Payroll run already exists for period');
    }

    const period = await this.prisma.payrollPeriod.findFirst({
      where: { id: dto.payrollPeriodId, companyId, deletedAt: null },
    });
    if (!period) throw new NotFoundException('Payroll period not found');

    const assignments = await this.prisma.employeeSalaryAssignment.findMany({
      where: {
        companyId,
        status: 'ACTIVE',
        deletedAt: null,
        effectiveFrom: { lte: period.endDate },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: period.startDate } }],
      },
      include: { salaryStructure: { include: { components: true } } },
    });

    const lines: ComputedPayrollLine[] = [];
    for (const assignment of assignments) {
      lines.push(await this.buildLineItem(companyId, period, assignment));
    }

    const totals = {
      totalGross: this.moneyNumber(
        sumMoney(lines.map((line) => Number(line.grossEarnings))),
      ),
      totalDeductions: this.moneyNumber(
        sumMoney(lines.map((line) => Number(line.totalDeductions))),
      ),
      totalNet: this.moneyNumber(
        sumMoney(lines.map((line) => Number(line.netPay))),
      ),
    };

    return this.prisma.$transaction(async (transaction) => {
      const run = await transaction.payrollRun.create({
        data: {
          companyId,
          payrollPeriodId: dto.payrollPeriodId,
          status: PayrollRunStatusDto.DRAFT,
          totalGross: totals.totalGross,
          totalDeductions: totals.totalDeductions,
          totalNet: totals.totalNet,
          notes: dto.notes,
          createdById: actorId,
        },
      });

      for (const line of lines) {
        const createdLine = await transaction.payrollEmployeeLineItem.create({
          data: {
            ...line,
            payrollRunId: run.id,
          },
        });
        await transaction.payslip.create({
          data: {
            companyId,
            payrollRunId: run.id,
            payrollLineItemId: createdLine.id,
            employeeId: line.employeeId,
            payslipNumber: `PS-${run.id.slice(0, 8)}-${line.employeeId.slice(0, 8)}`,
            metadata: {
              payrollRunId: run.id,
              employeeId: line.employeeId,
              generatedFrom: 'payroll-run',
            },
          },
        });
      }

      await this.audit(
        companyId,
        actorId,
        'payroll.runs.create',
        'PayrollRun',
        run.id,
        undefined,
        run,
        ipAddress,
        userAgent,
        transaction,
      );
      return run;
    });
  }

  async findPayrollRuns(companyId: string, query: PayrollRunQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.PayrollRunWhereInput = {
      companyId,
      deletedAt: null,
      ...(query.payrollPeriodId
        ? { payrollPeriodId: query.payrollPeriodId }
        : {}),
      ...(query.status ? { status: query.status } : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.payrollRun.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [query.sortBy ?? 'createdAt']: query.sortOrder ?? 'desc' },
        include: {
          payrollPeriod: true,
          _count: { select: { lineItems: true } },
        },
      }),
      this.prisma.payrollRun.count({ where }),
    ]);
    return this.paginated(data, page, limit, total);
  }

  async findPayrollRun(companyId: string, id: string) {
    const run = await this.prisma.payrollRun.findFirst({
      where: { id, companyId, deletedAt: null },
      include: {
        payrollPeriod: true,
        lineItems: {
          include: {
            employee: true,
            payslip: true,
            salaryAssignment: { include: { salaryStructure: true } },
          },
        },
      },
    });
    if (!run) throw new NotFoundException('Payroll run not found');
    return run;
  }

  async updatePayrollRun(
    companyId: string,
    id: string,
    actorId: string,
    dto: UpdatePayrollRunDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const oldValue = await this.findPayrollRun(companyId, id);
    if (!['DRAFT', 'PROCESSING'].includes(oldValue.status)) {
      throw new ConflictException(
        `Payroll run notes cannot be changed while status is ${oldValue.status}`,
      );
    }
    const run = await this.prisma.payrollRun.update({
      where: { id },
      data: { notes: dto.notes, updatedById: actorId },
    });
    await this.audit(
      companyId,
      actorId,
      'payroll.runs.update',
      'PayrollRun',
      id,
      oldValue,
      run,
      ipAddress,
      userAgent,
    );
    return run;
  }

  async changePayrollRunStatus(
    companyId: string,
    id: string,
    actorId: string,
    dto: ChangePayrollRunStatusDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const oldValue = await this.prisma.payrollRun.findFirst({
      where: { id, companyId, deletedAt: null },
      include: {
        lineItems: { select: { employeeId: true, deductions: true } },
      },
    });
    if (!oldValue) throw new NotFoundException('Payroll run not found');

    const legalTransitions: Record<PayrollRunStatusDto, PayrollRunStatusDto[]> = {
      DRAFT: [PayrollRunStatusDto.PROCESSING, PayrollRunStatusDto.CANCELLED],
      PROCESSING: [
        PayrollRunStatusDto.APPROVED,
        PayrollRunStatusDto.CANCELLED,
      ],
      APPROVED: [PayrollRunStatusDto.PAID],
      PAID: [],
      CANCELLED: [],
    };
    if (!legalTransitions[oldValue.status].includes(dto.status)) {
      throw new ConflictException(
        `Payroll run cannot transition from ${oldValue.status} to ${dto.status}`,
      );
    }

    if (dto.status === PayrollRunStatusDto.PAID) {
      return this.postPaidRun(
        companyId,
        actorId,
        oldValue,
        ipAddress,
        userAgent,
      );
    }

    const now = new Date();
    return this.prisma.$transaction(async (transaction) => {
      const run = await transaction.payrollRun.update({
        where: { id },
        data: {
          status: dto.status,
          processedAt:
            dto.status === PayrollRunStatusDto.PROCESSING ? now : undefined,
          approvedAt:
            dto.status === PayrollRunStatusDto.APPROVED ? now : undefined,
          paidAt: dto.status === PayrollRunStatusDto.PAID ? now : undefined,
          cancelledAt:
            dto.status === PayrollRunStatusDto.CANCELLED ? now : undefined,
          updatedById: actorId,
        },
      });

      await this.audit(
        companyId,
        actorId,
        this.statusAuditAction(dto.status),
        'PayrollRun',
        id,
        oldValue,
        run,
        ipAddress,
        userAgent,
        transaction,
      );
      return run;
    });
  }

  async findPayslips(
    companyId: string,
    employeeId: string,
    query: PayslipQueryDto,
  ) {
    await this.requireCompanyEmployee(companyId, employeeId);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.PayslipWhereInput = {
      companyId,
      employeeId,
      ...(query.payrollRunId ? { payrollRunId: query.payrollRunId } : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.payslip.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [query.sortBy ?? 'generatedAt']: query.sortOrder ?? 'desc' },
        include: {
          payrollRun: { include: { payrollPeriod: true } },
          payrollLineItem: true,
        },
      }),
      this.prisma.payslip.count({ where }),
    ]);
    return this.paginated(data, page, limit, total);
  }

  private async buildLineItem(
    companyId: string,
    period: PayrollPeriodRange,
    assignment: SalaryAssignmentForRun,
  ) {
    const workingDays = this.daysInclusive(period.startDate, period.endDate);
    const attendance = await this.prisma.attendanceRecord.findMany({
      where: {
        companyId,
        employeeId: assignment.employeeId,
        deletedAt: null,
        date: { gte: period.startDate, lte: period.endDate },
      },
      select: { date: true, status: true },
    });
    const [holidays, leaveRequests] = await Promise.all([
      this.prisma.holiday.findMany({
        where: {
          companyId,
          status: 'ACTIVE',
          deletedAt: null,
          date: { gte: period.startDate, lte: period.endDate },
        },
        select: { date: true },
      }),
      this.prisma.leaveRequest.findMany({
        where: {
          companyId,
          employeeId: assignment.employeeId,
          status: 'APPROVED',
          deletedAt: null,
          fromDate: { lte: period.endDate },
          toDate: { gte: period.startDate },
        },
        select: {
          fromDate: true,
          toDate: true,
          leaveType: { select: { paid: true } },
        },
      }),
    ]);
    const attendanceSummary = this.summarizePayableDays(
      period,
      attendance,
      holidays,
      leaveRequests,
    );
    const monthlyGross = assignment.monthlyGross;
    const components = assignment.salaryStructure.components;
    const earningComponents = components.filter(
      (component) => component.type === 'EARNING',
    );
    const deductionComponents = components.filter(
      (component) => component.type === 'DEDUCTION',
    );
    const earnings = earningComponents.map((component) => {
      const amount = prorateMoney(
        componentFullAmount(monthlyGross, {
          calculationType:
            component.calculationType === 'PERCENTAGE'
              ? 'PERCENTAGE'
              : 'FIXED',
          amount: component.amount,
        }),
        attendanceSummary.payableDays,
        workingDays,
      );
      return {
        kind: 'STRUCTURE',
        name: component.name,
        code: component.code,
        calculationType: component.calculationType,
        configuredValue: Number(component.amount),
        amount: this.moneyNumber(amount),
      };
    });
    const grossEarnings =
      earnings.length > 0
        ? sumMoney(earnings.map((component) => component.amount))
        : prorateMoney(
            monthlyGross,
            attendanceSummary.payableDays,
            workingDays,
          );
    const structureDeductions = deductionComponents.map((component) => {
      const amount = prorateMoney(
        componentFullAmount(monthlyGross, {
          calculationType:
            component.calculationType === 'PERCENTAGE'
              ? 'PERCENTAGE'
              : 'FIXED',
          amount: component.amount,
        }),
        attendanceSummary.payableDays,
        workingDays,
      );
      return {
        kind: 'STRUCTURE',
        name: component.name,
        code: component.code,
        calculationType: component.calculationType,
        configuredValue: Number(component.amount),
        amount: this.moneyNumber(amount),
      };
    });
    const structureDeductionTotal = sumMoney(
      structureDeductions.map((component) => component.amount),
    );
    const availableForAdvances = grossEarnings.minus(structureDeductionTotal);
    if (availableForAdvances.isNegative()) {
      throw new BadRequestException(
        `Payroll deductions exceed gross earnings for employee ${assignment.employeeId}`,
      );
    }
    const advanceDeductions = await this.findAdvanceDeductions(
      companyId,
      assignment.employeeId,
      availableForAdvances,
    );
    const advanceDeduction = sumMoney(
      advanceDeductions.map((deduction) => deduction.amount),
    );
    const totalDeductions = sumMoney([
      structureDeductionTotal,
      advanceDeduction,
    ]);
    const netPay = roundMoney(grossEarnings.minus(totalDeductions));

    return {
      companyId,
      employeeId: assignment.employeeId,
      salaryAssignmentId: assignment.id,
      workingDays,
      payableDays: attendanceSummary.payableDays,
      leaveDays: attendanceSummary.leaveDays,
      absentDays: attendanceSummary.absentDays,
      grossEarnings: this.moneyNumber(grossEarnings),
      totalDeductions: this.moneyNumber(totalDeductions),
      advanceDeduction: this.moneyNumber(advanceDeduction),
      netPay: this.moneyNumber(netPay),
      earnings,
      deductions: [...structureDeductions, ...advanceDeductions],
    };
  }

  private async findAdvanceDeductions(
    companyId: string,
    employeeId: string,
    availableAmount: Prisma.Decimal,
  ) {
    const advances = await this.prisma.salaryAdvance.findMany({
      where: {
        companyId,
        employeeId,
        status: 'ACTIVE',
        deletedAt: null,
        balanceAmount: { gt: 0 },
      },
      orderBy: [{ requestedAt: 'asc' }, { id: 'asc' }],
    });
    let remainingAvailable = roundMoney(availableAmount);
    const deductions: Array<{
      kind: 'ADVANCE';
      name: string;
      code: string;
      advanceId: string;
      amount: number;
    }> = [];
    for (const advance of advances) {
      if (remainingAvailable.lte(0)) break;
      const installment = Prisma.Decimal.min(
        new Prisma.Decimal(advance.installmentAmount),
        new Prisma.Decimal(advance.balanceAmount),
        remainingAvailable,
      );
      const amount = roundMoney(installment);
      if (amount.lte(0)) continue;
      deductions.push({
        kind: 'ADVANCE',
        name: 'Salary advance',
        code: 'ADVANCE',
        advanceId: advance.id,
        amount: this.moneyNumber(amount),
      });
      remainingAvailable = roundMoney(remainingAvailable.minus(amount));
    }
    return deductions;
  }

  private summarizePayableDays(
    period: PayrollPeriodRange,
    attendance: Array<{ date: Date; status: string }>,
    holidays: Array<{ date: Date }>,
    leaveRequests: Array<{
      fromDate: Date;
      toDate: Date;
      leaveType: { paid: boolean };
    }>,
  ) {
    const attendanceByDay = new Map(
      attendance.map((record) => [this.dateKey(record.date), record.status]),
    );
    const holidayDays = new Set(
      holidays.map((holiday) => this.dateKey(holiday.date)),
    );
    const leaveByDay = new Map<string, boolean>();
    for (const request of leaveRequests) {
      const start = request.fromDate < period.startDate
        ? period.startDate
        : request.fromDate;
      const end = request.toDate > period.endDate
        ? period.endDate
        : request.toDate;
      for (let date = new Date(start); date <= end; date = this.addUtcDay(date)) {
        leaveByDay.set(this.dateKey(date), request.leaveType.paid);
      }
    }

    const summary = { payableDays: 0, leaveDays: 0, absentDays: 0 };
    for (
      let date = new Date(period.startDate);
      date <= period.endDate;
      date = this.addUtcDay(date)
    ) {
      const key = this.dateKey(date);
      if (leaveByDay.has(key)) {
        summary.leaveDays += 1;
        if (leaveByDay.get(key)) summary.payableDays += 1;
        continue;
      }
      if (holidayDays.has(key)) {
        summary.payableDays += 1;
        continue;
      }
      const status = attendanceByDay.get(key);
      if (['PRESENT', 'LATE', 'WORK_FROM_HOME', 'HOLIDAY', 'LEAVE'].includes(status ?? '')) {
        summary.payableDays += 1;
        if (status === 'LEAVE') summary.leaveDays += 1;
      } else if (status === 'HALF_DAY') {
        summary.payableDays += 0.5;
        summary.absentDays += 0.5;
      } else {
        summary.absentDays += 1;
      }
    }
    return summary;
  }

  private statusAuditAction(status: PayrollRunStatusDto) {
    const map: Record<PayrollRunStatusDto, string> = {
      DRAFT: 'payroll.runs.update',
      PROCESSING: 'payroll.runs.processing',
      APPROVED: 'payroll.runs.approve',
      PAID: 'payroll.runs.pay',
      CANCELLED: 'payroll.runs.cancel',
    };
    return map[status];
  }

  private async postPaidRun(
    companyId: string,
    actorId: string,
    oldValue: {
      id: string;
      status: string;
      lineItems: Array<{
        employeeId: string;
        deductions: Prisma.JsonValue | null;
      }>;
    },
    ipAddress?: string,
    userAgent?: string,
  ) {
    const recoveries = this.plannedAdvanceRecoveries(oldValue.lineItems);
    const paidAt = new Date();
    return this.prisma.$transaction(async (transaction) => {
      const claimed = await transaction.payrollRun.updateMany({
        where: {
          id: oldValue.id,
          companyId,
          status: PayrollRunStatusDto.APPROVED,
          deletedAt: null,
        },
        data: {
          status: PayrollRunStatusDto.PAID,
          paidAt,
          updatedById: actorId,
        },
      });
      if (claimed.count !== 1) {
        throw new ConflictException(
          'Payroll run is no longer eligible to be marked paid',
        );
      }

      for (const recovery of recoveries) {
        const advance = await transaction.salaryAdvance.findFirst({
          where: {
            id: recovery.advanceId,
            companyId,
            employeeId: recovery.employeeId,
            status: 'ACTIVE',
            deletedAt: null,
          },
          select: { id: true, balanceAmount: true },
        });
        if (!advance) {
          throw new ConflictException(
            `Salary advance ${recovery.advanceId} is not eligible for recovery`,
          );
        }
        const amount = roundMoney(recovery.amount);
        const balance = roundMoney(advance.balanceAmount);
        if (amount.gt(balance)) {
          throw new ConflictException(
            `Salary advance ${recovery.advanceId} has insufficient remaining balance`,
          );
        }
        const nextBalance = roundMoney(balance.minus(amount));
        const updated = await transaction.salaryAdvance.updateMany({
          where: {
            id: recovery.advanceId,
            companyId,
            employeeId: recovery.employeeId,
            status: 'ACTIVE',
            balanceAmount: { gte: this.moneyNumber(amount) },
            deletedAt: null,
          },
          data: {
            paidAmount: { increment: this.moneyNumber(amount) },
            balanceAmount: { decrement: this.moneyNumber(amount) },
            status: nextBalance.isZero() ? 'SETTLED' : 'ACTIVE',
            updatedById: actorId,
          },
        });
        if (updated.count !== 1) {
          throw new ConflictException(
            `Salary advance ${recovery.advanceId} changed before recovery`,
          );
        }
      }

      await transaction.payslip.updateMany({
        where: { companyId, payrollRunId: oldValue.id },
        data: { status: 'PUBLISHED' },
      });
      const run = await transaction.payrollRun.findFirst({
        where: { id: oldValue.id, companyId, deletedAt: null },
        include: {
          payrollPeriod: true,
          lineItems: {
            include: {
              employee: true,
              payslip: true,
              salaryAssignment: {
                include: { salaryStructure: true },
              },
            },
          },
        },
      });
      if (!run) throw new NotFoundException('Payroll run not found');

      await this.audit(
        companyId,
        actorId,
        'payroll.runs.pay',
        'PayrollRun',
        oldValue.id,
        oldValue,
        run,
        ipAddress,
        userAgent,
        transaction,
      );
      return run;
    });
  }

  private plannedAdvanceRecoveries(
    lineItems: Array<{
      employeeId: string;
      deductions: Prisma.JsonValue | null;
    }>,
  ) {
    const recoveries = new Map<
      string,
      { advanceId: string; employeeId: string; amount: Prisma.Decimal }
    >();
    for (const line of lineItems) {
      if (!Array.isArray(line.deductions)) continue;
      for (const rawDeduction of line.deductions) {
        if (
          !rawDeduction ||
          typeof rawDeduction !== 'object' ||
          Array.isArray(rawDeduction)
        ) {
          continue;
        }
        const deduction = rawDeduction as Record<string, unknown>;
        if (
          deduction.kind !== 'ADVANCE' ||
          typeof deduction.advanceId !== 'string' ||
          (typeof deduction.amount !== 'number' &&
            typeof deduction.amount !== 'string')
        ) {
          continue;
        }
        const amount = roundMoney(deduction.amount);
        if (amount.lte(0)) continue;
        const existing = recoveries.get(deduction.advanceId);
        if (existing && existing.employeeId !== line.employeeId) {
          throw new ConflictException(
            `Salary advance ${deduction.advanceId} is linked to multiple employees`,
          );
        }
        recoveries.set(deduction.advanceId, {
          advanceId: deduction.advanceId,
          employeeId: line.employeeId,
          amount: existing ? roundMoney(existing.amount.plus(amount)) : amount,
        });
      }
    }
    return [...recoveries.values()];
  }

  private daysInclusive(startDate: Date, endDate: Date) {
    const ms = endDate.getTime() - startDate.getTime();
    return Math.floor(ms / 86_400_000) + 1;
  }

  private toDateOnly(value?: string) {
    if (!value) return undefined;
    const date = new Date(value);
    return new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
    );
  }

  private moneyNumber(value: Prisma.Decimal | number | string) {
    return Number(roundMoney(value).toFixed(2));
  }

  private dateKey(value: Date) {
    return value.toISOString().slice(0, 10);
  }

  private addUtcDay(value: Date) {
    return new Date(value.getTime() + 86_400_000);
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
    client: Pick<Prisma.TransactionClient, 'auditLog'> = this.prisma,
  ) {
    await client.auditLog.create({
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

  private async requireCompanyEmployee(companyId: string, employeeId: string) {
    const employee = await this.prisma.employee.findFirst({
      where: {
        id: employeeId,
        companyId,
        status: 'ACTIVE',
        deletedAt: null,
      },
      select: { id: true },
    });
    if (!employee) throw new NotFoundException('Employee not found');
    return employee;
  }

  private async requireCompanySalaryStructure(
    companyId: string,
    salaryStructureId: string,
  ) {
    const structure = await this.prisma.salaryStructure.findFirst({
      where: {
        id: salaryStructureId,
        companyId,
        status: 'ACTIVE',
        deletedAt: null,
      },
      select: { id: true },
    });
    if (!structure) throw new NotFoundException('Salary structure not found');
    return structure;
  }
}
