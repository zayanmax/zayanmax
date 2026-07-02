import { z } from "zod";

export const taskStatuses = [
  "TODO",
  "IN_PROGRESS",
  "BLOCKED",
  "REVIEW",
  "DONE",
  "CANCELLED",
] as const;

export const taskPriorities = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

const optionalString = z.string().trim().optional();

export const taskSchema = z.object({
  projectId: z.string().trim().min(1, "Select a project"),
  parentTaskId: optionalString,
  title: z.string().trim().min(2, "Task title must be at least 2 characters"),
  description: optionalString,
  status: z.enum(taskStatuses),
  priority: z.enum(taskPriorities),
  startDate: optionalString,
  dueDate: optionalString,
  completedAt: optionalString,
  assigneeEmployeeId: optionalString,
  assigneeEmployeeIds: z.array(z.string()).optional(),
});

export const subtaskSchema = taskSchema.omit({
  projectId: true,
  parentTaskId: true,
});

export const taskCommentSchema = z.object({
  commentText: z.string().trim().min(1, "Comment is required"),
});

export const taskAttachmentSchema = z.object({
  fileName: z.string().trim().min(2, "File name must be at least 2 characters"),
  storageKey: z.string().trim().min(2, "Storage key must be at least 2 characters"),
  mimeType: z.string().trim().min(2, "MIME type is required"),
  size: z.number().int().min(1, "Size must be at least 1 byte"),
});

export const taskAssigneeSchema = z.object({
  employeeId: z.string().trim().min(1, "Select an employee"),
});

export type TaskFormValues = z.infer<typeof taskSchema>;
export type SubtaskFormValues = z.infer<typeof subtaskSchema>;
export type TaskCommentFormValues = z.infer<typeof taskCommentSchema>;
export type TaskAttachmentFormValues = z.infer<typeof taskAttachmentSchema>;
export type TaskAssigneeFormValues = z.infer<typeof taskAssigneeSchema>;
