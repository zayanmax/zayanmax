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
import { vendorBillStatuses } from "@/features/finance/schemas";
import { useVendorBills, useVendors } from "@/features/finance/hooks";
import type { VendorBill, VendorBillStatus } from "@/features/finance/types";
import { ALL, formatFinanceDate, formatFinanceMoney } from "@/features/finance/utils";
import { ApiClientError } from "@/lib/api/client";

const statusOptions = [{ value: ALL, label: "All statuses" }, ...vendorBillStatuses.map((value) => ({ value, label: value }))];

export function VendorBillsListPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(ALL);
  const [vendorId, setVendorId] = useState(ALL);
  const bills = useVendorBills({
    page,
    limit: 20,
    search: search || undefined,
    status: status === ALL ? undefined : (status as VendorBillStatus),
    vendorId: vendorId === ALL ? undefined : vendorId,
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const vendors = useVendors({ page: 1, limit: 100, sortBy: "name", sortOrder: "asc" });
  const vendorOptions = useMemo(() => [{ value: ALL, label: "All vendors" }, ...(vendors.data?.data ?? []).map((vendor) => ({ value: vendor.id, label: vendor.name }))], [vendors.data?.data]);
  const columns: DataTableColumn<VendorBill>[] = [
    { key: "number", header: "Bill", render: (bill) => <Link href={`/finance/vendor-bills/${bill.id}`} className="font-medium text-primary hover:underline">{bill.billNumber}</Link> },
    { key: "vendor", header: "Vendor", render: (bill) => bill.vendor?.name ?? bill.vendorId },
    { key: "status", header: "Status", render: (bill) => <StatusBadge status={bill.status} /> },
    { key: "billDate", header: "Bill date", render: (bill) => formatFinanceDate(bill.billDate) },
    { key: "dueDate", header: "Due date", render: (bill) => formatFinanceDate(bill.dueDate) },
    { key: "total", header: "Total", render: (bill) => formatFinanceMoney(bill.totalAmount) },
    { key: "paid", header: "Paid", render: (bill) => formatFinanceMoney(bill.paidAmount) },
    { key: "balance", header: "Balance", render: (bill) => formatFinanceMoney(bill.balanceAmount) },
    {
      key: "actions",
      header: "Actions",
      render: (bill) => (
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/finance/vendor-bills/${bill.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}><Eye className="size-4" />View</Link>
          <PermissionGuard permission="finance.manage"><Link href={`/finance/vendor-bills/${bill.id}/edit`} className={buttonVariants({ variant: "outline", size: "sm" })}><Edit className="size-4" />Edit</Link></PermissionGuard>
        </div>
      ),
    },
  ];
  const errorMessage = bills.error instanceof ApiClientError ? bills.error.message : bills.error instanceof Error ? bills.error.message : undefined;
  return (
    <PermissionGuard permission={["finance.view", "vendors.view"]} fallback={<ErrorState title="Permission required" message="You do not have access to vendor bills." />}>
      <div className="flex flex-col gap-6">
        <PageHeader title="Vendor Bills" description="Vendor bills, totals, balances, and payment metadata." actions={<PermissionGuard permission="finance.manage"><Link href="/finance/vendor-bills/new" className={buttonVariants({ variant: "default" })}><Plus className="size-4" />New bill</Link></PermissionGuard>} />
        <SearchFilterBar value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Search bills" filters={<><SelectField value={status} onValueChange={(value) => { setStatus(value); setPage(1); }} className="w-full sm:w-48" options={statusOptions} /><SelectField value={vendorId} onValueChange={(value) => { setVendorId(value); setPage(1); }} className="w-full sm:w-56" options={vendorOptions} /></>} onReset={() => { setSearch(""); setStatus(ALL); setVendorId(ALL); setPage(1); }} />
        {bills.isLoading ? <LoadingState rows={6} /> : null}
        {bills.error ? <ErrorState title="Unable to load vendor bills" message={errorMessage} /> : null}
        {!bills.isLoading && !bills.error ? (
          <>
            <DataTable columns={columns} rows={bills.data?.data ?? []} getRowKey={(bill) => bill.id} emptyTitle="No vendor bills found" />
            <PaginationControls page={bills.data?.meta.page ?? page} totalPages={bills.data?.meta.totalPages ?? 1} onPageChange={setPage} />
          </>
        ) : null}
      </div>
    </PermissionGuard>
  );
}
