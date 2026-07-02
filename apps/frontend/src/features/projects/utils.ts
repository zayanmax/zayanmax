import type { Project, ProjectPayload } from "@/features/projects/types";
import type { ProjectFormValues } from "@/features/projects/schemas";

export function formatProjectDate(value?: string | null) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(parsed);
}

export function projectTaskProgress(project: Project) {
  const tasks = project.tasks ?? [];
  if (!tasks.length) return "No tasks";
  const done = tasks.filter((task) => task.status === "DONE").length;
  return `${done}/${tasks.length} complete`;
}

export function toProjectPayload(values: ProjectFormValues): ProjectPayload {
  return {
    name: values.name.trim(),
    description: values.description?.trim() || undefined,
    clientId: values.clientId?.trim() || undefined,
    status: values.status,
    startDate: values.startDate || undefined,
    dueDate: values.dueDate || undefined,
    completedAt: values.completedAt || undefined,
  };
}
