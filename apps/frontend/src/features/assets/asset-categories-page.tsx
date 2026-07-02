"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Edit, Plus, Save } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { PaginationControls } from "@/components/data/pagination-controls";
import { SearchFilterBar } from "@/components/data/search-filter-bar";
import { FormFieldWrapper } from "@/components/forms/form-field-wrapper";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { PermissionGuard } from "@/components/shared/permission-guard";
import { StatusBadge } from "@/components/shared/status-badge";
import { assetCategorySchema, type AssetCategoryFormValues } from "@/features/assets/schemas";
import { useAssetCategories, useCreateAssetCategory, useUpdateAssetCategory } from "@/features/assets/hooks";
import type { AssetCategory } from "@/features/assets/types";
import { toAssetCategoryPayload } from "@/features/assets/utils";

export function AssetCategoriesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AssetCategory | null>(null);
  const categories = useAssetCategories({ page, limit: 20, search: search || undefined, sortBy: "name", sortOrder: "asc" });
  const createCategory = useCreateAssetCategory();
  const updateCategory = useUpdateAssetCategory(editing?.id ?? "");
  const form = useForm<AssetCategoryFormValues>({ resolver: zodResolver(assetCategorySchema), defaultValues: { name: "", description: "" } });
  function startCreate() { setEditing(null); form.reset({ name: "", description: "" }); setOpen(true); }
  function startEdit(category: AssetCategory) { setEditing(category); form.reset({ name: category.name, description: category.description ?? "" }); setOpen(true); }
  async function onSubmit(values: AssetCategoryFormValues) {
    if (editing) await updateCategory.mutateAsync(toAssetCategoryPayload(values));
    else await createCategory.mutateAsync(toAssetCategoryPayload(values));
    setOpen(false);
  }
  const columns: DataTableColumn<AssetCategory>[] = [
    { key: "name", header: "Name", render: (row) => row.name },
    { key: "description", header: "Description", render: (row) => row.description ?? "-" },
    { key: "status", header: "Status", render: (row) => <StatusBadge status={row.status ?? "ACTIVE"} /> },
    { key: "actions", header: "Actions", render: (row) => <PermissionGuard permission="assets.manage"><Button type="button" variant="outline" size="sm" onClick={() => startEdit(row)}><Edit className="size-4" />Edit</Button></PermissionGuard> },
  ];
  return (
    <PermissionGuard permission="assets.view" fallback={<ErrorState title="Permission required" message="You do not have access to asset categories." />}>
      <div className="flex flex-col gap-6">
        <PageHeader title="Asset Categories" description="Asset category master data." actions={<PermissionGuard permission="assets.manage"><Dialog open={open} onOpenChange={setOpen}><DialogTrigger render={<Button type="button" onClick={startCreate} />}><Plus className="size-4" />New category</DialogTrigger><DialogContent><DialogHeader><DialogTitle>{editing ? "Edit Category" : "New Category"}</DialogTitle></DialogHeader><form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4"><FormFieldWrapper label="Name" error={form.formState.errors.name?.message}><Input {...form.register("name")} /></FormFieldWrapper><FormFieldWrapper label="Description"><Input {...form.register("description")} /></FormFieldWrapper><Button type="submit" disabled={createCategory.isPending || updateCategory.isPending}><Save className="size-4" />Save category</Button></form></DialogContent></Dialog></PermissionGuard>} />
        <SearchFilterBar value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Search categories" onReset={() => { setSearch(""); setPage(1); }} />
        {categories.isLoading ? <LoadingState rows={6} /> : null}
        {categories.error ? <ErrorState title="Unable to load categories" message={categories.error instanceof Error ? categories.error.message : undefined} /> : null}
        {!categories.isLoading && !categories.error ? <><DataTable columns={columns} rows={categories.data?.data ?? []} getRowKey={(row) => row.id} emptyTitle="No asset categories found" /><PaginationControls page={categories.data?.meta.page ?? page} totalPages={categories.data?.meta.totalPages ?? 1} onPageChange={setPage} /></> : null}
      </div>
    </PermissionGuard>
  );
}
