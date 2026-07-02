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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { CurrentUserDecorator } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import type { CurrentUser } from '../../common/types/current-user.type';
import { CreateSalaryStructureDto } from './dto/create-salary-structure.dto';
import {
  AssignSalaryDto,
  ChangePayrollRunStatusDto,
  CreatePayrollPeriodDto,
  CreatePayrollRunDto,
  CreateSalaryAdvanceDto,
  PayslipQueryDto,
  PayrollPeriodQueryDto,
  PayrollRunQueryDto,
  SalaryAdvanceQueryDto,
  SalaryAssignmentQueryDto,
  UpdatePayrollRunDto,
} from './dto/payroll.dto';
import { PayrollService } from './payroll.service';

@ApiTags('Payroll')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('payroll')
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  @RequirePermissions('payroll.view')
  @Get('salary-structures')
  findSalaryStructures(
    @CurrentUserDecorator() user: CurrentUser,
    @Query() query: PayrollPeriodQueryDto,
  ) {
    return this.payrollService.findSalaryStructures(user.companyId, query);
  }

  @RequirePermissions('payroll.manage')
  @Post('salary-structures')
  createSalaryStructure(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() dto: CreateSalaryStructureDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.payrollService.createSalaryStructure(
      user.companyId,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('payroll.view')
  @Get('salary-assignments')
  findSalaryAssignments(
    @CurrentUserDecorator() user: CurrentUser,
    @Query() query: SalaryAssignmentQueryDto,
  ) {
    return this.payrollService.findSalaryAssignments(user.companyId, query);
  }

  @RequirePermissions('payroll.manage')
  @Post('salary-assignments')
  assignSalary(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() dto: AssignSalaryDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.payrollService.assignSalary(
      user.companyId,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('payroll.view')
  @Get('advances')
  findAdvances(
    @CurrentUserDecorator() user: CurrentUser,
    @Query() query: SalaryAdvanceQueryDto,
  ) {
    return this.payrollService.findSalaryAdvances(user.companyId, query);
  }

  @RequirePermissions('payroll.manage')
  @Post('advances')
  createAdvance(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() dto: CreateSalaryAdvanceDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.payrollService.createSalaryAdvance(
      user.companyId,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('payroll.view')
  @Get('periods')
  findPeriods(
    @CurrentUserDecorator() user: CurrentUser,
    @Query() query: PayrollPeriodQueryDto,
  ) {
    return this.payrollService.findPayrollPeriods(user.companyId, query);
  }

  @RequirePermissions('payroll.manage')
  @Post('periods')
  createPeriod(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() dto: CreatePayrollPeriodDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.payrollService.createPayrollPeriod(
      user.companyId,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('payroll.view')
  @Get('runs')
  findRuns(
    @CurrentUserDecorator() user: CurrentUser,
    @Query() query: PayrollRunQueryDto,
  ) {
    return this.payrollService.findPayrollRuns(user.companyId, query);
  }

  @RequirePermissions('payroll.manage')
  @Post('runs')
  createRun(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() dto: CreatePayrollRunDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.payrollService.createPayrollRun(
      user.companyId,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('payroll.view')
  @Get('runs/:id')
  findRun(@CurrentUserDecorator() user: CurrentUser, @Param('id') id: string) {
    return this.payrollService.findPayrollRun(user.companyId, id);
  }

  @RequirePermissions('payroll.manage')
  @Patch('runs/:id')
  updateRun(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: UpdatePayrollRunDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.payrollService.updatePayrollRun(
      user.companyId,
      id,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('payroll.manage')
  @Patch('runs/:id/status')
  changeRunStatus(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: ChangePayrollRunStatusDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.payrollService.changePayrollRunStatus(
      user.companyId,
      id,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('payroll.view')
  @Get('payslips/:employeeId')
  findPayslips(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('employeeId') employeeId: string,
    @Query() query: PayslipQueryDto,
  ) {
    return this.payrollService.findPayslips(user.companyId, employeeId, query);
  }
}
