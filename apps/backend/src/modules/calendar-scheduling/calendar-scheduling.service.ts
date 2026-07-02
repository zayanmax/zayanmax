import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import {
  CalendarEventQueryDto,
  CalendarResourceBookingQueryDto,
  CalendarResourceQueryDto,
  ChangeCalendarEventStatusDto,
  CreateCalendarEventDto,
  CreateCalendarResourceDto,
  CreateStandaloneResourceBookingDto,
  RespondCalendarEventDto,
  UpdateCalendarEventDto,
} from './dto/calendar-scheduling.dto';
import {
  CalendarEntityTypeDto,
  CalendarEventStatusDto,
  CalendarRsvpStatusDto,
  NotificationDeliveryChannelDto,
} from './dto/calendar-scheduling.enums';

@Injectable()
export class CalendarSchedulingService {
  constructor(private readonly prisma: PrismaService) {}

  async createResource(
    companyId: string,
    actorId: string,
    dto: CreateCalendarResourceDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const existing = await this.prisma.calendarResource.findFirst({
      where: { companyId, name: dto.name, deletedAt: null },
    });
    if (existing) throw new ConflictException('Calendar resource exists');

    const resource = await this.prisma.calendarResource.create({
      data: {
        companyId,
        name: dto.name,
        type: dto.type,
        location: dto.location,
        capacity: dto.capacity,
        description: dto.description,
        createdById: actorId,
      },
    });
    await this.audit(
      companyId,
      actorId,
      'calendar.resources.create',
      'CalendarResource',
      resource.id,
      undefined,
      resource,
      ipAddress,
      userAgent,
    );
    return resource;
  }

  async findResources(companyId: string, query: CalendarResourceQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.CalendarResourceWhereInput = {
      companyId,
      deletedAt: null,
      ...(query.status
        ? { status: query.status as Prisma.EnumRecordStatusFilter['equals'] }
        : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { type: { contains: query.search, mode: 'insensitive' } },
              { location: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.calendarResource.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [query.sortBy ?? 'createdAt']: query.sortOrder ?? 'desc' },
      }),
      this.prisma.calendarResource.count({ where }),
    ]);
    return this.paginated(data, page, limit, total);
  }

  async createEvent(
    companyId: string,
    actorId: string,
    dto: CreateCalendarEventDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const startAt = new Date(dto.startAt);
    const endAt = new Date(dto.endAt);
    this.assertValidRange(startAt, endAt);

    const bookings = dto.resourceBookings ?? [];
    for (const booking of bookings) {
      await this.assertNoResourceConflict(
        companyId,
        booking.resourceId,
        new Date(booking.startAt ?? dto.startAt),
        new Date(booking.endAt ?? dto.endAt),
      );
    }

    const event = await this.prisma.calendarEvent.create({
      data: {
        companyId,
        createdByUserId: actorId,
        title: dto.title,
        description: dto.description,
        eventType: dto.eventType,
        startAt,
        endAt,
        timezone: dto.timezone ?? 'Asia/Kolkata',
        location: dto.location,
        isAllDay: dto.isAllDay ?? false,
        recurrenceRule: dto.recurrenceRule,
        recurrenceEndsAt: dto.recurrenceEndsAt
          ? new Date(dto.recurrenceEndsAt)
          : undefined,
        entityType: dto.entityType,
        entityId: dto.entityId,
        ...this.linkedEntityData(dto.entityType, dto.entityId),
        createdById: actorId,
        attendees: dto.attendees?.length
          ? {
              create: dto.attendees.map((attendee) => ({
                companyId,
                userId: attendee.userId,
                employeeId: attendee.employeeId,
                rsvpStatus: CalendarRsvpStatusDto.PENDING,
                createdById: actorId,
              })),
            }
          : undefined,
        resourceBookings: bookings.length
          ? {
              create: bookings.map((booking) => ({
                companyId,
                resourceId: booking.resourceId,
                startAt: new Date(booking.startAt ?? dto.startAt),
                endAt: new Date(booking.endAt ?? dto.endAt),
                createdById: actorId,
              })),
            }
          : undefined,
        reminders: dto.reminders?.length
          ? {
              create: dto.reminders.map((reminder) => ({
                companyId,
                method:
                  reminder.method ?? NotificationDeliveryChannelDto.IN_APP,
                remindAt: new Date(reminder.remindAt),
                minutesBefore: reminder.minutesBefore,
                message: reminder.message,
                createdById: actorId,
              })),
            }
          : undefined,
      },
      include: {
        attendees: true,
        resourceBookings: true,
        reminders: true,
      },
    });
    await this.audit(
      companyId,
      actorId,
      'calendar.events.create',
      'CalendarEvent',
      event.id,
      undefined,
      event,
      ipAddress,
      userAgent,
    );
    return event;
  }

  async findEvents(companyId: string, query: CalendarEventQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = this.eventWhere(companyId, query);
    const [data, total] = await Promise.all([
      this.prisma.calendarEvent.findMany({
        where,
        include: {
          attendees: true,
          resourceBookings: { include: { resource: true } },
          reminders: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [query.sortBy ?? 'startAt']: query.sortOrder ?? 'asc' },
      }),
      this.prisma.calendarEvent.count({ where }),
    ]);
    return this.paginated(data, page, limit, total);
  }

  async findMyCalendar(
    companyId: string,
    actorId: string,
    query: CalendarEventQueryDto,
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const baseWhere = this.eventWhere(companyId, query);
    const where: Prisma.CalendarEventWhereInput = {
      AND: [
        baseWhere,
        {
          OR: [
            { createdByUserId: actorId },
            { attendees: { some: { userId: actorId, deletedAt: null } } },
          ],
        },
      ],
    };
    const [data, total] = await Promise.all([
      this.prisma.calendarEvent.findMany({
        where,
        include: {
          attendees: true,
          resourceBookings: { include: { resource: true } },
          reminders: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [query.sortBy ?? 'startAt']: query.sortOrder ?? 'asc' },
      }),
      this.prisma.calendarEvent.count({ where }),
    ]);
    return this.paginated(data, page, limit, total);
  }

  async updateEvent(
    companyId: string,
    id: string,
    actorId: string,
    dto: UpdateCalendarEventDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const current = await this.prisma.calendarEvent.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!current) throw new NotFoundException('Calendar event not found');

    const startAt = dto.startAt ? new Date(dto.startAt) : current.startAt;
    const endAt = dto.endAt ? new Date(dto.endAt) : current.endAt;
    this.assertValidRange(startAt, endAt);

    const event = await this.prisma.calendarEvent.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        eventType: dto.eventType,
        startAt: dto.startAt ? startAt : undefined,
        endAt: dto.endAt ? endAt : undefined,
        timezone: dto.timezone,
        location: dto.location,
        isAllDay: dto.isAllDay,
        recurrenceRule: dto.recurrenceRule,
        recurrenceEndsAt: dto.recurrenceEndsAt
          ? new Date(dto.recurrenceEndsAt)
          : undefined,
        updatedById: actorId,
      },
    });
    await this.audit(
      companyId,
      actorId,
      'calendar.events.update',
      'CalendarEvent',
      event.id,
      current,
      event,
      ipAddress,
      userAgent,
    );
    return event;
  }

  async changeEventStatus(
    companyId: string,
    id: string,
    actorId: string,
    dto: ChangeCalendarEventStatusDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const current = await this.prisma.calendarEvent.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!current) throw new NotFoundException('Calendar event not found');

    const event = await this.prisma.calendarEvent.update({
      where: { id },
      data: { status: dto.status, updatedById: actorId },
    });
    await this.audit(
      companyId,
      actorId,
      this.statusAuditAction(dto.status),
      'CalendarEvent',
      event.id,
      current,
      event,
      ipAddress,
      userAgent,
    );
    return event;
  }

  async removeEvent(
    companyId: string,
    id: string,
    actorId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const current = await this.prisma.calendarEvent.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!current) throw new NotFoundException('Calendar event not found');

    const event = await this.prisma.calendarEvent.update({
      where: { id },
      data: { deletedAt: new Date(), updatedById: actorId },
    });
    await this.audit(
      companyId,
      actorId,
      'calendar.events.delete',
      'CalendarEvent',
      id,
      current,
      event,
      ipAddress,
      userAgent,
    );
    return event;
  }

  async respondToEvent(
    companyId: string,
    eventId: string,
    actorId: string,
    dto: RespondCalendarEventDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const current = await this.prisma.calendarEventAttendee.findFirst({
      where: { companyId, eventId, userId: actorId, deletedAt: null },
    });
    if (!current) throw new NotFoundException('Calendar attendee not found');

    const response = await this.prisma.calendarEventAttendee.update({
      where: { id: current.id },
      data: {
        rsvpStatus: dto.rsvpStatus,
        respondedAt: new Date(),
        updatedById: actorId,
      },
    });
    await this.audit(
      companyId,
      actorId,
      'calendar.attendees.respond',
      'CalendarEventAttendee',
      response.id,
      current,
      response,
      ipAddress,
      userAgent,
    );
    return response;
  }

  async createResourceBooking(
    companyId: string,
    resourceId: string,
    actorId: string,
    dto: CreateStandaloneResourceBookingDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const resource = await this.prisma.calendarResource.findFirst({
      where: { id: resourceId, companyId, deletedAt: null },
    });
    if (!resource) throw new NotFoundException('Calendar resource not found');
    const event = await this.prisma.calendarEvent.findFirst({
      where: { id: dto.eventId, companyId, deletedAt: null },
    });
    if (!event) throw new NotFoundException('Calendar event not found');

    const startAt = new Date(dto.startAt);
    const endAt = new Date(dto.endAt);
    this.assertValidRange(startAt, endAt);
    await this.assertNoResourceConflict(companyId, resourceId, startAt, endAt);

    const booking = await this.prisma.calendarResourceBooking.create({
      data: {
        companyId,
        resourceId,
        eventId: dto.eventId,
        startAt,
        endAt,
        createdById: actorId,
      },
    });
    await this.audit(
      companyId,
      actorId,
      'calendar.resource_bookings.create',
      'CalendarResourceBooking',
      booking.id,
      undefined,
      booking,
      ipAddress,
      userAgent,
    );
    return booking;
  }

  async findResourceBookings(
    companyId: string,
    query: CalendarResourceBookingQueryDto,
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.CalendarResourceBookingWhereInput = {
      companyId,
      deletedAt: null,
      ...(query.status
        ? { status: query.status as Prisma.EnumRecordStatusFilter['equals'] }
        : {}),
      ...(query.resourceId ? { resourceId: query.resourceId } : {}),
      ...(query.eventId ? { eventId: query.eventId } : {}),
      ...this.dateOverlapWhere(query.fromDate, query.toDate),
    };
    const [data, total] = await Promise.all([
      this.prisma.calendarResourceBooking.findMany({
        where,
        include: { resource: true, event: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [query.sortBy ?? 'startAt']: query.sortOrder ?? 'asc' },
      }),
      this.prisma.calendarResourceBooking.count({ where }),
    ]);
    return this.paginated(data, page, limit, total);
  }

  private eventWhere(
    companyId: string,
    query: CalendarEventQueryDto,
  ): Prisma.CalendarEventWhereInput {
    return {
      companyId,
      deletedAt: null,
      ...(query.eventType ? { eventType: query.eventType } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.attendeeUserId
        ? {
            attendees: {
              some: { userId: query.attendeeUserId, deletedAt: null },
            },
          }
        : {}),
      ...(query.entityType ? { entityType: query.entityType } : {}),
      ...(query.entityId ? { entityId: query.entityId } : {}),
      ...this.dateOverlapWhere(query.fromDate, query.toDate),
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: 'insensitive' } },
              {
                description: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
              { location: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
  }

  private dateOverlapWhere(fromDate?: string, toDate?: string) {
    if (!fromDate && !toDate) return {};
    return {
      ...(fromDate ? { endAt: { gte: new Date(fromDate) } } : {}),
      ...(toDate ? { startAt: { lte: new Date(toDate) } } : {}),
    };
  }

  private async assertNoResourceConflict(
    companyId: string,
    resourceId: string,
    startAt: Date,
    endAt: Date,
  ) {
    this.assertValidRange(startAt, endAt);
    const conflict = await this.prisma.calendarResourceBooking.findFirst({
      where: {
        companyId,
        resourceId,
        deletedAt: null,
        status: 'ACTIVE',
        startAt: { lt: endAt },
        endAt: { gt: startAt },
        event: { deletedAt: null },
      },
    });
    if (conflict) {
      throw new ConflictException('Calendar resource is already booked');
    }
  }

  private assertValidRange(startAt: Date, endAt: Date) {
    if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
      throw new BadRequestException('Invalid calendar date range');
    }
    if (endAt <= startAt) {
      throw new BadRequestException('Event end time must be after start time');
    }
  }

  private linkedEntityData(
    entityType?: CalendarEntityTypeDto,
    entityId?: string,
  ) {
    if (!entityType || !entityId) return {};
    const map: Record<CalendarEntityTypeDto, Record<string, string>> = {
      EMPLOYEE: { employeeId: entityId },
      CLIENT: { clientId: entityId },
      PROJECT: { projectId: entityId },
      TASK: { taskId: entityId },
      LEAVE: { leaveRequestId: entityId },
      HOLIDAY: { holidayId: entityId },
      DOCUMENT: { documentId: entityId },
    };
    return map[entityType];
  }

  private statusAuditAction(status: CalendarEventStatusDto) {
    const map: Record<CalendarEventStatusDto, string> = {
      SCHEDULED: 'calendar.events.update',
      COMPLETED: 'calendar.events.update',
      CANCELLED: 'calendar.events.cancel',
      POSTPONED: 'calendar.events.update',
    };
    return map[status];
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
