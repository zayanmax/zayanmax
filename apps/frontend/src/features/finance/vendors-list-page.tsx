"use client";

import Link from "next/link";
import { Edit, Eye, Plus } from "lucide-react";
import { useState } from "react";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { PaginationControls } from "@/components/data/pagination-controls";
import { SearchFilterBar } from "@/components/data/search-filter-bar";
import { buttonVariants } from "@/components/ui/button";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { PermissionGuard } from "@/components/shared/permission-guard";
import { StatusBadge } from "@/components/shared/status-badge";
import { useVendors } from "@/features/finance/hooks";
import type { Vendor } from "@/features/finance/types";
import { formatFinanceDate } from "@/features/finance/utils";
import { ApiClientError } from "@/lib/api/client";

export function VendorsListPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const vendors = useVendors({ page, limit: 20, search: search || undefined, sortBy: "createdAt", sortOrder: "desc" });
  const columns: DataTableColumn<Vendor>[] = [
    { key: "name", header: "Vendor", render: (vendor) => <Link href={`/finance/vendors/${vendor.id}`} className="font-medium text-primary hover:underline">{vendor.name}</Link> },
    { key: "email", header: "Email", render: (vendor) => vendor.email ?? "-" },
    { key: "phone", header: "Phone", render: (vendor) => vendor.phone ?? "-" },
    { key: "gstin", header: "GSTIN / Tax ID", render: (vendor) => vendor.gstin ?? "-" },
    { key: "address", header: "Location", render: (vendor) => vendor.address ?? "-" },
    { key: "status", header: "Status", render: (vendor) => <StatusBadge status={vendor.status ?? "ACTIVE"} /> },
    { key: "created", header: "Created", render: (vendor) => formatFinanceDate(vendor.createdAt) },
    {
      key: "actions",
      header: "Actions",
      render: (vendor) => (
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/finance/vendors/${vendor.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}><Eye className="size-4" />View</Link>
          <PermissionGuard permission="vendors.manage"><Link href={`/finance/vendors/${vendor.id}/edit`} className={buttonVariants({ variant: "outline", size: "sm" })}><Edit className="size-4" />Edit</Link></PermissionGuard>
        </div>
      ),
    },
  ];
  const errorMessage = vendors.error instanceof ApiClientError ? vendors.error.message : vendors.error instanceof Error ? vendors.error.message : undefined;
  return (
    <PermissionGuard permission="vendors.view" fallback={<ErrorState title="Permission required" message="You do not have access to vendors." />}>
      <div className="flex flex-col gap-6">
        <PageHeader title="Vendors" description="Vendor profile, contact, tax, and payment metadata." actions={<PermissionGuard permission="vendors.manage"><Link href="/finance/vendors/new" className={buttonVariants({ variant: "default" })}><Plus className="size-4" />New vendor</Link></PermissionGuard>} />
        <SearchFilterBar value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Search vendors" onReset={() => { setSearch(""); setPage(1); }} />
        {vendors.isLoading ? <LoadingState rows={6} /> : null}
        {vendors.error ? <ErrorState title="Unable to load vendors" message={errorMessage} /> : null}
        {!vendors.isLoading && !vendors.error ? (
          <>
            <DataTable columns={columns} rows={vendors.data?.data ?? []} getRowKey={(vendor) => vendor.id} emptyTitle="No vendors found" />
            <PaginationControls page={vendors.data?.meta.page ?? page} totalPages={vendors.data?.meta.totalPages ?? 1} onPageChange={setPage} />
          </>
        ) : null}
      </div>
    </PermissionGuard>
  );
}
