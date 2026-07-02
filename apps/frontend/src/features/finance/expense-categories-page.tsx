"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { PaginationControls } from "@/components/data/pagination-controls";
import { SearchFilterBar } from "@/components/data/search-filter-bar";
import { FormFieldWrapper } from "@/components/forms/form-field-wrapper";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { PermissionGuard } from "@/components/shared/permission-guard";
import { StatusBadge } from "@/components/shared/status-badge";
import { expenseCategorySchema, type ExpenseCategoryFormValues } from "@/features/finance/schemas";
import { useCreateExpenseCategory, useExpenseCategories } from "@/features/finance/hooks";
import type { ExpenseCategory } from "@/features/finance/types";
import { formatFinanceDate } from "@/features/finance/utils";
import { ApiClientError } from "@/lib/api/client";

export function ExpenseCategoriesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const categories = useExpenseCategories({
    page,
    limit: 20,
    search: search || undefined,
    sortBy: "name",
    sortOrder: "asc",
  });
  const columns: DataTableColumn<ExpenseCategory>[] = [
    { key: "name", header: "Name", render: (category) => category.name },
    { key: "description", header: "Description", render: (category) => category.description ?? "-" },
    { key: "status", header: "Status", render: (category) => <StatusBadge status={category.status ?? "ACTIVE"} /> },
    { key: "created", header: "Created", render: (category) => formatFinanceDate(category.createdAt) },
  ];
  const errorMessage = categories.error instanceof ApiClientError ? categories.error.message : categories.error instanceof Error ? categories.error.message : undefined;
  return (
    <PermissionGuard permission="finance.manage" fallback={<ErrorState title="Permission required" message="You do not have access to expense category management." />}>
      <div className="flex flex-col gap-6">
        <PageHeader title="Expense Categories" description="Reusable expense category metadata." actions={<CategoryDialog />} />
        <SearchFilterBar value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Search categories" onReset={() => { setSearch(""); setPage(1); }} />
        {categories.isLoading ? <LoadingState rows={6} /> : null}
        {categories.error ? <ErrorState title="Unable to load categories" message={errorMessage} /> : null}
        {!categories.isLoading && !categories.error ? (
          <>
            <DataTable columns={columns} rows={categories.data?.data ?? []} getRowKey={(category) => category.id} emptyTitle="No expense categories found" />
            <PaginationControls page={categories.data?.meta.page ?? page} totalPages={categories.data?.meta.totalPages ?? 1} onPageChange={setPage} />
          </>
        ) : null}
      </div>
    </PermissionGuard>
  );
}

function CategoryDialog() {
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const createCategory = useCreateExpenseCategory();
  const form = useForm<ExpenseCategoryFormValues>({
    resolver: zodResolver(expenseCategorySchema),
    defaultValues: { name: "", description: "" },
  });
  async function onSubmit(values: ExpenseCategoryFormValues) {
    setFormError(null);
    try {
      await createCategory.mutateAsync({
        name: values.name.trim(),
        description: values.description?.trim() || undefined,
      });
      setOpen(false);
      form.reset();
    } catch (caught) {
      setFormError(caught instanceof ApiClientError ? caught.message : "Unable to create category");
    }
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type="button" />}><Plus className="size-4" />New category</DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>New Expense Category</DialogTitle><DialogDescription>Create reusable expense category metadata.</DialogDescription></DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
          <FormFieldWrapper label="Name" error={form.formState.errors.name?.message}><Input {...form.register("name")} /></FormFieldWrapper>
          <FormFieldWrapper label="Description"><Input {...form.register("description")} /></FormFieldWrapper>
          {formError ? <ErrorState title="Unable to create category" message={formError} /> : null}
          <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" disabled={createCategory.isPending}>Save category</Button></div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
