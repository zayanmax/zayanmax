"use client";

import Link from "next/link";
import { Edit, Eye, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { PaginationControls } from "@/components/data/pagination-controls";
import { SearchFilterBar } from "@/components/data/search-filter-bar";
import { SelectField } from "@/components/forms/select-field";
import { Button, buttonVariants } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { PermissionGuard } from "@/components/shared/permission-guard";
import { StatusBadge } from "@/components/shared/status-badge";
import { useClients } from "@/features/clients/hooks";
import { useDeleteSalesQuotation, useSalesQuotations } from "@/features/sales/hooks";
import type { Quotation, QuotationStatus } from "@/features/sales/types";
import { formatSalesDate, formatSalesMoney } from "@/features/sales/utils";
import { ApiClientError } from "@/lib/api/client";

const ALL = "__all__";
const statusOptions = [
  { value: ALL, label: "All statuses" },
  ...["DRAFT", "SENT", "ACCEPTED", "REJECTED", "EXPIRED", "CANCELLED"].map((value) => ({ value, label: value })),
];

export function QuotationsListPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(ALL);
  const [clientId, setClientId] = useState(ALL);
  const quotations = useSalesQuotations({
    page,
    limit: 20,
    search: search || undefined,
    status: status === ALL ? undefined : (status as QuotationStatus),
    clientId: clientId === ALL ? undefined : clientId,
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const clients = useClients({ page: 1, limit: 100, sortBy: "name", sortOrder: "asc" });
  const deleteQuotation = useDeleteSalesQuotation();
  const clientOptions = useMemo(
    () => [{ value: ALL, label: "All clients" }, ...(clients.data?.data ?? []).map((client) => ({ value: client.id, label: client.name }))],
    [clients.data?.data],
  );
  const columns: DataTableColumn<Quotation>[] = [
    { key: "number", header: "Quotation", render: (quotation) => <Link href={`/sales/quotations/${quotation.id}`} className="font-medium text-primary hover:underline">{quotation.quotationNumber}</Link> },
    { key: "relation", header: "Relation", render: (quotation) => quotation.client?.name ?? quotation.opportunity?.name ?? quotation.lead?.name ?? "-" },
    { key: "status", header: "Status", render: (quotation) => <StatusBadge status={quotation.status} /> },
    { key: "total", header: "Total", render: (quotation) => formatSalesMoney(quotation.grandTotal, quotation.currency) },
    { key: "valid", header: "Valid until", render: (quotation) => formatSalesDate(quotation.validUntil) },
    { key: "created", header: "Created", render: (quotation) => formatSalesDate(quotation.createdAt) },
    {
      key: "actions",
      header: "Actions",
      render: (quotation) => (
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/sales/quotations/${quotation.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}><Eye className="size-4" />View</Link>
          <PermissionGuard permission="sales.manage"><Link href={`/sales/quotations/${quotation.id}/edit`} className={buttonVariants({ variant: "outline", size: "sm" })}><Edit className="size-4" />Edit</Link></PermissionGuard>
          <PermissionGuard permission="sales.manage">
            <ConfirmDialog title="Delete quotation" description="This will remove the quotation from active sales lists." confirmLabel="Delete" destructive onConfirm={() => void deleteQuotation.mutateAsync(quotation.id)} trigger={<Button type="button" variant="destructive" size="sm"><Trash2 className="size-4" />Delete</Button>} />
          </PermissionGuard>
        </div>
      ),
    },
  ];
  const errorMessage = quotations.error instanceof ApiClientError ? quotations.error.message : quotations.error instanceof Error ? quotations.error.message : undefined;
  return (
    <PermissionGuard permission="sales.view" fallback={<ErrorState title="Permission required" message="You do not have access to quotations." />}>
      <div className="flex flex-col gap-6">
        <PageHeader title="Quotations" description="Manage quotation metadata, line items, totals, and status." actions={<PermissionGuard permission="sales.manage"><Link href="/sales/quotations/new" className={buttonVariants({ variant: "default" })}><Plus className="size-4" />New quotation</Link></PermissionGuard>} />
        <SearchFilterBar value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Search quotations" filters={<><SelectField value={status} onValueChange={(value) => { setStatus(value); setPage(1); }} className="w-full sm:w-44" options={statusOptions} /><SelectField value={clientId} onValueChange={(value) => { setClientId(value); setPage(1); }} className="w-full sm:w-56" options={clientOptions} /></>} onReset={() => { setSearch(""); setStatus(ALL); setClientId(ALL); setPage(1); }} />
        {quotations.isLoading ? <LoadingState rows={6} /> : null}
        {quotations.error ? <ErrorState title="Unable to load quotations" message={errorMessage} /> : null}
        {!quotations.isLoading && !quotations.error ? (
          <>
            <DataTable columns={columns} rows={quotations.data?.data ?? []} getRowKey={(quotation) => quotation.id} emptyTitle="No quotations found" />
            <PaginationControls page={quotations.data?.meta.page ?? page} totalPages={quotations.data?.meta.totalPages ?? 1} onPageChange={setPage} />
          </>
        ) : null}
      </div>
    </PermissionGuard>
  );
}
