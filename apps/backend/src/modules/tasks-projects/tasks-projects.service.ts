import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AddProjectMemberDto } from './dto/add-project-member.dto';
import { AddTaskAssigneeDto } from './dto/add-task-assignee.dto';
import { ChangeProjectStatusDto } from './dto/change-project-status.dto';
import { ChangeTaskStatusDto } from './dto/change-task-status.dto';
import { CreateProjectDto, ProjectStatusDto } from './dto/create-project.dto';
import { CreateSubtaskDto } from './dto/create-subtask.dto';
import { CreateTaskAttachmentDto } from './dto/create-task-attachment.dto';
import { CreateTaskCommentDto } from './dto/create-task-comment.dto';
import {
  CreateTaskDto,
  TaskPriorityDto,
  TaskStatusDto,
} from './dto/create-task.dto';
import { ProjectQueryDto } from './dto/project-query.dto';
import { TaskQueryDto } from './dto/task-query.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

const TASK_STATUSES = Object.values(TaskStatusDto);

@Injectable()
export class TasksProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async createProject(
    companyId: string,
    actorId: string,
    dto: CreateProjectDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    await this.ensureNoDuplicateProject(companyId, dto.name);
    const project = await this.prisma.project.create({
      data: {
        companyId,
        clientId: dto.clientId,
        name: dto.name,
        description: dto.description,
        status: dto.status ?? ProjectStatusDto.PLANNED,
        startDate: this.toDate(dto.startDate),
        dueDate: this.toDate(dto.dueDate),
        completedAt: this.toDate(dto.completedAt),
        createdById: actorId,
      },
    });

    await this.audit(
      companyId,
      actorId,
      'projects.create',
      'Project',
      project.id,
      undefined,
      project,
      ipAddress,
      userAgent,
    );
    return project;
  }

  async findProjects(companyId: string, query: ProjectQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.ProjectWhereInput = {
      companyId,
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.clientId ? { clientId: query.clientId } : {}),
      ...(query.memberUserId
        ? { members: { some: { userId: query.memberUserId, deletedAt: null } } }
        : {}),
      ...(query.memberEmployeeId
        ? {
            members: {
              some: { employeeId: query.memberEmployeeId, deletedAt: null },
            },
          }
        : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { description: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [query.sortBy ?? 'createdAt']: query.sortOrder ?? 'desc' },
        include: {
          client: { select: { id: true, name: true } },
          _count: { select: { members: true, tasks: true } },
        },
      }),
      this.prisma.project.count({ where }),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findProject(companyId: string, id: string) {
    const project = await this.prisma.project.findFirst({
      where: { id, companyId, deletedAt: null },
      include: {
        client: { select: { id: true, name: true } },
        members: { where: { deletedAt: null }, orderBy: { createdAt: 'desc' } },
        tasks: {
          where: { deletedAt: null, parentTaskId: null },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async updateProject(
    companyId: string,
    id: string,
    actorId: string,
    dto: UpdateProjectDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const oldValue = await this.findProject(companyId, id);
    if (dto.name) await this.ensureNoDuplicateProject(companyId, dto.name, id);
    const project = await this.prisma.project.update({
      where: { id },
      data: {
        clientId: dto.clientId,
        name: dto.name,
        description: dto.description,
        status: dto.status,
        startDate: this.toDate(dto.startDate),
        dueDate: this.toDate(dto.dueDate),
        completedAt: this.toDate(dto.completedAt),
        updatedById: actorId,
      },
    });
    await this.audit(
      companyId,
      actorId,
      'projects.update',
      'Project',
      id,
      oldValue,
      project,
      ipAddress,
      userAgent,
    );
    return project;
  }

  async changeProjectStatus(
    companyId: string,
    id: string,
    actorId: string,
    dto: ChangeProjectStatusDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const oldValue = await this.findProject(companyId, id);
    const project = await this.prisma.project.update({
      where: { id },
      data: {
        status: dto.status,
        completedAt: this.toDate(dto.completedAt),
        updatedById: actorId,
      },
    });
    await this.audit(
      companyId,
      actorId,
      'projects.status_change',
      'Project',
      id,
      oldValue,
      project,
      ipAddress,
      userAgent,
    );
    return project;
  }

  async removeProject(
    companyId: string,
    id: string,
    actorId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const result = await this.prisma.project.updateMany({
      where: { id, companyId, deletedAt: null },
      data: { deletedAt: new Date(), updatedById: actorId },
    });
    if (result.count === 0) throw new NotFoundException('Project not found');
    await this.audit(
      companyId,
      actorId,
      'projects.delete',
      'Project',
      id,
      undefined,
      { deleted: true },
      ipAddress,
      userAgent,
    );
    return { deleted: true };
  }

  async addProjectMember(
    companyId: string,
    projectId: string,
    actorId: string,
    dto: AddProjectMemberDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    this.ensureUserOrEmployee(dto.userId, dto.employeeId);
    await this.assertProject(companyId, projectId);
    const existing = await this.prisma.projectMember.findFirst({
      where: {
        companyId,
        projectId,
        deletedAt: null,
        OR: [
          ...(dto.userId ? [{ userId: dto.userId }] : []),
          ...(dto.employeeId ? [{ employeeId: dto.employeeId }] : []),
        ],
      },
    });
    if (existing) throw new ConflictException('Project member already exists');

    const member = await this.prisma.projectMember.create({
      data: {
        companyId,
        projectId,
        userId: dto.userId,
        employeeId: dto.employeeId,
        role: dto.role,
        createdById: actorId,
      },
    });
    await this.audit(
      companyId,
      actorId,
      'projects.members.add',
      'Project',
      projectId,
      undefined,
      member,
      ipAddress,
      userAgent,
    );
    return member;
  }

  async listProjectMembers(companyId: string, projectId: string) {
    await this.assertProject(companyId, projectId);
    return this.prisma.projectMember.findMany({
      where: { companyId, projectId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async removeProjectMember(
    companyId: string,
    projectId: string,
    memberId: string,
    actorId: string,
  ) {
    await this.assertProject(companyId, projectId);
    const result = await this.prisma.projectMember.deleteMany({
      where: { id: memberId, companyId, projectId },
    });
    if (result.count === 0)
      throw new NotFoundException('Project member not found');
    await this.audit(
      companyId,
      actorId,
      'projects.members.remove',
      'Project',
      projectId,
      undefined,
      { memberId },
    );
    return { deleted: true };
  }

  async createTask(
    companyId: string,
    actorId: string,
    dto: CreateTaskDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    await this.assertProject(companyId, dto.projectId);
    if (dto.parentTaskId) await this.assertTask(companyId, dto.parentTaskId);
    const task = await this.prisma.task.create({
      data: {
        companyId,
        projectId: dto.projectId,
        parentTaskId: dto.parentTaskId,
        title: dto.title,
        description: dto.description,
        status: dto.status ?? TaskStatusDto.TODO,
        priority: dto.priority ?? TaskPriorityDto.MEDIUM,
        startDate: this.toDate(dto.startDate),
        dueDate: this.toDate(dto.dueDate),
        completedAt: this.toDate(dto.completedAt),
        createdById: actorId,
        assignees: this.assigneeCreate(
          dto.assigneeUserIds,
          dto.assigneeEmployeeIds,
          companyId,
          actorId,
        ),
      },
    });
    await this.audit(
      companyId,
      actorId,
      'tasks.create',
      'Task',
      task.id,
      undefined,
      task,
      ipAddress,
      userAgent,
    );
    return task;
  }

  async findTasks(companyId: string, query: TaskQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = this.taskWhere(companyId, query);
    const [data, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [query.sortBy ?? 'createdAt']: query.sortOrder ?? 'desc' },
        include: this.taskInclude(),
      }),
      this.prisma.task.count({ where }),
    ]);
    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findTasksKanban(companyId: string, query: TaskQueryDto) {
    const tasks = await this.prisma.task.findMany({
      where: this.taskWhere(companyId, query),
      orderBy: [{ status: 'asc' }, { dueDate: 'asc' }, { createdAt: 'desc' }],
      include: this.taskInclude(),
    });
    const groups = TASK_STATUSES.reduce(
      (result, status) => ({ ...result, [status]: [] }),
      {} as Record<TaskStatusDto, unknown[]>,
    );
    for (const task of tasks) {
      groups[String(task.status) as TaskStatusDto].push(task);
    }
    return groups;
  }

  async findTask(companyId: string, id: string) {
    const task = await this.prisma.task.findFirst({
      where: { id, companyId, deletedAt: null },
      include: {
        ...this.taskInclude(),
        subtasks: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
        },
        comments: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
        },
        attachments: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  async updateTask(
    companyId: string,
    id: string,
    actorId: string,
    dto: UpdateTaskDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const oldValue = await this.findTask(companyId, id);
    if (dto.projectId) await this.assertProject(companyId, dto.projectId);
    if (dto.parentTaskId) await this.assertTask(companyId, dto.parentTaskId);
    const task = await this.prisma.task.update({
      where: { id },
      data: {
        projectId: dto.projectId,
        parentTaskId: dto.parentTaskId,
        title: dto.title,
        description: dto.description,
        status: dto.status,
        priority: dto.priority,
        startDate: this.toDate(dto.startDate),
        dueDate: this.toDate(dto.dueDate),
        completedAt: this.toDate(dto.completedAt),
        updatedById: actorId,
      },
    });
    await this.audit(
      companyId,
      actorId,
      'tasks.update',
      'Task',
      id,
      oldValue,
      task,
      ipAddress,
      userAgent,
    );
    return task;
  }

  async changeTaskStatus(
    companyId: string,
    id: string,
    actorId: string,
    dto: ChangeTaskStatusDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const oldValue = await this.findTask(companyId, id);
    const task = await this.prisma.task.update({
      where: { id },
      data: {
        status: dto.status,
        completedAt: this.toDate(dto.completedAt),
        updatedById: actorId,
      },
    });
    await this.audit(
      companyId,
      actorId,
      'tasks.status_change',
      'Task',
      id,
      oldValue,
      task,
      ipAddress,
      userAgent,
    );
    return task;
  }

  async removeTask(
    companyId: string,
    id: string,
    actorId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const result = await this.prisma.task.updateMany({
      where: { id, companyId, deletedAt: null },
      data: { deletedAt: new Date(), updatedById: actorId },
    });
    if (result.count === 0) throw new NotFoundException('Task not found');
    await this.audit(
      companyId,
      actorId,
      'tasks.delete',
      'Task',
      id,
      undefined,
      { deleted: true },
      ipAddress,
      userAgent,
    );
    return { deleted: true };
  }

  async createSubtask(
    companyId: string,
    parentTaskId: string,
    actorId: string,
    dto: CreateSubtaskDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const parent = await this.assertTask(companyId, parentTaskId);
    return this.createTask(
      companyId,
      actorId,
      { ...dto, projectId: parent.projectId, parentTaskId },
      ipAddress,
      userAgent,
    );
  }

  async addTaskComment(
    companyId: string,
    taskId: string,
    actorId: string,
    dto: CreateTaskCommentDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    await this.assertTask(companyId, taskId);
    const comment = await this.prisma.taskComment.create({
      data: {
        companyId,
        taskId,
        commentText: dto.commentText,
        createdById: actorId,
      },
    });
    await this.audit(
      companyId,
      actorId,
      'tasks.comments.create',
      'Task',
      taskId,
      undefined,
      comment,
      ipAddress,
      userAgent,
    );
    return comment;
  }

  async listTaskComments(companyId: string, taskId: string) {
    await this.assertTask(companyId, taskId);
    return this.prisma.taskComment.findMany({
      where: { companyId, taskId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addTaskAttachment(
    companyId: string,
    taskId: string,
    actorId: string,
    dto: CreateTaskAttachmentDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    await this.assertTask(companyId, taskId);
    const attachment = await this.prisma.taskAttachment.create({
      data: {
        companyId,
        taskId,
        fileName: dto.fileName,
        storageKey: dto.storageKey,
        mimeType: dto.mimeType,
        size: dto.size,
        createdById: actorId,
      },
    });
    await this.audit(
      companyId,
      actorId,
      'tasks.attachments.create',
      'Task',
      taskId,
      undefined,
      attachment,
      ipAddress,
      userAgent,
    );
    return attachment;
  }

  async listTaskAttachments(companyId: string, taskId: string) {
    await this.assertTask(companyId, taskId);
    return this.prisma.taskAttachment.findMany({
      where: { companyId, taskId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addTaskAssignee(
    companyId: string,
    taskId: string,
    actorId: string,
    dto: AddTaskAssigneeDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    this.ensureUserOrEmployee(dto.userId, dto.employeeId);
    await this.assertTask(companyId, taskId);
    const existing = await this.prisma.taskAssignee.findFirst({
      where: {
        companyId,
        taskId,
        deletedAt: null,
        OR: [
          ...(dto.userId ? [{ userId: dto.userId }] : []),
          ...(dto.employeeId ? [{ employeeId: dto.employeeId }] : []),
        ],
      },
    });
    if (existing) throw new ConflictException('Task assignee already exists');
    const assignee = await this.prisma.taskAssignee.create({
      data: {
        companyId,
        taskId,
        userId: dto.userId,
        employeeId: dto.employeeId,
        assignedById: actorId,
      },
    });
    await this.audit(
      companyId,
      actorId,
      'tasks.assignees.add',
      'Task',
      taskId,
      undefined,
      assignee,
      ipAddress,
      userAgent,
    );
    return assignee;
  }

  async listTaskAssignees(companyId: string, taskId: string) {
    await this.assertTask(companyId, taskId);
    return this.prisma.taskAssignee.findMany({
      where: { companyId, taskId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async ensureNoDuplicateProject(
    companyId: string,
    name: string,
    excludeId?: string,
  ) {
    const existing = await this.prisma.project.findFirst({
      where: {
        companyId,
        deletedAt: null,
        name: { equals: name, mode: 'insensitive' },
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    if (existing)
      throw new ConflictException('Project already exists with the same name');
  }

  private async assertProject(companyId: string, id: string) {
    const project = await this.prisma.project.findFirst({
      where: { id, companyId, deletedAt: null },
      select: { id: true },
    });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  private async assertTask(companyId: string, id: string) {
    const task = await this.prisma.task.findFirst({
      where: { id, companyId, deletedAt: null },
      select: { id: true, projectId: true },
    });
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  private taskWhere(
    companyId: string,
    query: TaskQueryDto,
  ): Prisma.TaskWhereInput {
    return {
      companyId,
      deletedAt: null,
      ...(query.projectId ? { projectId: query.projectId } : {}),
      ...(query.parentTaskId ? { parentTaskId: query.parentTaskId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.priority ? { priority: query.priority } : {}),
      ...(query.assigneeUserId
        ? {
            assignees: {
              some: { userId: query.assigneeUserId, deletedAt: null },
            },
          }
        : {}),
      ...(query.assigneeEmployeeId
        ? {
            assignees: {
              some: { employeeId: query.assigneeEmployeeId, deletedAt: null },
            },
          }
        : {}),
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search, mode: 'insensitive' } },
              { description: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
  }

  private taskInclude() {
    return {
      project: { select: { id: true, name: true } },
      assignees: {
        where: { deletedAt: null },
        include: {
          employee: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          user: { select: { id: true, email: true } },
        },
      },
      _count: { select: { subtasks: true, comments: true, attachments: true } },
    };
  }

  private assigneeCreate(
    userIds: string[] | undefined,
    employeeIds: string[] | undefined,
    companyId: string,
    actorId: string,
  ) {
    const create = [
      ...(userIds ?? []).map((userId) => ({
        companyId,
        userId,
        assignedById: actorId,
      })),
      ...(employeeIds ?? []).map((employeeId) => ({
        companyId,
        employeeId,
        assignedById: actorId,
      })),
    ];
    return create.length ? { create } : undefined;
  }

  private ensureUserOrEmployee(userId?: string, employeeId?: string) {
    if (!userId && !employeeId) {
      throw new BadRequestException('Provide either userId or employeeId');
    }
  }

  private toDate(value?: string) {
    return value ? new Date(value) : undefined;
  }

  private audit(
    companyId: string,
    actorId: string,
    action: string,
    entityType: string,
    entityId: string,
    oldValue?: unknown,
    newValue?: unknown,
    ipAddress?: string,
    userAgent?: string,
  ) {
    return this.prisma.auditLog.create({
      data: {
        companyId,
        actorId,
        action,
        entityType,
        entityId,
        oldValue: oldValue as Prisma.InputJsonValue,
        newValue: newValue as Prisma.InputJsonValue,
        ipAddress,
        userAgent,
      },
    });
  }
}
