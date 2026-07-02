import {
  Body,
  Controller,
  Get,
  Ip,
  Post,
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
import { CreateShiftDto } from './dto/create-shift.dto';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('shifts')
export class ShiftsController {
  constructor(
    private readonly attendanceLeaveService: AttendanceLeaveService,
  ) {}

  @RequirePermissions('attendance.view')
  @Get()
  findAll(@CurrentUserDecorator() user: CurrentUser) {
    return this.attendanceLeaveService.findShifts(user.companyId);
  }

  @RequirePermissions('attendance.manage')
  @Post()
  create(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() dto: CreateShiftDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.attendanceLeaveService.createShift(
      user.companyId,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }
}
