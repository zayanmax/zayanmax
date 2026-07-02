"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useState } from "react";
import { SearchFilterBar } from "@/components/data/search-filter-bar";
import { SelectField } from "@/components/forms/select-field";
import { buttonVariants } from "@/components/ui/button";
import { DataCard } from "@/components/shared/data-card";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { PermissionGuard } from "@/components/shared/permission-guard";
import { StatusBadge } from "@/components/shared/status-badge";
import { useProjects } from "@/features/projects/hooks";
import { useTasksKanban } from "@/features/tasks/hooks";
import type { Task, TaskStatus } from "@/features/tasks/types";
import { formatTaskDate } from "@/features/tasks/utils";
import { ApiClientError } from "@/lib/api/client";

const ALL = "__all__";

const statuses: Array<{ value: TaskStatus; label: string }> = [
  { value: "TODO", label: "To do" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "BLOCKED", label: "Blocked" },
  { value: "REVIEW", label: "Review" },
  { value: "DONE", label: "Done" },
  { value: "CANCELLED", label: "Cancelled" },
];

export function TasksKanbanPage() {
  const [search, setSearch] = useState("");
  const [projectId, setProjectId] = useState(ALL);
  const projects = useProjects({ page: 1, limit: 100, sortBy: "name", sortOrder: "asc" });
  const kanban = useTasksKanban({
    search: search || undefined,
    projectId: projectId === ALL ? undefined : projectId,
  });

  const projectOptions = [
    { value: ALL, label: "All projects" },
    ...(projects.data?.data ?? []).map((project) => ({
      value: project.id,
      label: project.name,
    })),
  ];

  const errorMessage =
    kanban.error instanceof ApiClientError
      ? kanban.error.message
      : kanban.error instanceof Error
        ? kanban.error.message
        : undefined;

  return (
    <PermissionGuard
      permission="tasks.view"
      fallback={
        <ErrorState
          title="Permission required"
          message="You do not have access to task boards."
        />
      }
    >
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Task Kanban"
          description="Read-only workflow board grouped by backend task status."
          actions={
            <PermissionGuard permission="tasks.create">
              <Link
                href="/tasks/new"
                className={buttonVariants({ variant: "default" })}
              >
                <Plus className="size-4" />
                New task
              </Link>
            </PermissionGuard>
          }
        />

        <SearchFilterBar
          value={search}
          onChange={setSearch}
          placeholder="Search board"
          filters={
            <SelectField
              value={projectId}
              onValueChange={setProjectId}
              className="w-full sm:w-56"
              options={projectOptions}
            />
          }
          onReset={() => {
            setSearch("");
            setProjectId(ALL);
          }}
        />

        {kanban.isLoading ? <LoadingState rows={6} /> : null}
        {kanban.error ? (
          <ErrorState title="Unable to load kanban board" message={errorMessage} />
        ) : null}
        {!kanban.isLoading && !kanban.error ? (
          <div className="grid gap-4 xl:grid-cols-3 2xl:grid-cols-6">
            {statuses.map((status) => (
              <DataCard
                key={status.value}
                title={status.label}
                description={`${kanban.data?.[status.value]?.length ?? 0} tasks`}
              >
                <div className="flex flex-col gap-3">
                  {(kanban.data?.[status.value] ?? []).map((task) => (
                    <KanbanTaskCard key={task.id} task={task} />
                  ))}
                  {!kanban.data?.[status.value]?.length ? (
                    <p className="text-sm text-muted-foreground">No tasks</p>
                  ) : null}
                </div>
              </DataCard>
            ))}
          </div>
        ) : null}
      </div>
    </PermissionGuard>
  );
}

function KanbanTaskCard({ task }: { task: Task }) {
  return (
    <Link
      href={`/tasks/${task.id}`}
      className="rounded-md border bg-background p-3 transition-colors hover:bg-muted/40"
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <span className="text-sm font-medium text-foreground">{task.title}</span>
          <StatusBadge status={task.priority} />
        </div>
        <div className="flex flex-col gap-1 text-xs text-muted-foreground">
          <span>{task.project?.name ?? "No project"}</span>
          <span>Due {formatTaskDate(task.dueDate)}</span>
        </div>
      </div>
    </Link>
  );
}
