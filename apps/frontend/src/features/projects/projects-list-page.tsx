"use client";

import Link from "next/link";
import { Edit, Eye, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { PaginationControls } from "@/components/data/pagination-controls";
import { SearchFilterBar } from "@/components/data/search-filter-bar";
import { SelectField } from "@/components/forms/select-field";
import { Button, buttonVariants } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { PermissionGuard } from "@/components/shared/permission-guard";
import { StatusBadge } from "@/components/shared/status-badge";
import { useClients } from "@/features/clients/hooks";
import { useDeleteProject, useProjects } from "@/features/projects/hooks";
import type { Project, ProjectStatus } from "@/features/projects/types";
import { formatProjectDate, projectTaskProgress } from "@/features/projects/utils";
import { ApiClientError } from "@/lib/api/client";

const ALL = "__all__";

const statusOptions = [
  { value: ALL, label: "All statuses" },
  { value: "PLANNED", label: "Planned" },
  { value: "ACTIVE", label: "Active" },
  { value: "ON_HOLD", label: "On hold" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "ARCHIVED", label: "Archived" },
];

export function ProjectsListPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(ALL);
  const [clientId, setClientId] = useState(ALL);
  const deleteMutation = useDeleteProject();
  const clients = useClients({ page: 1, limit: 100, sortBy: "name", sortOrder: "asc" });
  const projects = useProjects({
    page,
    limit: 20,
    search: search || undefined,
    status: status === ALL ? undefined : (status as ProjectStatus),
    clientId: clientId === ALL ? undefined : clientId,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const clientOptions = useMemo(
    () => [
      { value: ALL, label: "All clients" },
      ...(clients.data?.data ?? []).map((client) => ({
        value: client.id,
        label: client.name,
      })),
    ],
    [clients.data?.data],
  );

  const columns: DataTableColumn<Project>[] = [
    {
      key: "name",
      header: "Project",
      render: (project) => (
        <Link
          href={`/projects/${project.id}`}
          className="font-medium text-primary hover:underline"
        >
          {project.name}
        </Link>
      ),
    },
    {
      key: "client",
      header: "Client",
      render: (project) => project.client?.name ?? "-",
    },
    {
      key: "status",
      header: "Status",
      render: (project) => <StatusBadge status={project.status} />,
    },
    {
      key: "startDate",
      header: "Start",
      render: (project) => formatProjectDate(project.startDate),
    },
    {
      key: "dueDate",
      header: "Due",
      render: (project) => formatProjectDate(project.dueDate),
    },
    {
      key: "members",
      header: "Members",
      render: (project) => project._count?.members ?? project.members?.length ?? 0,
    },
    {
      key: "tasks",
      header: "Tasks",
      render: (project) =>
        project.tasks?.length ? projectTaskProgress(project) : (project._count?.tasks ?? 0),
    },
    {
      key: "actions",
      header: "Actions",
      render: (project) => (
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/projects/${project.id}`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <Eye className="size-4" />
            View
          </Link>
          <PermissionGuard permission="projects.update">
            <Link
              href={`/projects/${project.id}/edit`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
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
              onConfirm={() => void deleteMutation.mutateAsync(project.id)}
              trigger={
                <Button type="button" variant="destructive" size="sm">
                  <Trash2 className="size-4" />
                  Delete
                </Button>
              }
            />
          </PermissionGuard>
        </div>
      ),
    },
  ];

  const errorMessage =
    projects.error instanceof ApiClientError
      ? projects.error.message
      : projects.error instanceof Error
        ? projects.error.message
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
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Projects"
          description="Track project delivery, members, timelines, and task progress."
          actions={
            <PermissionGuard permission="projects.create">
              <Link
                href="/projects/new"
                className={buttonVariants({ variant: "default" })}
              >
                <Plus className="size-4" />
                New project
              </Link>
            </PermissionGuard>
          }
        />

        <SearchFilterBar
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder="Search projects"
          filters={
            <>
              <SelectField
                value={status}
                onValueChange={(value) => {
                  setStatus(value);
                  setPage(1);
                }}
                className="w-full sm:w-44"
                options={statusOptions}
              />
              <SelectField
                value={clientId}
                onValueChange={(value) => {
                  setClientId(value);
                  setPage(1);
                }}
                className="w-full sm:w-56"
                options={clientOptions}
              />
            </>
          }
          onReset={() => {
            setSearch("");
            setStatus(ALL);
            setClientId(ALL);
            setPage(1);
          }}
        />

        {projects.isLoading ? <LoadingState rows={6} /> : null}
        {projects.error ? (
          <ErrorState title="Unable to load projects" message={errorMessage} />
        ) : null}
        {!projects.isLoading && !projects.error ? (
          <>
            <DataTable
              columns={columns}
              rows={projects.data?.data ?? []}
              getRowKey={(project) => project.id}
              emptyTitle="No projects found"
            />
            <PaginationControls
              page={projects.data?.meta.page ?? page}
              totalPages={projects.data?.meta.totalPages ?? 1}
              onPageChange={setPage}
            />
          </>
        ) : null}
      </div>
    </PermissionGuard>
  );
}
