import type { TaskAssignee, TaskPayload } from "@/features/tasks/types";
import type { TaskFormValues, SubtaskFormValues } from "@/features/tasks/schemas";

export function formatTaskDate(value?: string | null) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(parsed);
}

export function toTaskPayload(values: TaskFormValues): TaskPayload {
  return {
    projectId: values.projectId,
    parentTaskId: values.parentTaskId || undefined,
    title: values.title.trim(),
    description: values.description?.trim() || undefined,
    status: values.status,
    priority: values.priority,
    startDate: values.startDate || undefined,
    dueDate: values.dueDate || undefined,
    completedAt: values.completedAt || undefined,
    assigneeEmployeeIds: values.assigneeEmployeeId
      ? [values.assigneeEmployeeId]
      : values.assigneeEmployeeIds?.filter(Boolean),
  };
}

export function toSubtaskPayload(values: SubtaskFormValues) {
  return {
    title: values.title.trim(),
    description: values.description?.trim() || undefined,
    status: values.status,
    priority: values.priority,
    startDate: values.startDate || undefined,
    dueDate: values.dueDate || undefined,
    completedAt: values.completedAt || undefined,
    assigneeEmployeeIds: values.assigneeEmployeeId
      ? [values.assigneeEmployeeId]
      : values.assigneeEmployeeIds?.filter(Boolean),
  };
}

export function assigneeLabel(assignee: TaskAssignee) {
  if (assignee.employee) {
    const fullName = `${assignee.employee.firstName} ${assignee.employee.lastName}`.trim();
    return fullName || assignee.employee.email;
  }
  if (assignee.user?.email) return assignee.user.email;
  if (assignee.employeeId) return "Assigned employee";
  if (assignee.userId) return "Assigned user";
  return "Unassigned";
}
