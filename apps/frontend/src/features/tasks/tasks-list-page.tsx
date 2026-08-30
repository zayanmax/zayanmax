"use client";

import Link from "next/link";
import {
  CalendarDays,
  CircleDot,
  Edit,
  Eye,
  Flag,
  FolderKanban,
  LayoutGrid,
  Plus,
  Trash2,
  UserRound,
} from "lucide-react";
import { useMemo, useState } from "react";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { PaginationControls } from "@/components/data/pagination-controls";
import { SearchFilterBar } from "@/components/data/search-filter-bar";
import { SelectField } from "@/components/forms/select-field";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { PermissionGuard } from "@/components/shared/permission-guard";
import { StatusBadge } from "@/components/shared/status-badge";
import { useProjects } from "@/features/projects/hooks";
import { useDeleteTask, useTasks } from "@/features/tasks/hooks";
import type { Task, TaskPriority, TaskStatus } from "@/features/tasks/types";
import { assigneeLabel, formatTaskDate } from "@/features/tasks/utils";
import { ApiClientError } from "@/lib/api/client";

const ALL = "__all__";

const statusOptions = [
  { value: ALL, label: "All statuses" },
  { value: "TODO", label: "To do" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "BLOCKED", label: "Blocked" },
  { value: "REVIEW", label: "Review" },
  { value: "DONE", label: "Done" },
  { value: "CANCELLED", label: "Cancelled" },
];

const priorityOptions = [
  { value: ALL, label: "All priorities" },
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
];

export function TasksListPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(ALL);
  const [priority, setPriority] = useState(ALL);
  const [projectId, setProjectId] = useState(ALL);
  const deleteMutation = useDeleteTask();
  const projects = useProjects({ page: 1, limit: 100, sortBy: "name", sortOrder: "asc" });
  const tasks = useTasks({
    page,
    limit: 20,
    search: search || undefined,
    status: status === ALL ? undefined : (status as TaskStatus),
    priority: priority === ALL ? undefined : (priority as TaskPriority),
    projectId: projectId === ALL ? undefined : projectId,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const projectOptions = useMemo(
    () => [
      { value: ALL, label: "All projects" },
      ...(projects.data?.data ?? []).map((project) => ({
        value: project.id,
        label: project.name,
      })),
    ],
    [projects.data?.data],
  );

  const columns: DataTableColumn<Task>[] = [
    {
      key: "title",
      header: "Task",
      className: "min-w-56",
      render: (task) => (
        <Link
          href={`/tasks/${task.id}`}
          className="font-medium text-primary hover:underline"
        >
          {task.title}
        </Link>
      ),
    },
    {
      key: "project",
      header: "Project",
      className: "min-w-52 text-muted-foreground",
      render: (task) => task.project?.name ?? "—",
    },
    {
      key: "status",
      header: "Status",
      render: (task) => <StatusBadge status={task.status} />,
    },
    { key: "priority", header: "Priority", render: (task) => <StatusBadge status={task.priority} /> },
    {
      key: "assignees",
      header: "Assignees",
      className: "min-w-48",
      render: (task) =>
        task.assignees?.length ? (
          <div className="flex flex-wrap items-center gap-1.5">
            {task.assignees.slice(0, 2).map((assignee) => (
              <span
                key={assignee.id}
                className="inline-flex max-w-44 items-center gap-1.5 rounded-full bg-muted px-2 py-1 text-xs font-medium text-foreground"
              >
                <UserRound className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate">{assigneeLabel(assignee)}</span>
              </span>
            ))}
            {task.assignees.length > 2 ? (
              <span className="text-xs text-muted-foreground">+{task.assignees.length - 2}</span>
            ) : null}
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">Unassigned</span>
        ),
    },
    {
      key: "dueDate",
      header: "Due",
      className: "min-w-36",
      render: (task) => (
        <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
          <CalendarDays className="size-3.5" />
          {formatTaskDate(task.dueDate)}
        </span>
      ),
    },
    {
      key: "parent",
      header: "Type",
      render: (task) => (
        <Badge variant="secondary">
          {task.parentTaskId ? "Subtask" : `${task._count?.subtasks ?? 0} subtasks`}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (task) => (
        <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-muted/30 p-1">
          <Link
            href={`/tasks/${task.id}`}
            aria-label={`View ${task.title}`}
            title="View task"
            className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
          >
            <Eye className="size-4" />
            <span className="sr-only">View</span>
          </Link>
          <PermissionGuard permission="tasks.update">
            <Link
              href={`/tasks/${task.id}/edit`}
              aria-label={`Edit ${task.title}`}
              title="Edit task"
              className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
            >
              <Edit className="size-4" />
              <span className="sr-only">Edit</span>
            </Link>
          </PermissionGuard>
          <PermissionGuard permission="tasks.delete">
            <ConfirmDialog
              title="Delete task"
              description="This will remove the task from active task lists."
              confirmLabel="Delete"
              destructive
              onConfirm={() => void deleteMutation.mutateAsync(task.id)}
              trigger={
                <Button
                  type="button"
                  variant="destructive"
                  size="icon-sm"
                  aria-label={`Delete ${task.title}`}
                  title="Delete task"
                >
                  <Trash2 className="size-4" />
                  <span className="sr-only">Delete</span>
                </Button>
              }
            />
          </PermissionGuard>
        </div>
      ),
    },
  ];

  const errorMessage =
    tasks.error instanceof ApiClientError
      ? tasks.error.message
      : tasks.error instanceof Error
        ? tasks.error.message
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
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Tasks"
          description="Track task ownership, priorities, dates, and delivery state."
          actions={
            <>
              <Link
                href="/tasks/kanban"
                className={buttonVariants({ variant: "outline" })}
              >
                <LayoutGrid className="size-4" />
                Kanban
              </Link>
              <PermissionGuard permission="tasks.create">
                <Link
                  href="/tasks/new"
                  className={buttonVariants({ variant: "default" })}
                >
                  <Plus className="size-4" />
                  New task
                </Link>
              </PermissionGuard>
            </>
          }
        />

        <SearchFilterBar
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder="Search tasks"
          filters={
            <>
              <SelectField
                icon={CircleDot}
                value={status}
                onValueChange={(value) => {
                  setStatus(value);
                  setPage(1);
                }}
                className="w-full sm:w-44"
                options={statusOptions}
              />
              <SelectField
                icon={Flag}
                value={priority}
                onValueChange={(value) => {
                  setPriority(value);
                  setPage(1);
                }}
                className="w-full sm:w-44"
                options={priorityOptions}
              />
              <SelectField
                icon={FolderKanban}
                value={projectId}
                onValueChange={(value) => {
                  setProjectId(value);
                  setPage(1);
                }}
                className="w-full sm:w-56"
                options={projectOptions}
              />
            </>
          }
          onReset={() => {
            setSearch("");
            setStatus(ALL);
            setPriority(ALL);
            setProjectId(ALL);
            setPage(1);
          }}
        />

        {tasks.isLoading ? <LoadingState rows={6} /> : null}
        {tasks.error ? (
          <ErrorState title="Unable to load tasks" message={errorMessage} />
        ) : null}
        {!tasks.isLoading && !tasks.error ? (
          <>
            <DataTable
              columns={columns}
              rows={tasks.data?.data ?? []}
              getRowKey={(task) => task.id}
              emptyTitle="No tasks found"
            />
            <PaginationControls
              page={tasks.data?.meta.page ?? page}
              totalPages={tasks.data?.meta.totalPages ?? 1}
              onPageChange={setPage}
            />
          </>
        ) : null}
      </div>
    </PermissionGuard>
  );
}
