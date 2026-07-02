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
import type { Request } from 'express';
import { CurrentUserDecorator } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import type { CurrentUser } from '../../common/types/current-user.type';
import { HelpdeskTicketsService } from './helpdesk-tickets.service';
import {
  AssignTicketDto,
  ChangeTicketStatusDto,
  CreateTicketCategoryDto,
  CreateTicketDto,
  CreateTicketSubcategoryDto,
  TicketAttachmentDto,
  TicketCategoryQueryDto,
  TicketCommentDto,
  TicketInternalNoteDto,
  TicketQueryDto,
  TicketSubcategoryQueryDto,
  UpdateTicketDto,
} from './dto/helpdesk-tickets.dto';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('helpdesk')
export class HelpdeskTicketsController {
  constructor(
    private readonly helpdeskTicketsService: HelpdeskTicketsService,
  ) {}

  @RequirePermissions('helpdesk.view')
  @Get('categories')
  findCategories(
    @CurrentUserDecorator() user: CurrentUser,
    @Query() query: TicketCategoryQueryDto,
  ) {
    return this.helpdeskTicketsService.findCategories(user.companyId, query);
  }

  @RequirePermissions('helpdesk.manage')
  @Post('categories')
  createCategory(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() dto: CreateTicketCategoryDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.helpdeskTicketsService.createCategory(
      user.companyId,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('helpdesk.view')
  @Get('subcategories')
  findSubcategories(
    @CurrentUserDecorator() user: CurrentUser,
    @Query() query: TicketSubcategoryQueryDto,
  ) {
    return this.helpdeskTicketsService.findSubcategories(user.companyId, query);
  }

  @RequirePermissions('helpdesk.manage')
  @Post('categories/:id/subcategories')
  createSubcategory(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: CreateTicketSubcategoryDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.helpdeskTicketsService.createSubcategory(
      user.companyId,
      id,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('helpdesk.view')
  @Get('tickets/my')
  findMyTickets(
    @CurrentUserDecorator() user: CurrentUser,
    @Query() query: TicketQueryDto,
  ) {
    return this.helpdeskTicketsService.findMyTickets(
      user.companyId,
      user.id,
      query,
    );
  }

  @RequirePermissions('helpdesk.view')
  @Get('tickets/queue')
  findQueue(
    @CurrentUserDecorator() user: CurrentUser,
    @Query() query: TicketQueryDto,
  ) {
    return this.helpdeskTicketsService.findQueue(user.companyId, query);
  }

  @RequirePermissions('helpdesk.view')
  @Get('tickets')
  findTickets(
    @CurrentUserDecorator() user: CurrentUser,
    @Query() query: TicketQueryDto,
  ) {
    return this.helpdeskTicketsService.findTickets(user.companyId, query);
  }

  @RequirePermissions('helpdesk.manage')
  @Post('tickets')
  createTicket(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() dto: CreateTicketDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.helpdeskTicketsService.createTicket(
      user.companyId,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('helpdesk.manage')
  @Patch('tickets/:id')
  updateTicket(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: UpdateTicketDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.helpdeskTicketsService.updateTicket(
      user.companyId,
      id,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('helpdesk.manage')
  @Patch('tickets/:id/status')
  changeTicketStatus(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: ChangeTicketStatusDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.helpdeskTicketsService.changeTicketStatus(
      user.companyId,
      id,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('helpdesk.manage')
  @Patch('tickets/:id/assignment')
  assignTicket(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: AssignTicketDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.helpdeskTicketsService.assignTicket(
      user.companyId,
      id,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('helpdesk.manage')
  @Delete('tickets/:id')
  removeTicket(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.helpdeskTicketsService.removeTicket(
      user.companyId,
      id,
      user.id,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('helpdesk.manage')
  @Post('tickets/:id/comments')
  addComment(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: TicketCommentDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.helpdeskTicketsService.addComment(
      user.companyId,
      id,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('helpdesk.manage')
  @Post('tickets/:id/internal-notes')
  addInternalNote(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: TicketInternalNoteDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.helpdeskTicketsService.addInternalNote(
      user.companyId,
      id,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('helpdesk.manage')
  @Post('tickets/:id/attachments')
  addAttachment(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: TicketAttachmentDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.helpdeskTicketsService.addAttachment(
      user.companyId,
      id,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }
}
