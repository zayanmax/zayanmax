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
import { useClients } from "@/features/clients/hooks";
import {
  projectSchema,
  type ProjectFormValues,
} from "@/features/projects/schemas";
import {
  useCreateProject,
  useProject,
  useUpdateProject,
} from "@/features/projects/hooks";
import type { Project } from "@/features/projects/types";
import { toProjectPayload } from "@/features/projects/utils";
import { ApiClientError } from "@/lib/api/client";

const NONE = "__none__";

const statusOptions = [
  { value: "PLANNED", label: "Planned" },
  { value: "ACTIVE", label: "Active" },
  { value: "ON_HOLD", label: "On hold" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "ARCHIVED", label: "Archived" },
];

export function ProjectFormPage({ projectId }: { projectId?: string }) {
  const router = useRouter();
  const isEdit = Boolean(projectId);
  const permission = isEdit ? "projects.update" : "projects.create";
  const project = useProject(projectId ?? "");
  const clients = useClients({ page: 1, limit: 100, sortBy: "name", sortOrder: "asc" });
  const createMutation = useCreateProject();
  const updateMutation = useUpdateProject(projectId ?? "");
  const [formError, setFormError] = useState<string | null>(null);

  const clientOptions = useMemo(
    () => [
      { value: NONE, label: "No client" },
      ...(clients.data?.data ?? []).map((client) => ({
        value: client.id,
        label: client.name,
      })),
    ],
    [clients.data?.data],
  );

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: defaultValues(),
  });

  useEffect(() => {
    if (project.data) form.reset(defaultValues(project.data));
  }, [project.data, form]);

  async function onSubmit(values: ProjectFormValues) {
    setFormError(null);
    try {
      const payload = toProjectPayload({
        ...values,
        clientId: values.clientId === NONE ? "" : values.clientId,
      });
      const saved = isEdit
        ? await updateMutation.mutateAsync(payload)
        : await createMutation.mutateAsync(payload);
      router.replace(`/projects/${saved.id}`);
    } catch (caught) {
      setFormError(
        caught instanceof ApiClientError
          ? caught.message
          : "Unable to save project",
      );
    }
  }

  const errorMessage =
    project.error instanceof ApiClientError
      ? project.error.message
      : project.error instanceof Error
        ? project.error.message
        : undefined;

  return (
    <PermissionGuard
      permission={permission}
      fallback={
        <ErrorState
          title="Permission required"
          message="You do not have permission to manage projects."
        />
      }
    >
      <div className="flex flex-col gap-6">
        <PageHeader
          title={isEdit ? "Edit Project" : "New Project"}
          description="Create and maintain project delivery records."
        />

        {isEdit && project.isLoading ? <LoadingState rows={6} /> : null}
        {project.error ? (
          <ErrorState title="Unable to load project" message={errorMessage} />
        ) : null}

        {(!isEdit || project.data) && !project.error ? (
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <DataCard title="Basic Project Details">
              <div className="grid gap-4 md:grid-cols-2">
                <FormFieldWrapper
                  label="Project name"
                  htmlFor="name"
                  error={form.formState.errors.name?.message}
                >
                  <Input id="name" {...form.register("name")} />
                </FormFieldWrapper>
                <FormFieldWrapper
                  label="Client"
                  error={form.formState.errors.clientId?.message}
                >
                  <Controller
                    control={form.control}
                    name="clientId"
                    render={({ field }) => (
                      <SelectField
                        value={field.value || NONE}
                        onValueChange={field.onChange}
                        options={clientOptions}
                      />
                    )}
                  />
                </FormFieldWrapper>
                <FormFieldWrapper
                  label="Status"
                  error={form.formState.errors.status?.message}
                >
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
              </div>
              <FormFieldWrapper
                label="Description"
                htmlFor="description"
                error={form.formState.errors.description?.message}
              >
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

            {formError ? (
              <ErrorState title="Unable to save project" message={formError} />
            ) : null}

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
                {isEdit ? "Update project" : "Create project"}
              </Button>
            </div>
          </form>
        ) : null}
      </div>
    </PermissionGuard>
  );
}

function defaultValues(project?: Project): ProjectFormValues {
  return {
    name: project?.name ?? "",
    description: project?.description ?? "",
    clientId: project?.clientId ?? NONE,
    status: project?.status ?? "PLANNED",
    startDate: toDateInput(project?.startDate),
    dueDate: toDateInput(project?.dueDate),
    completedAt: toDateInput(project?.completedAt),
  };
}

function toDateInput(value?: string | null) {
  if (!value) return "";
  return value.slice(0, 10);
}
