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
  ApplicationQueryDto,
  CandidateQueryDto,
  ChangeApplicationStatusDto,
  ChangeJobOpeningStatusDto,
  ChangeOfferStatusDto,
  CompleteOnboardingItemDto,
  ConvertCandidateToEmployeeDto,
  CreateApplicationDto,
  CreateCandidateDto,
  CreateInterviewRoundDto,
  CreateJobOpeningDto,
  CreateOfferLetterDto,
  CreateOnboardingChecklistDto,
  CreatePipelineStageDto,
  InterviewFeedbackDto,
  JobOpeningQueryDto,
  OnboardingChecklistItemDto,
  PipelineStageQueryDto,
} from './dto/recruitment-onboarding.dto';
import { RecruitmentOnboardingService } from './recruitment-onboarding.service';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('recruitment')
export class RecruitmentOnboardingController {
  constructor(
    private readonly recruitmentOnboardingService: RecruitmentOnboardingService,
  ) {}

  @RequirePermissions('recruitment.view')
  @Get('jobs')
  findJobOpenings(
    @CurrentUserDecorator() user: CurrentUser,
    @Query() query: JobOpeningQueryDto,
  ) {
    return this.recruitmentOnboardingService.findJobOpenings(
      user.companyId,
      query,
    );
  }

  @RequirePermissions('recruitment.manage')
  @Post('jobs')
  createJobOpening(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() dto: CreateJobOpeningDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.recruitmentOnboardingService.createJobOpening(
      user.companyId,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('recruitment.manage')
  @Patch('jobs/:id/status')
  changeJobStatus(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: ChangeJobOpeningStatusDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.recruitmentOnboardingService.changeJobStatus(
      user.companyId,
      id,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('recruitment.view')
  @Get('candidates')
  findCandidates(
    @CurrentUserDecorator() user: CurrentUser,
    @Query() query: CandidateQueryDto,
  ) {
    return this.recruitmentOnboardingService.findCandidates(
      user.companyId,
      query,
    );
  }

  @RequirePermissions('recruitment.manage')
  @Post('candidates')
  createCandidate(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() dto: CreateCandidateDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.recruitmentOnboardingService.createCandidate(
      user.companyId,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('recruitment.view')
  @Get('pipeline-stages')
  findPipelineStages(
    @CurrentUserDecorator() user: CurrentUser,
    @Query() query: PipelineStageQueryDto,
  ) {
    return this.recruitmentOnboardingService.findPipelineStages(
      user.companyId,
      query,
    );
  }

  @RequirePermissions('recruitment.manage')
  @Post('pipeline-stages')
  createPipelineStage(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() dto: CreatePipelineStageDto,
  ) {
    return this.recruitmentOnboardingService.createPipelineStage(
      user.companyId,
      user.id,
      dto,
    );
  }

  @RequirePermissions('recruitment.view')
  @Get('applications')
  findApplications(
    @CurrentUserDecorator() user: CurrentUser,
    @Query() query: ApplicationQueryDto,
  ) {
    return this.recruitmentOnboardingService.findApplications(
      user.companyId,
      query,
    );
  }

  @RequirePermissions('recruitment.manage')
  @Post('applications')
  createApplication(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() dto: CreateApplicationDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.recruitmentOnboardingService.createApplication(
      user.companyId,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('recruitment.manage')
  @Patch('applications/:id/status')
  changeApplicationStatus(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: ChangeApplicationStatusDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.recruitmentOnboardingService.changeApplicationStatus(
      user.companyId,
      id,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('recruitment.manage')
  @Post('applications/:id/convert-to-employee')
  convertCandidateToEmployee(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: ConvertCandidateToEmployeeDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.recruitmentOnboardingService.convertCandidateToEmployee(
      user.companyId,
      id,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('recruitment.manage')
  @Post('interviews')
  createInterviewRound(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() dto: CreateInterviewRoundDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.recruitmentOnboardingService.createInterviewRound(
      user.companyId,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('recruitment.manage')
  @Post('interviews/:id/feedback')
  createInterviewFeedback(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: InterviewFeedbackDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.recruitmentOnboardingService.createInterviewFeedback(
      user.companyId,
      id,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('recruitment.manage')
  @Post('offers')
  createOfferLetter(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() dto: CreateOfferLetterDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.recruitmentOnboardingService.createOfferLetter(
      user.companyId,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('recruitment.manage')
  @Patch('offers/:id/status')
  changeOfferStatus(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: ChangeOfferStatusDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.recruitmentOnboardingService.changeOfferStatus(
      user.companyId,
      id,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('recruitment.manage')
  @Post('onboarding-checklists')
  createOnboardingChecklist(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() dto: CreateOnboardingChecklistDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.recruitmentOnboardingService.createOnboardingChecklist(
      user.companyId,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('recruitment.manage')
  @Post('onboarding-checklists/:id/items')
  addOnboardingChecklistItem(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: OnboardingChecklistItemDto,
  ) {
    return this.recruitmentOnboardingService.addOnboardingChecklistItem(
      user.companyId,
      id,
      user.id,
      dto,
    );
  }

  @RequirePermissions('recruitment.manage')
  @Patch('onboarding-items/:id/complete')
  completeOnboardingChecklistItem(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: CompleteOnboardingItemDto,
  ) {
    return this.recruitmentOnboardingService.completeOnboardingChecklistItem(
      user.companyId,
      id,
      user.id,
      dto,
    );
  }
}
