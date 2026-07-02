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
import {
  ChangeGoalStatusDto,
  ChangeReviewStatusDto,
  CreateEmployeeKpiDto,
  CreateEmployeeReviewDto,
  CreateGoalDto,
  CreateKpiCategoryDto,
  CreatePerformanceCycleDto,
  CreateReviewTemplateDto,
  FeedbackDto,
  GoalProgressDto,
  GoalQueryDto,
  OneOnOneNoteDto,
  PerformanceCycleQueryDto,
  PromotionRecommendationDto,
  ReviewQueryDto,
  ReviewResponseDto,
  ReviewTemplateQueryDto,
} from './dto/performance-appraisals.dto';
import { PerformanceAppraisalsService } from './performance-appraisals.service';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('performance')
export class PerformanceAppraisalsController {
  constructor(
    private readonly performanceAppraisalsService: PerformanceAppraisalsService,
  ) {}

  @RequirePermissions('performance.view')
  @Get('cycles')
  findCycles(
    @CurrentUserDecorator() user: CurrentUser,
    @Query() query: PerformanceCycleQueryDto,
  ) {
    return this.performanceAppraisalsService.findCycles(user.companyId, query);
  }

  @RequirePermissions('performance.manage')
  @Post('cycles')
  createCycle(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() dto: CreatePerformanceCycleDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.performanceAppraisalsService.createCycle(
      user.companyId,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('performance.view')
  @Get('goals')
  findGoals(
    @CurrentUserDecorator() user: CurrentUser,
    @Query() query: GoalQueryDto,
  ) {
    return this.performanceAppraisalsService.findGoals(user.companyId, query);
  }

  @RequirePermissions('performance.manage')
  @Post('goals')
  createGoal(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() dto: CreateGoalDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.performanceAppraisalsService.createGoal(
      user.companyId,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('performance.manage')
  @Post('goals/:id/progress')
  addGoalProgress(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: GoalProgressDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.performanceAppraisalsService.addGoalProgress(
      user.companyId,
      id,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('performance.manage')
  @Patch('goals/:id/status')
  changeGoalStatus(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: ChangeGoalStatusDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.performanceAppraisalsService.changeGoalStatus(
      user.companyId,
      id,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('performance.manage')
  @Post('kpi-categories')
  createKpiCategory(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() dto: CreateKpiCategoryDto,
  ) {
    return this.performanceAppraisalsService.createKpiCategory(
      user.companyId,
      user.id,
      dto,
    );
  }

  @RequirePermissions('performance.manage')
  @Post('kpis')
  createEmployeeKpi(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() dto: CreateEmployeeKpiDto,
  ) {
    return this.performanceAppraisalsService.createEmployeeKpi(
      user.companyId,
      user.id,
      dto,
    );
  }

  @RequirePermissions('performance.view')
  @Get('review-templates')
  findReviewTemplates(
    @CurrentUserDecorator() user: CurrentUser,
    @Query() query: ReviewTemplateQueryDto,
  ) {
    return this.performanceAppraisalsService.findReviewTemplates(
      user.companyId,
      query,
    );
  }

  @RequirePermissions('performance.manage')
  @Post('review-templates')
  createReviewTemplate(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() dto: CreateReviewTemplateDto,
  ) {
    return this.performanceAppraisalsService.createReviewTemplate(
      user.companyId,
      user.id,
      dto,
    );
  }

  @RequirePermissions('performance.view')
  @Get('reviews')
  findReviews(
    @CurrentUserDecorator() user: CurrentUser,
    @Query() query: ReviewQueryDto,
  ) {
    return this.performanceAppraisalsService.findReviews(user.companyId, query);
  }

  @RequirePermissions('performance.manage')
  @Post('reviews')
  createEmployeeReview(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() dto: CreateEmployeeReviewDto,
  ) {
    return this.performanceAppraisalsService.createEmployeeReview(
      user.companyId,
      user.id,
      dto,
    );
  }

  @RequirePermissions('performance.manage')
  @Patch('reviews/:id/status')
  changeReviewStatus(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: ChangeReviewStatusDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.performanceAppraisalsService.changeReviewStatus(
      user.companyId,
      id,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('performance.manage')
  @Post('reviews/:id/responses')
  addReviewResponse(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: ReviewResponseDto,
  ) {
    return this.performanceAppraisalsService.addReviewResponse(
      user.companyId,
      id,
      user.id,
      dto,
    );
  }

  @RequirePermissions('performance.manage')
  @Post('feedback')
  createFeedback(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() dto: FeedbackDto,
  ) {
    return this.performanceAppraisalsService.createFeedback(
      user.companyId,
      user.id,
      dto,
    );
  }

  @RequirePermissions('performance.manage')
  @Post('one-on-ones')
  createOneOnOneNote(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() dto: OneOnOneNoteDto,
  ) {
    return this.performanceAppraisalsService.createOneOnOneNote(
      user.companyId,
      user.id,
      dto,
    );
  }

  @RequirePermissions('performance.manage')
  @Post('promotion-recommendations')
  createPromotionRecommendation(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() dto: PromotionRecommendationDto,
  ) {
    return this.performanceAppraisalsService.createPromotionRecommendation(
      user.companyId,
      user.id,
      dto,
    );
  }

  @RequirePermissions('performance.view')
  @Get('employees/:employeeId/summary')
  employeeSummary(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('employeeId') employeeId: string,
  ) {
    return this.performanceAppraisalsService.employeeSummary(
      user.companyId,
      employeeId,
    );
  }

  @RequirePermissions('performance.view')
  @Get('managers/:managerEmployeeId/team-summary')
  managerTeamPerformance(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('managerEmployeeId') managerEmployeeId: string,
  ) {
    return this.performanceAppraisalsService.managerTeamPerformance(
      user.companyId,
      managerEmployeeId,
    );
  }
}
