"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { PaginationControls } from "@/components/data/pagination-controls";
import { SearchFilterBar } from "@/components/data/search-filter-bar";
import { FormFieldWrapper } from "@/components/forms/form-field-wrapper";
import { SelectField } from "@/components/forms/select-field";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DataCard } from "@/components/shared/data-card";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { PermissionGuard } from "@/components/shared/permission-guard";
import { knowledgeBaseCategorySchema, type KnowledgeBaseCategoryFormValues } from "@/features/knowledge-base/schemas";
import { useCreateKnowledgeBaseCategory, useKnowledgeBaseCategories } from "@/features/knowledge-base/hooks";
import type { KnowledgeBaseCategory } from "@/features/knowledge-base/types";
import { formatKnowledgeBaseDate, toKnowledgeBaseCategoryPayload } from "@/features/knowledge-base/utils";
import { NONE } from "@/features/documents/utils";
import { ApiClientError } from "@/lib/api/client";

export function KnowledgeBaseCategoriesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const categories = useKnowledgeBaseCategories({ page, limit: 20, search: search || undefined, sortBy: "name", sortOrder: "asc" });
  const parentCategories = useKnowledgeBaseCategories({ page: 1, limit: 100, sortBy: "name", sortOrder: "asc" });
  const createCategory = useCreateKnowledgeBaseCategory();
  const form = useForm<KnowledgeBaseCategoryFormValues>({
    resolver: zodResolver(knowledgeBaseCategorySchema),
    defaultValues: { parentCategoryId: NONE, name: "", description: "" },
  });
  const parentOptions = useMemo(
    () => [{ value: NONE, label: "No parent category" }, ...(parentCategories.data?.data ?? []).map((category) => ({ value: category.id, label: category.name }))],
    [parentCategories.data?.data],
  );
  const columns: DataTableColumn<KnowledgeBaseCategory>[] = [
    { key: "name", header: "Category", render: (category) => category.name },
    { key: "path", header: "Path", render: (category) => category.path },
    { key: "description", header: "Description", render: (category) => category.description ?? "-" },
    { key: "parent", header: "Parent", render: (category) => category.parentCategoryId?.slice(0, 8) ?? "-" },
    { key: "created", header: "Created", render: (category) => formatKnowledgeBaseDate(category.createdAt) },
  ];
  async function onSubmit(values: KnowledgeBaseCategoryFormValues) {
    setFormError(null);
    try {
      await createCategory.mutateAsync(toKnowledgeBaseCategoryPayload(values));
      form.reset({ parentCategoryId: NONE, name: "", description: "" });
      setOpen(false);
    } catch (caught) {
      setFormError(caught instanceof ApiClientError ? caught.message : "Unable to create category");
    }
  }
  const errorMessage = categories.error instanceof ApiClientError ? categories.error.message : categories.error instanceof Error ? categories.error.message : undefined;
  return (
    <PermissionGuard permission="documents.view" fallback={<ErrorState title="Permission required" message="You do not have access to knowledge base categories." />}>
      <div className="flex flex-col gap-6">
        <PageHeader title="Knowledge Base Categories" description="Article category hierarchy. Edit and delete endpoints are not available yet." actions={<PermissionGuard permission="documents.manage"><Button type="button" onClick={() => setOpen(true)}><Plus className="size-4" />New category</Button></PermissionGuard>} />
        <SearchFilterBar value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Search categories" onReset={() => { setSearch(""); setPage(1); }} />
        {categories.isLoading ? <LoadingState rows={5} /> : null}
        {categories.error ? <ErrorState title="Unable to load categories" message={errorMessage} /> : null}
        {!categories.isLoading && !categories.error ? (
          <DataCard title="Categories">
            <DataTable columns={columns} rows={categories.data?.data ?? []} getRowKey={(category) => category.id} emptyTitle="No knowledge base categories found" />
            <div className="mt-4">
              <PaginationControls page={categories.data?.meta.page ?? page} totalPages={categories.data?.meta.totalPages ?? 1} onPageChange={setPage} />
            </div>
          </DataCard>
        ) : null}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create knowledge base category</DialogTitle>
            <DialogDescription>Add an article category. Category editing is backend pending.</DialogDescription>
          </DialogHeader>
          <form id="knowledge-category-form" onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FormFieldWrapper label="Parent category">
              <Controller control={form.control} name="parentCategoryId" render={({ field }) => <SelectField value={field.value || NONE} onValueChange={field.onChange} options={parentOptions} />} />
            </FormFieldWrapper>
            <FormFieldWrapper label="Name" htmlFor="kbCategoryName" error={form.formState.errors.name?.message}><Input id="kbCategoryName" {...form.register("name")} /></FormFieldWrapper>
            <FormFieldWrapper label="Description" htmlFor="kbCategoryDescription"><Textarea id="kbCategoryDescription" rows={3} {...form.register("description")} /></FormFieldWrapper>
            {formError ? <ErrorState title="Unable to create category" message={formError} /> : null}
          </form>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" form="knowledge-category-form" disabled={createCategory.isPending}>Save category</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PermissionGuard>
  );
}
