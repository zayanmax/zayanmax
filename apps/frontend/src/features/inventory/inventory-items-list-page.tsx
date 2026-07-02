"use client";

import Link from "next/link";
import { Edit, Eye, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { PaginationControls } from "@/components/data/pagination-controls";
import { SearchFilterBar } from "@/components/data/search-filter-bar";
import { SelectField } from "@/components/forms/select-field";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { PermissionGuard } from "@/components/shared/permission-guard";
import { StatusBadge } from "@/components/shared/status-badge";
import { recordStatuses } from "@/features/inventory/schemas";
import { useInventoryCategories, useInventoryItems } from "@/features/inventory/hooks";
import type { InventoryItem } from "@/features/inventory/types";
import { ALL, formatQuantity, isLowStock } from "@/features/inventory/utils";

export function InventoryItemsListPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(ALL);
  const [categoryId, setCategoryId] = useState(ALL);
  const categories = useInventoryCategories({ page: 1, limit: 100, sortBy: "name", sortOrder: "asc" });
  const items = useInventoryItems({ page, limit: 20, search: search || undefined, status: status === ALL ? undefined : status, inventoryCategoryId: categoryId === ALL ? undefined : categoryId, sortBy: "createdAt", sortOrder: "desc" });
  const categoryOptions = useMemo(() => [{ value: ALL, label: "All categories" }, ...(categories.data?.data ?? []).map((category) => ({ value: category.id, label: category.name }))], [categories.data?.data]);
  const columns: DataTableColumn<InventoryItem>[] = [
    { key: "code", header: "SKU / Code", render: (row) => <Link href={`/inventory/items/${row.id}`} className="font-medium text-primary hover:underline">{row.itemCode}<span className="block text-xs font-normal text-muted-foreground">{row.sku ?? "-"}</span></Link> },
    { key: "name", header: "Name", render: (row) => row.name },
    { key: "category", header: "Category", render: (row) => row.inventoryCategory?.name ?? "-" },
    { key: "quantity", header: "Quantity", render: (row) => <div className="flex flex-col gap-1"><span>{formatQuantity(row.currentStock, row.unit)}</span>{isLowStock(row) ? <Badge variant="secondary">Low stock</Badge> : null}</div> },
    { key: "threshold", header: "Threshold", render: (row) => formatQuantity(row.lowStockThreshold, row.unit) },
    { key: "status", header: "Status", render: (row) => <StatusBadge status={row.status ?? "ACTIVE"} /> },
    { key: "actions", header: "Actions", render: (row) => <div className="flex flex-wrap gap-2"><Link href={`/inventory/items/${row.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}><Eye className="size-4" />View</Link><PermissionGuard permission="inventory.manage"><Link href={`/inventory/items/${row.id}/edit`} className={buttonVariants({ variant: "outline", size: "sm" })}><Edit className="size-4" />Edit</Link></PermissionGuard></div> },
  ];
  return (
    <PermissionGuard permission="inventory.view" fallback={<ErrorState title="Permission required" message="You do not have access to inventory items." />}>
      <div className="flex flex-col gap-6">
        <PageHeader title="Inventory Items" description="Inventory item master, quantity, unit, and threshold metadata." actions={<PermissionGuard permission="inventory.manage"><Link href="/inventory/items/new" className={buttonVariants({ variant: "default" })}><Plus className="size-4" />New item</Link></PermissionGuard>} />
        <SearchFilterBar value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Search items" filters={<><SelectField value={status} onValueChange={(value) => { setStatus(value); setPage(1); }} options={[{ value: ALL, label: "All statuses" }, ...recordStatuses.map((value) => ({ value, label: value }))]} /><SelectField value={categoryId} onValueChange={(value) => { setCategoryId(value); setPage(1); }} options={categoryOptions} /></>} onReset={() => { setSearch(""); setStatus(ALL); setCategoryId(ALL); setPage(1); }} />
        {items.isLoading ? <LoadingState rows={6} /> : null}
        {items.error ? <ErrorState title="Unable to load inventory items" message={items.error instanceof Error ? items.error.message : undefined} /> : null}
        {!items.isLoading && !items.error ? <><DataTable columns={columns} rows={items.data?.data ?? []} getRowKey={(row) => row.id} emptyTitle="No inventory items found" /><PaginationControls page={items.data?.meta.page ?? page} totalPages={items.data?.meta.totalPages ?? 1} onPageChange={setPage} /></> : null}
      </div>
    </PermissionGuard>
  );
}
