"use client";

import Link from "next/link";
import { Eye, Plus } from "lucide-react";
import type { ReactNode } from "react";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { buttonVariants } from "@/components/ui/button";
import { DataCard } from "@/components/shared/data-card";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { PermissionGuard } from "@/components/shared/permission-guard";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  useDocumentFolder,
  useDocumentCategories,
  useDocuments,
} from "@/features/documents/hooks";
import type { DocumentRecord } from "@/features/documents/types";
import {
  categoryName,
  fileMeta,
  formatDocumentDate,
  latestVersion,
} from "@/features/documents/utils";

export function DocumentFolderDetailPage({ folderId }: { folderId: string }) {
  const folder = useDocumentFolder(folderId);
  const documents = useDocuments({
    page: 1,
    limit: 50,
    folderId,
    sortBy: "updatedAt",
    sortOrder: "desc",
  });
  const categories = useDocumentCategories({ page: 1, limit: 100, sortBy: "name", sortOrder: "asc" });
  const columns: DataTableColumn<DocumentRecord>[] = [
    {
      key: "title",
      header: "Document",
      render: (row) => (
        <Link href={`/documents/records/${row.id}`} className="font-medium text-primary hover:underline">
          {row.title}
          <span className="block text-xs font-normal text-muted-foreground">
            {fileMeta(latestVersion(row))}
          </span>
        </Link>
      ),
    },
    {
      key: "category",
      header: "Category",
      render: (row) => categoryName(categories.data?.data, row.categoryId),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "expires",
      header: "Expires",
      render: (row) => formatDocumentDate(row.expiresAt),
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <Link href={`/documents/records/${row.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
          <Eye className="size-4" />
          View
        </Link>
      ),
    },
  ];
  return (
    <PermissionGuard
      permission="documents.view"
      fallback={<ErrorState title="Permission required" message="You do not have access to document folders." />}
    >
      {folder.isLoading ? <LoadingState rows={6} /> : null}
      {folder.error ? (
        <ErrorState
          title="Unable to load folder"
          message={folder.error instanceof Error ? folder.error.message : undefined}
        />
      ) : null}
      {!folder.isLoading && !folder.error && folder.data ? (
        <div className="flex flex-col gap-6">
          <PageHeader
            title={folder.data.name}
            description={folder.data.path}
            actions={
              <PermissionGuard permission="documents.upload">
                <Link href="/documents/records/new" className={buttonVariants({ variant: "default" })}>
                  <Plus className="size-4" />
                  New document
                </Link>
              </PermissionGuard>
            }
          />
          <div className="grid gap-4 xl:grid-cols-3">
            <DataCard title="Folder Info">
              <DetailRows
                rows={[
                  ["Name", folder.data.name],
                  ["Path", folder.data.path],
                  ["Visibility", <StatusBadge key="visibility" status={folder.data.visibility} />],
                  ["Parent", folder.data.parentFolderId?.slice(0, 8) ?? "-"],
                ]}
              />
            </DataCard>
            <DataCard title="Ownership">
              <DetailRows
                rows={[
                  ["Owner user", folder.data.ownerUserId?.slice(0, 8) ?? "-"],
                  ["Department", folder.data.departmentId?.slice(0, 8) ?? "-"],
                  ["Created", formatDocumentDate(folder.data.createdAt)],
                  ["Updated", formatDocumentDate(folder.data.updatedAt)],
                ]}
              />
            </DataCard>
            <DataCard title="Description">
              <p className="text-sm text-muted-foreground">
                {folder.data.description ?? "No description recorded."}
              </p>
            </DataCard>
          </div>
          <DataCard title="Documents In Folder">
            {documents.isLoading ? <LoadingState rows={5} /> : null}
            {!documents.isLoading ? (
              <DataTable
                columns={columns}
                rows={documents.data?.data ?? []}
                getRowKey={(row) => row.id}
                emptyTitle="No documents in this folder"
              />
            ) : null}
          </DataCard>
        </div>
      ) : null}
    </PermissionGuard>
  );
}

function DetailRows({ rows }: { rows: Array<[string, ReactNode]> }) {
  return (
    <dl className="grid gap-3">
      {rows.map(([label, value]) => (
        <div key={label} className="grid gap-1 sm:grid-cols-3 sm:gap-3">
          <dt className="text-sm text-muted-foreground">{label}</dt>
          <dd className="text-sm font-medium text-foreground sm:col-span-2">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
