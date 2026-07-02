import {
  Body,
  Controller,
  Delete,
  Get,
  Ip,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { CurrentUserDecorator } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import type { CurrentUser } from '../../common/types/current-user.type';
import { CalendarSchedulingService } from './calendar-scheduling.service';
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

@ApiTags('Calendar')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('calendar')
export class CalendarSchedulingController {
  constructor(
    private readonly calendarSchedulingService: CalendarSchedulingService,
  ) {}

  @RequirePermissions('calendar.view')
  @Get('my')
  findMyCalendar(
    @CurrentUserDecorator() user: CurrentUser,
    @Query() query: CalendarEventQueryDto,
  ) {
    return this.calendarSchedulingService.findMyCalendar(
      user.companyId,
      user.id,
      query,
    );
  }

  @RequirePermissions('calendar.view')
  @Get('company')
  findCompanyCalendar(
    @CurrentUserDecorator() user: CurrentUser,
    @Query() query: CalendarEventQueryDto,
  ) {
    return this.calendarSchedulingService.findEvents(user.companyId, query);
  }

  @RequirePermissions('calendar.view')
  @Get('events')
  findEvents(
    @CurrentUserDecorator() user: CurrentUser,
    @Query() query: CalendarEventQueryDto,
  ) {
    return this.calendarSchedulingService.findEvents(user.companyId, query);
  }

  @RequirePermissions('calendar.manage')
  @Post('events')
  createEvent(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() dto: CreateCalendarEventDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.calendarSchedulingService.createEvent(
      user.companyId,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('calendar.manage')
  @Patch('events/:id')
  updateEvent(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: UpdateCalendarEventDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.calendarSchedulingService.updateEvent(
      user.companyId,
      id,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('calendar.manage')
  @Patch('events/:id/status')
  changeEventStatus(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: ChangeCalendarEventStatusDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.calendarSchedulingService.changeEventStatus(
      user.companyId,
      id,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('calendar.manage')
  @Delete('events/:id')
  removeEvent(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.calendarSchedulingService.removeEvent(
      user.companyId,
      id,
      user.id,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('calendar.view')
  @Patch('events/:id/rsvp')
  respondToEvent(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: RespondCalendarEventDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.calendarSchedulingService.respondToEvent(
      user.companyId,
      id,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('calendar.view')
  @Get('resources')
  findResources(
    @CurrentUserDecorator() user: CurrentUser,
    @Query() query: CalendarResourceQueryDto,
  ) {
    return this.calendarSchedulingService.findResources(user.companyId, query);
  }

  @RequirePermissions('calendar.manage')
  @Post('resources')
  createResource(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() dto: CreateCalendarResourceDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.calendarSchedulingService.createResource(
      user.companyId,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('calendar.view')
  @Get('resource-bookings')
  findResourceBookings(
    @CurrentUserDecorator() user: CurrentUser,
    @Query() query: CalendarResourceBookingQueryDto,
  ) {
    return this.calendarSchedulingService.findResourceBookings(
      user.companyId,
      query,
    );
  }

  @RequirePermissions('calendar.manage')
  @Post('resources/:id/bookings')
  createResourceBooking(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: CreateStandaloneResourceBookingDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.calendarSchedulingService.createResourceBooking(
      user.companyId,
      id,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }
}
