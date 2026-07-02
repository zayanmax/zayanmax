import {
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
    const existing = await this.prisma.salaryStructure.findFirst({
      where: { companyId, name: dto.name, deletedAt: null },
    });
    if (existing)
      throw new ConflictException('Salary structure already exists');

    const structure = await this.prisma.salaryStructure.create({
      data: {
        companyId,
        name: dto.name,
        description: dto.description,
        createdById: actorId,
        components: {
          create: dto.components.map((component) => ({
            companyId,
            name: component.name,
            code: component.code.toUpperCase(),
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
    const existing = await this.prisma.employeeSalaryAssignment.findFirst({
      where: {
        companyId,
        employeeId: dto.employeeId,
        status: 'ACTIVE',
        deletedAt: null,
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
        effectiveFrom: this.toDateOnly(dto.effectiveFrom)!,
        effectiveTo: this.toDateOnly(dto.effectiveTo),
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
    const existing = await this.prisma.payrollPeriod.findFirst({
      where: { companyId, startDate, endDate, deletedAt: null },
    });
    if (existing) throw new ConflictException('Payroll period already exists');

    const period = await this.prisma.payrollPeriod.create({
      data: {
        companyId,
        name: dto.name,
        startDate,
        endDate,
        payDate: this.toDateOnly(dto.payDate),
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

    const totals = lines.reduce(
      (acc, line) => ({
        totalGross: acc.totalGross + Number(line.grossEarnings),
        totalDeductions: acc.totalDeductions + Number(line.totalDeductions),
        totalNet: acc.totalNet + Number(line.netPay),
      }),
      { totalGross: 0, totalDeductions: 0, totalNet: 0 },
    );

    const run = await this.prisma.payrollRun.create({
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
      const createdLine = await this.prisma.payrollEmployeeLineItem.create({
        data: {
          ...line,
          payrollRunId: run.id,
        },
      });
      await this.prisma.payslip.create({
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
    );
    return run;
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
        lineItems: { include: { employee: true, payslip: true } },
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
    });
    if (!oldValue) throw new NotFoundException('Payroll run not found');

    const now = new Date();
    const run = await this.prisma.payrollRun.update({
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
    );
    return run;
  }

  async findPayslips(
    companyId: string,
    employeeId: string,
    query: PayslipQueryDto,
  ) {
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
        include: { payrollRun: { include: { payrollPeriod: true } } },
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
      select: { employeeId: true, status: true },
    });
    const attendanceSummary = this.summarizeAttendance(attendance);
    const ratio =
      workingDays > 0 ? attendanceSummary.payableDays / workingDays : 0;
    const monthlyGross = Number(assignment.monthlyGross);
    const components = assignment.salaryStructure.components;
    const earningComponents = components.filter(
      (component) => component.type === 'EARNING',
    );
    const deductionComponents = components.filter(
      (component) => component.type === 'DEDUCTION',
    );
    const grossEarnings =
      (earningComponents.length > 0
        ? earningComponents.reduce(
            (sum, component) => sum + Number(component.amount),
            0,
          )
        : monthlyGross) * ratio;
    const structureDeductions =
      deductionComponents.reduce(
        (sum, component) => sum + Number(component.amount),
        0,
      ) * ratio;
    const advanceDeduction = await this.findAdvanceDeduction(
      companyId,
      assignment.employeeId,
    );
    const totalDeductions = structureDeductions + advanceDeduction;

    return {
      companyId,
      employeeId: assignment.employeeId,
      salaryAssignmentId: assignment.id,
      workingDays,
      payableDays: attendanceSummary.payableDays,
      leaveDays: attendanceSummary.leaveDays,
      absentDays: attendanceSummary.absentDays,
      grossEarnings: this.money(grossEarnings),
      totalDeductions: this.money(totalDeductions),
      advanceDeduction: this.money(advanceDeduction),
      netPay: this.money(grossEarnings - totalDeductions),
      earnings: earningComponents.map((component) => ({
        name: component.name,
        code: component.code,
        amount: this.money(Number(component.amount) * ratio),
      })),
      deductions: deductionComponents.map((component) => ({
        name: component.name,
        code: component.code,
        amount: this.money(Number(component.amount) * ratio),
      })),
    };
  }

  private async findAdvanceDeduction(companyId: string, employeeId: string) {
    const advances = await this.prisma.salaryAdvance.findMany({
      where: {
        companyId,
        employeeId,
        status: 'ACTIVE',
        deletedAt: null,
        balanceAmount: { gt: 0 },
      },
    });
    return advances.reduce((sum, advance) => {
      return (
        sum +
        Math.min(
          Number(advance.installmentAmount),
          Number(advance.balanceAmount),
        )
      );
    }, 0);
  }

  private summarizeAttendance(records: Array<{ status: string }>) {
    return records.reduce(
      (summary, record) => {
        if (
          ['PRESENT', 'LATE', 'WORK_FROM_HOME', 'HOLIDAY', 'LEAVE'].includes(
            record.status,
          )
        ) {
          summary.payableDays += 1;
        } else if (record.status === 'HALF_DAY') {
          summary.payableDays += 0.5;
        } else if (record.status === 'ABSENT') {
          summary.absentDays += 1;
        }

        if (record.status === 'LEAVE') summary.leaveDays += 1;
        return summary;
      },
      { payableDays: 0, leaveDays: 0, absentDays: 0 },
    );
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

  private money(value: number) {
    return Math.round(value * 100) / 100;
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
