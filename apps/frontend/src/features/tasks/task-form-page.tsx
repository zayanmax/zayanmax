"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { FormFieldWrapper } from "@/components/forms/form-field-wrapper";
import { SelectField } from "@/components/forms/select-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataCard } from "@/components/shared/data-card";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { PermissionGuard } from "@/components/shared/permission-guard";
import { useEmployees } from "@/features/employees/hooks";
import type { Employee } from "@/features/employees/types";
import { useProjects } from "@/features/projects/hooks";
import { taskSchema, type TaskFormValues } from "@/features/tasks/schemas";
import {
  useCreateTask,
  useTask,
  useTasks,
  useUpdateTask,
} from "@/features/tasks/hooks";
import type { Task } from "@/features/tasks/types";
import { toTaskPayload } from "@/features/tasks/utils";
import { ApiClientError } from "@/lib/api/client";

const NONE = "__none__";

const statusOptions = [
  { value: "TODO", label: "To do" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "BLOCKED", label: "Blocked" },
  { value: "REVIEW", label: "Review" },
  { value: "DONE", label: "Done" },
  { value: "CANCELLED", label: "Cancelled" },
];

const priorityOptions = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
];

export function TaskFormPage({ taskId }: { taskId?: string }) {
  const router = useRouter();
  const isEdit = Boolean(taskId);
  const permission = isEdit ? "tasks.update" : "tasks.create";
  const task = useTask(taskId ?? "");
  const projects = useProjects({ page: 1, limit: 100, sortBy: "name", sortOrder: "asc" });
  const tasks = useTasks({ page: 1, limit: 100, sortBy: "title", sortOrder: "asc" });
  const employees = useEmployees({ page: 1, limit: 100, sortBy: "firstName", sortOrder: "asc" });
  const createMutation = useCreateTask();
  const updateMutation = useUpdateTask(taskId ?? "");
  const [formError, setFormError] = useState<string | null>(null);

  const projectOptions = useMemo(
    () =>
      (projects.data?.data ?? []).map((project) => ({
        value: project.id,
        label: project.name,
      })),
    [projects.data?.data],
  );

  const parentTaskOptions = useMemo(
    () => [
      { value: NONE, label: "No parent task" },
      ...(tasks.data?.data ?? [])
        .filter((item) => item.id !== taskId)
        .map((item) => ({ value: item.id, label: item.title })),
    ],
    [taskId, tasks.data?.data],
  );

  const employeeOptions = useMemo(
    () => [
      { value: NONE, label: "No assignee" },
      ...(employees.data?.data ?? []).map((employee) => ({
        value: employee.id,
        label: employeeName(employee),
      })),
    ],
    [employees.data?.data],
  );

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: defaultValues(),
  });

  useEffect(() => {
    if (task.data) form.reset(defaultValues(task.data));
  }, [form, task.data]);

  async function onSubmit(values: TaskFormValues) {
    setFormError(null);
    try {
      const payload = toTaskPayload({
        ...values,
        parentTaskId: values.parentTaskId === NONE ? "" : values.parentTaskId,
        assigneeEmployeeId:
          values.assigneeEmployeeId === NONE ? "" : values.assigneeEmployeeId,
      });
      const saved = isEdit
        ? await updateMutation.mutateAsync(payload)
        : await createMutation.mutateAsync(payload);
      router.replace(`/tasks/${saved.id}`);
    } catch (caught) {
      setFormError(
        caught instanceof ApiClientError ? caught.message : "Unable to save task",
      );
    }
  }

  const errorMessage =
    task.error instanceof ApiClientError
      ? task.error.message
      : task.error instanceof Error
        ? task.error.message
        : undefined;

  return (
    <PermissionGuard
      permission={permission}
      fallback={
        <ErrorState
          title="Permission required"
          message="You do not have permission to manage tasks."
        />
      }
    >
      <div className="flex flex-col gap-6">
        <PageHeader
          title={isEdit ? "Edit Task" : "New Task"}
          description="Create and maintain task delivery records."
        />

        {isEdit && task.isLoading ? <LoadingState rows={6} /> : null}
        {task.error ? (
          <ErrorState title="Unable to load task" message={errorMessage} />
        ) : null}

        {(!isEdit || task.data) && !task.error ? (
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <DataCard title="Basic Task Details">
              <div className="grid gap-4 md:grid-cols-2">
                <FormFieldWrapper label="Project" error={form.formState.errors.projectId?.message}>
                  <Controller
                    control={form.control}
                    name="projectId"
                    render={({ field }) => (
                      <SelectField
                        value={field.value}
                        onValueChange={field.onChange}
                        options={projectOptions}
                        placeholder="Select project"
                      />
                    )}
                  />
                </FormFieldWrapper>
                <FormFieldWrapper label="Parent task">
                  <Controller
                    control={form.control}
                    name="parentTaskId"
                    render={({ field }) => (
                      <SelectField
                        value={field.value || NONE}
                        onValueChange={field.onChange}
                        options={parentTaskOptions}
                      />
                    )}
                  />
                </FormFieldWrapper>
                <FormFieldWrapper
                  label="Task title"
                  htmlFor="title"
                  error={form.formState.errors.title?.message}
                >
                  <Input id="title" {...form.register("title")} />
                </FormFieldWrapper>
                {!isEdit ? (
                  <FormFieldWrapper label="Assignee">
                    <Controller
                      control={form.control}
                      name="assigneeEmployeeId"
                      render={({ field }) => (
                        <SelectField
                          value={field.value || NONE}
                          onValueChange={field.onChange}
                          options={employeeOptions}
                        />
                      )}
                    />
                  </FormFieldWrapper>
                ) : null}
                <FormFieldWrapper label="Status" error={form.formState.errors.status?.message}>
                  <Controller
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <SelectField
                        value={field.value}
                        onValueChange={field.onChange}
                        options={statusOptions}
                      />
                    )}
                  />
                </FormFieldWrapper>
                <FormFieldWrapper label="Priority" error={form.formState.errors.priority?.message}>
                  <Controller
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <SelectField
                        value={field.value}
                        onValueChange={field.onChange}
                        options={priorityOptions}
                      />
                    )}
                  />
                </FormFieldWrapper>
              </div>
              <FormFieldWrapper label="Description" htmlFor="description">
                <Input id="description" {...form.register("description")} />
              </FormFieldWrapper>
            </DataCard>

            <DataCard title="Dates">
              <div className="grid gap-4 md:grid-cols-3">
                <FormFieldWrapper label="Start date" htmlFor="startDate">
                  <Input id="startDate" type="date" {...form.register("startDate")} />
                </FormFieldWrapper>
                <FormFieldWrapper label="Due date" htmlFor="dueDate">
                  <Input id="dueDate" type="date" {...form.register("dueDate")} />
                </FormFieldWrapper>
                <FormFieldWrapper label="Completed date" htmlFor="completedAt">
                  <Input id="completedAt" type="date" {...form.register("completedAt")} />
                </FormFieldWrapper>
              </div>
            </DataCard>

            {formError ? <ErrorState title="Unable to save task" message={formError} /> : null}

            <div className="flex items-center justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  form.formState.isSubmitting ||
                  createMutation.isPending ||
                  updateMutation.isPending
                }
              >
                <Save className="size-4" />
                {isEdit ? "Update task" : "Create task"}
              </Button>
            </div>
          </form>
        ) : null}
      </div>
    </PermissionGuard>
  );
}

function defaultValues(task?: Task): TaskFormValues {
  return {
    projectId: task?.projectId ?? "",
    parentTaskId: task?.parentTaskId ?? NONE,
    title: task?.title ?? "",
    description: task?.description ?? "",
    status: task?.status ?? "TODO",
    priority: task?.priority ?? "MEDIUM",
    startDate: toDateInput(task?.startDate),
    dueDate: toDateInput(task?.dueDate),
    completedAt: toDateInput(task?.completedAt),
    assigneeEmployeeId: task?.assignees?.find((item) => item.employeeId)?.employeeId ?? NONE,
    assigneeEmployeeIds: task?.assignees?.flatMap((item) => (item.employeeId ? [item.employeeId] : [])) ?? [],
  };
}

function toDateInput(value?: string | null) {
  if (!value) return "";
  return value.slice(0, 10);
}

function employeeName(employee: Employee) {
  return `${employee.firstName} ${employee.lastName}`.trim() || employee.email;
}
