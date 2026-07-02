import {
  Body,
  Controller,
  Get,
  Ip,
  Patch,
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
import {
  CreateLeaveRequestDto,
  CreateLeaveTypeDto,
  LeaveRequestQueryDto,
  ReviewLeaveRequestDto,
  UpsertLeaveBalanceDto,
} from './dto/leave.dto';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('leaves')
export class LeavesController {
  constructor(
    private readonly attendanceLeaveService: AttendanceLeaveService,
  ) {}

  @RequirePermissions('leaves.view')
  @Get('types')
  findTypes(@CurrentUserDecorator() user: CurrentUser) {
    return this.attendanceLeaveService.findLeaveTypes(user.companyId);
  }

  @RequirePermissions('leaves.approve')
  @Post('types')
  createType(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() dto: CreateLeaveTypeDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.attendanceLeaveService.createLeaveType(
      user.companyId,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('leaves.approve')
  @Post('balances')
  upsertBalance(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() dto: UpsertLeaveBalanceDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.attendanceLeaveService.upsertLeaveBalance(
      user.companyId,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('leaves.view')
  @Get('requests')
  findRequests(
    @CurrentUserDecorator() user: CurrentUser,
    @Query() query: LeaveRequestQueryDto,
  ) {
    return this.attendanceLeaveService.findLeaveRequests(user.companyId, query);
  }

  @RequirePermissions('leaves.request')
  @Post('requests')
  createRequest(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() dto: CreateLeaveRequestDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.attendanceLeaveService.createLeaveRequest(
      user.companyId,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('leaves.approve')
  @Patch('requests/:id/review')
  reviewRequest(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: ReviewLeaveRequestDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.attendanceLeaveService.reviewLeaveRequest(
      user.companyId,
      id,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }
}
