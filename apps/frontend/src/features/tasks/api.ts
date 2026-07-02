import { apiRequest } from "@/lib/api/client";
import type {
  AddTaskAssigneePayload,
  ChangeTaskStatusPayload,
  CreateSubtaskPayload,
  Task,
  TaskAssignee,
  TaskAttachment,
  TaskAttachmentPayload,
  TaskComment,
  TaskCommentPayload,
  TaskKanbanResult,
  TaskListQuery,
  TaskListResult,
  TaskPayload,
} from "@/features/tasks/types";

export const tasksApi = {
  list: (params: TaskListQuery) =>
    apiRequest<TaskListResult>({
      url: "/tasks",
      method: "GET",
      params,
    }),
  kanban: (params: TaskListQuery) =>
    apiRequest<TaskKanbanResult>({
      url: "/tasks/kanban",
      method: "GET",
      params,
    }),
  get: (id: string) =>
    apiRequest<Task>({
      url: `/tasks/${id}`,
      method: "GET",
    }),
  create: (payload: TaskPayload) =>
    apiRequest<Task>({
      url: "/tasks",
      method: "POST",
      data: payload,
    }),
  update: (id: string, payload: Partial<TaskPayload>) =>
    apiRequest<Task>({
      url: `/tasks/${id}`,
      method: "PATCH",
      data: payload,
    }),
  changeStatus: (id: string, payload: ChangeTaskStatusPayload) =>
    apiRequest<Task>({
      url: `/tasks/${id}/status`,
      method: "PATCH",
      data: payload,
    }),
  remove: (id: string) =>
    apiRequest<{ deleted: boolean }>({
      url: `/tasks/${id}`,
      method: "DELETE",
    }),
  createSubtask: (id: string, payload: CreateSubtaskPayload) =>
    apiRequest<Task>({
      url: `/tasks/${id}/subtasks`,
      method: "POST",
      data: payload,
    }),
  listComments: (id: string) =>
    apiRequest<TaskComment[]>({
      url: `/tasks/${id}/comments`,
      method: "GET",
    }),
  addComment: (id: string, payload: TaskCommentPayload) =>
    apiRequest<TaskComment>({
      url: `/tasks/${id}/comments`,
      method: "POST",
      data: payload,
    }),
  listAttachments: (id: string) =>
    apiRequest<TaskAttachment[]>({
      url: `/tasks/${id}/attachments`,
      method: "GET",
    }),
  addAttachment: (id: string, payload: TaskAttachmentPayload) =>
    apiRequest<TaskAttachment>({
      url: `/tasks/${id}/attachments`,
      method: "POST",
      data: payload,
    }),
  listAssignees: (id: string) =>
    apiRequest<TaskAssignee[]>({
      url: `/tasks/${id}/assignees`,
      method: "GET",
    }),
  addAssignee: (id: string, payload: AddTaskAssigneePayload) =>
    apiRequest<TaskAssignee>({
      url: `/tasks/${id}/assignees`,
      method: "POST",
      data: payload,
    }),
};
