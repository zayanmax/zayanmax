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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
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
  LeaveBalanceQueryDto,
  LeaveRequestQueryDto,
  ReviewLeaveRequestDto,
  UpsertLeaveBalanceDto,
} from './dto/leave.dto';

@ApiTags('Attendance & Leave')
@ApiBearerAuth('bearer')
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
  @Get('balances')
  findBalances(
    @CurrentUserDecorator() user: CurrentUser,
    @Query() query: LeaveBalanceQueryDto,
  ) {
    return this.attendanceLeaveService.findLeaveBalances(
      user.companyId,
      user.employeeId,
      user.permissions.includes('leaves.approve'),
      query,
    );
  }

  @RequirePermissions('leaves.view')
  @Get('requests')
  findRequests(
    @CurrentUserDecorator() user: CurrentUser,
    @Query() query: LeaveRequestQueryDto,
  ) {
    return this.attendanceLeaveService.findLeaveRequests(
      user.companyId,
      query,
      user.employeeId,
      user.permissions.includes('leaves.approve'),
    );
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
      user.employeeId,
      user.permissions.includes('leaves.approve'),
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }


  @RequirePermissions('leaves.request')
  @Patch('requests/:id/cancel')
  cancelRequest(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.attendanceLeaveService.cancelLeaveRequest(
      user.companyId,
      id,
      user.id,
      user.employeeId,
      user.permissions.includes('leaves.approve'),
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
