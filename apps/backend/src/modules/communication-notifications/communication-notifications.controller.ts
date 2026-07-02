import {
  Body,
  Controller,
  Get,
  Ip,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { CurrentUserDecorator } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import type { CurrentUser } from '../../common/types/current-user.type';
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
import { CommunicationNotificationsService } from './communication-notifications.service';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller()
export class CommunicationNotificationsController {
  constructor(
    private readonly communicationNotificationsService: CommunicationNotificationsService,
  ) {}

  @RequirePermissions('communications.view')
  @Get('announcements')
  findAnnouncements(
    @CurrentUserDecorator() user: CurrentUser,
    @Query() query: AnnouncementQueryDto,
  ) {
    return this.communicationNotificationsService.findAnnouncements(
      user.companyId,
      query,
    );
  }

  @RequirePermissions('communications.manage')
  @Post('announcements')
  createAnnouncement(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() dto: CreateAnnouncementDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.communicationNotificationsService.createAnnouncement(
      user.companyId,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('communications.manage')
  @Patch('announcements/:id')
  updateAnnouncement(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: UpdateAnnouncementDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.communicationNotificationsService.updateAnnouncement(
      user.companyId,
      id,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('communications.manage')
  @Patch('announcements/:id/status')
  changeAnnouncementStatus(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: ChangeAnnouncementStatusDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.communicationNotificationsService.changeAnnouncementStatus(
      user.companyId,
      id,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('communications.view')
  @Post('announcements/:id/read')
  markAnnouncementRead(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
  ) {
    return this.communicationNotificationsService.markAnnouncementRead(
      user.companyId,
      id,
      user.id,
    );
  }

  @RequirePermissions('communications.view')
  @Get('announcements/:id/read-receipts')
  findAnnouncementReadReceipts(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
    @Query() query: AnnouncementQueryDto,
  ) {
    return this.communicationNotificationsService.findAnnouncementReadReceipts(
      user.companyId,
      id,
      query,
    );
  }

  @RequirePermissions('notifications.view')
  @Get('notification-types')
  findNotificationTypes(
    @CurrentUserDecorator() user: CurrentUser,
    @Query() query: NotificationTypeQueryDto,
  ) {
    return this.communicationNotificationsService.findNotificationTypes(
      user.companyId,
      query,
    );
  }

  @RequirePermissions('notifications.manage')
  @Post('notification-types')
  createNotificationType(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() dto: CreateNotificationTypeDto,
  ) {
    return this.communicationNotificationsService.createNotificationType(
      user.companyId,
      user.id,
      dto,
    );
  }

  @RequirePermissions('notifications.view')
  @Get('notifications')
  findNotifications(
    @CurrentUserDecorator() user: CurrentUser,
    @Query() query: NotificationQueryDto,
  ) {
    return this.communicationNotificationsService.findNotifications(
      user.companyId,
      query,
    );
  }

  @RequirePermissions('notifications.manage')
  @Post('notifications')
  createNotification(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() dto: CreateNotificationDto,
  ) {
    return this.communicationNotificationsService.createNotification(
      user.companyId,
      user.id,
      dto,
    );
  }

  @RequirePermissions('notifications.view')
  @Patch('notifications/:id/read')
  markNotificationRead(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
  ) {
    return this.communicationNotificationsService.markNotificationRead(
      user.companyId,
      id,
      user.id,
    );
  }

  @RequirePermissions('notifications.view')
  @Patch('notifications/:id/unread')
  markNotificationUnread(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
  ) {
    return this.communicationNotificationsService.markNotificationUnread(
      user.companyId,
      id,
      user.id,
    );
  }

  @RequirePermissions('notifications.view')
  @Get('notification-preferences')
  findPreferences(
    @CurrentUserDecorator() user: CurrentUser,
    @Query() query: NotificationPreferenceQueryDto,
  ) {
    return this.communicationNotificationsService.findPreferences(
      user.companyId,
      user.id,
      query,
    );
  }

  @RequirePermissions('notifications.manage')
  @Post('notification-preferences')
  upsertPreference(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() dto: UpsertNotificationPreferenceDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.communicationNotificationsService.upsertPreference(
      user.companyId,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('notifications.view')
  @Get('notification-templates')
  findTemplates(
    @CurrentUserDecorator() user: CurrentUser,
    @Query() query: NotificationTemplateQueryDto,
  ) {
    return this.communicationNotificationsService.findTemplates(
      user.companyId,
      query,
    );
  }

  @RequirePermissions('notifications.manage')
  @Post('notification-templates')
  createTemplate(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() dto: CreateNotificationTemplateDto,
  ) {
    return this.communicationNotificationsService.createTemplate(
      user.companyId,
      user.id,
      dto,
    );
  }

  @RequirePermissions('notifications.view')
  @Get('reminders')
  findReminders(
    @CurrentUserDecorator() user: CurrentUser,
    @Query() query: ReminderQueryDto,
  ) {
    return this.communicationNotificationsService.findReminders(
      user.companyId,
      query,
    );
  }

  @RequirePermissions('notifications.manage')
  @Post('reminders')
  createReminder(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() dto: CreateReminderDto,
  ) {
    return this.communicationNotificationsService.createReminder(
      user.companyId,
      user.id,
      dto,
    );
  }
}
