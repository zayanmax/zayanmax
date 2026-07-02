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
import { purchaseRequestStatuses } from "@/features/purchase/schemas";
import { usePurchaseRequests } from "@/features/purchase/hooks";
import type { PurchaseRequest } from "@/features/purchase/types";
import { ALL, employeeLabel, formatPurchaseDate, formatPurchaseMoney, purchaseRequestTotal } from "@/features/purchase/utils";

export function PurchaseRequestsListPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(ALL);
  const requests = usePurchaseRequests({ page, limit: 20, search: search || undefined, status: status === ALL ? undefined : status, sortBy: "createdAt", sortOrder: "desc" });
  const columns: DataTableColumn<PurchaseRequest>[] = [
    { key: "request", header: "Request", render: (row) => <Link href={`/purchase/requests/${row.id}`} className="font-medium text-primary hover:underline">{row.requestNumber}<span className="block text-xs font-normal text-muted-foreground">{row.title}</span></Link> },
    { key: "requester", header: "Requester", render: (row) => employeeLabel(row.requesterEmployee) },
    { key: "status", header: "Status", render: (row) => <StatusBadge status={row.status} /> },
    { key: "total", header: "Estimated Total", render: (row) => formatPurchaseMoney(purchaseRequestTotal(row)) },
    { key: "created", header: "Created", render: (row) => formatPurchaseDate(row.createdAt) },
    { key: "needed", header: "Required By", render: (row) => formatPurchaseDate(row.neededByDate) },
    { key: "actions", header: "Actions", render: (row) => <div className="flex flex-wrap gap-2"><Link href={`/purchase/requests/${row.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}><Eye className="size-4" />View</Link><PermissionGuard permission="purchases.manage"><Link href={`/purchase/requests/${row.id}/edit`} className={buttonVariants({ variant: "outline", size: "sm" })}><Edit className="size-4" />Edit</Link></PermissionGuard></div> },
  ];
  return (
    <PermissionGuard permission="purchases.view" fallback={<ErrorState title="Permission required" message="You do not have access to purchase requests." />}>
      <div className="flex flex-col gap-6">
        <PageHeader title="Purchase Requests" description="Request, review, and order required goods or services." actions={<PermissionGuard permission="purchases.manage"><Link href="/purchase/requests/new" className={buttonVariants({ variant: "default" })}><Plus className="size-4" />New request</Link></PermissionGuard>} />
        <SearchFilterBar value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Search purchase requests" filters={<SelectField value={status} onValueChange={(value) => { setStatus(value); setPage(1); }} options={[{ value: ALL, label: "All statuses" }, ...purchaseRequestStatuses.map((value) => ({ value, label: value.replaceAll("_", " ") }))]} />} onReset={() => { setSearch(""); setStatus(ALL); setPage(1); }} />
        {requests.isLoading ? <LoadingState rows={6} /> : null}
        {requests.error ? <ErrorState title="Unable to load purchase requests" message={requests.error instanceof Error ? requests.error.message : undefined} /> : null}
        {!requests.isLoading && !requests.error ? <><DataTable columns={columns} rows={requests.data?.data ?? []} getRowKey={(row) => row.id} emptyTitle="No purchase requests found" /><PaginationControls page={requests.data?.meta.page ?? page} totalPages={requests.data?.meta.totalPages ?? 1} onPageChange={setPage} /></> : null}
      </div>
    </PermissionGuard>
  );
}
