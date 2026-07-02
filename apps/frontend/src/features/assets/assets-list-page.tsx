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
import { assetStatuses } from "@/features/assets/schemas";
import { useAssetCategories, useAssets } from "@/features/assets/hooks";
import type { Asset } from "@/features/assets/types";
import { ALL, employeeLabel, formatAssetDate } from "@/features/assets/utils";

export function AssetsListPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(ALL);
  const [categoryId, setCategoryId] = useState(ALL);
  const categories = useAssetCategories({ page: 1, limit: 100, sortBy: "name", sortOrder: "asc" });
  const assets = useAssets({ page, limit: 20, search: search || undefined, status: status === ALL ? undefined : status, assetCategoryId: categoryId === ALL ? undefined : categoryId, sortBy: "createdAt", sortOrder: "desc" });
  const categoryOptions = useMemo(() => [{ value: ALL, label: "All categories" }, ...(categories.data?.data ?? []).map((category) => ({ value: category.id, label: category.name }))], [categories.data?.data]);
  const columns: DataTableColumn<Asset>[] = [
    { key: "tag", header: "Asset Tag", render: (row) => <Link href={`/assets/${row.id}`} className="font-medium text-primary hover:underline">{row.assetTag}<span className="block text-xs font-normal text-muted-foreground">{row.name}</span></Link> },
    { key: "category", header: "Category", render: (row) => row.assetCategory?.name ?? "-" },
    { key: "serial", header: "Serial Number", render: (row) => row.serialNumber ?? "-" },
    { key: "assigned", header: "Assigned Employee", render: (row) => employeeLabel(row.assignedEmployee) },
    { key: "status", header: "Status", render: (row) => <StatusBadge status={row.status} /> },
    { key: "warranty", header: "Warranty", render: (row) => formatAssetDate(row.warrantyExpiryDate) },
    { key: "actions", header: "Actions", render: (row) => <div className="flex flex-wrap gap-2"><Link href={`/assets/${row.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}><Eye className="size-4" />View</Link><PermissionGuard permission="assets.manage"><Link href={`/assets/${row.id}/edit`} className={buttonVariants({ variant: "outline", size: "sm" })}><Edit className="size-4" />Edit</Link></PermissionGuard></div> },
  ];
  return (
    <PermissionGuard permission="assets.view" fallback={<ErrorState title="Permission required" message="You do not have access to assets." />}>
      <div className="flex flex-col gap-6">
        <PageHeader title="Assets" description="Asset register, assignment state, serials, and warranty metadata." actions={<PermissionGuard permission="assets.manage"><Link href="/assets/new" className={buttonVariants({ variant: "default" })}><Plus className="size-4" />New asset</Link></PermissionGuard>} />
        <SearchFilterBar value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Search assets" filters={<><SelectField value={status} onValueChange={(value) => { setStatus(value); setPage(1); }} options={[{ value: ALL, label: "All statuses" }, ...assetStatuses.map((value) => ({ value, label: value.replaceAll("_", " ") }))]} /><SelectField value={categoryId} onValueChange={(value) => { setCategoryId(value); setPage(1); }} options={categoryOptions} /></>} onReset={() => { setSearch(""); setStatus(ALL); setCategoryId(ALL); setPage(1); }} />
        {assets.isLoading ? <LoadingState rows={6} /> : null}
        {assets.error ? <ErrorState title="Unable to load assets" message={assets.error instanceof Error ? assets.error.message : undefined} /> : null}
        {!assets.isLoading && !assets.error ? <><DataTable columns={columns} rows={assets.data?.data ?? []} getRowKey={(row) => row.id} emptyTitle="No assets found" /><PaginationControls page={assets.data?.meta.page ?? page} totalPages={assets.data?.meta.totalPages ?? 1} onPageChange={setPage} /></> : null}
      </div>
    </PermissionGuard>
  );
}
