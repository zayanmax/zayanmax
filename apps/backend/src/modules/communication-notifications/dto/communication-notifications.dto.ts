import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import {
  AnnouncementAudienceTypeDto,
  AnnouncementStatusDto,
  NotificationCategoryDto,
  NotificationDeliveryChannelDto,
  NotificationEntityTypeDto,
  NotificationPriorityDto,
  ReminderStatusDto,
} from './communication-notifications.enums';

export class AnnouncementAudienceDto {
  @IsEnum(AnnouncementAudienceTypeDto)
  audienceType!: AnnouncementAudienceTypeDto;

  @IsOptional()
  @IsUUID()
  branchId?: string;

  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @IsOptional()
  @IsUUID()
  roleId?: string;
}

export class CreateAnnouncementDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  body!: string;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AnnouncementAudienceDto)
  audiences?: AnnouncementAudienceDto[];
}

export class UpdateAnnouncementDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  body?: string;
}

export class AnnouncementQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(AnnouncementStatusDto)
  declare status?: AnnouncementStatusDto;
}

export class ChangeAnnouncementStatusDto {
  @IsEnum(AnnouncementStatusDto)
  status!: AnnouncementStatusDto;
}

export class CreateNotificationTypeDto {
  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEnum(NotificationCategoryDto)
  category!: NotificationCategoryDto;

  @IsOptional()
  @IsString()
  description?: string;
}

export class NotificationTypeQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(NotificationCategoryDto)
  category?: NotificationCategoryDto;
}

export class CreateNotificationDto {
  @IsUUID()
  recipientUserId!: string;

  @IsOptional()
  @IsUUID()
  notificationTypeId?: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  body!: string;

  @IsOptional()
  @IsEnum(NotificationCategoryDto)
  category?: NotificationCategoryDto;

  @IsOptional()
  @IsEnum(NotificationPriorityDto)
  priority?: NotificationPriorityDto;

  @IsOptional()
  @IsEnum(NotificationEntityTypeDto)
  entityType?: NotificationEntityTypeDto;

  @IsOptional()
  @IsUUID()
  entityId?: string;

  @IsOptional()
  @IsArray()
  @IsEnum(NotificationDeliveryChannelDto, { each: true })
  channels?: NotificationDeliveryChannelDto[];
}

export class NotificationQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID()
  recipientUserId?: string;

  @IsOptional()
  @IsEnum(NotificationCategoryDto)
  category?: NotificationCategoryDto;

  @IsOptional()
  @IsEnum(NotificationPriorityDto)
  priority?: NotificationPriorityDto;

  @IsOptional()
  @IsEnum(NotificationEntityTypeDto)
  entityType?: NotificationEntityTypeDto;

  @IsOptional()
  @IsUUID()
  entityId?: string;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  isRead?: boolean;
}

export class UpsertNotificationPreferenceDto {
  @IsEnum(NotificationDeliveryChannelDto)
  channel!: NotificationDeliveryChannelDto;

  @IsOptional()
  @IsEnum(NotificationCategoryDto)
  category?: NotificationCategoryDto;

  @IsBoolean()
  enabled!: boolean;
}

export class NotificationPreferenceQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsEnum(NotificationCategoryDto)
  category?: NotificationCategoryDto;

  @IsOptional()
  @IsEnum(NotificationDeliveryChannelDto)
  channel?: NotificationDeliveryChannelDto;
}

export class CreateNotificationTemplateDto {
  @IsOptional()
  @IsUUID()
  notificationTypeId?: string;

  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEnum(NotificationDeliveryChannelDto)
  channel!: NotificationDeliveryChannelDto;

  @IsOptional()
  @IsEnum(NotificationCategoryDto)
  category?: NotificationCategoryDto;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsString()
  @IsNotEmpty()
  bodyTemplate!: string;
}

export class NotificationTemplateQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(NotificationCategoryDto)
  category?: NotificationCategoryDto;

  @IsOptional()
  @IsEnum(NotificationDeliveryChannelDto)
  channel?: NotificationDeliveryChannelDto;
}

export class CreateReminderDto {
  @IsUUID()
  recipientUserId!: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsOptional()
  @IsString()
  body?: string;

  @IsISO8601({ strict: true })
  remindAt!: string;

  @IsOptional()
  @IsEnum(NotificationCategoryDto)
  category?: NotificationCategoryDto;

  @IsOptional()
  @IsEnum(NotificationPriorityDto)
  priority?: NotificationPriorityDto;

  @IsOptional()
  @IsEnum(NotificationEntityTypeDto)
  entityType?: NotificationEntityTypeDto;

  @IsOptional()
  @IsUUID()
  entityId?: string;
}

export class ReminderQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID()
  recipientUserId?: string;

  @IsOptional()
  @IsEnum(ReminderStatusDto)
  declare status?: ReminderStatusDto;

  @IsOptional()
  @IsEnum(NotificationCategoryDto)
  category?: NotificationCategoryDto;
}
