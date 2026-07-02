import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import {
  AnnouncementQueryDto,
  ChangeAnnouncementStatusDto,
  CreateAnnouncementDto,
  CreateNotificationDto,
  CreateNotificationTemplateDto,
  CreateNotificationTypeDto,
  CreateReminderDto,
  NotificationPreferenceQueryDto,
  NotificationQueryDto,
  NotificationTemplateQueryDto,
  NotificationTypeQueryDto,
  ReminderQueryDto,
  UpdateAnnouncementDto,
  UpsertNotificationPreferenceDto,
} from './dto/communication-notifications.dto';
import {
  AnnouncementAudienceTypeDto,
  AnnouncementStatusDto,
  NotificationCategoryDto,
  NotificationDeliveryChannelDto,
  NotificationDeliveryStatusDto,
  NotificationPriorityDto,
} from './dto/communication-notifications.enums';

@Injectable()
export class CommunicationNotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async createAnnouncement(
    companyId: string,
    actorId: string,
    dto: CreateAnnouncementDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const announcement = await this.prisma.companyAnnouncement.create({
      data: {
        companyId,
        authorUserId: actorId,
        title: dto.title,
        body: dto.body,
        createdById: actorId,
        audiences: {
          create: this.normalizeAudiences(dto.audiences).map((audience) => ({
            companyId,
            audienceType: audience.audienceType,
            branchId: audience.branchId,
            departmentId: audience.departmentId,
            employeeId: audience.employeeId,
            roleId: audience.roleId,
          })),
        },
      },
      include: { audiences: true },
    });
    await this.audit(
      companyId,
      actorId,
      'communications.announcements.create',
      'CompanyAnnouncement',
      announcement.id,
      undefined,
      announcement,
      ipAddress,
      userAgent,
    );
    return announcement;
  }

  async findAnnouncements(companyId: string, query: AnnouncementQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.CompanyAnnouncementWhereInput = {
      companyId,
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: 'insensitive' } },
              { body: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.companyAnnouncement.findMany({
        where,
        include: { audiences: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [query.sortBy ?? 'createdAt']: query.sortOrder ?? 'desc' },
      }),
      this.prisma.companyAnnouncement.count({ where }),
    ]);
    return this.paginated(data, page, limit, total);
  }

  async findAnnouncement(companyId: string, id: string) {
    const announcement = await this.prisma.companyAnnouncement.findFirst({
      where: { id, companyId, deletedAt: null },
      include: { audiences: true },
    });
    if (!announcement) throw new NotFoundException('Announcement not found');
    return announcement;
  }

  async updateAnnouncement(
    companyId: string,
    id: string,
    actorId: string,
    dto: UpdateAnnouncementDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const current = await this.prisma.companyAnnouncement.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!current) throw new NotFoundException('Announcement not found');

    const announcement = await this.prisma.companyAnnouncement.update({
      where: { id },
      data: {
        title: dto.title,
        body: dto.body,
        updatedById: actorId,
      },
    });
    await this.audit(
      companyId,
      actorId,
      'communications.announcements.update',
      'CompanyAnnouncement',
      announcement.id,
      current,
      announcement,
      ipAddress,
      userAgent,
    );
    return announcement;
  }

  async changeAnnouncementStatus(
    companyId: string,
    id: string,
    actorId: string,
    dto: ChangeAnnouncementStatusDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const current = await this.prisma.companyAnnouncement.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!current) throw new NotFoundException('Announcement not found');

    const announcement = await this.prisma.companyAnnouncement.update({
      where: { id },
      data: {
        status: dto.status,
        publishedAt:
          dto.status === AnnouncementStatusDto.PUBLISHED
            ? new Date()
            : current.publishedAt,
        archivedAt:
          dto.status === AnnouncementStatusDto.ARCHIVED
            ? new Date()
            : current.archivedAt,
        updatedById: actorId,
      },
    });
    await this.audit(
      companyId,
      actorId,
      this.announcementStatusAuditAction(dto.status),
      'CompanyAnnouncement',
      announcement.id,
      current,
      announcement,
      ipAddress,
      userAgent,
    );
    return announcement;
  }

  async markAnnouncementRead(
    companyId: string,
    announcementId: string,
    actorId: string,
  ) {
    return this.prisma.announcementReadReceipt.upsert({
      where: { announcementId_userId: { announcementId, userId: actorId } },
      update: { readAt: new Date() },
      create: { companyId, announcementId, userId: actorId },
    });
  }

  async findAnnouncementReadReceipts(
    companyId: string,
    announcementId: string,
    query: AnnouncementQueryDto,
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.AnnouncementReadReceiptWhereInput = {
      companyId,
      announcementId,
    };
    const [data, total] = await Promise.all([
      this.prisma.announcementReadReceipt.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { readAt: 'desc' },
      }),
      this.prisma.announcementReadReceipt.count({ where }),
    ]);
    return this.paginated(data, page, limit, total);
  }

  async createNotificationType(
    companyId: string,
    actorId: string,
    dto: CreateNotificationTypeDto,
  ) {
    const code = dto.code.toUpperCase();
    const existing = await this.prisma.notificationType.findFirst({
      where: { companyId, code, deletedAt: null },
    });
    if (existing) throw new ConflictException('Notification type exists');

    return this.prisma.notificationType.create({
      data: {
        companyId,
        code,
        name: dto.name,
        category: dto.category,
        description: dto.description,
        createdById: actorId,
      },
    });
  }

  async findNotificationTypes(
    companyId: string,
    query: NotificationTypeQueryDto,
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.NotificationTypeWhereInput = {
      companyId,
      deletedAt: null,
      ...(query.category ? { category: query.category } : {}),
      ...(query.search
        ? {
            OR: [
              { code: { contains: query.search, mode: 'insensitive' } },
              { name: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.notificationType.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [query.sortBy ?? 'createdAt']: query.sortOrder ?? 'desc' },
      }),
      this.prisma.notificationType.count({ where }),
    ]);
    return this.paginated(data, page, limit, total);
  }

  async createNotification(
    companyId: string,
    actorId: string,
    dto: CreateNotificationDto,
  ) {
    const channels = dto.channels?.length
      ? dto.channels
      : [NotificationDeliveryChannelDto.IN_APP];
    return this.prisma.internalNotification.create({
      data: {
        companyId,
        recipientUserId: dto.recipientUserId,
        notificationTypeId: dto.notificationTypeId,
        title: dto.title,
        body: dto.body,
        category: dto.category ?? NotificationCategoryDto.GENERAL,
        priority: dto.priority ?? NotificationPriorityDto.NORMAL,
        entityType: dto.entityType,
        entityId: dto.entityId,
        createdById: actorId,
        deliveries: {
          create: channels.map((channel) => ({
            companyId,
            channel,
            status: NotificationDeliveryStatusDto.PENDING,
          })),
        },
      },
      include: { deliveries: true },
    });
  }

  async findNotifications(companyId: string, query: NotificationQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.InternalNotificationWhereInput = {
      companyId,
      deletedAt: null,
      ...(query.recipientUserId
        ? { recipientUserId: query.recipientUserId }
        : {}),
      ...(query.category ? { category: query.category } : {}),
      ...(query.priority ? { priority: query.priority } : {}),
      ...(query.entityType ? { entityType: query.entityType } : {}),
      ...(query.entityId ? { entityId: query.entityId } : {}),
      ...(query.isRead !== undefined ? { isRead: query.isRead } : {}),
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: 'insensitive' } },
              { body: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.internalNotification.findMany({
        where,
        include: { deliveries: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [query.sortBy ?? 'createdAt']: query.sortOrder ?? 'desc' },
      }),
      this.prisma.internalNotification.count({ where }),
    ]);
    return this.paginated(data, page, limit, total);
  }

  async markNotificationRead(companyId: string, id: string, actorId: string) {
    const notification = await this.prisma.internalNotification.findFirst({
      where: { id, companyId, recipientUserId: actorId, deletedAt: null },
    });
    if (!notification) throw new NotFoundException('Notification not found');

    return this.prisma.internalNotification.update({
      where: { id },
      data: { isRead: true, readAt: new Date(), updatedById: actorId },
    });
  }

  async markNotificationUnread(companyId: string, id: string, actorId: string) {
    const notification = await this.prisma.internalNotification.findFirst({
      where: { id, companyId, recipientUserId: actorId, deletedAt: null },
    });
    if (!notification) throw new NotFoundException('Notification not found');

    return this.prisma.internalNotification.update({
      where: { id },
      data: { isRead: false, readAt: null, updatedById: actorId },
    });
  }

  async upsertPreference(
    companyId: string,
    actorId: string,
    dto: UpsertNotificationPreferenceDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const category = dto.category ?? NotificationCategoryDto.GENERAL;
    const preference = await this.prisma.notificationPreference.upsert({
      where: {
        companyId_userId_category_channel: {
          companyId,
          userId: actorId,
          category,
          channel: dto.channel,
        },
      },
      update: { enabled: dto.enabled, updatedById: actorId },
      create: {
        companyId,
        userId: actorId,
        category,
        channel: dto.channel,
        enabled: dto.enabled,
        updatedById: actorId,
      },
    });
    await this.audit(
      companyId,
      actorId,
      'notifications.preferences.upsert',
      'NotificationPreference',
      preference.id,
      undefined,
      preference,
      ipAddress,
      userAgent,
    );
    return preference;
  }

  async findPreferences(
    companyId: string,
    actorId: string,
    query: NotificationPreferenceQueryDto,
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.NotificationPreferenceWhereInput = {
      companyId,
      userId: query.userId ?? actorId,
      ...(query.category ? { category: query.category } : {}),
      ...(query.channel ? { channel: query.channel } : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.notificationPreference.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [query.sortBy ?? 'updatedAt']: query.sortOrder ?? 'desc' },
      }),
      this.prisma.notificationPreference.count({ where }),
    ]);
    return this.paginated(data, page, limit, total);
  }

  async createTemplate(
    companyId: string,
    actorId: string,
    dto: CreateNotificationTemplateDto,
  ) {
    const code = dto.code.toUpperCase();
    const existing = await this.prisma.notificationTemplate.findFirst({
      where: { companyId, code, deletedAt: null },
    });
    if (existing) throw new ConflictException('Notification template exists');

    return this.prisma.notificationTemplate.create({
      data: {
        companyId,
        notificationTypeId: dto.notificationTypeId,
        code,
        name: dto.name,
        category: dto.category ?? NotificationCategoryDto.GENERAL,
        channel: dto.channel,
        subject: dto.subject,
        bodyTemplate: dto.bodyTemplate,
        createdById: actorId,
      },
    });
  }

  async findTemplates(companyId: string, query: NotificationTemplateQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.NotificationTemplateWhereInput = {
      companyId,
      deletedAt: null,
      ...(query.category ? { category: query.category } : {}),
      ...(query.channel ? { channel: query.channel } : {}),
      ...(query.search
        ? {
            OR: [
              { code: { contains: query.search, mode: 'insensitive' } },
              { name: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.notificationTemplate.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [query.sortBy ?? 'createdAt']: query.sortOrder ?? 'desc' },
      }),
      this.prisma.notificationTemplate.count({ where }),
    ]);
    return this.paginated(data, page, limit, total);
  }

  async createReminder(
    companyId: string,
    actorId: string,
    dto: CreateReminderDto,
  ) {
    return this.prisma.reminderRecord.create({
      data: {
        companyId,
        recipientUserId: dto.recipientUserId,
        title: dto.title,
        body: dto.body,
        remindAt: new Date(dto.remindAt),
        category: dto.category ?? NotificationCategoryDto.GENERAL,
        priority: dto.priority ?? NotificationPriorityDto.NORMAL,
        entityType: dto.entityType,
        entityId: dto.entityId,
        createdById: actorId,
      },
    });
  }

  async findReminders(companyId: string, query: ReminderQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.ReminderRecordWhereInput = {
      companyId,
      deletedAt: null,
      ...(query.recipientUserId
        ? { recipientUserId: query.recipientUserId }
        : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.category ? { category: query.category } : {}),
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: 'insensitive' } },
              { body: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.reminderRecord.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [query.sortBy ?? 'remindAt']: query.sortOrder ?? 'asc' },
      }),
      this.prisma.reminderRecord.count({ where }),
    ]);
    return this.paginated(data, page, limit, total);
  }

  private normalizeAudiences(audiences?: CreateAnnouncementDto['audiences']) {
    if (audiences?.length) return audiences;
    return [{ audienceType: AnnouncementAudienceTypeDto.ALL_COMPANY }];
  }

  private announcementStatusAuditAction(status: AnnouncementStatusDto) {
    const map: Record<AnnouncementStatusDto, string> = {
      DRAFT: 'communications.announcements.update',
      PUBLISHED: 'communications.announcements.publish',
      ARCHIVED: 'communications.announcements.archive',
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
