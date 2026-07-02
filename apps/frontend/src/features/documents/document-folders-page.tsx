"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { Edit, Eye, FolderPlus, Save, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { PaginationControls } from "@/components/data/pagination-controls";
import { SearchFilterBar } from "@/components/data/search-filter-bar";
import { FormFieldWrapper } from "@/components/forms/form-field-wrapper";
import { SelectField } from "@/components/forms/select-field";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { PermissionGuard } from "@/components/shared/permission-guard";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  documentFolderSchema,
  documentVisibilityOptions,
  type DocumentFolderFormValues,
} from "@/features/documents/schemas";
import {
  useCreateDocumentFolder,
  useDeleteDocumentFolder,
  useDocumentFolders,
  useUpdateDocumentFolder,
} from "@/features/documents/hooks";
import type { DocumentFolder, DocumentVisibility } from "@/features/documents/types";
import {
  ALL,
  NONE,
  folderName,
  formatDocumentDate,
  toFolderPayload,
} from "@/features/documents/utils";
import { ApiClientError } from "@/lib/api/client";

export function DocumentFoldersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [visibility, setVisibility] = useState(ALL);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<DocumentFolder | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const folders = useDocumentFolders({
    page,
    limit: 20,
    search: search || undefined,
    visibility: visibility === ALL ? undefined : (visibility as DocumentVisibility),
    sortBy: "path",
    sortOrder: "asc",
  });
  const folderLookup = useDocumentFolders({
    page: 1,
    limit: 100,
    sortBy: "path",
    sortOrder: "asc",
  });
  const createFolder = useCreateDocumentFolder();
  const updateFolder = useUpdateDocumentFolder(editing?.id ?? "");
  const deleteFolder = useDeleteDocumentFolder();
  const form = useForm<DocumentFolderFormValues>({
    resolver: zodResolver(documentFolderSchema),
    defaultValues: defaultFolderValues(),
  });
  const folderOptions = useMemo(
    () => [
      { value: NONE, label: "No parent folder" },
      ...(folderLookup.data?.data ?? [])
        .filter((folder) => folder.id !== editing?.id)
        .map((folder) => ({ value: folder.id, label: folder.path })),
    ],
    [editing?.id, folderLookup.data?.data],
  );
  function startCreate() {
    setEditing(null);
    setFormError(null);
    form.reset(defaultFolderValues());
    setOpen(true);
  }
  function startEdit(folder: DocumentFolder) {
    setEditing(folder);
    setFormError(null);
    form.reset(defaultFolderValues(folder));
    setOpen(true);
  }
  async function onSubmit(values: DocumentFolderFormValues) {
    setFormError(null);
    try {
      if (editing) await updateFolder.mutateAsync(toFolderPayload(values));
      else await createFolder.mutateAsync(toFolderPayload(values));
      setOpen(false);
    } catch (caught) {
      setFormError(
        caught instanceof ApiClientError ? caught.message : "Unable to save folder",
      );
    }
  }
  const rows = folders.data?.data ?? [];
  const allFolders = folderLookup.data?.data ?? [];
  const columns: DataTableColumn<DocumentFolder>[] = [
    {
      key: "folder",
      header: "Folder",
      render: (row) => (
        <Link
          href={`/documents/folders/${row.id}`}
          className="font-medium text-primary hover:underline"
        >
          {row.name}
          <span className="block text-xs font-normal text-muted-foreground">
            {row.path}
          </span>
        </Link>
      ),
    },
    {
      key: "parent",
      header: "Parent",
      render: (row) => folderName(allFolders, row.parentFolderId),
    },
    {
      key: "visibility",
      header: "Visibility",
      render: (row) => <StatusBadge status={row.visibility} />,
    },
    {
      key: "owner",
      header: "Owner",
      render: (row) => row.ownerUserId?.slice(0, 8) ?? "-",
    },
    {
      key: "created",
      header: "Created",
      render: (row) => formatDocumentDate(row.createdAt),
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/documents/folders/${row.id}`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <Eye className="size-4" />
            View
          </Link>
          <PermissionGuard permission="documents.manage">
            <Button type="button" variant="outline" size="sm" onClick={() => startEdit(row)}>
              <Edit className="size-4" />
              Edit
            </Button>
            <ConfirmDialog
              title="Delete folder"
              description="This soft-deletes the folder metadata. Existing document metadata is not removed by this screen."
              confirmLabel="Delete"
              destructive
              onConfirm={() => void deleteFolder.mutateAsync(row.id)}
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
  return (
    <PermissionGuard
      permission="documents.view"
      fallback={<ErrorState title="Permission required" message="You do not have access to document folders." />}
    >
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Document Folders"
          description="Folder hierarchy metadata and document organization."
          actions={
            <PermissionGuard permission="documents.manage">
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger render={<Button type="button" onClick={startCreate} />}>
                  <FolderPlus className="size-4" />
                  New folder
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editing ? "Edit Folder" : "New Folder"}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
                    <FormFieldWrapper label="Parent folder">
                      <Controller
                        control={form.control}
                        name="parentFolderId"
                        render={({ field }) => (
                          <SelectField
                            value={field.value || NONE}
                            onValueChange={field.onChange}
                            options={folderOptions}
                          />
                        )}
                      />
                    </FormFieldWrapper>
                    <FormFieldWrapper label="Name" error={form.formState.errors.name?.message}>
                      <Input {...form.register("name")} />
                    </FormFieldWrapper>
                    <FormFieldWrapper label="Description">
                      <Input {...form.register("description")} />
                    </FormFieldWrapper>
                    <FormFieldWrapper label="Visibility">
                      <Controller
                        control={form.control}
                        name="visibility"
                        render={({ field }) => (
                          <SelectField
                            value={field.value}
                            onValueChange={field.onChange}
                            options={documentVisibilityOptions.map((value) => ({
                              value,
                              label: value,
                            }))}
                          />
                        )}
                      />
                    </FormFieldWrapper>
                    {formError ? <ErrorState title="Unable to save folder" message={formError} /> : null}
                    <Button type="submit" disabled={createFolder.isPending || updateFolder.isPending}>
                      <Save className="size-4" />
                      Save folder
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </PermissionGuard>
          }
        />
        <SearchFilterBar
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder="Search folders"
          filters={
            <SelectField
              value={visibility}
              onValueChange={(value) => {
                setVisibility(value);
                setPage(1);
              }}
              options={[
                { value: ALL, label: "All visibility" },
                ...documentVisibilityOptions.map((value) => ({ value, label: value })),
              ]}
            />
          }
          onReset={() => {
            setSearch("");
            setVisibility(ALL);
            setPage(1);
          }}
        />
        {folders.isLoading ? <LoadingState rows={6} /> : null}
        {folders.error ? (
          <ErrorState
            title="Unable to load folders"
            message={folders.error instanceof Error ? folders.error.message : undefined}
          />
        ) : null}
        {!folders.isLoading && !folders.error ? (
          <>
            <DataTable
              columns={columns}
              rows={rows}
              getRowKey={(row) => row.id}
              emptyTitle="No document folders found"
            />
            <PaginationControls
              page={folders.data?.meta.page ?? page}
              totalPages={folders.data?.meta.totalPages ?? 1}
              onPageChange={setPage}
            />
          </>
        ) : null}
      </div>
    </PermissionGuard>
  );
}

function defaultFolderValues(folder?: DocumentFolder): DocumentFolderFormValues {
  return {
    parentFolderId: folder?.parentFolderId ?? NONE,
    name: folder?.name ?? "",
    description: folder?.description ?? "",
    visibility: folder?.visibility ?? "COMPANY",
  };
}
