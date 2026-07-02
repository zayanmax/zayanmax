import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUserDecorator } from '../../common/decorators/current-user.decorator';
import { RequestContextDecorator } from '../../common/decorators/request-context.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import type { CurrentUser } from '../../common/types/current-user.type';
import type { RequestContext } from '../../common/types/request-context.type';
import { ClientsService } from './clients.service';
import { ChangeClientStatusDto } from './dto/change-client-status.dto';
import { ClientQueryDto } from './dto/client-query.dto';
import { CreateClientActivityDto } from './dto/create-client-activity.dto';
import { CreateClientContactDto } from './dto/create-client-contact.dto';
import { CreateClientDocumentDto } from './dto/create-client-document.dto';
import { CreateClientNoteDto } from './dto/create-client-note.dto';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@ApiTags('Clients')
@ApiBearerAuth('bearer')
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
    @RequestContextDecorator() context: RequestContext,
  ) {
    return this.clientsService.create(
      user.companyId,
      user.id,
      dto,
      context.ipAddress,
      context.userAgent,
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
    @RequestContextDecorator() context: RequestContext,
  ) {
    return this.clientsService.update(
      user.companyId,
      id,
      user.id,
      dto,
      context.ipAddress,
      context.userAgent,
    );
  }

  @RequirePermissions('clients.update')
  @Patch(':id/status')
  changeStatus(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: ChangeClientStatusDto,
    @RequestContextDecorator() context: RequestContext,
  ) {
    return this.clientsService.changeStatus(
      user.companyId,
      id,
      user.id,
      dto,
      context.ipAddress,
      context.userAgent,
    );
  }

  @RequirePermissions('clients.delete')
  @Delete(':id')
  remove(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
    @RequestContextDecorator() context: RequestContext,
  ) {
    return this.clientsService.remove(
      user.companyId,
      id,
      user.id,
      context.ipAddress,
      context.userAgent,
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
    @RequestContextDecorator() context: RequestContext,
  ) {
    return this.clientsService.addContact(
      user.companyId,
      id,
      user.id,
      dto,
      context.ipAddress,
      context.userAgent,
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
    @RequestContextDecorator() context: RequestContext,
  ) {
    return this.clientsService.addActivity(
      user.companyId,
      id,
      user.id,
      dto,
      context.ipAddress,
      context.userAgent,
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
    @RequestContextDecorator() context: RequestContext,
  ) {
    return this.clientsService.addNote(
      user.companyId,
      id,
      user.id,
      dto,
      context.ipAddress,
      context.userAgent,
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
    @RequestContextDecorator() context: RequestContext,
  ) {
    return this.clientsService.addDocument(
      user.companyId,
      id,
      user.id,
      dto,
      context.ipAddress,
      context.userAgent,
    );
  }
}
