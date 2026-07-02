"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { FormFieldWrapper } from "@/components/forms/form-field-wrapper";
import { SelectField } from "@/components/forms/select-field";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DataCard } from "@/components/shared/data-card";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { PermissionGuard } from "@/components/shared/permission-guard";
import { documentRecordSchema, documentVisibilityOptions, linkedEntityTypeOptions, type DocumentRecordFormValues } from "@/features/documents/schemas";
import { useCreateDocument, useDocument, useDocumentCategories, useDocumentFolders, useDocumentTags, useUpdateDocument } from "@/features/documents/hooks";
import type { DocumentRecord } from "@/features/documents/types";
import { documentTagIds, NONE, toDateInput, toDocumentPayload, toDocumentUpdatePayload } from "@/features/documents/utils";
import { ApiClientError } from "@/lib/api/client";

export function DocumentRecordFormPage({ documentId }: { documentId?: string }) {
  const router = useRouter();
  const isEdit = Boolean(documentId);
  const document = useDocument(documentId ?? "");
  const folders = useDocumentFolders({ page: 1, limit: 100, sortBy: "name", sortOrder: "asc" });
  const categories = useDocumentCategories({ page: 1, limit: 100, sortBy: "name", sortOrder: "asc" });
  const tags = useDocumentTags({ page: 1, limit: 100, sortBy: "name", sortOrder: "asc" });
  const createDocument = useCreateDocument();
  const updateDocument = useUpdateDocument(documentId ?? "");
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<DocumentRecordFormValues>({
    resolver: zodResolver(documentRecordSchema),
    defaultValues: defaultValues(),
  });

  useEffect(() => {
    if (document.data) form.reset(defaultValues(document.data));
  }, [document.data, form]);

  const folderOptions = useMemo(
    () => [{ value: NONE, label: "No folder" }, ...(folders.data?.data ?? []).map((folder) => ({ value: folder.id, label: folder.name }))],
    [folders.data?.data],
  );
  const categoryOptions = useMemo(
    () => [{ value: NONE, label: "No category" }, ...(categories.data?.data ?? []).map((category) => ({ value: category.id, label: category.name }))],
    [categories.data?.data],
  );
  const currentTagIds = useWatch({ control: form.control, name: "tagIds" }) ?? [];

  async function onSubmit(values: DocumentRecordFormValues) {
    setFormError(null);
    try {
      const saved = isEdit
        ? await updateDocument.mutateAsync(toDocumentUpdatePayload(values))
        : await createDocument.mutateAsync(toDocumentPayload(values));
      router.replace(`/documents/records/${saved.id}`);
    } catch (caught) {
      setFormError(caught instanceof ApiClientError ? caught.message : "Unable to save document metadata");
    }
  }
  const errorMessage = document.error instanceof ApiClientError ? document.error.message : document.error instanceof Error ? document.error.message : undefined;

  return (
    <PermissionGuard permission={isEdit ? "documents.manage" : "documents.upload"} fallback={<ErrorState title="Permission required" message="You do not have permission to manage document metadata." />}>
      <div className="flex flex-col gap-6">
        <PageHeader title={isEdit ? "Edit Document Record" : "New Document Record"} description="Create or update document metadata. Binary upload, OCR, preview, and public sharing are not enabled in this pass." />
        {isEdit && document.isLoading ? <LoadingState rows={6} /> : null}
        {document.error ? <ErrorState title="Unable to load document" message={errorMessage} /> : null}
        {(!isEdit || document.data) && !document.error ? (
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <DataCard title="Document Details">
              <div className="grid gap-4 lg:grid-cols-2">
                <FormFieldWrapper label="Title" htmlFor="title" error={form.formState.errors.title?.message}>
                  <Input id="title" {...form.register("title")} />
                </FormFieldWrapper>
                <FormFieldWrapper label="Visibility">
                  <Controller control={form.control} name="visibility" render={({ field }) => <SelectField value={field.value} onValueChange={field.onChange} options={documentVisibilityOptions.map((value) => ({ value, label: value }))} />} />
                </FormFieldWrapper>
                <FormFieldWrapper label="Folder">
                  <Controller control={form.control} name="folderId" render={({ field }) => <SelectField value={field.value || NONE} onValueChange={field.onChange} options={folderOptions} disabled={isEdit} />} />
                </FormFieldWrapper>
                <FormFieldWrapper label="Category">
                  <Controller control={form.control} name="categoryId" render={({ field }) => <SelectField value={field.value || NONE} onValueChange={field.onChange} options={categoryOptions} />} />
                </FormFieldWrapper>
                <FormFieldWrapper label="Owner user ID" htmlFor="ownerUserId">
                  <Input id="ownerUserId" placeholder="Optional UUID" {...form.register("ownerUserId")} />
                </FormFieldWrapper>
                <FormFieldWrapper label="Expiry date" htmlFor="expiresAt">
                  <Input id="expiresAt" type="date" {...form.register("expiresAt")} />
                </FormFieldWrapper>
                <FormFieldWrapper label="Reminder date" htmlFor="reminderAt">
                  <Input id="reminderAt" type="date" {...form.register("reminderAt")} />
                </FormFieldWrapper>
                <div className="lg:col-span-2">
                  <FormFieldWrapper label="Description" htmlFor="description">
                    <Textarea id="description" rows={4} {...form.register("description")} />
                  </FormFieldWrapper>
                </div>
              </div>
            </DataCard>
            {!isEdit ? (
              <>
                <DataCard title="Initial File Metadata" description="Optional metadata only. The frontend does not upload a binary file yet.">
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormFieldWrapper label="File name" htmlFor="fileName"><Input id="fileName" {...form.register("fileName")} /></FormFieldWrapper>
                    <FormFieldWrapper label="Storage key" htmlFor="storageKey"><Input id="storageKey" {...form.register("storageKey")} /></FormFieldWrapper>
                    <FormFieldWrapper label="MIME type" htmlFor="mimeType"><Input id="mimeType" placeholder="application/pdf" {...form.register("mimeType")} /></FormFieldWrapper>
                    <FormFieldWrapper label="Size" htmlFor="size"><Input id="size" type="number" min={0} {...form.register("size", { valueAsNumber: true })} /></FormFieldWrapper>
                    <div className="md:col-span-2">
                      <FormFieldWrapper label="Checksum" htmlFor="checksum"><Input id="checksum" {...form.register("checksum")} /></FormFieldWrapper>
                    </div>
                  </div>
                </DataCard>
                <DataCard title="Links And Tags" description="Entity links and tags are set when creating the document record.">
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormFieldWrapper label="Linked entity type">
                      <Controller control={form.control} name="linkedEntityType" render={({ field }) => <SelectField value={field.value} onValueChange={field.onChange} options={linkedEntityTypeOptions.map((value) => ({ value, label: value === NONE ? "No linked entity" : value.replaceAll("_", " ") }))} />} />
                    </FormFieldWrapper>
                    <FormFieldWrapper label="Linked entity ID" htmlFor="linkedEntityId">
                      <Input id="linkedEntityId" placeholder="Optional UUID" {...form.register("linkedEntityId")} />
                    </FormFieldWrapper>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    {(tags.data?.data ?? []).map((tag) => (
                      <label key={tag.id} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                        <Checkbox
                          checked={currentTagIds.includes(tag.id)}
                          onCheckedChange={(checked) => {
                            const next = checked ? [...currentTagIds, tag.id] : currentTagIds.filter((id) => id !== tag.id);
                            form.setValue("tagIds", next, { shouldDirty: true });
                          }}
                        />
                        {tag.name}
                      </label>
                    ))}
                    {!tags.data?.data.length ? <p className="text-sm text-muted-foreground">Create document tags before assigning them.</p> : null}
                  </div>
                </DataCard>
              </>
            ) : null}
            {formError ? <ErrorState title="Unable to save document" message={formError} /> : null}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
              <Button type="submit" disabled={form.formState.isSubmitting || createDocument.isPending || updateDocument.isPending}>
                <Save className="size-4" />
                Save document
              </Button>
            </div>
          </form>
        ) : null}
      </div>
    </PermissionGuard>
  );
}

function defaultValues(document?: DocumentRecord): DocumentRecordFormValues {
  const firstLink = document?.links?.[0];
  const firstVersion = document?.versions?.[0];
  return {
    folderId: document?.folderId ?? NONE,
    categoryId: document?.categoryId ?? NONE,
    ownerUserId: document?.ownerUserId ?? "",
    title: document?.title ?? "",
    description: document?.description ?? "",
    visibility: document?.visibility ?? "COMPANY",
    linkedEntityType: firstLink?.entityType ?? NONE,
    linkedEntityId: firstLink?.entityId ?? "",
    tagIds: documentTagIds(document),
    expiresAt: toDateInput(document?.expiresAt),
    reminderAt: toDateInput(document?.reminderAt),
    fileName: firstVersion?.fileName ?? "",
    storageKey: firstVersion?.storageKey ?? "",
    mimeType: firstVersion?.mimeType ?? "",
    size: Number(firstVersion?.size ?? 0),
    checksum: firstVersion?.checksum ?? "",
  };
}
