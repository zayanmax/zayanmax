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
import { AttendanceLeaveService } from './attendance-leave.service';
import {
  CheckInDto,
  CheckOutDto,
  ManualAttendanceDto,
} from './dto/attendance-entry.dto';
import {
  AttendanceQueryDto,
  EmployeeReportQueryDto,
  MonthlySummaryQueryDto,
} from './dto/attendance-query.dto';
import {
  CreateAttendanceCorrectionDto,
  ReviewAttendanceCorrectionDto,
} from './dto/attendance-correction.dto';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(
    private readonly attendanceLeaveService: AttendanceLeaveService,
  ) {}

  @RequirePermissions('attendance.view')
  @Get()
  findAll(
    @CurrentUserDecorator() user: CurrentUser,
    @Query() query: AttendanceQueryDto,
  ) {
    return this.attendanceLeaveService.findAttendance(user.companyId, query);
  }

  @RequirePermissions('attendance.view')
  @Get('monthly-summary')
  monthlySummary(
    @CurrentUserDecorator() user: CurrentUser,
    @Query() query: MonthlySummaryQueryDto,
  ) {
    return this.attendanceLeaveService.monthlySummary(user.companyId, query);
  }

  @RequirePermissions('attendance.view')
  @Get('employees/:employeeId/report')
  employeeReport(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('employeeId') employeeId: string,
    @Query() query: EmployeeReportQueryDto,
  ) {
    return this.attendanceLeaveService.employeeReport(
      user.companyId,
      employeeId,
      query,
    );
  }

  @RequirePermissions('attendance.manage')
  @Post('check-in')
  checkIn(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() dto: CheckInDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.attendanceLeaveService.checkIn(
      user.companyId,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('attendance.manage')
  @Post('check-out')
  checkOut(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() dto: CheckOutDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.attendanceLeaveService.checkOut(
      user.companyId,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('attendance.manage')
  @Post('manual')
  createManual(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() dto: ManualAttendanceDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.attendanceLeaveService.createManualAttendance(
      user.companyId,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('attendance.manage')
  @Post('corrections')
  createCorrection(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() dto: CreateAttendanceCorrectionDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.attendanceLeaveService.createCorrectionRequest(
      user.companyId,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('attendance.manage')
  @Patch('corrections/:id/review')
  reviewCorrection(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: ReviewAttendanceCorrectionDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.attendanceLeaveService.reviewCorrectionRequest(
      user.companyId,
      id,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }
}
