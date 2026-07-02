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
import { AddTaskAssigneeDto } from './dto/add-task-assignee.dto';
import { ChangeTaskStatusDto } from './dto/change-task-status.dto';
import { CreateSubtaskDto } from './dto/create-subtask.dto';
import { CreateTaskAttachmentDto } from './dto/create-task-attachment.dto';
import { CreateTaskCommentDto } from './dto/create-task-comment.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { TaskQueryDto } from './dto/task-query.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TasksProjectsService } from './tasks-projects.service';

@ApiTags('Projects & Tasks')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksProjectsService: TasksProjectsService) {}

  @RequirePermissions('tasks.view')
  @Get()
  findAll(
    @CurrentUserDecorator() user: CurrentUser,
    @Query() query: TaskQueryDto,
  ) {
    return this.tasksProjectsService.findTasks(user.companyId, query);
  }

  @RequirePermissions('tasks.view')
  @Get('kanban')
  kanban(
    @CurrentUserDecorator() user: CurrentUser,
    @Query() query: TaskQueryDto,
  ) {
    return this.tasksProjectsService.findTasksKanban(user.companyId, query);
  }

  @RequirePermissions('tasks.create')
  @Post()
  create(
    @CurrentUserDecorator() user: CurrentUser,
    @Body() dto: CreateTaskDto,
    @RequestContextDecorator() context: RequestContext,
  ) {
    return this.tasksProjectsService.createTask(
      user.companyId,
      user.id,
      dto,
      context.ipAddress,
      context.userAgent,
    );
  }

  @RequirePermissions('tasks.view')
  @Get(':id')
  findOne(@CurrentUserDecorator() user: CurrentUser, @Param('id') id: string) {
    return this.tasksProjectsService.findTask(user.companyId, id);
  }

  @RequirePermissions('tasks.update')
  @Patch(':id')
  update(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
    @RequestContextDecorator() context: RequestContext,
  ) {
    return this.tasksProjectsService.updateTask(
      user.companyId,
      id,
      user.id,
      dto,
      context.ipAddress,
      context.userAgent,
    );
  }

  @RequirePermissions('tasks.update')
  @Patch(':id/status')
  changeStatus(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: ChangeTaskStatusDto,
    @RequestContextDecorator() context: RequestContext,
  ) {
    return this.tasksProjectsService.changeTaskStatus(
      user.companyId,
      id,
      user.id,
      dto,
      context.ipAddress,
      context.userAgent,
    );
  }

  @RequirePermissions('tasks.delete')
  @Delete(':id')
  remove(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
    @RequestContextDecorator() context: RequestContext,
  ) {
    return this.tasksProjectsService.removeTask(
      user.companyId,
      id,
      user.id,
      context.ipAddress,
      context.userAgent,
    );
  }

  @RequirePermissions('tasks.create')
  @Post(':id/subtasks')
  createSubtask(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: CreateSubtaskDto,
    @RequestContextDecorator() context: RequestContext,
  ) {
    return this.tasksProjectsService.createSubtask(
      user.companyId,
      id,
      user.id,
      dto,
      context.ipAddress,
      context.userAgent,
    );
  }

  @RequirePermissions('tasks.view')
  @Get(':id/comments')
  listComments(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
  ) {
    return this.tasksProjectsService.listTaskComments(user.companyId, id);
  }

  @RequirePermissions('tasks.update')
  @Post(':id/comments')
  addComment(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: CreateTaskCommentDto,
    @RequestContextDecorator() context: RequestContext,
  ) {
    return this.tasksProjectsService.addTaskComment(
      user.companyId,
      id,
      user.id,
      dto,
      context.ipAddress,
      context.userAgent,
    );
  }

  @RequirePermissions('tasks.view')
  @Get(':id/attachments')
  listAttachments(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
  ) {
    return this.tasksProjectsService.listTaskAttachments(user.companyId, id);
  }

  @RequirePermissions('tasks.update')
  @Post(':id/attachments')
  addAttachment(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: CreateTaskAttachmentDto,
    @RequestContextDecorator() context: RequestContext,
  ) {
    return this.tasksProjectsService.addTaskAttachment(
      user.companyId,
      id,
      user.id,
      dto,
      context.ipAddress,
      context.userAgent,
    );
  }

  @RequirePermissions('tasks.view')
  @Get(':id/assignees')
  listAssignees(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
  ) {
    return this.tasksProjectsService.listTaskAssignees(user.companyId, id);
  }

  @RequirePermissions('tasks.update')
  @Post(':id/assignees')
  addAssignee(
    @CurrentUserDecorator() user: CurrentUser,
    @Param('id') id: string,
    @Body() dto: AddTaskAssigneeDto,
    @RequestContextDecorator() context: RequestContext,
  ) {
    return this.tasksProjectsService.addTaskAssignee(
      user.companyId,
      id,
      user.id,
      dto,
      context.ipAddress,
      context.userAgent,
    );
  }
}
