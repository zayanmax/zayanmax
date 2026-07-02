import {
  Body,
  Controller,
  Delete,
  Get,
  Ip,
  Param,
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
import { AttendanceLeaveService } from './attendance-leave.service';
import { CreateHolidayDto, HolidayQueryDto } from './dto/holiday.dto';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('holidays')
export class HolidaysController {
  constructor(
    private readonly attendanceLeaveService: AttendanceLeaveService,
  ) {}

  @RequirePermissions('attendance.view')
  @Get()
  findAll(
    @CurrentUserDecorator() user: CurrentUser,
    @Query() query: HolidayQueryDto,
  ) {
    return this.attendanceLeaveService.findHolidays(user.companyId, query);
  }

  @RequirePermissions('attendance.manage')
  @Post()
  create(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() dto: CreateHolidayDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.attendanceLeaveService.createHoliday(
      user.companyId,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('attendance.manage')
  @Delete(':id')
  remove(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.attendanceLeaveService.removeHoliday(
      user.companyId,
      id,
      user.id,
      ipAddress,
      request.headers['user-agent'],
    );
  }
}
