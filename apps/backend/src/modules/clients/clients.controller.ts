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
import { ClientsService } from './clients.service';
import { ChangeClientStatusDto } from './dto/change-client-status.dto';
import { ClientQueryDto } from './dto/client-query.dto';
import { CreateClientActivityDto } from './dto/create-client-activity.dto';
import { CreateClientContactDto } from './dto/create-client-contact.dto';
import { CreateClientDocumentDto } from './dto/create-client-document.dto';
import { CreateClientNoteDto } from './dto/create-client-note.dto';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @RequirePermissions('clients.view')
  @Get()
  findAll(
    @CurrentUserDecorator() user: CurrentUser,
    @Query() query: ClientQueryDto,
  ) {
    return this.clientsService.findAll(user.companyId, query);
  }

  @RequirePermissions('clients.create')
  @Post()
  create(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() dto: CreateClientDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.clientsService.create(
      user.companyId,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('clients.view')
  @Get(':id')
  findOne(@CurrentUserDecorator() user: CurrentUser, @Param('id') id: string) {
    return this.clientsService.findOne(user.companyId, id);
  }

  @RequirePermissions('clients.update')
  @Patch(':id')
  update(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: UpdateClientDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.clientsService.update(
      user.companyId,
      id,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('clients.update')
  @Patch(':id/status')
  changeStatus(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: ChangeClientStatusDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.clientsService.changeStatus(
      user.companyId,
      id,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('clients.delete')
  @Delete(':id')
  remove(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.clientsService.remove(
      user.companyId,
      id,
      user.id,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('clients.view')
  @Get(':id/contacts')
  listContacts(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
  ) {
    return this.clientsService.listContacts(user.companyId, id);
  }

  @RequirePermissions('clients.update')
  @Post(':id/contacts')
  addContact(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: CreateClientContactDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.clientsService.addContact(
      user.companyId,
      id,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('clients.view')
  @Get(':id/activities')
  listActivities(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
  ) {
    return this.clientsService.listActivities(user.companyId, id);
  }

  @RequirePermissions('clients.update')
  @Post(':id/activities')
  addActivity(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: CreateClientActivityDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.clientsService.addActivity(
      user.companyId,
      id,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('clients.view')
  @Get(':id/notes')
  listNotes(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
  ) {
    return this.clientsService.listNotes(user.companyId, id);
  }

  @RequirePermissions('clients.update')
  @Post(':id/notes')
  addNote(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: CreateClientNoteDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.clientsService.addNote(
      user.companyId,
      id,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('clients.view')
  @Get(':id/documents')
  listDocuments(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
  ) {
    return this.clientsService.listDocuments(user.companyId, id);
  }

  @RequirePermissions('clients.update')
  @Post(':id/documents')
  addDocument(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: CreateClientDocumentDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.clientsService.addDocument(
      user.companyId,
      id,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }
}
