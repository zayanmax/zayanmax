import { z } from "zod";

export const projectStatuses = [
  "PLANNED",
  "ACTIVE",
  "ON_HOLD",
  "COMPLETED",
  "CANCELLED",
  "ARCHIVED",
] as const;

const optionalString = z.string().trim().optional();

export const projectSchema = z.object({
  name: z.string().trim().min(2, "Project name must be at least 2 characters"),
  description: optionalString,
  clientId: optionalString,
  status: z.enum(projectStatuses),
  startDate: optionalString,
  dueDate: optionalString,
  completedAt: optionalString,
});

export const projectMemberSchema = z.object({
  employeeId: z.string().trim().min(1, "Select an employee"),
  role: optionalString,
});

export const projectStatusSchema = z.object({
  status: z.enum(projectStatuses),
  completedAt: optionalString,
});

export type ProjectFormValues = z.infer<typeof projectSchema>;
export type ProjectMemberFormValues = z.infer<typeof projectMemberSchema>;
export type ProjectStatusFormValues = z.infer<typeof projectStatusSchema>;
