import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { tasksApi } from "@/features/tasks/api";
import type {
  AddTaskAssigneePayload,
  ChangeTaskStatusPayload,
  CreateSubtaskPayload,
  TaskAttachmentPayload,
  TaskCommentPayload,
  TaskListQuery,
  TaskPayload,
} from "@/features/tasks/types";

export const taskKeys = {
  all: ["tasks"] as const,
  list: (query: TaskListQuery) => [...taskKeys.all, "list", query] as const,
  kanban: (query: TaskListQuery) => [...taskKeys.all, "kanban", query] as const,
  detail: (id: string) => [...taskKeys.all, "detail", id] as const,
  comments: (id: string) => [...taskKeys.detail(id), "comments"] as const,
  attachments: (id: string) => [...taskKeys.detail(id), "attachments"] as const,
  assignees: (id: string) => [...taskKeys.detail(id), "assignees"] as const,
};

export function useTasks(query: TaskListQuery) {
  return useQuery({
    queryKey: taskKeys.list(query),
    queryFn: () => tasksApi.list(query),
  });
}

export function useTasksKanban(query: TaskListQuery) {
  return useQuery({
    queryKey: taskKeys.kanban(query),
    queryFn: () => tasksApi.kanban(query),
  });
}

export function useTask(id: string) {
  return useQuery({
    queryKey: taskKeys.detail(id),
    queryFn: () => tasksApi.get(id),
    enabled: Boolean(id),
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: TaskPayload) => tasksApi.create(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}

export function useUpdateTask(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<TaskPayload>) => tasksApi.update(id, payload),
    onSuccess: async (task) => {
      await queryClient.invalidateQueries({ queryKey: taskKeys.all });
      queryClient.setQueryData(taskKeys.detail(task.id), task);
    },
  });
}

export function useChangeTaskStatus(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ChangeTaskStatusPayload) =>
      tasksApi.changeStatus(id, payload),
    onSuccess: async (task) => {
      await queryClient.invalidateQueries({ queryKey: taskKeys.all });
      queryClient.setQueryData(taskKeys.detail(task.id), task);
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tasksApi.remove(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}

export function useCreateSubtask(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSubtaskPayload) =>
      tasksApi.createSubtask(id, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: taskKeys.all }),
        queryClient.invalidateQueries({ queryKey: taskKeys.detail(id) }),
      ]);
    },
  });
}

export function useTaskComments(id: string) {
  return useQuery({
    queryKey: taskKeys.comments(id),
    queryFn: () => tasksApi.listComments(id),
    enabled: Boolean(id),
  });
}

export function useAddTaskComment(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: TaskCommentPayload) => tasksApi.addComment(id, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: taskKeys.comments(id) }),
        queryClient.invalidateQueries({ queryKey: taskKeys.detail(id) }),
      ]);
    },
  });
}

export function useTaskAttachments(id: string) {
  return useQuery({
    queryKey: taskKeys.attachments(id),
    queryFn: () => tasksApi.listAttachments(id),
    enabled: Boolean(id),
  });
}

export function useAddTaskAttachment(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: TaskAttachmentPayload) =>
      tasksApi.addAttachment(id, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: taskKeys.attachments(id) }),
        queryClient.invalidateQueries({ queryKey: taskKeys.detail(id) }),
      ]);
    },
  });
}

export function useTaskAssignees(id: string) {
  return useQuery({
    queryKey: taskKeys.assignees(id),
    queryFn: () => tasksApi.listAssignees(id),
    enabled: Boolean(id),
  });
}

export function useAddTaskAssignee(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AddTaskAssigneePayload) =>
      tasksApi.addAssignee(id, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: taskKeys.assignees(id) }),
        queryClient.invalidateQueries({ queryKey: taskKeys.detail(id) }),
      ]);
    },
  });
}
