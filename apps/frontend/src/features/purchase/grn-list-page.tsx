"use client";

import Link from "next/link";
import { Eye, Plus } from "lucide-react";
import { useState } from "react";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { PaginationControls } from "@/components/data/pagination-controls";
import { SearchFilterBar } from "@/components/data/search-filter-bar";
import { buttonVariants } from "@/components/ui/button";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { PermissionGuard } from "@/components/shared/permission-guard";
import { useGoodsReceivedNotes } from "@/features/purchase/hooks";
import type { GoodsReceivedNote } from "@/features/purchase/types";
import { formatPurchaseDate } from "@/features/purchase/utils";

export function GrnListPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const grns = useGoodsReceivedNotes({ page, limit: 20, search: search || undefined, sortBy: "receivedDate", sortOrder: "desc" });
  const columns: DataTableColumn<GoodsReceivedNote>[] = [
    { key: "grn", header: "GRN Number", render: (row) => <Link href={`/purchase/grn/${row.id}`} className="font-medium text-primary hover:underline">{row.grnNumber}</Link> },
    { key: "po", header: "Purchase Order", render: (row) => row.purchaseOrder?.orderNumber ?? "-" },
    { key: "vendor", header: "Vendor", render: (row) => row.purchaseOrder?.vendor?.name ?? "-" },
    { key: "received", header: "Received Date", render: (row) => formatPurchaseDate(row.receivedDate) },
    { key: "by", header: "Received By", render: () => "-" },
    { key: "actions", header: "Actions", render: (row) => <Link href={`/purchase/grn/${row.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}><Eye className="size-4" />View</Link> },
  ];
  return (
    <PermissionGuard permission="purchases.view" fallback={<ErrorState title="Permission required" message="You do not have access to goods received notes." />}>
      <div className="flex flex-col gap-6">
        <PageHeader title="Goods Received Notes" description="Receiving notes and stock impact metadata." actions={<PermissionGuard permission="purchases.manage"><Link href="/purchase/grn/new" className={buttonVariants({ variant: "default" })}><Plus className="size-4" />New GRN</Link></PermissionGuard>} />
        <SearchFilterBar value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Search GRNs" onReset={() => { setSearch(""); setPage(1); }} />
        {grns.isLoading ? <LoadingState rows={6} /> : null}
        {grns.error ? <ErrorState title="Unable to load GRNs" message={grns.error instanceof Error ? grns.error.message : undefined} /> : null}
        {!grns.isLoading && !grns.error ? <><DataTable columns={columns} rows={grns.data?.data ?? []} getRowKey={(row) => row.id} emptyTitle="No goods received notes found" /><PaginationControls page={grns.data?.meta.page ?? page} totalPages={grns.data?.meta.totalPages ?? 1} onPageChange={setPage} /></> : null}
      </div>
    </PermissionGuard>
  );
}
