"use client";

import Link from "next/link";
import { Edit, Eye, Plus } from "lucide-react";
import { useState } from "react";
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
import { purchaseOrderStatuses } from "@/features/purchase/schemas";
import { usePurchaseOrders } from "@/features/purchase/hooks";
import type { PurchaseOrder } from "@/features/purchase/types";
import { ALL, formatPurchaseDate, formatPurchaseMoney } from "@/features/purchase/utils";

export function PurchaseOrdersListPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(ALL);
  const orders = usePurchaseOrders({ page, limit: 20, search: search || undefined, status: status === ALL ? undefined : status, sortBy: "createdAt", sortOrder: "desc" });
  const columns: DataTableColumn<PurchaseOrder>[] = [
    { key: "order", header: "PO Number", render: (row) => <Link href={`/purchase/orders/${row.id}`} className="font-medium text-primary hover:underline">{row.orderNumber}</Link> },
    { key: "vendor", header: "Vendor", render: (row) => row.vendor?.name ?? "-" },
    { key: "status", header: "Status", render: (row) => <StatusBadge status={row.status} /> },
    { key: "orderDate", header: "Order Date", render: (row) => formatPurchaseDate(row.orderDate) },
    { key: "expected", header: "Expected", render: (row) => formatPurchaseDate(row.expectedDeliveryDate) },
    { key: "amount", header: "Total", render: (row) => formatPurchaseMoney(row.totalAmount) },
    { key: "received", header: "Received Status", render: (row) => row.status.replaceAll("_", " ") },
    { key: "actions", header: "Actions", render: (row) => <div className="flex flex-wrap gap-2"><Link href={`/purchase/orders/${row.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}><Eye className="size-4" />View</Link><PermissionGuard permission="purchases.manage"><Link href={`/purchase/orders/${row.id}/edit`} className={buttonVariants({ variant: "outline", size: "sm" })}><Edit className="size-4" />Edit</Link></PermissionGuard></div> },
  ];
  return (
    <PermissionGuard permission="purchases.view" fallback={<ErrorState title="Permission required" message="You do not have access to purchase orders." />}>
      <div className="flex flex-col gap-6">
        <PageHeader title="Purchase Orders" description="Vendor purchase orders, totals, and receiving status." actions={<PermissionGuard permission="purchases.manage"><Link href="/purchase/orders/new" className={buttonVariants({ variant: "default" })}><Plus className="size-4" />New order</Link></PermissionGuard>} />
        <SearchFilterBar value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Search purchase orders" filters={<SelectField value={status} onValueChange={(value) => { setStatus(value); setPage(1); }} options={[{ value: ALL, label: "All statuses" }, ...purchaseOrderStatuses.map((value) => ({ value, label: value.replaceAll("_", " ") }))]} />} onReset={() => { setSearch(""); setStatus(ALL); setPage(1); }} />
        {orders.isLoading ? <LoadingState rows={6} /> : null}
        {orders.error ? <ErrorState title="Unable to load purchase orders" message={orders.error instanceof Error ? orders.error.message : undefined} /> : null}
        {!orders.isLoading && !orders.error ? <><DataTable columns={columns} rows={orders.data?.data ?? []} getRowKey={(row) => row.id} emptyTitle="No purchase orders found" /><PaginationControls page={orders.data?.meta.page ?? page} totalPages={orders.data?.meta.totalPages ?? 1} onPageChange={setPage} /></> : null}
      </div>
    </PermissionGuard>
  );
}
