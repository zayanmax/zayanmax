import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { AttendanceLeaveService } from './attendance-leave.service';
import { AttendanceCorrectionStatusDto } from './dto/attendance-correction.dto';
import { AttendanceStatusDto } from './dto/attendance-status.dto';
import { LeaveRequestStatusDto } from './dto/leave-request-status.dto';

describe('AttendanceLeaveService', () => {
  const prisma = {
    $transaction: jest.fn(),
    employee: {
      findFirst: jest.fn(),
    },
    shift: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    attendanceRecord: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    attendanceCorrectionRequest: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    leaveType: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
    },
    leaveBalance: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    leaveRequest: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    holiday: {
      findFirst: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.resetAllMocks();
    prisma.$transaction.mockImplementation(
      async (callback: (transaction: typeof prisma) => Promise<unknown>) =>
        callback(prisma),
    );
    prisma.employee.findFirst.mockResolvedValue({ id: 'employee-id' });
    prisma.shift.findFirst.mockResolvedValue({ id: 'shift-id' });
    prisma.leaveType.findFirst.mockResolvedValue({
      id: 'leave-type-id',
      companyId: 'company-id',
      annualAllowance: 12,
      requiresApproval: true,
      paid: true,
      status: 'ACTIVE',
    });
  });

  it('creates company-scoped shifts and audits the action', async () => {
    prisma.shift.findFirst.mockResolvedValue(null);
    prisma.shift.create.mockResolvedValue({
      id: 'shift-id',
      companyId: 'company-id',
      name: 'General',
    });

    const service = new AttendanceLeaveService(prisma as never);
    const result = await service.createShift('company-id', 'actor-id', {
      name: 'General',
      startTime: '09:30',
      endTime: '18:30',
      graceMinutes: 10,
    });

    expect(result.id).toBe('shift-id');
    expect(prisma.shift.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          companyId: 'company-id',
          name: 'General',
          createdById: 'actor-id',
        }),
      }),
    );
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'attendance.shifts.create',
          entityType: 'Shift',
          entityId: 'shift-id',
        }),
      }),
    );
  });

  it('rejects duplicate attendance per employee and date', async () => {
    prisma.attendanceRecord.findFirst.mockResolvedValue({
      id: 'attendance-id',
    });
    const service = new AttendanceLeaveService(prisma as never);

    await expect(
      service.createManualAttendance('company-id', 'actor-id', {
        employeeId: 'employee-id',
        date: '2026-06-12',
        status: AttendanceStatusDto.PRESENT,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects a cross-company employee during manual attendance creation', async () => {
    prisma.employee.findFirst.mockResolvedValue(null);
    const service = new AttendanceLeaveService(prisma as never);

    await expect(
      service.createManualAttendance('company-id', 'actor-id', {
        employeeId: 'foreign-employee-id',
        date: '2026-06-12',
        status: AttendanceStatusDto.PRESENT,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(prisma.employee.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'foreign-employee-id',
        companyId: 'company-id',
        deletedAt: null,
      },
      select: { id: true },
    });
    expect(prisma.attendanceRecord.create).not.toHaveBeenCalled();
  });

  it('rejects a cross-company shift during manual attendance creation', async () => {
    prisma.shift.findFirst.mockResolvedValue(null);
    const service = new AttendanceLeaveService(prisma as never);

    await expect(
      service.createManualAttendance('company-id', 'actor-id', {
        employeeId: 'employee-id',
        shiftId: 'foreign-shift-id',
        date: '2026-06-12',
        status: AttendanceStatusDto.PRESENT,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(prisma.shift.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'foreign-shift-id',
        companyId: 'company-id',
        deletedAt: null,
      },
      select: { id: true },
    });
    expect(prisma.attendanceRecord.create).not.toHaveBeenCalled();
  });

  it('rejects cross-company employees during check-in and check-out', async () => {
    prisma.employee.findFirst.mockResolvedValue(null);
    const service = new AttendanceLeaveService(prisma as never);

    await expect(
      service.checkIn('company-id', 'actor-id', {
        employeeId: 'foreign-employee-id',
        date: '2026-06-12',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(
      service.checkOut('company-id', 'actor-id', {
        employeeId: 'foreign-employee-id',
        date: '2026-06-12',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(prisma.attendanceRecord.create).not.toHaveBeenCalled();
    expect(prisma.attendanceRecord.update).not.toHaveBeenCalled();
  });

  it('creates check-in records and updates check-out records', async () => {
    prisma.attendanceRecord.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 'attendance-id',
        companyId: 'company-id',
        employeeId: 'employee-id',
        checkInAt: new Date('2026-06-12T09:25:00.000Z'),
      });
    prisma.attendanceRecord.create.mockResolvedValue({
      id: 'attendance-id',
      employeeId: 'employee-id',
      checkInAt: new Date('2026-06-12T09:25:00.000Z'),
    });
    prisma.attendanceRecord.update.mockResolvedValue({
      id: 'attendance-id',
      employeeId: 'employee-id',
      checkOutAt: new Date('2026-06-12T18:30:00.000Z'),
    });

    const service = new AttendanceLeaveService(prisma as never);
    await service.checkIn('company-id', 'actor-id', {
      employeeId: 'employee-id',
      date: '2026-06-12',
      checkInAt: '2026-06-12T09:25:00.000Z',
    });
    const checkedOut = await service.checkOut('company-id', 'actor-id', {
      employeeId: 'employee-id',
      date: '2026-06-12',
      checkOutAt: '2026-06-12T18:30:00.000Z',
    });

    expect(checkedOut.checkOutAt).toEqual(new Date('2026-06-12T18:30:00.000Z'));
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: 'attendance.check_out' }),
      }),
    );
  });

  it('rejects checkout before the stored check-in time', async () => {
    prisma.attendanceRecord.findFirst.mockResolvedValue({
      id: 'attendance-id',
      companyId: 'company-id',
      employeeId: 'employee-id',
      checkInAt: new Date('2026-06-12T09:30:00.000Z'),
    });
    const service = new AttendanceLeaveService(prisma as never);

    await expect(
      service.checkOut('company-id', 'actor-id', {
        employeeId: 'employee-id',
        date: '2026-06-12',
        checkOutAt: '2026-06-12T08:30:00.000Z',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.attendanceRecord.update).not.toHaveBeenCalled();
  });

  it('returns monthly attendance summary by status', async () => {
    prisma.attendanceRecord.findMany.mockResolvedValue([
      { status: 'PRESENT' },
      { status: 'PRESENT' },
      { status: 'LATE' },
    ]);
    const service = new AttendanceLeaveService(prisma as never);

    const result = await service.monthlySummary('company-id', {
      year: 2026,
      month: 6,
    });

    expect(result).toEqual({
      year: 2026,
      month: 6,
      total: 3,
      byStatus: { PRESENT: 2, LATE: 1 },
    });
  });

  it('rejects a cross-company attendance record in a correction request', async () => {
    prisma.attendanceRecord.findFirst.mockResolvedValue(null);
    const service = new AttendanceLeaveService(prisma as never);

    await expect(
      service.createCorrectionRequest('company-id', 'actor-id', {
        attendanceRecordId: 'foreign-attendance-id',
        employeeId: 'employee-id',
        date: '2026-06-12',
        reason: 'Check-in was recorded incorrectly',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(prisma.attendanceRecord.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'foreign-attendance-id',
        companyId: 'company-id',
        deletedAt: null,
      },
    });
    expect(prisma.attendanceCorrectionRequest.create).not.toHaveBeenCalled();
  });

  it('rejects a cross-company employee during correction creation', async () => {
    prisma.employee.findFirst.mockResolvedValue(null);
    const service = new AttendanceLeaveService(prisma as never);

    await expect(
      service.createCorrectionRequest('company-id', 'actor-id', {
        employeeId: 'foreign-employee-id',
        date: '2026-06-12',
        reason: 'Correction for an inaccessible employee',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(prisma.attendanceCorrectionRequest.create).not.toHaveBeenCalled();
  });

  it('rejects a correction when the linked record belongs to another employee', async () => {
    prisma.attendanceRecord.findFirst.mockResolvedValue({
      id: 'attendance-id',
      companyId: 'company-id',
      employeeId: 'other-employee-id',
    });
    const service = new AttendanceLeaveService(prisma as never);

    await expect(
      service.createCorrectionRequest('company-id', 'actor-id', {
        attendanceRecordId: 'attendance-id',
        employeeId: 'employee-id',
        date: '2026-06-12',
        reason: 'Wrong employee record',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.attendanceCorrectionRequest.create).not.toHaveBeenCalled();
  });

  it('rejects a correction with checkout before check-in', async () => {
    const service = new AttendanceLeaveService(prisma as never);

    await expect(
      service.createCorrectionRequest('company-id', 'actor-id', {
        employeeId: 'employee-id',
        date: '2026-06-12',
        requestedCheckInAt: '2026-06-12T12:00:00.000Z',
        requestedCheckOutAt: '2026-06-12T10:00:00.000Z',
        reason: 'Correct the recorded times',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.attendanceCorrectionRequest.create).not.toHaveBeenCalled();
  });

  it('returns only company corrections filtered by employee', async () => {
    const correction = {
      id: 'correction-id',
      companyId: 'company-id',
      employeeId: 'employee-id',
      status: 'PENDING',
    };
    prisma.attendanceCorrectionRequest.findMany.mockResolvedValue([correction]);
    prisma.attendanceCorrectionRequest.count.mockResolvedValue(1);
    const service = new AttendanceLeaveService(prisma as never);

    const result = await service.findCorrectionRequests('company-id', {
      page: 1,
      limit: 20,
      employeeId: 'employee-id',
    });

    expect(result).toEqual({
      data: [correction],
      meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });
    expect(prisma.attendanceCorrectionRequest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          companyId: 'company-id',
          employeeId: 'employee-id',
        }),
      }),
    );
  });

  it('filters correction requests by status and attendance date', async () => {
    prisma.attendanceCorrectionRequest.findMany.mockResolvedValue([]);
    prisma.attendanceCorrectionRequest.count.mockResolvedValue(0);
    const service = new AttendanceLeaveService(prisma as never);

    await service.findCorrectionRequests('company-id', {
      status: AttendanceCorrectionStatusDto.REJECTED,
      fromDate: '2026-06-01',
      toDate: '2026-06-30',
    });

    expect(prisma.attendanceCorrectionRequest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          companyId: 'company-id',
          status: AttendanceCorrectionStatusDto.REJECTED,
          date: {
            gte: new Date('2026-06-01T00:00:00.000Z'),
            lte: new Date('2026-06-30T00:00:00.000Z'),
          },
        },
      }),
    );
  });

  it('approves a pending correction and applies requested attendance changes', async () => {
    const requestedCheckInAt = new Date('2026-06-12T09:00:00.000Z');
    const requestedCheckOutAt = new Date('2026-06-12T18:00:00.000Z');
    prisma.attendanceCorrectionRequest.findFirst.mockResolvedValue({
      id: 'correction-id',
      companyId: 'company-id',
      attendanceRecordId: 'attendance-id',
      employeeId: 'employee-id',
      status: AttendanceCorrectionStatusDto.PENDING,
      requestedCheckInAt,
      requestedCheckOutAt,
      requestedStatus: AttendanceStatusDto.PRESENT,
    });
    prisma.attendanceRecord.findFirst.mockResolvedValue({
      id: 'attendance-id',
      companyId: 'company-id',
      employeeId: 'employee-id',
    });
    prisma.attendanceCorrectionRequest.update.mockResolvedValue({
      id: 'correction-id',
      status: AttendanceCorrectionStatusDto.APPROVED,
    });
    prisma.attendanceRecord.update.mockResolvedValue({ id: 'attendance-id' });
    const service = new AttendanceLeaveService(prisma as never);

    const result = await service.reviewCorrectionRequest(
      'company-id',
      'correction-id',
      'actor-id',
      {
        status: AttendanceCorrectionStatusDto.APPROVED,
        reviewComment: 'Validated against access logs',
      },
    );

    expect(result.status).toBe(AttendanceCorrectionStatusDto.APPROVED);
    expect(prisma.attendanceRecord.update).toHaveBeenCalledWith({
      where: { id: 'attendance-id' },
      data: {
        checkInAt: requestedCheckInAt,
        checkOutAt: requestedCheckOutAt,
        status: AttendanceStatusDto.PRESENT,
        updatedById: 'actor-id',
      },
    });
  });

  it('rejects a pending correction without modifying attendance', async () => {
    prisma.attendanceCorrectionRequest.findFirst.mockResolvedValue({
      id: 'correction-id',
      companyId: 'company-id',
      attendanceRecordId: 'attendance-id',
      employeeId: 'employee-id',
      status: AttendanceCorrectionStatusDto.PENDING,
    });
    prisma.attendanceCorrectionRequest.update.mockResolvedValue({
      id: 'correction-id',
      status: AttendanceCorrectionStatusDto.REJECTED,
    });
    const service = new AttendanceLeaveService(prisma as never);

    const result = await service.reviewCorrectionRequest(
      'company-id',
      'correction-id',
      'actor-id',
      {
        status: AttendanceCorrectionStatusDto.REJECTED,
        reviewComment: 'Times do not match access logs',
      },
    );

    expect(result.status).toBe(AttendanceCorrectionStatusDto.REJECTED);
    expect(prisma.attendanceRecord.update).not.toHaveBeenCalled();
  });

  it('rejects a second review of a non-pending correction', async () => {
    prisma.attendanceCorrectionRequest.findFirst.mockResolvedValue({
      id: 'correction-id',
      companyId: 'company-id',
      status: AttendanceCorrectionStatusDto.APPROVED,
    });
    const service = new AttendanceLeaveService(prisma as never);

    await expect(
      service.reviewCorrectionRequest(
        'company-id',
        'correction-id',
        'actor-id',
        { status: AttendanceCorrectionStatusDto.REJECTED },
      ),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(prisma.attendanceCorrectionRequest.update).not.toHaveBeenCalled();
  });

  it('rejects review of a correction owned by another company', async () => {
    prisma.attendanceCorrectionRequest.findFirst.mockResolvedValue(null);
    const service = new AttendanceLeaveService(prisma as never);

    await expect(
      service.reviewCorrectionRequest(
        'company-id',
        'foreign-correction-id',
        'actor-id',
        { status: AttendanceCorrectionStatusDto.APPROVED },
      ),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(prisma.attendanceCorrectionRequest.findFirst).toHaveBeenCalledWith({
      where: { id: 'foreign-correction-id', companyId: 'company-id' },
    });
    expect(prisma.attendanceCorrectionRequest.update).not.toHaveBeenCalled();
  });

  it('lists only company leave balances with filters and authoritative remaining values', async () => {
    prisma.leaveBalance.findMany.mockResolvedValue([
      {
        id: 'balance-id',
        companyId: 'company-id',
        employeeId: 'employee-id',
        leaveTypeId: 'leave-type-id',
        year: 2026,
        openingBalance: 10,
        accrued: 3,
        used: 5,
        remaining: 99,
        employee: {
          id: 'employee-id',
          employeeCode: 'ZM001',
          firstName: 'Aarav',
          lastName: 'Mehta',
        },
        leaveType: { id: 'leave-type-id', name: 'Casual Leave', code: 'CL' },
      },
    ]);
    prisma.leaveBalance.count.mockResolvedValue(1);
    const service = new AttendanceLeaveService(prisma as never);

    const result = await service.findLeaveBalances(
      'company-id',
      'employee-id',
      true,
      {
        page: 1,
        limit: 20,
        employeeId: 'employee-id',
        leaveTypeId: 'leave-type-id',
        year: 2026,
      },
    );

    expect(result.data[0]).toEqual(
      expect.objectContaining({ remaining: 8 }),
    );
    expect(prisma.leaveBalance.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          companyId: 'company-id',
          employeeId: 'employee-id',
          leaveTypeId: 'leave-type-id',
          year: 2026,
        }),
      }),
    );
  });

  it('prevents a normal user from reading another employee leave balance', async () => {
    const service = new AttendanceLeaveService(prisma as never);

    await expect(
      service.findLeaveBalances('company-id', 'employee-id', false, {
        employeeId: 'other-employee-id',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(prisma.leaveBalance.findMany).not.toHaveBeenCalled();
  });

  it('rejects cross-company employee and leave type balance references', async () => {
    const service = new AttendanceLeaveService(prisma as never);
    prisma.employee.findFirst.mockResolvedValueOnce(null);

    await expect(
      service.upsertLeaveBalance('company-id', 'actor-id', {
        employeeId: 'foreign-employee-id',
        leaveTypeId: 'leave-type-id',
        year: 2026,
        openingBalance: 10,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    prisma.employee.findFirst.mockResolvedValueOnce({ id: 'employee-id' });
    prisma.leaveType.findFirst.mockResolvedValueOnce(null);
    await expect(
      service.upsertLeaveBalance('company-id', 'actor-id', {
        employeeId: 'employee-id',
        leaveTypeId: 'foreign-leave-type-id',
        year: 2026,
        openingBalance: 10,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.leaveBalance.create).not.toHaveBeenCalled();
  });

  it('rejects negative and overused leave balance administration', async () => {
    const service = new AttendanceLeaveService(prisma as never);

    await expect(
      service.upsertLeaveBalance('company-id', 'actor-id', {
        employeeId: 'employee-id',
        leaveTypeId: 'leave-type-id',
        year: 2026,
        openingBalance: -1,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expect(
      service.upsertLeaveBalance('company-id', 'actor-id', {
        employeeId: 'employee-id',
        leaveTypeId: 'leave-type-id',
        year: 2026,
        openingBalance: 5,
        accrued: 1,
        used: 7,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.leaveBalance.create).not.toHaveBeenCalled();
  });

  it('preserves consumed leave when an administrator omits used during balance update', async () => {
    prisma.leaveBalance.findFirst.mockResolvedValue({
      id: 'balance-id',
      openingBalance: 10,
      accrued: 2,
      used: 4,
      remaining: 8,
    });
    prisma.leaveBalance.update.mockResolvedValue({ id: 'balance-id' });
    const service = new AttendanceLeaveService(prisma as never);

    await service.upsertLeaveBalance('company-id', 'actor-id', {
      employeeId: 'employee-id',
      leaveTypeId: 'leave-type-id',
      year: 2026,
      openingBalance: 12,
    });

    expect(prisma.leaveBalance.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          openingBalance: 12,
          accrued: 2,
          used: 4,
          remaining: 10,
        }),
      }),
    );
  });

  it('creates leave with an inclusive server-calculated day count', async () => {
    prisma.leaveRequest.findFirst.mockResolvedValue(null);
    prisma.leaveRequest.create.mockResolvedValue({
      id: 'leave-request-id',
      days: 3,
      status: 'PENDING',
    });
    const service = new AttendanceLeaveService(prisma as never);

    await service.createLeaveRequest(
      'company-id',
      'actor-id',
      'employee-id',
      false,
      {
        employeeId: 'employee-id',
        leaveTypeId: 'leave-type-id',
        fromDate: '2026-06-10',
        toDate: '2026-06-12',
        days: 99,
        reason: 'Family event',
      },
    );

    expect(prisma.leaveRequest.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ days: 3 }),
      }),
    );
  });

  it('rejects cross-company leave request references', async () => {
    const service = new AttendanceLeaveService(prisma as never);
    prisma.employee.findFirst.mockResolvedValueOnce(null);

    await expect(
      service.createLeaveRequest(
        'company-id',
        'actor-id',
        'foreign-employee-id',
        false,
        {
          employeeId: 'foreign-employee-id',
          leaveTypeId: 'leave-type-id',
          fromDate: '2026-06-10',
          toDate: '2026-06-12',
        },
      ),
    ).rejects.toBeInstanceOf(NotFoundException);

    prisma.employee.findFirst.mockResolvedValueOnce({ id: 'employee-id' });
    prisma.leaveType.findFirst.mockResolvedValueOnce(null);
    await expect(
      service.createLeaveRequest(
        'company-id',
        'actor-id',
        'employee-id',
        false,
        {
          employeeId: 'employee-id',
          leaveTypeId: 'foreign-leave-type-id',
          fromDate: '2026-06-10',
          toDate: '2026-06-12',
        },
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.leaveRequest.create).not.toHaveBeenCalled();
  });

  it('rejects another employee request from a normal requester', async () => {
    const service = new AttendanceLeaveService(prisma as never);

    await expect(
      service.createLeaveRequest(
        'company-id',
        'actor-id',
        'employee-id',
        false,
        {
          employeeId: 'other-employee-id',
          leaveTypeId: 'leave-type-id',
          fromDate: '2026-06-10',
          toDate: '2026-06-12',
        },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.leaveRequest.create).not.toHaveBeenCalled();
  });

  it('rejects reversed and cross-year leave date ranges', async () => {
    const service = new AttendanceLeaveService(prisma as never);

    await expect(
      service.createLeaveRequest(
        'company-id',
        'actor-id',
        'employee-id',
        false,
        {
          employeeId: 'employee-id',
          leaveTypeId: 'leave-type-id',
          fromDate: '2026-06-12',
          toDate: '2026-06-10',
        },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expect(
      service.createLeaveRequest(
        'company-id',
        'actor-id',
        'employee-id',
        false,
        {
          employeeId: 'employee-id',
          leaveTypeId: 'leave-type-id',
          fromDate: '2026-12-31',
          toDate: '2027-01-01',
        },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.leaveRequest.create).not.toHaveBeenCalled();
  });

  it('rejects leave overlapping an active request', async () => {
    prisma.leaveRequest.findFirst.mockResolvedValue({
      id: 'overlap-id',
      status: 'APPROVED',
    });
    const service = new AttendanceLeaveService(prisma as never);

    await expect(
      service.createLeaveRequest(
        'company-id',
        'actor-id',
        'employee-id',
        false,
        {
          employeeId: 'employee-id',
          leaveTypeId: 'leave-type-id',
          fromDate: '2026-06-10',
          toDate: '2026-06-12',
        },
      ),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(prisma.leaveRequest.findFirst).toHaveBeenCalledWith({
      where: {
        companyId: 'company-id',
        employeeId: 'employee-id',
        deletedAt: null,
        status: { in: ['PENDING', 'APPROVED'] },
        fromDate: { lte: new Date('2026-06-12T00:00:00.000Z') },
        toDate: { gte: new Date('2026-06-10T00:00:00.000Z') },
      },
      select: { id: true },
    });
    expect(prisma.leaveRequest.create).not.toHaveBeenCalled();
  });

  it('approves leave requests and decrements the matching leave balance', async () => {
    prisma.leaveRequest.findFirst.mockResolvedValue({
      id: 'leave-request-id',
      companyId: 'company-id',
      employeeId: 'employee-id',
      leaveTypeId: 'leave-type-id',
      days: 2,
      status: 'PENDING',
      fromDate: new Date('2026-06-15T00:00:00.000Z'),
    });
    prisma.leaveRequest.update.mockResolvedValue({
      id: 'leave-request-id',
      status: LeaveRequestStatusDto.APPROVED,
    });
    prisma.leaveBalance.findFirst.mockResolvedValue({
      id: 'balance-id',
      remaining: 10,
      used: 0,
    });
    prisma.leaveBalance.update.mockResolvedValue({
      id: 'balance-id',
      remaining: 8,
      used: 2,
    });

    const service = new AttendanceLeaveService(prisma as never);
    const result = await service.reviewLeaveRequest(
      'company-id',
      'leave-request-id',
      'actor-id',
      { status: LeaveRequestStatusDto.APPROVED, reviewComment: 'Approved' },
    );

    expect(result.status).toBe('APPROVED');
    expect(prisma.leaveBalance.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'balance-id' },
        data: expect.objectContaining({ used: 2, remaining: 8 }),
      }),
    );
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it('rejects approval when the matching leave balance is insufficient', async () => {
    prisma.leaveRequest.findFirst.mockResolvedValue({
      id: 'leave-request-id',
      companyId: 'company-id',
      employeeId: 'employee-id',
      leaveTypeId: 'leave-type-id',
      days: 4,
      status: 'PENDING',
      fromDate: new Date('2026-06-15T00:00:00.000Z'),
    });
    prisma.leaveBalance.findFirst.mockResolvedValue({
      id: 'balance-id',
      remaining: 2,
      used: 8,
    });
    const service = new AttendanceLeaveService(prisma as never);

    await expect(
      service.reviewLeaveRequest(
        'company-id',
        'leave-request-id',
        'actor-id',
        { status: LeaveRequestStatusDto.APPROVED },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.leaveRequest.update).not.toHaveBeenCalled();
    expect(prisma.leaveBalance.update).not.toHaveBeenCalled();
  });

  it('does not update the request when transactional balance mutation fails', async () => {
    prisma.leaveRequest.findFirst.mockResolvedValue({
      id: 'leave-request-id',
      companyId: 'company-id',
      employeeId: 'employee-id',
      leaveTypeId: 'leave-type-id',
      days: 2,
      status: 'PENDING',
      fromDate: new Date('2026-06-15T00:00:00.000Z'),
    });
    prisma.leaveBalance.findFirst.mockResolvedValue({
      id: 'balance-id',
      remaining: 10,
      used: 0,
    });
    prisma.leaveBalance.update.mockRejectedValue(new Error('database failure'));
    const service = new AttendanceLeaveService(prisma as never);

    await expect(
      service.reviewLeaveRequest(
        'company-id',
        'leave-request-id',
        'actor-id',
        { status: LeaveRequestStatusDto.APPROVED },
      ),
    ).rejects.toThrow('database failure');
    expect(prisma.leaveRequest.update).not.toHaveBeenCalled();
  });

  it('keeps leave review company-scoped and blocks cancelled review', async () => {
    const service = new AttendanceLeaveService(prisma as never);
    prisma.leaveRequest.findFirst.mockResolvedValueOnce(null);
    await expect(
      service.reviewLeaveRequest(
        'company-id',
        'foreign-request-id',
        'actor-id',
        { status: LeaveRequestStatusDto.APPROVED },
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.leaveRequest.findFirst).toHaveBeenLastCalledWith({
      where: {
        id: 'foreign-request-id',
        companyId: 'company-id',
        deletedAt: null,
      },
    });

    prisma.leaveRequest.findFirst.mockResolvedValueOnce({
      id: 'leave-request-id',
      status: 'CANCELLED',
    });
    await expect(
      service.reviewLeaveRequest(
        'company-id',
        'leave-request-id',
        'actor-id',
        { status: LeaveRequestStatusDto.REJECTED },
      ),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.leaveRequest.update).not.toHaveBeenCalled();
  });

  it('rejects leave without consuming balance and blocks repeated review', async () => {
    prisma.leaveRequest.findFirst.mockResolvedValueOnce({
      id: 'leave-request-id',
      companyId: 'company-id',
      employeeId: 'employee-id',
      leaveTypeId: 'leave-type-id',
      days: 2,
      status: 'PENDING',
      fromDate: new Date('2026-06-15T00:00:00.000Z'),
    });
    prisma.leaveRequest.update.mockResolvedValue({
      id: 'leave-request-id',
      status: LeaveRequestStatusDto.REJECTED,
    });
    const service = new AttendanceLeaveService(prisma as never);
    await service.reviewLeaveRequest(
      'company-id',
      'leave-request-id',
      'actor-id',
      { status: LeaveRequestStatusDto.REJECTED },
    );
    expect(prisma.leaveBalance.update).not.toHaveBeenCalled();

    prisma.leaveRequest.findFirst.mockResolvedValueOnce({
      id: 'leave-request-id',
      status: 'REJECTED',
    });
    await expect(
      service.reviewLeaveRequest(
        'company-id',
        'leave-request-id',
        'actor-id',
        { status: LeaveRequestStatusDto.APPROVED },
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('cancels a pending self-service request without changing a balance', async () => {
    prisma.leaveRequest.findFirst.mockResolvedValue({
      id: 'leave-request-id',
      companyId: 'company-id',
      employeeId: 'employee-id',
      leaveTypeId: 'leave-type-id',
      days: 2,
      status: 'PENDING',
      fromDate: new Date('2099-06-15T00:00:00.000Z'),
    });
    prisma.leaveRequest.update.mockResolvedValue({
      id: 'leave-request-id',
      status: 'CANCELLED',
    });
    const service = new AttendanceLeaveService(prisma as never);

    const result = await service.cancelLeaveRequest(
      'company-id',
      'leave-request-id',
      'actor-id',
      'employee-id',
      false,
    );

    expect(result.status).toBe('CANCELLED');
    expect(prisma.leaveBalance.update).not.toHaveBeenCalled();
  });

  it('prevents another employee and foreign company from cancelling a request', async () => {
    prisma.leaveRequest.findFirst.mockResolvedValueOnce({
      id: 'leave-request-id',
      companyId: 'company-id',
      employeeId: 'other-employee-id',
      status: 'PENDING',
      fromDate: new Date('2099-06-15T00:00:00.000Z'),
    });
    const service = new AttendanceLeaveService(prisma as never);

    await expect(
      service.cancelLeaveRequest(
        'company-id',
        'leave-request-id',
        'actor-id',
        'employee-id',
        false,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    prisma.leaveRequest.findFirst.mockResolvedValueOnce(null);
    await expect(
      service.cancelLeaveRequest(
        'company-id',
        'foreign-request-id',
        'actor-id',
        'employee-id',
        true,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.leaveRequest.update).not.toHaveBeenCalled();
  });

  it('restores balance transactionally when future approved leave is cancelled', async () => {
    prisma.leaveRequest.findFirst.mockResolvedValue({
      id: 'leave-request-id',
      companyId: 'company-id',
      employeeId: 'employee-id',
      leaveTypeId: 'leave-type-id',
      days: 2,
      status: 'APPROVED',
      fromDate: new Date('2099-06-15T00:00:00.000Z'),
    });
    prisma.leaveBalance.findFirst.mockResolvedValue({
      id: 'balance-id',
      used: 5,
      remaining: 7,
    });
    prisma.leaveBalance.update.mockResolvedValue({ id: 'balance-id' });
    prisma.leaveRequest.update.mockResolvedValue({
      id: 'leave-request-id',
      status: 'CANCELLED',
    });
    const service = new AttendanceLeaveService(prisma as never);

    await service.cancelLeaveRequest(
      'company-id',
      'leave-request-id',
      'actor-id',
      'employee-id',
      false,
    );

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.leaveBalance.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ used: 3, remaining: 9 }),
      }),
    );
  });

  it('rejects cancellation of rejected, cancelled, or already-started approved leave', async () => {
    const service = new AttendanceLeaveService(prisma as never);
    for (const request of [
      { status: 'REJECTED', fromDate: new Date('2099-06-15') },
      { status: 'CANCELLED', fromDate: new Date('2099-06-15') },
      { status: 'APPROVED', fromDate: new Date('2020-06-15') },
    ]) {
      prisma.leaveRequest.findFirst.mockResolvedValueOnce({
        id: 'leave-request-id',
        companyId: 'company-id',
        employeeId: 'employee-id',
        leaveTypeId: 'leave-type-id',
        days: 2,
        ...request,
      });
      await expect(
        service.cancelLeaveRequest(
          'company-id',
          'leave-request-id',
          'actor-id',
          'employee-id',
          false,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
    }
    expect(prisma.leaveRequest.update).not.toHaveBeenCalled();
  });

  it('rejects duplicate holidays by company, date, and name', async () => {
    prisma.holiday.findFirst.mockResolvedValue({ id: 'holiday-id' });
    const service = new AttendanceLeaveService(prisma as never);

    await expect(
      service.createHoliday('company-id', 'actor-id', {
        name: 'Founders Day',
        date: '2026-06-12',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('throws when checking out without an attendance record', async () => {
    prisma.attendanceRecord.findFirst.mockResolvedValue(null);
    const service = new AttendanceLeaveService(prisma as never);

    await expect(
      service.checkOut('company-id', 'actor-id', {
        employeeId: 'employee-id',
        date: '2026-06-12',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
