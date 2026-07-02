"use client";

import Link from "next/link";
import { Edit, Eye, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { PaginationControls } from "@/components/data/pagination-controls";
import { SearchFilterBar } from "@/components/data/search-filter-bar";
import { SelectField } from "@/components/forms/select-field";
import { buttonVariants } from "@/components/ui/button";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { PermissionGuard } from "@/components/shared/permission-guard";
import { StatusBadge } from "@/components/shared/status-badge";
import { documentStatusOptions, documentVisibilityOptions, linkedEntityTypeOptions } from "@/features/documents/schemas";
import { useDocumentCategories, useDocumentFolders, useDocuments } from "@/features/documents/hooks";
import type { DocumentRecord, DocumentStatus, DocumentVisibility } from "@/features/documents/types";
import { ALL, categoryName, fileMeta, folderName, formatDocumentDate, latestVersion } from "@/features/documents/utils";
import { ApiClientError } from "@/lib/api/client";

const allOption = { value: ALL, label: "All" };

export function DocumentRecordsListPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(ALL);
  const [visibility, setVisibility] = useState(ALL);
  const [categoryId, setCategoryId] = useState(ALL);
  const [folderId, setFolderId] = useState(ALL);
  const [linkedEntityType, setLinkedEntityType] = useState(ALL);

  const documents = useDocuments({
    page,
    limit: 20,
    search: search || undefined,
    status: status === ALL ? undefined : (status as DocumentStatus),
    visibility: visibility === ALL ? undefined : (visibility as DocumentVisibility),
    categoryId: categoryId === ALL ? undefined : categoryId,
    folderId: folderId === ALL ? undefined : folderId,
    sortBy: "updatedAt",
    sortOrder: "desc",
  });
  const folders = useDocumentFolders({ page: 1, limit: 100, sortBy: "name", sortOrder: "asc" });
  const categories = useDocumentCategories({ page: 1, limit: 100, sortBy: "name", sortOrder: "asc" });

  const folderOptions = useMemo(
    () => [{ value: ALL, label: "All folders" }, ...(folders.data?.data ?? []).map((folder) => ({ value: folder.id, label: folder.name }))],
    [folders.data?.data],
  );
  const categoryOptions = useMemo(
    () => [{ value: ALL, label: "All categories" }, ...(categories.data?.data ?? []).map((category) => ({ value: category.id, label: category.name }))],
    [categories.data?.data],
  );
  const filteredRows = (documents.data?.data ?? []).filter((document) => {
    if (linkedEntityType === ALL) return true;
    return document.links?.some((link) => link.entityType === linkedEntityType);
  });

  const columns: DataTableColumn<DocumentRecord>[] = [
    {
      key: "title",
      header: "Document",
      render: (document) => (
        <Link href={`/documents/records/${document.id}`} className="font-medium text-primary hover:underline">
          {document.title}
          <span className="block text-xs font-normal text-muted-foreground">{fileMeta(latestVersion(document))}</span>
        </Link>
      ),
    },
    { key: "folder", header: "Folder", render: (document) => folderName(folders.data?.data, document.folderId) },
    { key: "category", header: "Category", render: (document) => categoryName(categories.data?.data, document.categoryId) },
    { key: "visibility", header: "Visibility", render: (document) => <StatusBadge status={document.visibility} /> },
    { key: "status", header: "Status", render: (document) => <StatusBadge status={document.status} /> },
    { key: "expires", header: "Expires", render: (document) => formatDocumentDate(document.expiresAt) },
    { key: "updated", header: "Updated", render: (document) => formatDocumentDate(document.updatedAt) },
    {
      key: "actions",
      header: "Actions",
      render: (document) => (
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/documents/records/${document.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
            <Eye className="size-4" />
            View
          </Link>
          <PermissionGuard permission="documents.manage">
            <Link href={`/documents/records/${document.id}/edit`} className={buttonVariants({ variant: "outline", size: "sm" })}>
              <Edit className="size-4" />
              Edit
            </Link>
          </PermissionGuard>
        </div>
      ),
    },
  ];
  const errorMessage = documents.error instanceof ApiClientError ? documents.error.message : documents.error instanceof Error ? documents.error.message : undefined;

  return (
    <PermissionGuard permission="documents.view" fallback={<ErrorState title="Permission required" message="You do not have access to document records." />}>
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Document Records"
          description="Search metadata-only document records, ownership, visibility, expiry, and version metadata."
          actions={
            <PermissionGuard permission="documents.upload">
              <Link href="/documents/records/new" className={buttonVariants({ variant: "default" })}>
                <Plus className="size-4" />
                New document
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
          placeholder="Search documents"
          filters={
            <>
              <SelectField value={status} onValueChange={(value) => { setStatus(value); setPage(1); }} className="w-full sm:w-44" options={[{ value: ALL, label: "All statuses" }, ...documentStatusOptions.map((value) => ({ value, label: value }))]} />
              <SelectField value={visibility} onValueChange={(value) => { setVisibility(value); setPage(1); }} className="w-full sm:w-48" options={[{ value: ALL, label: "All visibility" }, ...documentVisibilityOptions.map((value) => ({ value, label: value }))]} />
              <SelectField value={folderId} onValueChange={(value) => { setFolderId(value); setPage(1); }} className="w-full sm:w-52" options={folderOptions} />
              <SelectField value={categoryId} onValueChange={(value) => { setCategoryId(value); setPage(1); }} className="w-full sm:w-52" options={categoryOptions} />
              <SelectField value={linkedEntityType} onValueChange={(value) => { setLinkedEntityType(value); setPage(1); }} className="w-full sm:w-48" options={[allOption, ...linkedEntityTypeOptions.filter((value) => value !== "__none__").map((value) => ({ value, label: value.replaceAll("_", " ") }))]} />
            </>
          }
          onReset={() => {
            setSearch("");
            setStatus(ALL);
            setVisibility(ALL);
            setFolderId(ALL);
            setCategoryId(ALL);
            setLinkedEntityType(ALL);
            setPage(1);
          }}
        />
        {documents.isLoading ? <LoadingState rows={6} /> : null}
        {documents.error ? <ErrorState title="Unable to load documents" message={errorMessage} /> : null}
        {!documents.isLoading && !documents.error ? (
          <>
            <DataTable columns={columns} rows={filteredRows} getRowKey={(document) => document.id} emptyTitle="No document records found" />
            <PaginationControls page={documents.data?.meta.page ?? page} totalPages={documents.data?.meta.totalPages ?? 1} onPageChange={setPage} />
          </>
        ) : null}
      </div>
    </PermissionGuard>
  );
}
