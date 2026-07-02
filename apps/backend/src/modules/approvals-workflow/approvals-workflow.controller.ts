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
import {
  ApprovalCommentDto,
  ApprovalDecisionDto,
  ApprovalRequestQueryDto,
  ApprovalWorkflowQueryDto,
  CreateApprovalWorkflowDto,
  DelegateApprovalDto,
  SubmitApprovalRequestDto,
  UpdateApprovalWorkflowDto,
} from './dto/approvals-workflow.dto';
import { ApprovalsWorkflowService } from './approvals-workflow.service';

@ApiTags('Approvals')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('approvals')
export class ApprovalsWorkflowController {
  constructor(
    private readonly approvalsWorkflowService: ApprovalsWorkflowService,
  ) {}

  @RequirePermissions('approvals.view')
  @Get('workflows')
  findWorkflows(
    @CurrentUserDecorator() user: CurrentUser,
    @Query() query: ApprovalWorkflowQueryDto,
  ) {
    return this.approvalsWorkflowService.findWorkflows(user.companyId, query);
  }

  @RequirePermissions('approvals.manage')
  @Post('workflows')
  createWorkflow(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() dto: CreateApprovalWorkflowDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.approvalsWorkflowService.createWorkflow(
      user.companyId,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('approvals.manage')
  @Patch('workflows/:id')
  updateWorkflow(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: UpdateApprovalWorkflowDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.approvalsWorkflowService.updateWorkflow(
      user.companyId,
      id,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('approvals.manage')
  @Delete('workflows/:id')
  deleteWorkflow(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.approvalsWorkflowService.deleteWorkflow(
      user.companyId,
      id,
      user.id,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('approvals.view')
  @Get('requests')
  findRequests(
    @CurrentUserDecorator() user: CurrentUser,
    @Query() query: ApprovalRequestQueryDto,
  ) {
    return this.approvalsWorkflowService.findRequests(user.companyId, query);
  }

  @RequirePermissions('approvals.manage')
  @Post('requests')
  submitRequest(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() dto: SubmitApprovalRequestDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.approvalsWorkflowService.submitRequest(
      user.companyId,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('approvals.view')
  @Get('pending')
  findMyPendingApprovals(
    @CurrentUserDecorator() user: CurrentUser,
    @Query() query: ApprovalRequestQueryDto,
  ) {
    return this.approvalsWorkflowService.findMyPendingApprovals(
      user.companyId,
      user.id,
      query,
    );
  }

  @RequirePermissions('approvals.view')
  @Get('history/:entityType/:entityId')
  findEntityHistory(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
  ) {
    return this.approvalsWorkflowService.findEntityHistory(
      user.companyId,
      entityType,
      entityId,
    );
  }

  @RequirePermissions('approvals.approve')
  @Patch('requests/:id/approve')
  approveStep(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: ApprovalDecisionDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.approvalsWorkflowService.approveStep(
      user.companyId,
      id,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('approvals.approve')
  @Patch('requests/:id/reject')
  rejectStep(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: ApprovalDecisionDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.approvalsWorkflowService.rejectStep(
      user.companyId,
      id,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('approvals.manage')
  @Patch('requests/:id/cancel')
  cancelRequest(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: ApprovalCommentDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.approvalsWorkflowService.cancelRequest(
      user.companyId,
      id,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('approvals.approve')
  @Patch('requests/:id/delegate')
  delegateStep(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: DelegateApprovalDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.approvalsWorkflowService.delegateStep(
      user.companyId,
      id,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }
}
