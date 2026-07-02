import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUserDecorator } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import type { CurrentUser } from '../../common/types/current-user.type';
import { DashboardReportsService } from './dashboard-reports.service';
import {
  CreateReportExportRequestDto,
  DashboardDateRangeQueryDto,
  ReportExportRequestQueryDto,
} from './dto/dashboard-reports.dto';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller()
export class DashboardReportsController {
  constructor(
    private readonly dashboardReportsService: DashboardReportsService,
  ) {}

  @RequirePermissions('dashboard.view')
  @Get('dashboard/summary')
  companySummary(
    @CurrentUserDecorator() user: CurrentUser,
    @Query() query: DashboardDateRangeQueryDto,
  ) {
    return this.dashboardReportsService.companyDashboardSummary(
      user.companyId,
      query,
    );
  }

  @RequirePermissions('dashboard.view')
  @Get('dashboard/hr')
  hrSummary(
    @CurrentUserDecorator() user: CurrentUser,
    @Query() query: DashboardDateRangeQueryDto,
  ) {
    return this.dashboardReportsService.hrDashboardSummary(
      user.companyId,
      query,
    );
  }

  @RequirePermissions('dashboard.view')
  @Get('dashboard/projects-tasks')
  projectsTasksSummary(
    @CurrentUserDecorator() user: CurrentUser,
    @Query() query: DashboardDateRangeQueryDto,
  ) {
    return this.dashboardReportsService.projectsTasksDashboardSummary(
      user.companyId,
      user.id,
      query,
    );
  }

  @RequirePermissions('dashboard.view')
  @Get('dashboard/crm-sales')
  crmSalesSummary(
    @CurrentUserDecorator() user: CurrentUser,
    @Query() query: DashboardDateRangeQueryDto,
  ) {
    return this.dashboardReportsService.crmSalesDashboardSummary(
      user.companyId,
      query,
    );
  }

  @RequirePermissions('dashboard.view')
  @Get('dashboard/finance')
  financeSummary(
    @CurrentUserDecorator() user: CurrentUser,
    @Query() query: DashboardDateRangeQueryDto,
  ) {
    return this.dashboardReportsService.financeDashboardSummary(
      user.companyId,
      query,
    );
  }

  @RequirePermissions('dashboard.view')
  @Get('dashboard/inventory-assets')
  inventoryAssetsSummary(
    @CurrentUserDecorator() user: CurrentUser,
    @Query() query: DashboardDateRangeQueryDto,
  ) {
    return this.dashboardReportsService.inventoryAssetsDashboardSummary(
      user.companyId,
      query,
    );
  }

  @RequirePermissions('dashboard.view')
  @Get('dashboard/helpdesk')
  helpdeskSummary(
    @CurrentUserDecorator() user: CurrentUser,
    @Query() query: DashboardDateRangeQueryDto,
  ) {
    return this.dashboardReportsService.helpdeskDashboardSummary(
      user.companyId,
      query,
    );
  }

  @RequirePermissions('dashboard.view')
  @Get('dashboard/approvals')
  approvalsSummary(
    @CurrentUserDecorator() user: CurrentUser,
    @Query() query: DashboardDateRangeQueryDto,
  ) {
    return this.dashboardReportsService.approvalsDashboardSummary(
      user.companyId,
      user.id,
      query,
    );
  }

  @RequirePermissions('dashboard.view')
  @Get('dashboard/calendar')
  calendarSummary(
    @CurrentUserDecorator() user: CurrentUser,
    @Query() query: DashboardDateRangeQueryDto,
  ) {
    return this.dashboardReportsService.calendarDashboardSummary(
      user.companyId,
      query,
    );
  }

  @RequirePermissions('reports.view')
  @Get('reports/registry')
  reportsRegistry() {
    return this.dashboardReportsService.reportsRegistry();
  }

  @RequirePermissions('reports.view')
  @Get('reports/metadata/:reportType')
  reportMetadata(@Param('reportType') reportType: string) {
    return this.dashboardReportsService.reportMetadata(reportType);
  }

  @RequirePermissions('reports.export')
  @Post('reports/export-requests')
  createExportRequest(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() dto: CreateReportExportRequestDto,
  ) {
    return this.dashboardReportsService.createExportRequest(
      user.companyId,
      user.id,
      dto,
    );
  }

  @RequirePermissions('reports.view')
  @Get('reports/export-requests')
  findExportRequests(
    @CurrentUserDecorator() user: CurrentUser,
    @Query() query: ReportExportRequestQueryDto,
  ) {
    return this.dashboardReportsService.findExportRequests(
      user.companyId,
      query,
    );
  }
}
