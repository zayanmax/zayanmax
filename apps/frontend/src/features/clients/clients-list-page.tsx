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
import { useClients, useDeleteClient } from "@/features/clients/hooks";
import type {
  Client,
  ClientStatus,
  ClientType,
} from "@/features/clients/types";
import { clientLocation, formatClientDate } from "@/features/clients/utils";
import { ApiClientError } from "@/lib/api/client";

const ALL = "__all__";

export function ClientsListPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(ALL);
  const [type, setType] = useState(ALL);
  const [ownerId, setOwnerId] = useState(ALL);
  const deleteMutation = useDeleteClient();

  const clients = useClients({
    page,
    limit: 20,
    search: search || undefined,
    status: status === ALL ? undefined : (status as ClientStatus),
    type: type === ALL ? undefined : (type as ClientType),
    ownerId: ownerId === ALL ? undefined : ownerId,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const ownerOptions = useMemo(() => {
    const owners = new Map<string, string>();
    for (const client of clients.data?.data ?? []) {
      if (client.owner?.id) owners.set(client.owner.id, client.owner.email);
    }
    return [
      { value: ALL, label: "All owners" },
      ...Array.from(owners.entries()).map(([id, email]) => ({
        value: id,
        label: email,
      })),
    ];
  }, [clients.data?.data]);

  const columns: DataTableColumn<Client>[] = [
    {
      key: "name",
      header: "Client",
      render: (client) => (
        <Link
          href={`/clients/${client.id}`}
          className="font-medium text-primary hover:underline"
        >
          {client.name}
        </Link>
      ),
    },
    {
      key: "type",
      header: "Type",
      render: (client) => client.type,
    },
    {
      key: "status",
      header: "Status",
      render: (client) => <StatusBadge status={client.status} />,
    },
    {
      key: "email",
      header: "Email",
      render: (client) => client.email ?? "-",
    },
    {
      key: "phone",
      header: "Phone",
      render: (client) => client.phone ?? "-",
    },
    {
      key: "owner",
      header: "Owner",
      render: (client) => client.owner?.email ?? "-",
    },
    {
      key: "location",
      header: "Location",
      render: (client) => (
        <span className="line-clamp-2 max-w-48">{clientLocation(client)}</span>
      ),
    },
    {
      key: "lastActivity",
      header: "Activity",
      render: (client) =>
        client._count?.activities
          ? `${client._count.activities} activities`
          : "-",
    },
    {
      key: "createdAt",
      header: "Created",
      render: (client) => formatClientDate(client.createdAt),
    },
    {
      key: "actions",
      header: "Actions",
      render: (client) => (
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/clients/${client.id}`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <Eye className="size-4" />
            View
          </Link>
          <PermissionGuard permission="clients.update">
            <Link
              href={`/clients/${client.id}/edit`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <Edit className="size-4" />
              Edit
            </Link>
          </PermissionGuard>
          <PermissionGuard permission="clients.delete">
            <ConfirmDialog
              title="Delete client"
              description="This will remove the client from active CRM lists."
              confirmLabel="Delete"
              destructive
              onConfirm={() => void deleteMutation.mutateAsync(client.id)}
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
    clients.error instanceof ApiClientError
      ? clients.error.message
      : clients.error instanceof Error
        ? clients.error.message
        : undefined;

  return (
    <PermissionGuard
      permission="clients.view"
      fallback={
        <ErrorState
          title="Permission required"
          message="You do not have access to client records."
        />
      }
    >
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Clients & CRM"
          description="Manage client profiles, contacts, activities, notes, and document metadata."
          actions={
            <PermissionGuard permission="clients.create">
              <Link
                href="/clients/new"
                className={buttonVariants({ variant: "default" })}
              >
                <Plus className="size-4" />
                New client
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
          placeholder="Search clients"
          filters={
            <>
              <SelectField
                value={status}
                onValueChange={(value) => {
                  setStatus(value);
                  setPage(1);
                }}
                className="w-full sm:w-40"
                options={[
                  { value: ALL, label: "All statuses" },
                  { value: "ACTIVE", label: "Active" },
                  { value: "INACTIVE", label: "Inactive" },
                  { value: "PROSPECT", label: "Prospect" },
                  { value: "ARCHIVED", label: "Archived" },
                ]}
              />
              <SelectField
                value={type}
                onValueChange={(value) => {
                  setType(value);
                  setPage(1);
                }}
                className="w-full sm:w-40"
                options={[
                  { value: ALL, label: "All types" },
                  { value: "COMPANY", label: "Company" },
                  { value: "INDIVIDUAL", label: "Individual" },
                ]}
              />
              <SelectField
                value={ownerId}
                onValueChange={(value) => {
                  setOwnerId(value);
                  setPage(1);
                }}
                className="w-full sm:w-52"
                options={ownerOptions}
              />
            </>
          }
          onReset={() => {
            setSearch("");
            setStatus(ALL);
            setType(ALL);
            setOwnerId(ALL);
            setPage(1);
          }}
        />

        {clients.isLoading ? <LoadingState rows={6} /> : null}
        {clients.error ? (
          <ErrorState title="Unable to load clients" message={errorMessage} />
        ) : null}
        {!clients.isLoading && !clients.error ? (
          <>
            <DataTable
              columns={columns}
              rows={clients.data?.data ?? []}
              getRowKey={(client) => client.id}
              emptyTitle="No clients found"
            />
            <PaginationControls
              page={clients.data?.meta.page ?? page}
              totalPages={clients.data?.meta.totalPages ?? 1}
              onPageChange={setPage}
            />
          </>
        ) : null}
      </div>
    </PermissionGuard>
  );
}
