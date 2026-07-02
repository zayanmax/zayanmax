import { ConflictException, NotFoundException } from '@nestjs/common';
import { TasksProjectsService } from './tasks-projects.service';
import { ProjectStatusDto } from './dto/create-project.dto';
import { TaskPriorityDto, TaskStatusDto } from './dto/create-task.dto';

describe('TasksProjectsService', () => {
  const prisma = {
    project: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    projectMember: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    task: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    taskAssignee: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    taskComment: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    taskAttachment: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates company-scoped projects with optional client relation and audits the action', async () => {
    prisma.project.findFirst.mockResolvedValue(null);
    prisma.project.create.mockResolvedValue({
      id: 'project-id',
      companyId: 'company-id',
      name: 'Website Build',
      status: ProjectStatusDto.ACTIVE,
      clientId: 'client-id',
    });

    const service = new TasksProjectsService(prisma as never);
    const result = await service.createProject(
      'company-id',
      'actor-id',
      {
        name: 'Website Build',
        clientId: 'client-id',
        status: ProjectStatusDto.ACTIVE,
        startDate: '2026-06-12',
        dueDate: '2026-07-12',
      },
      '127.0.0.1',
      'jest',
    );

    expect(result.id).toBe('project-id');
    expect(prisma.project.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          companyId: 'company-id',
          clientId: 'client-id',
          createdById: 'actor-id',
        }),
      }),
    );
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'projects.create',
          entityType: 'Project',
          entityId: 'project-id',
        }),
      }),
    );
  });

  it('rejects duplicate active project names within a company', async () => {
    prisma.project.findFirst.mockResolvedValue({ id: 'existing-project-id' });
    const service = new TasksProjectsService(prisma as never);

    await expect(
      service.createProject('company-id', 'actor-id', {
        name: 'Website Build',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('lists projects with search, client, member, status, and pagination filters', async () => {
    prisma.project.findMany.mockResolvedValue([{ id: 'project-id' }]);
    prisma.project.count.mockResolvedValue(1);
    const service = new TasksProjectsService(prisma as never);

    const result = await service.findProjects('company-id', {
      page: 2,
      limit: 10,
      search: 'website',
      clientId: 'client-id',
      memberUserId: 'user-id',
      status: ProjectStatusDto.ACTIVE,
      sortBy: 'name',
      sortOrder: 'asc',
    });

    expect(result.meta).toEqual({
      page: 2,
      limit: 10,
      total: 1,
      totalPages: 1,
    });
    expect(prisma.project.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          companyId: 'company-id',
          deletedAt: null,
          clientId: 'client-id',
          status: ProjectStatusDto.ACTIVE,
          members: { some: { userId: 'user-id', deletedAt: null } },
        }),
        skip: 10,
        take: 10,
        orderBy: { name: 'asc' },
      }),
    );
  });

  it('adds project members and audits assignment changes', async () => {
    prisma.project.findFirst.mockResolvedValue({
      id: 'project-id',
      companyId: 'company-id',
    });
    prisma.projectMember.findFirst.mockResolvedValue(null);
    prisma.projectMember.create.mockResolvedValue({
      id: 'member-id',
      projectId: 'project-id',
    });
    const service = new TasksProjectsService(prisma as never);

    const result = await service.addProjectMember(
      'company-id',
      'project-id',
      'actor-id',
      {
        userId: 'user-id',
        employeeId: 'employee-id',
        role: 'Manager',
      },
    );

    expect(result.id).toBe('member-id');
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: 'projects.members.add' }),
      }),
    );
  });

  it('creates tasks with project, assignee, dates, priority, and audit logging', async () => {
    prisma.project.findFirst.mockResolvedValue({
      id: 'project-id',
      companyId: 'company-id',
    });
    prisma.task.create.mockResolvedValue({
      id: 'task-id',
      companyId: 'company-id',
      projectId: 'project-id',
      title: 'Design homepage',
      status: TaskStatusDto.TODO,
    });
    const service = new TasksProjectsService(prisma as never);

    const result = await service.createTask(
      'company-id',
      'actor-id',
      {
        projectId: 'project-id',
        title: 'Design homepage',
        priority: TaskPriorityDto.HIGH,
        status: TaskStatusDto.TODO,
        startDate: '2026-06-12',
        dueDate: '2026-06-20',
        assigneeUserIds: ['user-id'],
      },
      '127.0.0.1',
      'jest',
    );

    expect(result.id).toBe('task-id');
    expect(prisma.task.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          companyId: 'company-id',
          projectId: 'project-id',
          priority: TaskPriorityDto.HIGH,
          assignees: {
            create: [
              {
                companyId: 'company-id',
                userId: 'user-id',
                assignedById: 'actor-id',
              },
            ],
          },
        }),
      }),
    );
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: 'tasks.create' }),
      }),
    );
  });

  it('lists tasks with filters and supports kanban grouping by status', async () => {
    prisma.task.findMany.mockResolvedValue([
      { id: 'task-1', status: TaskStatusDto.TODO },
      { id: 'task-2', status: TaskStatusDto.IN_PROGRESS },
    ]);
    prisma.task.count.mockResolvedValue(2);
    const service = new TasksProjectsService(prisma as never);

    const list = await service.findTasks('company-id', {
      page: 1,
      limit: 20,
      search: 'design',
      projectId: 'project-id',
      status: TaskStatusDto.TODO,
      priority: TaskPriorityDto.HIGH,
      assigneeUserId: 'user-id',
      sortBy: 'dueDate',
      sortOrder: 'asc',
    });
    const kanban = await service.findTasksKanban('company-id', {
      page: 1,
      limit: 20,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      projectId: 'project-id',
    });

    expect(list.meta.total).toBe(2);
    expect(prisma.task.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          companyId: 'company-id',
          projectId: 'project-id',
          status: TaskStatusDto.TODO,
          priority: TaskPriorityDto.HIGH,
          assignees: { some: { userId: 'user-id', deletedAt: null } },
        }),
      }),
    );
    expect(kanban).toEqual(
      expect.objectContaining({
        TODO: [expect.objectContaining({ id: 'task-1' })],
        IN_PROGRESS: [expect.objectContaining({ id: 'task-2' })],
      }),
    );
  });

  it('changes task status with completion date and audit logging', async () => {
    prisma.task.findFirst.mockResolvedValue({
      id: 'task-id',
      companyId: 'company-id',
      status: TaskStatusDto.IN_PROGRESS,
    });
    prisma.task.update.mockResolvedValue({
      id: 'task-id',
      companyId: 'company-id',
      status: TaskStatusDto.DONE,
    });
    const service = new TasksProjectsService(prisma as never);

    const result = await service.changeTaskStatus(
      'company-id',
      'task-id',
      'actor-id',
      {
        status: TaskStatusDto.DONE,
        completedAt: '2026-06-21T10:00:00.000Z',
      },
    );

    expect(result.status).toBe(TaskStatusDto.DONE);
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: 'tasks.status_change' }),
      }),
    );
  });

  it('adds subtasks, comments, attachments, and assignees with scoped parent checks', async () => {
    prisma.task.findFirst.mockResolvedValue({
      id: 'task-id',
      companyId: 'company-id',
      projectId: 'project-id',
    });
    prisma.task.create.mockResolvedValue({
      id: 'subtask-id',
      parentTaskId: 'task-id',
    });
    prisma.taskComment.create.mockResolvedValue({
      id: 'comment-id',
      taskId: 'task-id',
    });
    prisma.taskAttachment.create.mockResolvedValue({
      id: 'attachment-id',
      taskId: 'task-id',
    });
    prisma.taskAssignee.findFirst.mockResolvedValue(null);
    prisma.taskAssignee.create.mockResolvedValue({
      id: 'assignee-id',
      taskId: 'task-id',
    });
    const service = new TasksProjectsService(prisma as never);

    await service.createSubtask('company-id', 'task-id', 'actor-id', {
      title: 'Copy review',
    });
    await service.addTaskComment('company-id', 'task-id', 'actor-id', {
      commentText: 'Looks good',
    });
    await service.addTaskAttachment('company-id', 'task-id', 'actor-id', {
      fileName: 'brief.pdf',
      storageKey: 'tasks/task-id/brief.pdf',
      mimeType: 'application/pdf',
      size: 1024,
    });
    await service.addTaskAssignee('company-id', 'task-id', 'actor-id', {
      userId: 'user-id',
    });

    expect(prisma.task.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          parentTaskId: 'task-id',
          projectId: 'project-id',
        }),
      }),
    );
    expect(prisma.taskComment.create).toHaveBeenCalled();
    expect(prisma.taskAttachment.create).toHaveBeenCalled();
    expect(prisma.taskAssignee.create).toHaveBeenCalled();
  });

  it('soft deletes scoped projects and tasks', async () => {
    prisma.project.updateMany.mockResolvedValue({ count: 1 });
    prisma.task.updateMany.mockResolvedValue({ count: 1 });
    const service = new TasksProjectsService(prisma as never);

    await service.removeProject('company-id', 'project-id', 'actor-id');
    await service.removeTask('company-id', 'task-id', 'actor-id');

    expect(prisma.project.updateMany).toHaveBeenCalledWith({
      where: { id: 'project-id', companyId: 'company-id', deletedAt: null },
      data: { deletedAt: expect.any(Date), updatedById: 'actor-id' },
    });
    expect(prisma.task.updateMany).toHaveBeenCalledWith({
      where: { id: 'task-id', companyId: 'company-id', deletedAt: null },
      data: { deletedAt: expect.any(Date), updatedById: 'actor-id' },
    });
  });

  it('throws when scoped task is missing', async () => {
    prisma.task.findFirst.mockResolvedValue(null);
    const service = new TasksProjectsService(prisma as never);

    await expect(
      service.findTask('company-id', 'task-id'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
