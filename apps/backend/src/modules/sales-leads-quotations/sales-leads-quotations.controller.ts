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
  AddQuotationVersionDto,
  AssignLeadDto,
  ChangeLeadStatusDto,
  ChangeOpportunityStatusDto,
  ChangeQuotationStatusDto,
  ConvertLeadDto,
  CreateLeadActivityDto,
  CreateLeadDto,
  CreateLeadNoteDto,
  CreateLeadSourceDto,
  CreateLeadStageDto,
  CreateOpportunityDto,
  CreateOpportunityStageDto,
  CreateQuotationDto,
  LeadQueryDto,
  LeadTaxonomyQueryDto,
  OpportunityQueryDto,
  QuotationQueryDto,
  UpdateLeadDto,
  UpdateOpportunityDto,
  UpdateQuotationDto,
} from './dto/sales-leads-quotations.dto';
import { SalesLeadsQuotationsService } from './sales-leads-quotations.service';

@ApiTags('Sales')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('sales')
export class SalesLeadsQuotationsController {
  constructor(
    private readonly salesLeadsQuotationsService: SalesLeadsQuotationsService,
  ) {}

  @RequirePermissions('sales.view')
  @Get('lead-sources')
  findLeadSources(
    @CurrentUserDecorator() user: CurrentUser,
    @Query() query: LeadTaxonomyQueryDto,
  ) {
    return this.salesLeadsQuotationsService.findLeadSources(
      user.companyId,
      query,
    );
  }

  @RequirePermissions('sales.manage')
  @Post('lead-sources')
  createLeadSource(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() dto: CreateLeadSourceDto,
  ) {
    return this.salesLeadsQuotationsService.createLeadSource(
      user.companyId,
      user.id,
      dto,
    );
  }

  @RequirePermissions('sales.view')
  @Get('lead-stages')
  findLeadStages(
    @CurrentUserDecorator() user: CurrentUser,
    @Query() query: LeadTaxonomyQueryDto,
  ) {
    return this.salesLeadsQuotationsService.findLeadStages(
      user.companyId,
      query,
    );
  }

  @RequirePermissions('sales.manage')
  @Post('lead-stages')
  createLeadStage(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() dto: CreateLeadStageDto,
  ) {
    return this.salesLeadsQuotationsService.createLeadStage(
      user.companyId,
      user.id,
      dto,
    );
  }

  @RequirePermissions('sales.view')
  @Get('leads')
  findLeads(
    @CurrentUserDecorator() user: CurrentUser,
    @Query() query: LeadQueryDto,
  ) {
    return this.salesLeadsQuotationsService.findLeads(user.companyId, query);
  }

  @RequirePermissions('sales.view')
  @Get('leads/:id')
  findLead(@CurrentUserDecorator() user: CurrentUser, @Param('id') id: string) {
    return this.salesLeadsQuotationsService.findLead(user.companyId, id);
  }

  @RequirePermissions('sales.manage')
  @Post('leads')
  createLead(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() dto: CreateLeadDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.salesLeadsQuotationsService.createLead(
      user.companyId,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('sales.manage')
  @Patch('leads/:id')
  updateLead(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: UpdateLeadDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.salesLeadsQuotationsService.updateLead(
      user.companyId,
      id,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('sales.manage')
  @Delete('leads/:id')
  deleteLead(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.salesLeadsQuotationsService.deleteLead(
      user.companyId,
      id,
      user.id,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('sales.manage')
  @Post('leads/:id/activities')
  addLeadActivity(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: CreateLeadActivityDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.salesLeadsQuotationsService.addLeadActivity(
      user.companyId,
      id,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('sales.manage')
  @Post('leads/:id/notes')
  addLeadNote(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: CreateLeadNoteDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.salesLeadsQuotationsService.addLeadNote(
      user.companyId,
      id,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('sales.manage')
  @Patch('leads/:id/assignment')
  assignLead(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: AssignLeadDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.salesLeadsQuotationsService.assignLead(
      user.companyId,
      id,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('sales.manage')
  @Patch('leads/:id/status')
  changeLeadStatus(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: ChangeLeadStatusDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.salesLeadsQuotationsService.changeLeadStatus(
      user.companyId,
      id,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('sales.manage')
  @Post('leads/:id/convert-to-client')
  convertLeadToClient(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: ConvertLeadDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.salesLeadsQuotationsService.convertLeadToClient(
      user.companyId,
      id,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('sales.manage')
  @Post('opportunity-stages')
  createOpportunityStage(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() dto: CreateOpportunityStageDto,
  ) {
    return this.salesLeadsQuotationsService.createOpportunityStage(
      user.companyId,
      user.id,
      dto,
    );
  }

  @RequirePermissions('sales.view')
  @Get('opportunities')
  findOpportunities(
    @CurrentUserDecorator() user: CurrentUser,
    @Query() query: OpportunityQueryDto,
  ) {
    return this.salesLeadsQuotationsService.findOpportunities(
      user.companyId,
      query,
    );
  }

  @RequirePermissions('sales.view')
  @Get('opportunities/:id')
  findOpportunity(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
  ) {
    return this.salesLeadsQuotationsService.findOpportunity(user.companyId, id);
  }

  @RequirePermissions('sales.manage')
  @Post('opportunities')
  createOpportunity(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() dto: CreateOpportunityDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.salesLeadsQuotationsService.createOpportunity(
      user.companyId,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('sales.manage')
  @Patch('opportunities/:id')
  updateOpportunity(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: UpdateOpportunityDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.salesLeadsQuotationsService.updateOpportunity(
      user.companyId,
      id,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('sales.manage')
  @Patch('opportunities/:id/status')
  changeOpportunityStatus(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: ChangeOpportunityStatusDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.salesLeadsQuotationsService.changeOpportunityStatus(
      user.companyId,
      id,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('sales.manage')
  @Delete('opportunities/:id')
  deleteOpportunity(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.salesLeadsQuotationsService.deleteOpportunity(
      user.companyId,
      id,
      user.id,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('sales.view')
  @Get('quotations')
  findQuotations(
    @CurrentUserDecorator() user: CurrentUser,
    @Query() query: QuotationQueryDto,
  ) {
    return this.salesLeadsQuotationsService.findQuotations(
      user.companyId,
      query,
    );
  }

  @RequirePermissions('sales.view')
  @Get('quotations/:id')
  findQuotation(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
  ) {
    return this.salesLeadsQuotationsService.findQuotation(user.companyId, id);
  }

  @RequirePermissions('sales.manage')
  @Post('quotations')
  createQuotation(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() dto: CreateQuotationDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.salesLeadsQuotationsService.createQuotation(
      user.companyId,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('sales.manage')
  @Patch('quotations/:id')
  updateQuotation(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: UpdateQuotationDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.salesLeadsQuotationsService.updateQuotation(
      user.companyId,
      id,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('sales.manage')
  @Post('quotations/:id/versions')
  addQuotationVersion(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: AddQuotationVersionDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.salesLeadsQuotationsService.addQuotationVersion(
      user.companyId,
      id,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('sales.manage')
  @Patch('quotations/:id/status')
  changeQuotationStatus(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: ChangeQuotationStatusDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.salesLeadsQuotationsService.changeQuotationStatus(
      user.companyId,
      id,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('sales.manage')
  @Delete('quotations/:id')
  deleteQuotation(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.salesLeadsQuotationsService.deleteQuotation(
      user.companyId,
      id,
      user.id,
      ipAddress,
      request.headers['user-agent'],
    );
  }
}
