"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Archive, Edit, Plus, RotateCcw, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { FormFieldWrapper } from "@/components/forms/form-field-wrapper";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataCard } from "@/components/shared/data-card";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { PermissionGuard } from "@/components/shared/permission-guard";
import { StatusBadge } from "@/components/shared/status-badge";
import { documentVersionSchema, type DocumentVersionFormValues } from "@/features/documents/schemas";
import { useChangeDocumentStatus, useCreateDocumentVersion, useDeleteDocument, useDocument, useDocumentCategories, useDocumentFolders, useDocumentTags } from "@/features/documents/hooks";
import type { DocumentVersion } from "@/features/documents/types";
import { categoryName, documentTagIds, fileMeta, folderName, formatDocumentDate, formatFileSize, latestVersion, tagLabels, toVersionPayload } from "@/features/documents/utils";
import { ApiClientError } from "@/lib/api/client";

export function DocumentRecordDetailPage({ documentId }: { documentId: string }) {
  const router = useRouter();
  const document = useDocument(documentId);
  const folders = useDocumentFolders({ page: 1, limit: 100, sortBy: "name", sortOrder: "asc" });
  const categories = useDocumentCategories({ page: 1, limit: 100, sortBy: "name", sortOrder: "asc" });
  const tags = useDocumentTags({ page: 1, limit: 100, sortBy: "name", sortOrder: "asc" });
  const deleteDocument = useDeleteDocument();
  const changeStatus = useChangeDocumentStatus(documentId);

  async function removeDocument() {
    await deleteDocument.mutateAsync(documentId);
    router.replace("/documents/records");
  }

  const errorMessage = document.error instanceof ApiClientError ? document.error.message : document.error instanceof Error ? document.error.message : undefined;

  return (
    <PermissionGuard permission="documents.view" fallback={<ErrorState title="Permission required" message="You do not have access to document records." />}>
      {document.isLoading ? <LoadingState rows={6} /> : null}
      {document.error ? <ErrorState title="Unable to load document" message={errorMessage} /> : null}
      {!document.isLoading && !document.error && document.data ? (
        <div className="flex flex-col gap-6">
          <PageHeader
            title={document.data.title}
            description={fileMeta(latestVersion(document.data))}
            actions={
              <>
                <PermissionGuard permission="documents.manage">
                  <Link href={`/documents/records/${documentId}/edit`} className={buttonVariants({ variant: "outline" })}>
                    <Edit className="size-4" />
                    Edit
                  </Link>
                  <Button type="button" variant="outline" disabled={changeStatus.isPending} onClick={() => void changeStatus.mutateAsync({ status: document.data?.status === "ARCHIVED" ? "ACTIVE" : "ARCHIVED" })}>
                    {document.data.status === "ARCHIVED" ? <RotateCcw className="size-4" /> : <Archive className="size-4" />}
                    {document.data.status === "ARCHIVED" ? "Restore" : "Archive"}
                  </Button>
                  <ConfirmDialog
                    title="Delete document record"
                    description="This soft-deletes the document metadata record. It does not delete binary storage because uploads are not implemented yet."
                    confirmLabel="Delete"
                    destructive
                    onConfirm={() => void removeDocument()}
                    trigger={<Button type="button" variant="destructive"><Trash2 className="size-4" />Delete</Button>}
                  />
                </PermissionGuard>
              </>
            }
          />
          <div className="grid gap-4 xl:grid-cols-3">
            <DataCard title="Document Metadata">
              <DetailRows rows={[
                ["Title", document.data.title],
                ["Folder", folderName(folders.data?.data, document.data.folderId)],
                ["Category", categoryName(categories.data?.data, document.data.categoryId)],
                ["Visibility", <StatusBadge key="visibility" status={document.data.visibility} />],
                ["Status", <StatusBadge key="status" status={document.data.status} />],
              ]} />
            </DataCard>
            <DataCard title="Lifecycle">
              <DetailRows rows={[
                ["Owner user", document.data.ownerUserId?.slice(0, 8) ?? "-"],
                ["Expires", formatDocumentDate(document.data.expiresAt)],
                ["Reminder", formatDocumentDate(document.data.reminderAt)],
                ["Created", formatDocumentDate(document.data.createdAt)],
                ["Updated", formatDocumentDate(document.data.updatedAt)],
              ]} />
            </DataCard>
            <DataCard title="Description">
              <p className="text-sm text-muted-foreground">{document.data.description ?? "No description recorded."}</p>
            </DataCard>
          </div>
          <Tabs defaultValue="versions">
            <TabsList>
              <TabsTrigger value="versions">Versions</TabsTrigger>
              <TabsTrigger value="links">Links & Tags</TabsTrigger>
            </TabsList>
            <TabsContent value="versions">
              <DocumentVersionsSection documentId={documentId} versions={document.data.versions ?? []} />
            </TabsContent>
            <TabsContent value="links">
              <DataCard title="Links And Tags">
                <DetailRows rows={[
                  ["Linked entities", document.data.links?.length ? document.data.links.map((link) => `${link.entityType}: ${link.entityId.slice(0, 8)}`).join(", ") : "-"],
                  ["Tags", tagLabels(tags.data?.data, documentTagIds(document.data)).join(", ") || "-"],
                ]} />
              </DataCard>
            </TabsContent>
          </Tabs>
        </div>
      ) : null}
    </PermissionGuard>
  );
}

function DocumentVersionsSection({ documentId, versions }: { documentId: string; versions: DocumentVersion[] }) {
  const createVersion = useCreateDocumentVersion(documentId);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<DocumentVersionFormValues>({
    resolver: zodResolver(documentVersionSchema),
    defaultValues: { fileName: "", storageKey: "", mimeType: "", size: 1, checksum: "", notes: "" },
  });
  const columns: DataTableColumn<DocumentVersion>[] = [
    { key: "version", header: "Version", render: (version) => `v${version.versionNumber}` },
    { key: "file", header: "File", render: (version) => version.fileName },
    { key: "mime", header: "MIME type", render: (version) => version.mimeType },
    { key: "size", header: "Size", render: (version) => formatFileSize(version.size) },
    { key: "notes", header: "Notes", render: (version) => version.notes ?? "-" },
    { key: "created", header: "Created", render: (version) => formatDocumentDate(version.createdAt) },
  ];

  async function onSubmit(values: DocumentVersionFormValues) {
    setError(null);
    try {
      await createVersion.mutateAsync(toVersionPayload(values));
      form.reset({ fileName: "", storageKey: "", mimeType: "", size: 1, checksum: "", notes: "" });
      setOpen(false);
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : "Unable to add version metadata");
    }
  }

  return (
    <DataCard
      title="Version Metadata"
      description="Metadata only. No binary upload or preview is performed."
      action={
        <PermissionGuard permission="documents.upload">
          <Button type="button" onClick={() => setOpen(true)}>
            <Plus className="size-4" />
            Add version
          </Button>
        </PermissionGuard>
      }
    >
      <DataTable columns={columns} rows={[...versions].sort((left, right) => right.versionNumber - left.versionNumber)} getRowKey={(version) => version.id} emptyTitle="No version metadata found" />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add version metadata</DialogTitle>
            <DialogDescription>Create a new document version metadata record without uploading a file.</DialogDescription>
          </DialogHeader>
          <form id="document-version-form" onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FormFieldWrapper label="File name" htmlFor="versionFileName" error={form.formState.errors.fileName?.message}><Input id="versionFileName" {...form.register("fileName")} /></FormFieldWrapper>
            <FormFieldWrapper label="Storage key" htmlFor="versionStorageKey" error={form.formState.errors.storageKey?.message}><Input id="versionStorageKey" {...form.register("storageKey")} /></FormFieldWrapper>
            <FormFieldWrapper label="MIME type" htmlFor="versionMimeType" error={form.formState.errors.mimeType?.message}><Input id="versionMimeType" {...form.register("mimeType")} /></FormFieldWrapper>
            <FormFieldWrapper label="Size" htmlFor="versionSize" error={form.formState.errors.size?.message}><Input id="versionSize" type="number" min={1} {...form.register("size", { valueAsNumber: true })} /></FormFieldWrapper>
            <FormFieldWrapper label="Checksum" htmlFor="versionChecksum"><Input id="versionChecksum" {...form.register("checksum")} /></FormFieldWrapper>
            <FormFieldWrapper label="Notes" htmlFor="versionNotes"><Textarea id="versionNotes" rows={3} {...form.register("notes")} /></FormFieldWrapper>
            {error ? <ErrorState title="Unable to add version metadata" message={error} /> : null}
          </form>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" form="document-version-form" disabled={createVersion.isPending}>Save version</Button>
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
          <dd className="text-sm font-medium text-foreground sm:col-span-2">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
