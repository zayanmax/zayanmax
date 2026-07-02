import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsISO8601,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import {
  CalendarEntityTypeDto,
  CalendarEventStatusDto,
  CalendarEventTypeDto,
  CalendarRsvpStatusDto,
  NotificationDeliveryChannelDto,
} from './calendar-scheduling.enums';

export class CreateCalendarEventAttendeeDto {
  @IsUUID()
  userId!: string;

  @IsOptional()
  @IsUUID()
  employeeId?: string;
}

export class CreateCalendarResourceBookingDto {
  @IsUUID()
  resourceId!: string;

  @IsOptional()
  @IsISO8601({ strict: true })
  startAt?: string;

  @IsOptional()
  @IsISO8601({ strict: true })
  endAt?: string;
}

export class CreateCalendarEventReminderDto {
  @IsOptional()
  @IsEnum(NotificationDeliveryChannelDto)
  method?: NotificationDeliveryChannelDto;

  @IsISO8601({ strict: true })
  remindAt!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  minutesBefore?: number;

  @IsOptional()
  @IsString()
  message?: string;
}

export class CreateCalendarEventDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(CalendarEventTypeDto)
  eventType!: CalendarEventTypeDto;

  @IsISO8601({ strict: true })
  startAt!: string;

  @IsISO8601({ strict: true })
  endAt!: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsBoolean()
  isAllDay?: boolean;

  @IsOptional()
  @IsString()
  recurrenceRule?: string;

  @IsOptional()
  @IsISO8601({ strict: true })
  recurrenceEndsAt?: string;

  @IsOptional()
  @IsEnum(CalendarEntityTypeDto)
  entityType?: CalendarEntityTypeDto;

  @IsOptional()
  @IsUUID()
  entityId?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCalendarEventAttendeeDto)
  attendees?: CreateCalendarEventAttendeeDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCalendarResourceBookingDto)
  resourceBookings?: CreateCalendarResourceBookingDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCalendarEventReminderDto)
  reminders?: CreateCalendarEventReminderDto[];
}

export class UpdateCalendarEventDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(CalendarEventTypeDto)
  eventType?: CalendarEventTypeDto;

  @IsOptional()
  @IsISO8601({ strict: true })
  startAt?: string;

  @IsOptional()
  @IsISO8601({ strict: true })
  endAt?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsBoolean()
  isAllDay?: boolean;

  @IsOptional()
  @IsString()
  recurrenceRule?: string;

  @IsOptional()
  @IsISO8601({ strict: true })
  recurrenceEndsAt?: string;
}

export class ChangeCalendarEventStatusDto {
  @IsEnum(CalendarEventStatusDto)
  status!: CalendarEventStatusDto;
}

export class RespondCalendarEventDto {
  @IsEnum(CalendarRsvpStatusDto)
  rsvpStatus!: CalendarRsvpStatusDto;
}

export class CalendarEventQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(CalendarEventTypeDto)
  eventType?: CalendarEventTypeDto;

  @IsOptional()
  @IsEnum(CalendarEventStatusDto)
  declare status?: CalendarEventStatusDto;

  @IsOptional()
  @IsISO8601({ strict: true })
  fromDate?: string;

  @IsOptional()
  @IsISO8601({ strict: true })
  toDate?: string;

  @IsOptional()
  @IsUUID()
  attendeeUserId?: string;

  @IsOptional()
  @IsEnum(CalendarEntityTypeDto)
  entityType?: CalendarEntityTypeDto;

  @IsOptional()
  @IsUUID()
  entityId?: string;
}

export class CreateCalendarResourceDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  capacity?: number;

  @IsOptional()
  @IsString()
  description?: string;
}

export class CalendarResourceQueryDto extends PaginationQueryDto {}

export class CreateStandaloneResourceBookingDto {
  @IsUUID()
  eventId!: string;

  @IsISO8601({ strict: true })
  startAt!: string;

  @IsISO8601({ strict: true })
  endAt!: string;
}

export class CalendarResourceBookingQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID()
  resourceId?: string;

  @IsOptional()
  @IsUUID()
  eventId?: string;

  @IsOptional()
  @IsISO8601({ strict: true })
  fromDate?: string;

  @IsOptional()
  @IsISO8601({ strict: true })
  toDate?: string;
}
