import { ConflictException, NotFoundException } from '@nestjs/common';
import { CalendarSchedulingService } from './calendar-scheduling.service';
import {
  CalendarEntityTypeDto,
  CalendarEventStatusDto,
  CalendarEventTypeDto,
  CalendarRsvpStatusDto,
  NotificationDeliveryChannelDto,
} from './dto/calendar-scheduling.enums';

describe('CalendarSchedulingService', () => {
  const prisma = {
    calendarResource: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    calendarResourceBooking: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    calendarEvent: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    calendarEventAttendee: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    auditLog: { create: jest.fn() },
  };

  beforeEach(() => jest.clearAllMocks());

  it('creates events with attendees, resource bookings, reminders, entity links, and audit logs', async () => {
    prisma.calendarResourceBooking.findFirst.mockResolvedValue(null);
    prisma.calendarEvent.create.mockResolvedValue({
      id: 'event-id',
      title: 'Client meeting',
      eventType: CalendarEventTypeDto.CLIENT_MEETING,
      attendees: [{ userId: 'user-id' }],
      resourceBookings: [{ resourceId: 'room-id' }],
      reminders: [{ method: NotificationDeliveryChannelDto.IN_APP }],
    });
    const service = new CalendarSchedulingService(prisma as never);

    const result = await service.createEvent('company-id', 'actor-id', {
      title: 'Client meeting',
      description: 'Discuss launch plan',
      eventType: CalendarEventTypeDto.CLIENT_MEETING,
      startAt: '2026-06-20T10:00:00.000Z',
      endAt: '2026-06-20T11:00:00.000Z',
      entityType: CalendarEntityTypeDto.CLIENT,
      entityId: 'client-id',
      attendees: [{ userId: 'user-id', employeeId: 'employee-id' }],
      resourceBookings: [{ resourceId: 'room-id' }],
      reminders: [
        {
          method: NotificationDeliveryChannelDto.IN_APP,
          remindAt: '2026-06-20T09:45:00.000Z',
          minutesBefore: 15,
        },
      ],
    });

    expect(result.id).toBe('event-id');
    expect(prisma.calendarEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          companyId: 'company-id',
          createdByUserId: 'actor-id',
          clientId: 'client-id',
          attendees: {
            create: [
              expect.objectContaining({
                companyId: 'company-id',
                userId: 'user-id',
                employeeId: 'employee-id',
                rsvpStatus: CalendarRsvpStatusDto.PENDING,
              }),
            ],
          },
          resourceBookings: {
            create: [
              expect.objectContaining({
                companyId: 'company-id',
                resourceId: 'room-id',
                createdById: 'actor-id',
              }),
            ],
          },
          reminders: {
            create: [
              expect.objectContaining({
                companyId: 'company-id',
                method: NotificationDeliveryChannelDto.IN_APP,
                minutesBefore: 15,
              }),
            ],
          },
        }),
      }),
    );
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: 'calendar.events.create' }),
      }),
    );
  });

  it('rejects overlapping resource bookings', async () => {
    prisma.calendarResourceBooking.findFirst.mockResolvedValue({
      id: 'existing-booking',
    });
    const service = new CalendarSchedulingService(prisma as never);

    await expect(
      service.createEvent('company-id', 'actor-id', {
        title: 'Conflicting meeting',
        eventType: CalendarEventTypeDto.MEETING,
        startAt: '2026-06-20T10:00:00.000Z',
        endAt: '2026-06-20T11:00:00.000Z',
        resourceBookings: [{ resourceId: 'room-id' }],
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('audits event cancellation status changes', async () => {
    prisma.calendarEvent.findFirst.mockResolvedValue({
      id: 'event-id',
      status: CalendarEventStatusDto.SCHEDULED,
    });
    prisma.calendarEvent.update.mockResolvedValue({
      id: 'event-id',
      status: CalendarEventStatusDto.CANCELLED,
    });
    const service = new CalendarSchedulingService(prisma as never);

    await service.changeEventStatus('company-id', 'event-id', 'actor-id', {
      status: CalendarEventStatusDto.CANCELLED,
    });

    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: 'calendar.events.cancel' }),
      }),
    );
  });

  it('updates attendee RSVP responses with audit logs', async () => {
    prisma.calendarEventAttendee.findFirst.mockResolvedValue({
      id: 'attendee-id',
      eventId: 'event-id',
      userId: 'actor-id',
      rsvpStatus: CalendarRsvpStatusDto.PENDING,
    });
    prisma.calendarEventAttendee.update.mockResolvedValue({
      id: 'attendee-id',
      eventId: 'event-id',
      userId: 'actor-id',
      rsvpStatus: CalendarRsvpStatusDto.ACCEPTED,
    });
    const service = new CalendarSchedulingService(prisma as never);

    const response = await service.respondToEvent(
      'company-id',
      'event-id',
      'actor-id',
      { rsvpStatus: CalendarRsvpStatusDto.ACCEPTED },
    );

    expect(response.rsvpStatus).toBe(CalendarRsvpStatusDto.ACCEPTED);
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'calendar.attendees.respond',
          entityType: 'CalendarEventAttendee',
        }),
      }),
    );
  });

  it('combines my calendar attendee scope with search and status filters', async () => {
    prisma.calendarEvent.findMany.mockResolvedValue([]);
    prisma.calendarEvent.count.mockResolvedValue(0);
    const service = new CalendarSchedulingService(prisma as never);

    await service.findMyCalendar('company-id', 'actor-id', {
      page: 1,
      limit: 20,
      search: 'planning',
      sortBy: 'startAt',
      sortOrder: 'asc',
      status: CalendarEventStatusDto.SCHEDULED,
    });

    expect(prisma.calendarEvent.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          AND: [
            expect.objectContaining({
              companyId: 'company-id',
              status: CalendarEventStatusDto.SCHEDULED,
              OR: expect.arrayContaining([
                expect.objectContaining({
                  title: expect.objectContaining({ contains: 'planning' }),
                }),
              ]),
            }),
            {
              OR: [
                { createdByUserId: 'actor-id' },
                {
                  attendees: {
                    some: { userId: 'actor-id', deletedAt: null },
                  },
                },
              ],
            },
          ],
        },
      }),
    );
  });

  it('loads event detail with attendees, bookings, and reminders', async () => {
    prisma.calendarEvent.findFirst.mockResolvedValueOnce({
      id: 'event-id',
      title: 'Planning meeting',
      attendees: [{ userId: 'user-id' }],
      resourceBookings: [{ resourceId: 'room-id' }],
      reminders: [{ id: 'reminder-id' }],
    });
    const service = new CalendarSchedulingService(prisma as never);

    const result = await service.findEvent('company-id', 'event-id');

    expect(result.id).toBe('event-id');
    expect(prisma.calendarEvent.findFirst).toHaveBeenCalledWith({
      where: { id: 'event-id', companyId: 'company-id', deletedAt: null },
      include: {
        attendees: true,
        resourceBookings: { include: { resource: true } },
        reminders: true,
      },
    });

    prisma.calendarEvent.findFirst.mockResolvedValueOnce(null);
    await expect(
      service.findEvent('company-id', 'missing-event'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('prevents duplicate active resource names per company', async () => {
    prisma.calendarResource.findFirst.mockResolvedValue({ id: 'room-id' });
    const service = new CalendarSchedulingService(prisma as never);

    await expect(
      service.createResource('company-id', 'actor-id', {
        name: 'Board Room',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
