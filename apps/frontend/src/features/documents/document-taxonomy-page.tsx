"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Save } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { PaginationControls } from "@/components/data/pagination-controls";
import { SearchFilterBar } from "@/components/data/search-filter-bar";
import { FormFieldWrapper } from "@/components/forms/form-field-wrapper";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { PermissionGuard } from "@/components/shared/permission-guard";
import {
  documentCategorySchema,
  documentTagSchema,
  type DocumentCategoryFormValues,
  type DocumentTagFormValues,
} from "@/features/documents/schemas";
import {
  useCreateDocumentCategory,
  useCreateDocumentTag,
  useDocumentCategories,
  useDocumentTags,
} from "@/features/documents/hooks";
import type { DocumentCategory, DocumentTag } from "@/features/documents/types";
import { formatDocumentDate } from "@/features/documents/utils";
import { ApiClientError } from "@/lib/api/client";

export function DocumentCategoriesPage() {
  return <DocumentTaxonomyPage kind="categories" />;
}

export function DocumentTagsPage() {
  return <DocumentTaxonomyPage kind="tags" />;
}

function DocumentTaxonomyPage({ kind }: { kind: "categories" | "tags" }) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const categories = useDocumentCategories({
    page,
    limit: 20,
    search: kind === "categories" ? search || undefined : undefined,
    sortBy: "name",
    sortOrder: "asc",
  });
  const tags = useDocumentTags({
    page,
    limit: 20,
    search: kind === "tags" ? search || undefined : undefined,
    sortBy: "name",
    sortOrder: "asc",
  });
  const createCategory = useCreateDocumentCategory();
  const createTag = useCreateDocumentTag();
  const categoryForm = useForm<DocumentCategoryFormValues>({
    resolver: zodResolver(documentCategorySchema),
    defaultValues: { name: "", description: "" },
  });
  const tagForm = useForm<DocumentTagFormValues>({
    resolver: zodResolver(documentTagSchema),
    defaultValues: { name: "" },
  });
  const isCategories = kind === "categories";
  const query = isCategories ? categories : tags;
  async function onSubmit(values: DocumentCategoryFormValues | DocumentTagFormValues) {
    setFormError(null);
    try {
      if (isCategories) await createCategory.mutateAsync(values as DocumentCategoryFormValues);
      else await createTag.mutateAsync(values as DocumentTagFormValues);
      categoryForm.reset({ name: "", description: "" });
      tagForm.reset({ name: "" });
      setOpen(false);
    } catch (caught) {
      setFormError(
        caught instanceof ApiClientError
          ? caught.message
          : `Unable to create ${isCategories ? "category" : "tag"}`,
      );
    }
  }
  const categoryColumns: DataTableColumn<DocumentCategory>[] = [
    { key: "name", header: "Name", render: (row) => row.name },
    { key: "description", header: "Description", render: (row) => row.description ?? "-" },
    { key: "created", header: "Created", render: (row) => formatDocumentDate(row.createdAt) },
  ];
  const tagColumns: DataTableColumn<DocumentTag>[] = [
    { key: "name", header: "Name", render: (row) => row.name },
    { key: "created", header: "Created", render: (row) => formatDocumentDate(row.createdAt) },
  ];
  return (
    <PermissionGuard
      permission="documents.view"
      fallback={<ErrorState title="Permission required" message="You do not have access to document metadata." />}
    >
      <div className="flex flex-col gap-6">
        <PageHeader
          title={isCategories ? "Document Categories" : "Document Tags"}
          description={
            isCategories
              ? "Category metadata for organizing document records."
              : "Reusable tags used by documents and knowledge base articles."
          }
          actions={
            <PermissionGuard permission="documents.manage">
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger
                  render={
                    <Button
                      type="button"
                      onClick={() => {
                        setFormError(null);
                        setOpen(true);
                      }}
                    />
                  }
                >
                  <Plus className="size-4" />
                  {isCategories ? "New category" : "New tag"}
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{isCategories ? "New Category" : "New Tag"}</DialogTitle>
                  </DialogHeader>
                  {isCategories ? (
                    <form
                      onSubmit={categoryForm.handleSubmit(onSubmit)}
                      className="flex flex-col gap-4"
                    >
                      <FormFieldWrapper label="Name" error={categoryForm.formState.errors.name?.message}>
                        <Input {...categoryForm.register("name")} />
                      </FormFieldWrapper>
                      <FormFieldWrapper label="Description">
                        <Input {...categoryForm.register("description")} />
                      </FormFieldWrapper>
                      {formError ? <ErrorState title="Unable to save category" message={formError} /> : null}
                      <Button type="submit" disabled={createCategory.isPending}>
                        <Save className="size-4" />
                        Save category
                      </Button>
                    </form>
                  ) : (
                    <form onSubmit={tagForm.handleSubmit(onSubmit)} className="flex flex-col gap-4">
                      <FormFieldWrapper label="Name" error={tagForm.formState.errors.name?.message}>
                        <Input {...tagForm.register("name")} />
                      </FormFieldWrapper>
                      {formError ? <ErrorState title="Unable to save tag" message={formError} /> : null}
                      <Button type="submit" disabled={createTag.isPending}>
                        <Save className="size-4" />
                        Save tag
                      </Button>
                    </form>
                  )}
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
          placeholder={isCategories ? "Search categories" : "Search tags"}
          onReset={() => {
            setSearch("");
            setPage(1);
          }}
        />
        {query.isLoading ? <LoadingState rows={6} /> : null}
        {query.error ? (
          <ErrorState
            title={`Unable to load ${isCategories ? "categories" : "tags"}`}
            message={query.error instanceof Error ? query.error.message : undefined}
          />
        ) : null}
        {!query.isLoading && !query.error ? (
          <>
            {isCategories ? (
              <DataTable
                columns={categoryColumns}
                rows={categories.data?.data ?? []}
                getRowKey={(row) => row.id}
                emptyTitle="No document categories found"
              />
            ) : (
              <DataTable
                columns={tagColumns}
                rows={tags.data?.data ?? []}
                getRowKey={(row) => row.id}
                emptyTitle="No document tags found"
              />
            )}
            <PaginationControls
              page={query.data?.meta.page ?? page}
              totalPages={query.data?.meta.totalPages ?? 1}
              onPageChange={setPage}
            />
          </>
        ) : null}
      </div>
    </PermissionGuard>
  );
}
