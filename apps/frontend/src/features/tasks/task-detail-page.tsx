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
  subtaskSchema,
  taskAssigneeSchema,
  taskAttachmentSchema,
  taskCommentSchema,
  type SubtaskFormValues,
  type TaskAssigneeFormValues,
  type TaskAttachmentFormValues,
  type TaskCommentFormValues,
} from "@/features/tasks/schemas";
import {
  useAddTaskAssignee,
  useAddTaskAttachment,
  useAddTaskComment,
  useChangeTaskStatus,
  useCreateSubtask,
  useDeleteTask,
  useTask,
  useTaskAssignees,
  useTaskAttachments,
  useTaskComments,
} from "@/features/tasks/hooks";
import type {
  Task,
  TaskAssignee,
  TaskAttachment,
  TaskComment,
  TaskStatus,
} from "@/features/tasks/types";
import {
  assigneeLabel,
  formatTaskDate,
  toSubtaskPayload,
} from "@/features/tasks/utils";
import { ApiClientError } from "@/lib/api/client";

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

export function TaskDetailPage({ taskId }: { taskId: string }) {
  const router = useRouter();
  const task = useTask(taskId);
  const deleteMutation = useDeleteTask();
  const statusMutation = useChangeTaskStatus(taskId);
  const [nextStatus, setNextStatus] = useState<TaskStatus | "">("");

  async function deleteTask() {
    await deleteMutation.mutateAsync(taskId);
    router.replace("/tasks");
  }

  const errorMessage =
    task.error instanceof ApiClientError
      ? task.error.message
      : task.error instanceof Error
        ? task.error.message
        : undefined;

  return (
    <PermissionGuard
      permission="tasks.view"
      fallback={
        <ErrorState
          title="Permission required"
          message="You do not have access to tasks."
        />
      }
    >
      {task.isLoading ? <LoadingState rows={6} /> : null}
      {task.error ? (
        <ErrorState title="Unable to load task" message={errorMessage} />
      ) : null}
      {!task.isLoading && !task.error && task.data ? (
        <div className="flex flex-col gap-6">
          <PageHeader
            title={task.data.title}
            description={`${task.data.project?.name ?? "No project"} - ${task.data.priority}`}
            actions={
              <>
                <PermissionGuard permission="tasks.update">
                  <Link
                    href={`/tasks/${taskId}/edit`}
                    className={buttonVariants({ variant: "outline" })}
                  >
                    <Edit className="size-4" />
                    Edit
                  </Link>
                </PermissionGuard>
                <PermissionGuard permission="tasks.delete">
                  <ConfirmDialog
                    title="Delete task"
                    description="This will remove the task from active task lists."
                    confirmLabel="Delete"
                    destructive
                    onConfirm={() => void deleteTask()}
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
            <DataCard title="Task Summary">
              <DetailRows
                rows={[
                  ["Title", task.data.title],
                  ["Project", task.data.project?.name ?? "-"],
                  ["Status", <StatusBadge key="status" status={task.data.status} />],
                  ["Priority", <StatusBadge key="priority" status={task.data.priority} />],
                ]}
              />
            </DataCard>
            <DataCard title="Schedule">
              <DetailRows
                rows={[
                  ["Start", formatTaskDate(task.data.startDate)],
                  ["Due", formatTaskDate(task.data.dueDate)],
                  ["Completed", formatTaskDate(task.data.completedAt)],
                  ["Parent task", task.data.parentTaskId ? task.data.parentTaskId.slice(0, 8) : "-"],
                ]}
              />
            </DataCard>
            <DataCard title="Activity">
              <DetailRows
                rows={[
                  ["Assignees", task.data.assignees?.length ?? 0],
                  ["Subtasks", task.data._count?.subtasks ?? task.data.subtasks?.length ?? 0],
                  ["Comments", task.data._count?.comments ?? task.data.comments?.length ?? 0],
                  ["Attachments", task.data._count?.attachments ?? task.data.attachments?.length ?? 0],
                  ["Updated", formatTaskDate(task.data.updatedAt)],
                ]}
              />
            </DataCard>
          </div>

          <DataCard title="Description">
            <p className="text-sm text-muted-foreground">
              {task.data.description ?? "No description recorded."}
            </p>
          </DataCard>

          <PermissionGuard permission="tasks.update">
            <DataCard title="Change Status" description="Update the task workflow state.">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <SelectField
                  value={nextStatus || task.data.status}
                  onValueChange={(value) => setNextStatus(value as TaskStatus)}
                  className="w-full sm:w-52"
                  options={statusOptions}
                />
                <Button
                  type="button"
                  disabled={statusMutation.isPending}
                  onClick={() =>
                    void statusMutation.mutateAsync({
                      status: nextStatus || task.data.status,
                      completedAt:
                        (nextStatus || task.data.status) === "DONE"
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

          <Tabs defaultValue="subtasks">
            <TabsList>
              <TabsTrigger value="subtasks">Subtasks</TabsTrigger>
              <TabsTrigger value="comments">Comments</TabsTrigger>
              <TabsTrigger value="assignees">Assignees</TabsTrigger>
              <TabsTrigger value="attachments">Attachments</TabsTrigger>
            </TabsList>
            <TabsContent value="subtasks">
              <SubtasksSection taskId={taskId} subtasks={task.data.subtasks ?? []} />
            </TabsContent>
            <TabsContent value="comments">
              <CommentsSection taskId={taskId} />
            </TabsContent>
            <TabsContent value="assignees">
              <AssigneesSection taskId={taskId} />
            </TabsContent>
            <TabsContent value="attachments">
              <AttachmentsSection taskId={taskId} />
            </TabsContent>
          </Tabs>
        </div>
      ) : null}
    </PermissionGuard>
  );
}

function SubtasksSection({ taskId, subtasks }: { taskId: string; subtasks: Task[] }) {
  const createSubtask = useCreateSubtask(taskId);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<SubtaskFormValues>({
    resolver: zodResolver(subtaskSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "TODO",
      priority: "MEDIUM",
      startDate: "",
      dueDate: "",
      completedAt: "",
      assigneeEmployeeIds: [],
    },
  });

  const columns: DataTableColumn<Task>[] = [
    {
      key: "title",
      header: "Subtask",
      render: (task) => (
        <Link href={`/tasks/${task.id}`} className="font-medium text-primary hover:underline">
          {task.title}
        </Link>
      ),
    },
    { key: "status", header: "Status", render: (task) => <StatusBadge status={task.status} /> },
    { key: "priority", header: "Priority", render: (task) => <StatusBadge status={task.priority} /> },
    { key: "dueDate", header: "Due", render: (task) => formatTaskDate(task.dueDate) },
  ];

  async function onSubmit(values: SubtaskFormValues) {
    setError(null);
    try {
      await createSubtask.mutateAsync(toSubtaskPayload(values));
      form.reset({
        title: "",
        description: "",
        status: "TODO",
        priority: "MEDIUM",
        startDate: "",
        dueDate: "",
        completedAt: "",
        assigneeEmployeeIds: [],
      });
      setOpen(false);
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : "Unable to add subtask");
    }
  }

  return (
    <ChildSection
      title="Subtasks"
      description="Nested task records under this parent task."
      open={open}
      setOpen={setOpen}
      loading={false}
      error={null}
      dialogTitle="Add subtask"
      dialogDescription="Create a subtask under this task."
      formId="subtask-form"
      form={
        <form id="subtask-form" onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <FormFieldWrapper label="Title" htmlFor="subtaskTitle" error={form.formState.errors.title?.message}>
            <Input id="subtaskTitle" {...form.register("title")} />
          </FormFieldWrapper>
          <FormFieldWrapper label="Description" htmlFor="subtaskDescription">
            <Input id="subtaskDescription" {...form.register("description")} />
          </FormFieldWrapper>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormFieldWrapper label="Status">
              <Controller
                control={form.control}
                name="status"
                render={({ field }) => (
                  <SelectField value={field.value} onValueChange={field.onChange} options={statusOptions} />
                )}
              />
            </FormFieldWrapper>
            <FormFieldWrapper label="Priority">
              <Controller
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <SelectField value={field.value} onValueChange={field.onChange} options={priorityOptions} />
                )}
              />
            </FormFieldWrapper>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormFieldWrapper label="Start date" htmlFor="subtaskStart">
              <Input id="subtaskStart" type="date" {...form.register("startDate")} />
            </FormFieldWrapper>
            <FormFieldWrapper label="Due date" htmlFor="subtaskDue">
              <Input id="subtaskDue" type="date" {...form.register("dueDate")} />
            </FormFieldWrapper>
          </div>
          {error ? <ErrorState title="Unable to add subtask" message={error} /> : null}
        </form>
      }
    >
      <DataTable
        columns={columns}
        rows={subtasks}
        getRowKey={(task) => task.id}
        emptyTitle="No subtasks found"
      />
    </ChildSection>
  );
}

function CommentsSection({ taskId }: { taskId: string }) {
  const comments = useTaskComments(taskId);
  const addComment = useAddTaskComment(taskId);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<TaskCommentFormValues>({
    resolver: zodResolver(taskCommentSchema),
    defaultValues: { commentText: "" },
  });

  const columns: DataTableColumn<TaskComment>[] = [
    { key: "comment", header: "Comment", render: (comment) => comment.commentText },
    { key: "createdAt", header: "Created", render: (comment) => formatTaskDate(comment.createdAt) },
  ];

  async function onSubmit(values: TaskCommentFormValues) {
    setError(null);
    try {
      await addComment.mutateAsync({ commentText: values.commentText.trim() });
      form.reset();
      setOpen(false);
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : "Unable to add comment");
    }
  }

  return (
    <ChildSection
      title="Comments"
      description="Task discussion comments."
      open={open}
      setOpen={setOpen}
      loading={comments.isLoading}
      error={comments.error}
      dialogTitle="Add comment"
      dialogDescription="Add a task comment."
      formId="task-comment-form"
      form={
        <form id="task-comment-form" onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <FormFieldWrapper label="Comment" htmlFor="commentText" error={form.formState.errors.commentText?.message}>
            <Input id="commentText" {...form.register("commentText")} />
          </FormFieldWrapper>
          {error ? <ErrorState title="Unable to add comment" message={error} /> : null}
        </form>
      }
    >
      <DataTable
        columns={columns}
        rows={comments.data ?? []}
        getRowKey={(comment) => comment.id}
        emptyTitle="No comments found"
      />
    </ChildSection>
  );
}

function AssigneesSection({ taskId }: { taskId: string }) {
  const assignees = useTaskAssignees(taskId);
  const employees = useEmployees({ page: 1, limit: 100, sortBy: "firstName", sortOrder: "asc" });
  const addAssignee = useAddTaskAssignee(taskId);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<TaskAssigneeFormValues>({
    resolver: zodResolver(taskAssigneeSchema),
    defaultValues: { employeeId: "" },
  });

  const employeeMap = useMemo(() => {
    const result = new Map<string, string>();
    for (const employee of employees.data?.data ?? []) result.set(employee.id, employeeName(employee));
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

  const columns: DataTableColumn<TaskAssignee>[] = [
    {
      key: "assignee",
      header: "Assignee",
      render: (assignee) =>
        assignee.employeeId
          ? employeeMap.get(assignee.employeeId) ?? assigneeLabel(assignee)
          : assigneeLabel(assignee),
    },
    { key: "createdAt", header: "Assigned", render: (assignee) => formatTaskDate(assignee.createdAt) },
  ];

  async function onSubmit(values: TaskAssigneeFormValues) {
    setError(null);
    try {
      await addAssignee.mutateAsync({ employeeId: values.employeeId });
      form.reset({ employeeId: "" });
      setOpen(false);
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : "Unable to add assignee");
    }
  }

  return (
    <ChildSection
      title="Assignees"
      description="Employee lookup is available; assignee removal is not exposed by the backend yet."
      open={open}
      setOpen={setOpen}
      loading={assignees.isLoading}
      error={assignees.error}
      dialogTitle="Add assignee"
      dialogDescription="Assign an employee to this task."
      formId="task-assignee-form"
      form={
        <form id="task-assignee-form" onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
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
          {error ? <ErrorState title="Unable to add assignee" message={error} /> : null}
        </form>
      }
    >
      <DataTable
        columns={columns}
        rows={assignees.data ?? []}
        getRowKey={(assignee) => assignee.id}
        emptyTitle="No assignees found"
      />
    </ChildSection>
  );
}

function AttachmentsSection({ taskId }: { taskId: string }) {
  const attachments = useTaskAttachments(taskId);
  const addAttachment = useAddTaskAttachment(taskId);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<TaskAttachmentFormValues>({
    resolver: zodResolver(taskAttachmentSchema),
    defaultValues: { fileName: "", storageKey: "", mimeType: "", size: 1 },
  });

  const columns: DataTableColumn<TaskAttachment>[] = [
    { key: "fileName", header: "File name", render: (attachment) => attachment.fileName },
    { key: "storageKey", header: "Storage key", render: (attachment) => attachment.storageKey },
    { key: "mimeType", header: "MIME type", render: (attachment) => attachment.mimeType },
    { key: "size", header: "Size", render: (attachment) => `${attachment.size} bytes` },
    { key: "createdAt", header: "Created", render: (attachment) => formatTaskDate(attachment.createdAt) },
  ];

  async function onSubmit(values: TaskAttachmentFormValues) {
    setError(null);
    try {
      await addAttachment.mutateAsync(values);
      form.reset({ fileName: "", storageKey: "", mimeType: "", size: 1 });
      setOpen(false);
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : "Unable to add attachment metadata");
    }
  }

  return (
    <ChildSection
      title="Attachment Metadata"
      description="Metadata only. File upload is intentionally not implemented yet."
      open={open}
      setOpen={setOpen}
      loading={attachments.isLoading}
      error={attachments.error}
      dialogTitle="Add attachment metadata"
      dialogDescription="Create an attachment metadata record without uploading a file."
      formId="task-attachment-form"
      form={
        <form id="task-attachment-form" onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <FormFieldWrapper label="File name" htmlFor="fileName" error={form.formState.errors.fileName?.message}>
            <Input id="fileName" {...form.register("fileName")} />
          </FormFieldWrapper>
          <FormFieldWrapper label="Storage key" htmlFor="storageKey" error={form.formState.errors.storageKey?.message}>
            <Input id="storageKey" {...form.register("storageKey")} />
          </FormFieldWrapper>
          <FormFieldWrapper label="MIME type" htmlFor="mimeType" error={form.formState.errors.mimeType?.message}>
            <Input id="mimeType" placeholder="application/pdf" {...form.register("mimeType")} />
          </FormFieldWrapper>
          <FormFieldWrapper label="Size" htmlFor="size" error={form.formState.errors.size?.message}>
            <Input id="size" type="number" min={1} {...form.register("size", { valueAsNumber: true })} />
          </FormFieldWrapper>
          {error ? <ErrorState title="Unable to add attachment metadata" message={error} /> : null}
        </form>
      }
    >
      <DataTable
        columns={columns}
        rows={attachments.data ?? []}
        getRowKey={(attachment) => attachment.id}
        emptyTitle="No attachments found"
      />
    </ChildSection>
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
        <PermissionGuard permission="tasks.update">
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
