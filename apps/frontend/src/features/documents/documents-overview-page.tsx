"use client";

import Link from "next/link";
import { FileText, FolderTree, Library, Plus, Tags } from "lucide-react";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { buttonVariants } from "@/components/ui/button";
import { DataCard } from "@/components/shared/data-card";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { PermissionGuard } from "@/components/shared/permission-guard";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { useDocuments, useDocumentFolders } from "@/features/documents/hooks";
import type { DocumentRecord } from "@/features/documents/types";
import {
  fileMeta,
  formatDocumentDate,
  latestVersion,
} from "@/features/documents/utils";
import { useKnowledgeBaseArticles } from "@/features/knowledge-base/hooks";

export function DocumentsOverviewPage() {
  const folders = useDocumentFolders({ page: 1, limit: 1 });
  const documents = useDocuments({
    page: 1,
    limit: 100,
    sortBy: "updatedAt",
    sortOrder: "desc",
  });
  const articles = useKnowledgeBaseArticles({ page: 1, limit: 1 });
  const draftArticles = useKnowledgeBaseArticles({
    page: 1,
    limit: 1,
    status: "DRAFT",
  });
  const now = new Date();
  const thirtyDays = new Date(now);
  thirtyDays.setDate(now.getDate() + 30);
  const expiringDocuments =
    documents.data?.data.filter((document) => {
      if (!document.expiresAt) return false;
      const expiresAt = new Date(document.expiresAt);
      return expiresAt >= now && expiresAt <= thirtyDays;
    }) ?? [];
  const recentDocuments = documents.data?.data.slice(0, 8) ?? [];
  const loading =
    folders.isLoading ||
    documents.isLoading ||
    articles.isLoading ||
    draftArticles.isLoading;
  const hasError =
    folders.error || documents.error || articles.error || draftArticles.error;
  const columns: DataTableColumn<DocumentRecord>[] = [
    {
      key: "title",
      header: "Document",
      render: (row) => (
        <Link
          href={`/documents/records/${row.id}`}
          className="font-medium text-primary hover:underline"
        >
          {row.title}
          <span className="block text-xs font-normal text-muted-foreground">
            {fileMeta(latestVersion(row))}
          </span>
        </Link>
      ),
    },
    {
      key: "visibility",
      header: "Visibility",
      render: (row) => <StatusBadge status={row.visibility} />,
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "updated",
      header: "Updated",
      render: (row) => formatDocumentDate(row.updatedAt ?? row.createdAt),
    },
  ];
  return (
    <PermissionGuard
      permission="documents.view"
      fallback={
        <ErrorState
          title="Permission required"
          message="You do not have access to documents."
        />
      }
    >
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Documents"
          description="Document metadata, file versions, folders, tags, and knowledge base content."
          actions={
            <PermissionGuard permission="documents.upload">
              <Link
                href="/documents/records/new"
                className={buttonVariants({ variant: "default" })}
              >
                <Plus className="size-4" />
                New document
              </Link>
            </PermissionGuard>
          }
        />
        {loading ? <LoadingState rows={4} /> : null}
        {hasError ? (
          <ErrorState title="Unable to load document overview" />
        ) : null}
        {!loading && !hasError ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
              <StatCard
                title="Documents"
                value={documents.data?.meta.total ?? 0}
                icon={FileText}
                tone="primary"
              />
              <StatCard
                title="Folders"
                value={folders.data?.meta.total ?? 0}
                icon={FolderTree}
                tone="info"
              />
              <StatCard
                title="Expiring Soon"
                value={expiringDocuments.length}
                icon={Tags}
                tone="warning"
              />
              <StatCard
                title="Recently Updated"
                value={recentDocuments.length}
                icon={FileText}
                tone="success"
              />
              <StatCard
                title="KB Articles"
                value={articles.data?.meta.total ?? 0}
                icon={Library}
                tone="primary"
              />
              <StatCard
                title="Draft Articles"
                value={draftArticles.data?.meta.total ?? 0}
                icon={Library}
                tone="warning"
              />
            </div>
            <DataCard title="Recently Updated Documents">
              <DataTable
                columns={columns}
                rows={recentDocuments}
                getRowKey={(row) => row.id}
                emptyTitle="No documents found"
              />
            </DataCard>
          </>
        ) : null}
      </div>
    </PermissionGuard>
  );
}
