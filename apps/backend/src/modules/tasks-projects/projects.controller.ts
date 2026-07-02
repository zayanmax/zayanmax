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
import { AddProjectMemberDto } from './dto/add-project-member.dto';
import { ChangeProjectStatusDto } from './dto/change-project-status.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { ProjectQueryDto } from './dto/project-query.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { TasksProjectsService } from './tasks-projects.service';

@ApiTags('Projects & Tasks')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly tasksProjectsService: TasksProjectsService) {}

  @RequirePermissions('projects.view')
  @Get()
  findAll(
    @CurrentUserDecorator() user: CurrentUser,
    @Query() query: ProjectQueryDto,
  ) {
    return this.tasksProjectsService.findProjects(user.companyId, query);
  }

  @RequirePermissions('projects.create')
  @Post()
  create(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() dto: CreateProjectDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.tasksProjectsService.createProject(
      user.companyId,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('projects.view')
  @Get(':id')
  findOne(@CurrentUserDecorator() user: CurrentUser, @Param('id') id: string) {
    return this.tasksProjectsService.findProject(user.companyId, id);
  }

  @RequirePermissions('projects.update')
  @Patch(':id')
  update(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.tasksProjectsService.updateProject(
      user.companyId,
      id,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('projects.update')
  @Patch(':id/status')
  changeStatus(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: ChangeProjectStatusDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.tasksProjectsService.changeProjectStatus(
      user.companyId,
      id,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('projects.delete')
  @Delete(':id')
  remove(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.tasksProjectsService.removeProject(
      user.companyId,
      id,
      user.id,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('projects.view')
  @Get(':id/members')
  listMembers(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
  ) {
    return this.tasksProjectsService.listProjectMembers(user.companyId, id);
  }

  @RequirePermissions('projects.update')
  @Post(':id/members')
  addMember(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: AddProjectMemberDto,
    @Ip() ipAddress: string,
    @Req() request: Request,
  ) {
    return this.tasksProjectsService.addProjectMember(
      user.companyId,
      id,
      user.id,
      dto,
      ipAddress,
      request.headers['user-agent'],
    );
  }

  @RequirePermissions('projects.update')
  @Delete(':id/members/:memberId')
  removeMember(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
    @Param('memberId') memberId: string,
  ) {
    return this.tasksProjectsService.removeProjectMember(
      user.companyId,
      id,
      memberId,
      user.id,
    );
  }
}
