import { ConflictException, NotFoundException } from '@nestjs/common';
import { AttendanceLeaveService } from './attendance-leave.service';
import { AttendanceStatusDto } from './dto/attendance-status.dto';
import { LeaveRequestStatusDto } from './dto/leave-request-status.dto';

describe('AttendanceLeaveService', () => {
  const prisma = {
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
    jest.clearAllMocks();
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
