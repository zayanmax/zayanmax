import type { ApiMeta } from "@/types/api";
import type { Project } from "@/features/projects/types";
import type { Employee } from "@/features/employees/types";

export type TaskStatus =
  | "TODO"
  | "IN_PROGRESS"
  | "BLOCKED"
  | "REVIEW"
  | "DONE"
  | "CANCELLED";

export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type TaskCounts = {
  subtasks?: number;
  comments?: number;
  attachments?: number;
};

export type TaskAssignee = {
  id: string;
  companyId: string;
  taskId: string;
  userId?: string | null;
  employeeId?: string | null;
  assignedById?: string | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  employee?: Pick<Employee, "id" | "firstName" | "lastName" | "email"> | null;
  user?: { id: string; email: string } | null;
};

export type TaskComment = {
  id: string;
  companyId: string;
  taskId: string;
  commentText: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  createdById?: string | null;
  updatedById?: string | null;
};

export type TaskAttachment = {
  id: string;
  companyId: string;
  taskId: string;
  fileName: string;
  storageKey: string;
  mimeType: string;
  size: number;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
};

export type Task = {
  id: string;
  companyId: string;
  projectId: string;
  parentTaskId?: string | null;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  startDate?: string | null;
  dueDate?: string | null;
  completedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  createdById?: string | null;
  updatedById?: string | null;
  project?: Pick<Project, "id" | "name"> | null;
  assignees?: TaskAssignee[];
  subtasks?: Task[];
  comments?: TaskComment[];
  attachments?: TaskAttachment[];
  _count?: TaskCounts;
};

export type TaskPayload = {
  projectId: string;
  parentTaskId?: string;
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  startDate?: string;
  dueDate?: string;
  completedAt?: string;
  assigneeEmployeeIds?: string[];
  assigneeUserIds?: string[];
};

export type TaskListQuery = {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  projectId?: string;
  parentTaskId?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeUserId?: string;
  assigneeEmployeeId?: string;
};

export type TaskListResult = {
  data: Task[];
  meta: Required<ApiMeta>;
};

export type TaskKanbanResult = Record<TaskStatus, Task[]>;

export type ChangeTaskStatusPayload = {
  status: TaskStatus;
  completedAt?: string;
};

export type CreateSubtaskPayload = Omit<TaskPayload, "projectId" | "parentTaskId">;

export type TaskCommentPayload = {
  commentText: string;
};

export type TaskAttachmentPayload = {
  fileName: string;
  storageKey: string;
  mimeType: string;
  size: number;
};

export type AddTaskAssigneePayload = {
  userId?: string;
  employeeId?: string;
};
