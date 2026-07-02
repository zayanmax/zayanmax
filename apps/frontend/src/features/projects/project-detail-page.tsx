"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Edit, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { FormFieldWrapper } from "@/components/forms/form-field-wrapper";
import { SelectField } from "@/components/forms/select-field";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataCard } from "@/components/shared/data-card";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { PermissionGuard } from "@/components/shared/permission-guard";
import { StatusBadge } from "@/components/shared/status-badge";
import { useEmployees } from "@/features/employees/hooks";
import type { Employee } from "@/features/employees/types";
import {
  projectMemberSchema,
  type ProjectMemberFormValues,
} from "@/features/projects/schemas";
import {
  useAddProjectMember,
  useChangeProjectStatus,
  useDeleteProject,
  useProject,
  useProjectMembers,
  useRemoveProjectMember,
} from "@/features/projects/hooks";
import type {
  ProjectMember,
  ProjectStatus,
  ProjectTaskSummary,
} from "@/features/projects/types";
import { formatProjectDate, projectTaskProgress } from "@/features/projects/utils";
import { ApiClientError } from "@/lib/api/client";

const statusOptions = [
  { value: "PLANNED", label: "Planned" },
  { value: "ACTIVE", label: "Active" },
  { value: "ON_HOLD", label: "On hold" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "ARCHIVED", label: "Archived" },
];

export function ProjectDetailPage({ projectId }: { projectId: string }) {
  const router = useRouter();
  const project = useProject(projectId);
  const deleteMutation = useDeleteProject();
  const statusMutation = useChangeProjectStatus(projectId);
  const [nextStatus, setNextStatus] = useState<ProjectStatus | "">("");

  async function deleteProject() {
    await deleteMutation.mutateAsync(projectId);
    router.replace("/projects");
  }

  const errorMessage =
    project.error instanceof ApiClientError
      ? project.error.message
      : project.error instanceof Error
        ? project.error.message
        : undefined;

  return (
    <PermissionGuard
      permission="projects.view"
      fallback={
        <ErrorState
          title="Permission required"
          message="You do not have access to projects."
        />
      }
    >
      {project.isLoading ? <LoadingState rows={6} /> : null}
      {project.error ? (
        <ErrorState title="Unable to load project" message={errorMessage} />
      ) : null}
      {!project.isLoading && !project.error && project.data ? (
        <div className="flex flex-col gap-6">
          <PageHeader
            title={project.data.name}
            description={`${project.data.client?.name ?? "No client"} - ${project.data.status.replaceAll("_", " ")}`}
            actions={
              <>
                <PermissionGuard permission="projects.update">
                  <Link
                    href={`/projects/${projectId}/edit`}
                    className={buttonVariants({ variant: "outline" })}
                  >
                    <Edit className="size-4" />
                    Edit
                  </Link>
                </PermissionGuard>
                <PermissionGuard permission="projects.delete">
                  <ConfirmDialog
                    title="Delete project"
                    description="This will remove the project from active project lists."
                    confirmLabel="Delete"
                    destructive
                    onConfirm={() => void deleteProject()}
                    trigger={
                      <Button type="button" variant="destructive">
                        <Trash2 className="size-4" />
                        Delete
                      </Button>
                    }
                  />
                </PermissionGuard>
              </>
            }
          />

          <div className="grid gap-4 xl:grid-cols-3">
            <DataCard title="Project Summary">
              <DetailRows
                rows={[
                  ["Name", project.data.name],
                  ["Status", <StatusBadge key="status" status={project.data.status} />],
                  ["Client", project.data.client?.name ?? "-"],
                  ["Description", project.data.description ?? "-"],
                ]}
              />
            </DataCard>
            <DataCard title="Schedule">
              <DetailRows
                rows={[
                  ["Start", formatProjectDate(project.data.startDate)],
                  ["Due", formatProjectDate(project.data.dueDate)],
                  ["Completed", formatProjectDate(project.data.completedAt)],
                ]}
              />
            </DataCard>
            <DataCard title="Activity">
              <DetailRows
                rows={[
                  ["Members", project.data.members?.length ?? project.data._count?.members ?? 0],
                  ["Tasks", project.data.tasks?.length ?? project.data._count?.tasks ?? 0],
                  ["Progress", projectTaskProgress(project.data)],
                  ["Created", formatProjectDate(project.data.createdAt)],
                  ["Updated", formatProjectDate(project.data.updatedAt)],
                ]}
              />
            </DataCard>
          </div>

          <PermissionGuard permission="projects.update">
            <DataCard title="Change Status" description="Update the project lifecycle state.">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <SelectField
                  value={nextStatus || project.data.status}
                  onValueChange={(value) => setNextStatus(value as ProjectStatus)}
                  className="w-full sm:w-52"
                  options={statusOptions}
                />
                <Button
                  type="button"
                  disabled={statusMutation.isPending}
                  onClick={() =>
                    void statusMutation.mutateAsync({
                      status: nextStatus || project.data.status,
                      completedAt:
                        (nextStatus || project.data.status) === "COMPLETED"
                          ? new Date().toISOString()
                          : undefined,
                    })
                  }
                >
                  Save status
                </Button>
              </div>
            </DataCard>
          </PermissionGuard>

          <Tabs defaultValue="members">
            <TabsList>
              <TabsTrigger value="members">Members</TabsTrigger>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
            </TabsList>
            <TabsContent value="members">
              <ProjectMembersSection projectId={projectId} />
            </TabsContent>
            <TabsContent value="tasks">
              <ProjectTasksSection tasks={project.data.tasks ?? []} />
            </TabsContent>
          </Tabs>
        </div>
      ) : null}
    </PermissionGuard>
  );
}

function ProjectMembersSection({ projectId }: { projectId: string }) {
  const members = useProjectMembers(projectId);
  const employees = useEmployees({ page: 1, limit: 100, sortBy: "firstName", sortOrder: "asc" });
  const addMember = useAddProjectMember(projectId);
  const removeMember = useRemoveProjectMember(projectId);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<ProjectMemberFormValues>({
    resolver: zodResolver(projectMemberSchema),
    defaultValues: { employeeId: "", role: "" },
  });

  const employeeMap = useMemo(() => {
    const result = new Map<string, string>();
    for (const employee of employees.data?.data ?? []) {
      result.set(employee.id, employeeName(employee));
    }
    return result;
  }, [employees.data?.data]);

  const employeeOptions = useMemo(
    () =>
      (employees.data?.data ?? []).map((employee) => ({
        value: employee.id,
        label: employeeName(employee),
      })),
    [employees.data?.data],
  );

  const columns: DataTableColumn<ProjectMember>[] = [
    {
      key: "member",
      header: "Member",
      render: (member) =>
        member.employeeId
          ? employeeMap.get(member.employeeId) ?? `Employee ${member.employeeId.slice(0, 8)}`
          : member.userId
            ? `User ${member.userId.slice(0, 8)}`
            : "-",
    },
    { key: "role", header: "Role", render: (member) => member.role ?? "-" },
    {
      key: "createdAt",
      header: "Added",
      render: (member) => formatProjectDate(member.createdAt),
    },
    {
      key: "actions",
      header: "Actions",
      render: (member) => (
        <PermissionGuard permission="projects.update">
          <ConfirmDialog
            title="Remove member"
            description="This member will no longer appear on the project."
            confirmLabel="Remove"
            destructive
            onConfirm={() => void removeMember.mutateAsync(member.id)}
            trigger={
              <Button type="button" variant="destructive" size="sm">
                <Trash2 className="size-4" />
                Remove
              </Button>
            }
          />
        </PermissionGuard>
      ),
    },
  ];

  async function onSubmit(values: ProjectMemberFormValues) {
    setError(null);
    try {
      await addMember.mutateAsync({
        employeeId: values.employeeId,
        role: values.role?.trim() || undefined,
      });
      form.reset({ employeeId: "", role: "" });
      setOpen(false);
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : "Unable to add member");
    }
  }

  return (
    <ChildSection
      title="Project Members"
      description="Employee lookup is available; a dedicated user picker is not present in the frontend yet."
      open={open}
      setOpen={setOpen}
      loading={members.isLoading}
      error={members.error}
      dialogTitle="Add member"
      dialogDescription="Add an employee to this project."
      formId="project-member-form"
      form={
        <form id="project-member-form" onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <FormFieldWrapper label="Employee" error={form.formState.errors.employeeId?.message}>
            <Controller
              control={form.control}
              name="employeeId"
              render={({ field }) => (
                <SelectField
                  value={field.value}
                  onValueChange={field.onChange}
                  options={employeeOptions}
                  placeholder="Select employee"
                />
              )}
            />
          </FormFieldWrapper>
          <FormFieldWrapper label="Role" htmlFor="memberRole">
            <Input id="memberRole" {...form.register("role")} />
          </FormFieldWrapper>
          {error ? <ErrorState title="Unable to add member" message={error} /> : null}
        </form>
      }
    >
      <DataTable
        columns={columns}
        rows={members.data ?? []}
        getRowKey={(member) => member.id}
        emptyTitle="No members found"
      />
    </ChildSection>
  );
}

function ProjectTasksSection({ tasks }: { tasks: ProjectTaskSummary[] }) {
  const columns: DataTableColumn<ProjectTaskSummary>[] = [
    {
      key: "title",
      header: "Task",
      render: (task) => (
        <Link href={`/tasks/${task.id}`} className="font-medium text-primary hover:underline">
          {task.title}
        </Link>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (task) => <StatusBadge status={task.status} />,
    },
    { key: "priority", header: "Priority", render: (task) => task.priority ?? "-" },
    { key: "dueDate", header: "Due", render: (task) => formatProjectDate(task.dueDate) },
  ];

  return (
    <DataCard title="Project Tasks" description="Top-level tasks attached to this project.">
      <DataTable
        columns={columns}
        rows={tasks}
        getRowKey={(task) => task.id}
        emptyTitle="No tasks found"
      />
    </DataCard>
  );
}

function ChildSection({
  title,
  description,
  children,
  loading,
  error,
  open,
  setOpen,
  dialogTitle,
  dialogDescription,
  formId,
  form,
}: {
  title: string;
  description: string;
  children: ReactNode;
  loading: boolean;
  error: unknown;
  open: boolean;
  setOpen: (open: boolean) => void;
  dialogTitle: string;
  dialogDescription: string;
  formId: string;
  form: ReactNode;
}) {
  const errorMessage =
    error instanceof ApiClientError
      ? error.message
      : error instanceof Error
        ? error.message
        : undefined;

  return (
    <DataCard
      title={title}
      description={description}
      action={
        <PermissionGuard permission="projects.update">
          <Button type="button" onClick={() => setOpen(true)}>
            <Plus className="size-4" />
            Add
          </Button>
        </PermissionGuard>
      }
    >
      <div className="flex flex-col gap-4">
        {loading ? <LoadingState rows={4} /> : null}
        {error ? <ErrorState title={`Unable to load ${title.toLowerCase()}`} message={errorMessage} /> : null}
        {!loading && !error ? children : null}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>{dialogDescription}</DialogDescription>
          </DialogHeader>
          {form}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form={formId}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DataCard>
  );
}

function DetailRows({ rows }: { rows: Array<[string, ReactNode]> }) {
  return (
    <dl className="grid gap-3">
      {rows.map(([label, value]) => (
        <div key={label} className="grid gap-1 sm:grid-cols-3 sm:gap-3">
          <dt className="text-sm text-muted-foreground">{label}</dt>
          <dd className="text-sm font-medium text-foreground sm:col-span-2">
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function employeeName(employee: Employee) {
  return `${employee.firstName} ${employee.lastName}`.trim() || employee.email;
}
