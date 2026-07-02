import { CommunicationNotificationsService } from './communication-notifications.service';
import {
  AnnouncementAudienceTypeDto,
  AnnouncementStatusDto,
  NotificationCategoryDto,
  NotificationDeliveryChannelDto,
  NotificationDeliveryStatusDto,
  NotificationEntityTypeDto,
  NotificationPriorityDto,
} from './dto/communication-notifications.enums';

describe('CommunicationNotificationsService', () => {
  const prisma = {
    companyAnnouncement: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    announcementReadReceipt: {
      upsert: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    notificationType: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    internalNotification: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    notificationPreference: {
      upsert: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    notificationTemplate: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    reminderRecord: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    auditLog: { create: jest.fn() },
  };

  beforeEach(() => jest.clearAllMocks());

  it('creates announcements with audience targeting and audits create', async () => {
    prisma.companyAnnouncement.create.mockResolvedValue({
      id: 'announcement-id',
      title: 'Office closed',
      status: AnnouncementStatusDto.DRAFT,
      audiences: [{ audienceType: AnnouncementAudienceTypeDto.DEPARTMENT }],
    });
    const service = new CommunicationNotificationsService(prisma as never);

    const result = await service.createAnnouncement('company-id', 'actor-id', {
      title: 'Office closed',
      body: 'Office is closed tomorrow.',
      audiences: [
        {
          audienceType: AnnouncementAudienceTypeDto.DEPARTMENT,
          departmentId: 'department-id',
        },
        {
          audienceType: AnnouncementAudienceTypeDto.EMPLOYEE,
          employeeId: 'employee-id',
        },
      ],
    });

    expect(result.id).toBe('announcement-id');
    expect(prisma.companyAnnouncement.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          companyId: 'company-id',
          title: 'Office closed',
          audiences: {
            create: [
              expect.objectContaining({
                audienceType: AnnouncementAudienceTypeDto.DEPARTMENT,
                departmentId: 'department-id',
              }),
              expect.objectContaining({
                audienceType: AnnouncementAudienceTypeDto.EMPLOYEE,
                employeeId: 'employee-id',
              }),
            ],
          },
        }),
      }),
    );
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'communications.announcements.create',
        }),
      }),
    );
  });

  it('publishes and archives announcements with status audit actions', async () => {
    prisma.companyAnnouncement.findFirst.mockResolvedValue({
      id: 'announcement-id',
      status: AnnouncementStatusDto.DRAFT,
    });
    prisma.companyAnnouncement.update
      .mockResolvedValueOnce({
        id: 'announcement-id',
        status: AnnouncementStatusDto.PUBLISHED,
      })
      .mockResolvedValueOnce({
        id: 'announcement-id',
        status: AnnouncementStatusDto.ARCHIVED,
      });
    const service = new CommunicationNotificationsService(prisma as never);

    await service.changeAnnouncementStatus(
      'company-id',
      'announcement-id',
      'actor-id',
      { status: AnnouncementStatusDto.PUBLISHED },
    );
    await service.changeAnnouncementStatus(
      'company-id',
      'announcement-id',
      'actor-id',
      { status: AnnouncementStatusDto.ARCHIVED },
    );

    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'communications.announcements.publish',
        }),
      }),
    );
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'communications.announcements.archive',
        }),
      }),
    );
  });

  it('records announcement read receipts idempotently', async () => {
    prisma.announcementReadReceipt.upsert.mockResolvedValue({
      id: 'receipt-id',
      announcementId: 'announcement-id',
      userId: 'actor-id',
    });
    const service = new CommunicationNotificationsService(prisma as never);

    const result = await service.markAnnouncementRead(
      'company-id',
      'announcement-id',
      'actor-id',
    );

    expect(result.id).toBe('receipt-id');
    expect(prisma.announcementReadReceipt.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          announcementId_userId: {
            announcementId: 'announcement-id',
            userId: 'actor-id',
          },
        },
      }),
    );
  });

  it('creates notification metadata with delivery channels and marks read', async () => {
    prisma.internalNotification.create.mockResolvedValue({
      id: 'notification-id',
      isRead: false,
      deliveries: [{ channel: NotificationDeliveryChannelDto.IN_APP }],
    });
    prisma.internalNotification.findFirst.mockResolvedValue({
      id: 'notification-id',
      isRead: false,
    });
    prisma.internalNotification.update.mockResolvedValue({
      id: 'notification-id',
      isRead: true,
    });
    const service = new CommunicationNotificationsService(prisma as never);

    await service.createNotification('company-id', 'actor-id', {
      recipientUserId: 'recipient-id',
      title: 'Task updated',
      body: 'A task was updated.',
      category: NotificationCategoryDto.TASK,
      priority: NotificationPriorityDto.HIGH,
      entityType: NotificationEntityTypeDto.TASK,
      entityId: 'task-id',
      channels: [
        NotificationDeliveryChannelDto.IN_APP,
        NotificationDeliveryChannelDto.EMAIL,
      ],
    });
    const result = await service.markNotificationRead(
      'company-id',
      'notification-id',
      'recipient-id',
    );

    expect(result.isRead).toBe(true);
    expect(prisma.internalNotification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          category: NotificationCategoryDto.TASK,
          priority: NotificationPriorityDto.HIGH,
          deliveries: {
            create: [
              expect.objectContaining({
                channel: NotificationDeliveryChannelDto.IN_APP,
                status: NotificationDeliveryStatusDto.PENDING,
              }),
              expect.objectContaining({
                channel: NotificationDeliveryChannelDto.EMAIL,
                status: NotificationDeliveryStatusDto.PENDING,
              }),
            ],
          },
        }),
      }),
    );
  });

  it('upserts notification preferences and audits preference changes', async () => {
    prisma.notificationPreference.upsert.mockResolvedValue({
      id: 'preference-id',
      userId: 'actor-id',
      channel: NotificationDeliveryChannelDto.EMAIL,
      enabled: false,
    });
    const service = new CommunicationNotificationsService(prisma as never);

    const result = await service.upsertPreference('company-id', 'actor-id', {
      channel: NotificationDeliveryChannelDto.EMAIL,
      category: NotificationCategoryDto.PAYROLL,
      enabled: false,
    });

    expect(result.enabled).toBe(false);
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'notifications.preferences.upsert',
        }),
      }),
    );
  });

  it('creates notification type, template, and reminder metadata', async () => {
    prisma.notificationType.findFirst.mockResolvedValue(null);
    prisma.notificationType.create.mockResolvedValue({
      id: 'type-id',
      code: 'TASK_UPDATED',
    });
    prisma.notificationTemplate.findFirst.mockResolvedValue(null);
    prisma.notificationTemplate.create.mockResolvedValue({
      id: 'template-id',
      code: 'TASK_UPDATED_EMAIL',
    });
    prisma.reminderRecord.create.mockResolvedValue({
      id: 'reminder-id',
      title: 'Follow up',
    });
    const service = new CommunicationNotificationsService(prisma as never);

    await service.createNotificationType('company-id', 'actor-id', {
      code: 'TASK_UPDATED',
      name: 'Task updated',
      category: NotificationCategoryDto.TASK,
    });
    await service.createTemplate('company-id', 'actor-id', {
      code: 'TASK_UPDATED_EMAIL',
      name: 'Task updated email',
      channel: NotificationDeliveryChannelDto.EMAIL,
      category: NotificationCategoryDto.TASK,
      subject: 'Task updated',
      bodyTemplate: 'Task {{taskName}} was updated.',
    });
    const reminder = await service.createReminder('company-id', 'actor-id', {
      recipientUserId: 'recipient-id',
      title: 'Follow up',
      body: 'Check the task tomorrow.',
      remindAt: '2026-06-14T09:00:00.000Z',
      entityType: NotificationEntityTypeDto.TASK,
      entityId: 'task-id',
    });

    expect(reminder.id).toBe('reminder-id');
  });
});
