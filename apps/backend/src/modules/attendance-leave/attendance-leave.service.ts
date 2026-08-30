import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import {
  CheckInDto,
  CheckOutDto,
  ManualAttendanceDto,
} from './dto/attendance-entry.dto';
import {
  EmployeeReportQueryDto,
  AttendanceQueryDto,
  MonthlySummaryQueryDto,
} from './dto/attendance-query.dto';
import {
  AttendanceSourceDto,
  AttendanceStatusDto,
} from './dto/attendance-status.dto';
import {
  AttendanceCorrectionQueryDto,
  CreateAttendanceCorrectionDto,
  ReviewAttendanceCorrectionDto,
} from './dto/attendance-correction.dto';
import { CreateHolidayDto, HolidayQueryDto } from './dto/holiday.dto';
import {
  CreateLeaveRequestDto,
  CreateLeaveTypeDto,
  LeaveRequestQueryDto,
  ReviewLeaveRequestDto,
  UpsertLeaveBalanceDto,
} from './dto/leave.dto';
import { CreateShiftDto } from './dto/create-shift.dto';

@Injectable()
export class AttendanceLeaveService {
  constructor(private readonly prisma: PrismaService) {}

  async createShift(
    companyId: string,
    actorId: string,
    dto: CreateShiftDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const existing = await this.prisma.shift.findFirst({
      where: { companyId, name: dto.name, deletedAt: null },
    });
    if (existing) throw new ConflictException('Shift already exists');

    const shift = await this.prisma.shift.create({
      data: {
        companyId,
        name: dto.name,
        startTime: dto.startTime,
        endTime: dto.endTime,
        graceMinutes: dto.graceMinutes ?? 0,
        createdById: actorId,
      },
    });
    await this.audit(
      companyId,
      actorId,
      'attendance.shifts.create',
      'Shift',
      shift.id,
      undefined,
      shift,
      ipAddress,
      userAgent,
    );
    return shift;
  }

  async findShifts(companyId: string) {
    return this.prisma.shift.findMany({
      where: { companyId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createManualAttendance(
    companyId: string,
    actorId: string,
    dto: ManualAttendanceDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const date = this.toDateOnly(dto.date);
    await this.ensureEmployeeInCompany(companyId, dto.employeeId);
    await this.ensureShiftInCompany(companyId, dto.shiftId);
    this.ensureValidTimeRange(dto.checkInAt, dto.checkOutAt);
    await this.ensureNoDuplicateAttendance(companyId, dto.employeeId, date);
    const attendance = await this.prisma.attendanceRecord.create({
      data: {
        companyId,
        employeeId: dto.employeeId,
        shiftId: dto.shiftId,
        date,
        checkInAt: this.toDateTime(dto.checkInAt),
        checkOutAt: this.toDateTime(dto.checkOutAt),
        status: dto.status,
        source: AttendanceSourceDto.MANUAL,
        location: dto.location,
        notes: dto.notes,
        createdById: actorId,
      },
    });
    await this.audit(
      companyId,
      actorId,
      'attendance.manual_create',
      'AttendanceRecord',
      attendance.id,
      undefined,
      attendance,
      ipAddress,
      userAgent,
    );
    return attendance;
  }

  async checkIn(
    companyId: string,
    actorId: string,
    dto: CheckInDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const date = this.toDateOnly(dto.date);
    const checkInAt = this.toDateTime(dto.checkInAt) ?? new Date();
    await this.ensureEmployeeInCompany(companyId, dto.employeeId);
    await this.ensureShiftInCompany(companyId, dto.shiftId);
    const existing = await this.findAttendanceByEmployeeDate(
      companyId,
      dto.employeeId,
      date,
    );

    if (existing?.checkInAt) {
      throw new ConflictException('Attendance check-in already exists');
    }
    if (existing?.checkOutAt) {
      this.ensureValidTimeRange(checkInAt, existing.checkOutAt);
    }

    const attendance = existing
      ? await this.prisma.attendanceRecord.update({
          where: { id: existing.id },
          data: {
            shiftId: dto.shiftId,
            checkInAt,
            status: dto.status ?? AttendanceStatusDto.PRESENT,
            source: AttendanceSourceDto.SELF,
            location: dto.location,
            notes: dto.notes,
            updatedById: actorId,
          },
        })
      : await this.prisma.attendanceRecord.create({
          data: {
            companyId,
            employeeId: dto.employeeId,
            shiftId: dto.shiftId,
            date,
            checkInAt,
            status: dto.status ?? AttendanceStatusDto.PRESENT,
            source: AttendanceSourceDto.SELF,
            location: dto.location,
            notes: dto.notes,
            createdById: actorId,
          },
        });

    await this.audit(
      companyId,
      actorId,
      'attendance.check_in',
      'AttendanceRecord',
      attendance.id,
      existing,
      attendance,
      ipAddress,
      userAgent,
    );
    return attendance;
  }

  async checkOut(
    companyId: string,
    actorId: string,
    dto: CheckOutDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const date = this.toDateOnly(dto.date);
    await this.ensureEmployeeInCompany(companyId, dto.employeeId);
    const existing = await this.findAttendanceByEmployeeDate(
      companyId,
      dto.employeeId,
      date,
    );
    if (!existing) throw new NotFoundException('Attendance record not found');

    const checkOutAt = this.toDateTime(dto.checkOutAt) ?? new Date();
    this.ensureValidTimeRange(existing.checkInAt, checkOutAt);

    const attendance = await this.prisma.attendanceRecord.update({
      where: { id: existing.id },
      data: {
        checkOutAt,
        notes: dto.notes ?? existing.notes,
        updatedById: actorId,
      },
    });
    await this.audit(
      companyId,
      actorId,
      'attendance.check_out',
      'AttendanceRecord',
      attendance.id,
      existing,
      attendance,
      ipAddress,
      userAgent,
    );
    return attendance;
  }

  async findAttendance(companyId: string, query: AttendanceQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.AttendanceRecordWhereInput = {
      companyId,
      deletedAt: null,
      ...(query.employeeId ? { employeeId: query.employeeId } : {}),
      ...(query.shiftId ? { shiftId: query.shiftId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...this.dateRangeWhere(query.fromDate, query.toDate),
      ...(query.search
        ? {
            OR: [
              { notes: { contains: query.search, mode: 'insensitive' } },
              { location: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.attendanceRecord.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [query.sortBy ?? 'date']: query.sortOrder ?? 'desc' },
        include: {
          employee: {
            select: {
              id: true,
              employeeCode: true,
              firstName: true,
              lastName: true,
            },
          },
          shift: { select: { id: true, name: true } },
        },
      }),
      this.prisma.attendanceRecord.count({ where }),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async monthlySummary(companyId: string, query: MonthlySummaryQueryDto) {
    const fromDate = new Date(Date.UTC(query.year, query.month - 1, 1));
    const toDate = new Date(Date.UTC(query.year, query.month, 1));
    const records = await this.prisma.attendanceRecord.findMany({
      where: {
        companyId,
        deletedAt: null,
        date: { gte: fromDate, lt: toDate },
        ...(query.employeeId ? { employeeId: query.employeeId } : {}),
      },
      select: { status: true },
    });

    return {
      year: query.year,
      month: query.month,
      total: records.length,
      byStatus: records.reduce<Record<string, number>>((acc, record) => {
        acc[record.status] = (acc[record.status] ?? 0) + 1;
        return acc;
      }, {}),
    };
  }

  async employeeReport(
    companyId: string,
    employeeId: string,
    query: EmployeeReportQueryDto,
  ) {
    const records = await this.prisma.attendanceRecord.findMany({
      where: {
        companyId,
        employeeId,
        deletedAt: null,
        ...this.dateRangeWhere(query.fromDate, query.toDate),
      },
      orderBy: { date: 'asc' },
      include: { shift: { select: { id: true, name: true } } },
    });

    return {
      employeeId,
      total: records.length,
      byStatus: records.reduce<Record<string, number>>((acc, record) => {
        acc[record.status] = (acc[record.status] ?? 0) + 1;
        return acc;
      }, {}),
      records,
    };
  }

  async createCorrectionRequest(
    companyId: string,
    actorId: string,
    dto: CreateAttendanceCorrectionDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    await this.ensureEmployeeInCompany(companyId, dto.employeeId);
    this.ensureValidTimeRange(
      dto.requestedCheckInAt,
      dto.requestedCheckOutAt,
    );

    if (dto.attendanceRecordId) {
      const attendance = await this.findAttendanceRecordInCompany(
        companyId,
        dto.attendanceRecordId,
      );
      if (attendance.employeeId !== dto.employeeId) {
        throw new BadRequestException(
          'Attendance record does not belong to the selected employee',
        );
      }
    }

    const correction = await this.prisma.attendanceCorrectionRequest.create({
      data: {
        companyId,
        attendanceRecordId: dto.attendanceRecordId,
        employeeId: dto.employeeId,
        date: this.toDateOnly(dto.date),
        requestedCheckInAt: this.toDateTime(dto.requestedCheckInAt),
        requestedCheckOutAt: this.toDateTime(dto.requestedCheckOutAt),
        requestedStatus: dto.requestedStatus,
        reason: dto.reason,
        createdById: actorId,
      },
    });
    await this.audit(
      companyId,
      actorId,
      'attendance.corrections.create',
      'AttendanceCorrectionRequest',
      correction.id,
      undefined,
      correction,
      ipAddress,
      userAgent,
    );
    return correction;
  }

  async findCorrectionRequests(
    companyId: string,
    query: AttendanceCorrectionQueryDto,
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.AttendanceCorrectionRequestWhereInput = {
      companyId,
      ...(query.employeeId ? { employeeId: query.employeeId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...this.dateRangeWhere(query.fromDate, query.toDate),
      ...(query.search
        ? {
            OR: [
              { reason: { contains: query.search, mode: 'insensitive' } },
              {
                employee: {
                  is: {
                    OR: [
                      {
                        firstName: {
                          contains: query.search,
                          mode: 'insensitive',
                        },
                      },
                      {
                        lastName: {
                          contains: query.search,
                          mode: 'insensitive',
                        },
                      },
                      {
                        employeeCode: {
                          contains: query.search,
                          mode: 'insensitive',
                        },
                      },
                    ],
                  },
                },
              },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.attendanceCorrectionRequest.findMany({
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
          attendanceRecord: {
            select: {
              id: true,
              date: true,
              checkInAt: true,
              checkOutAt: true,
              status: true,
              source: true,
            },
          },
        },
      }),
      this.prisma.attendanceCorrectionRequest.count({ where }),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async reviewCorrectionRequest(
    companyId: string,
    id: string,
    actorId: string,
    dto: ReviewAttendanceCorrectionDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const oldValue = await this.prisma.attendanceCorrectionRequest.findFirst({
      where: { id, companyId },
    });
    if (!oldValue) {
      throw new NotFoundException('Attendance correction request not found');
    }
    if (oldValue.status !== 'PENDING') {
      throw new ConflictException(
        'Attendance correction request is not pending',
      );
    }

    let linkedAttendance:
      | Awaited<ReturnType<typeof this.findAttendanceRecordInCompany>>
      | undefined;
    if (String(dto.status) === 'APPROVED' && oldValue.attendanceRecordId) {
      linkedAttendance = await this.findAttendanceRecordInCompany(
        companyId,
        oldValue.attendanceRecordId,
      );
      if (linkedAttendance.employeeId !== oldValue.employeeId) {
        throw new BadRequestException(
          'Attendance record does not belong to the correction employee',
        );
      }
      this.ensureValidTimeRange(
        oldValue.requestedCheckInAt ?? linkedAttendance.checkInAt,
        oldValue.requestedCheckOutAt ?? linkedAttendance.checkOutAt,
      );
    }

    const correction = await this.prisma.attendanceCorrectionRequest.update({
      where: { id },
      data: {
        status: dto.status,
        reviewedById: actorId,
        reviewedAt: new Date(),
        reviewComment: dto.reviewComment,
        updatedById: actorId,
      },
    });

    if (linkedAttendance) {
      await this.prisma.attendanceRecord.update({
        where: { id: linkedAttendance.id },
        data: {
          ...(oldValue.requestedCheckInAt
            ? { checkInAt: oldValue.requestedCheckInAt }
            : {}),
          ...(oldValue.requestedCheckOutAt
            ? { checkOutAt: oldValue.requestedCheckOutAt }
            : {}),
          ...(oldValue.requestedStatus
            ? { status: oldValue.requestedStatus }
            : {}),
          updatedById: actorId,
        },
      });
    }

    await this.audit(
      companyId,
      actorId,
      'attendance.corrections.review',
      'AttendanceCorrectionRequest',
      id,
      oldValue,
      correction,
      ipAddress,
      userAgent,
    );
    return correction;
  }

  async createLeaveType(
    companyId: string,
    actorId: string,
    dto: CreateLeaveTypeDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const existing = await this.prisma.leaveType.findFirst({
      where: { companyId, code: dto.code.toUpperCase(), deletedAt: null },
    });
    if (existing) throw new ConflictException('Leave type already exists');

    const leaveType = await this.prisma.leaveType.create({
      data: {
        companyId,
        name: dto.name,
        code: dto.code.toUpperCase(),
        annualAllowance: dto.annualAllowance ?? 0,
        requiresApproval: dto.requiresApproval ?? true,
        paid: dto.paid ?? true,
        createdById: actorId,
      },
    });
    await this.audit(
      companyId,
      actorId,
      'leaves.types.create',
      'LeaveType',
      leaveType.id,
      undefined,
      leaveType,
      ipAddress,
      userAgent,
    );
    return leaveType;
  }

  async findLeaveTypes(companyId: string) {
    return this.prisma.leaveType.findMany({
      where: { companyId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async upsertLeaveBalance(
    companyId: string,
    actorId: string,
    dto: UpsertLeaveBalanceDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const existing = await this.prisma.leaveBalance.findFirst({
      where: {
        companyId,
        employeeId: dto.employeeId,
        leaveTypeId: dto.leaveTypeId,
        year: dto.year,
      },
    });
    const openingBalance = dto.openingBalance ?? 0;
    const accrued = dto.accrued ?? 0;
    const used = dto.used ?? 0;
    const remaining = openingBalance + accrued - used;

    const balance = existing
      ? await this.prisma.leaveBalance.update({
          where: { id: existing.id },
          data: {
            openingBalance,
            accrued,
            used,
            remaining,
            updatedById: actorId,
          },
        })
      : await this.prisma.leaveBalance.create({
          data: {
            companyId,
            employeeId: dto.employeeId,
            leaveTypeId: dto.leaveTypeId,
            year: dto.year,
            openingBalance,
            accrued,
            used,
            remaining,
            createdById: actorId,
          },
        });

    await this.audit(
      companyId,
      actorId,
      'leaves.balances.upsert',
      'LeaveBalance',
      balance.id,
      existing,
      balance,
      ipAddress,
      userAgent,
    );
    return balance;
  }

  async createLeaveRequest(
    companyId: string,
    actorId: string,
    dto: CreateLeaveRequestDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const leaveRequest = await this.prisma.leaveRequest.create({
      data: {
        companyId,
        employeeId: dto.employeeId,
        leaveTypeId: dto.leaveTypeId,
        fromDate: this.toDateOnly(dto.fromDate),
        toDate: this.toDateOnly(dto.toDate),
        days: dto.days,
        reason: dto.reason,
        createdById: actorId,
      },
    });
    await this.audit(
      companyId,
      actorId,
      'leaves.requests.create',
      'LeaveRequest',
      leaveRequest.id,
      undefined,
      leaveRequest,
      ipAddress,
      userAgent,
    );
    return leaveRequest;
  }

  async findLeaveRequests(companyId: string, query: LeaveRequestQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.LeaveRequestWhereInput = {
      companyId,
      deletedAt: null,
      ...(query.employeeId ? { employeeId: query.employeeId } : {}),
      ...(query.leaveTypeId ? { leaveTypeId: query.leaveTypeId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.fromDate || query.toDate
        ? {
            fromDate: {
              ...(query.fromDate
                ? { gte: this.toDateOnly(query.fromDate) }
                : {}),
              ...(query.toDate ? { lte: this.toDateOnly(query.toDate) } : {}),
            },
          }
        : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.leaveRequest.findMany({
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
          leaveType: { select: { id: true, name: true, code: true } },
        },
      }),
      this.prisma.leaveRequest.count({ where }),
    ]);
    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async reviewLeaveRequest(
    companyId: string,
    id: string,
    actorId: string,
    dto: ReviewLeaveRequestDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const oldValue = await this.prisma.leaveRequest.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!oldValue) throw new NotFoundException('Leave request not found');
    if (oldValue.status !== 'PENDING') {
      throw new ConflictException('Leave request is not pending');
    }

    const leaveRequest = await this.prisma.leaveRequest.update({
      where: { id },
      data: {
        status: dto.status,
        reviewedById: actorId,
        reviewedAt: new Date(),
        reviewComment: dto.reviewComment,
        updatedById: actorId,
      },
    });

    if (String(dto.status) === 'APPROVED') {
      await this.decrementLeaveBalance(companyId, oldValue, actorId);
    }

    await this.audit(
      companyId,
      actorId,
      'leaves.requests.review',
      'LeaveRequest',
      id,
      oldValue,
      leaveRequest,
      ipAddress,
      userAgent,
    );
    return leaveRequest;
  }

  async createHoliday(
    companyId: string,
    actorId: string,
    dto: CreateHolidayDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const date = this.toDateOnly(dto.date);
    const existing = await this.prisma.holiday.findFirst({
      where: {
        companyId,
        date,
        name: { equals: dto.name, mode: 'insensitive' },
        deletedAt: null,
      },
    });
    if (existing) throw new ConflictException('Holiday already exists');

    const holiday = await this.prisma.holiday.create({
      data: {
        companyId,
        name: dto.name,
        date,
        description: dto.description,
        recurring: dto.recurring ?? false,
        createdById: actorId,
      },
    });
    await this.audit(
      companyId,
      actorId,
      'attendance.holidays.create',
      'Holiday',
      holiday.id,
      undefined,
      holiday,
      ipAddress,
      userAgent,
    );
    return holiday;
  }

  async findHolidays(companyId: string, query: HolidayQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.HolidayWhereInput = {
      companyId,
      deletedAt: null,
      ...this.dateRangeWhere(query.fromDate, query.toDate),
      ...(query.search
        ? { name: { contains: query.search, mode: 'insensitive' } }
        : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.holiday.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [query.sortBy ?? 'date']: query.sortOrder ?? 'asc' },
      }),
      this.prisma.holiday.count({ where }),
    ]);
    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async removeHoliday(
    companyId: string,
    id: string,
    actorId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const result = await this.prisma.holiday.updateMany({
      where: { id, companyId, deletedAt: null },
      data: { deletedAt: new Date(), updatedById: actorId },
    });
    if (result.count === 0) throw new NotFoundException('Holiday not found');
    await this.audit(
      companyId,
      actorId,
      'attendance.holidays.delete',
      'Holiday',
      id,
      undefined,
      { deleted: true },
      ipAddress,
      userAgent,
    );
    return { deleted: true };
  }

  private async ensureNoDuplicateAttendance(
    companyId: string,
    employeeId: string,
    date: Date,
  ) {
    const existing = await this.findAttendanceByEmployeeDate(
      companyId,
      employeeId,
      date,
    );
    if (existing) {
      throw new ConflictException(
        'Attendance already exists for employee date',
      );
    }
  }

  private async ensureEmployeeInCompany(
    companyId: string,
    employeeId: string,
  ) {
    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, companyId, deletedAt: null },
      select: { id: true },
    });
    if (!employee) throw new NotFoundException('Employee not found');
  }

  private async ensureShiftInCompany(companyId: string, shiftId?: string) {
    if (!shiftId) return;
    const shift = await this.prisma.shift.findFirst({
      where: { id: shiftId, companyId, deletedAt: null },
      select: { id: true },
    });
    if (!shift) throw new NotFoundException('Shift not found');
  }

  private async findAttendanceRecordInCompany(
    companyId: string,
    attendanceRecordId: string,
  ) {
    const attendance = await this.prisma.attendanceRecord.findFirst({
      where: {
        id: attendanceRecordId,
        companyId,
        deletedAt: null,
      },
    });
    if (!attendance) {
      throw new NotFoundException('Attendance record not found');
    }
    return attendance;
  }

  private ensureValidTimeRange(
    checkIn?: string | Date | null,
    checkOut?: string | Date | null,
  ) {
    if (!checkIn || !checkOut) return;
    const checkInAt = checkIn instanceof Date ? checkIn : new Date(checkIn);
    const checkOutAt =
      checkOut instanceof Date ? checkOut : new Date(checkOut);
    if (checkOutAt.getTime() < checkInAt.getTime()) {
      throw new BadRequestException('Check-out cannot be before check-in');
    }
  }

  private async findAttendanceByEmployeeDate(
    companyId: string,
    employeeId: string,
    date: Date,
  ) {
    return this.prisma.attendanceRecord.findFirst({
      where: { companyId, employeeId, date, deletedAt: null },
    });
  }

  private async decrementLeaveBalance(
    companyId: string,
    leaveRequest: {
      employeeId: string;
      leaveTypeId: string;
      days: Prisma.Decimal | number;
      fromDate: Date;
    },
    actorId: string,
  ) {
    const year = leaveRequest.fromDate.getUTCFullYear();
    const balance = await this.prisma.leaveBalance.findFirst({
      where: {
        companyId,
        employeeId: leaveRequest.employeeId,
        leaveTypeId: leaveRequest.leaveTypeId,
        year,
      },
    });
    if (!balance) return;

    const days = Number(leaveRequest.days);
    const used = Number(balance.used) + days;
    const remaining = Number(balance.remaining) - days;
    await this.prisma.leaveBalance.update({
      where: { id: balance.id },
      data: { used, remaining, updatedById: actorId },
    });
  }

  private dateRangeWhere(fromDate?: string, toDate?: string) {
    if (!fromDate && !toDate) return {};
    return {
      date: {
        ...(fromDate ? { gte: this.toDateOnly(fromDate) } : {}),
        ...(toDate ? { lte: this.toDateOnly(toDate) } : {}),
      },
    };
  }

  private toDateOnly(value?: string) {
    if (!value) {
      const now = new Date();
      return new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
      );
    }
    const date = new Date(value);
    return new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
    );
  }

  private toDateTime(value?: string) {
    return value ? new Date(value) : undefined;
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
