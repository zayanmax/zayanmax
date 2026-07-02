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
import { useBillingInvoices } from "@/features/billing/hooks";
import type { Invoice, InvoiceStatus } from "@/features/billing/types";
import { ALL, formatBillingDate, formatBillingMoney } from "@/features/billing/utils";
import { invoiceStatuses } from "@/features/billing/schemas";
import { useClients } from "@/features/clients/hooks";
import { ApiClientError } from "@/lib/api/client";

const statusOptions = [
  { value: ALL, label: "All statuses" },
  ...invoiceStatuses.map((value) => ({ value, label: value })),
];

export function InvoicesListPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(ALL);
  const [clientId, setClientId] = useState(ALL);
  const invoices = useBillingInvoices({
    page,
    limit: 20,
    search: search || undefined,
    status: status === ALL ? undefined : (status as InvoiceStatus),
    clientId: clientId === ALL ? undefined : clientId,
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const clients = useClients({ page: 1, limit: 100, sortBy: "name", sortOrder: "asc" });
  const clientOptions = useMemo(
    () => [{ value: ALL, label: "All clients" }, ...(clients.data?.data ?? []).map((client) => ({ value: client.id, label: client.name }))],
    [clients.data?.data],
  );
  const columns: DataTableColumn<Invoice>[] = [
    { key: "invoice", header: "Invoice", render: (invoice) => <Link href={`/billing/invoices/${invoice.id}`} className="font-medium text-primary hover:underline">{invoice.invoiceNumber}</Link> },
    { key: "client", header: "Client", render: (invoice) => invoice.client?.name ?? "-" },
    { key: "relation", header: "Project / Opportunity", render: (invoice) => invoice.project?.name ?? invoice.opportunity?.name ?? invoice.quotation?.quotationNumber ?? "-" },
    { key: "status", header: "Status", render: (invoice) => <StatusBadge status={invoice.status} /> },
    { key: "issue", header: "Issue date", render: (invoice) => formatBillingDate(invoice.issueDate) },
    { key: "due", header: "Due date", render: (invoice) => formatBillingDate(invoice.dueDate) },
    { key: "total", header: "Total", render: (invoice) => formatBillingMoney(invoice.grandTotal, invoice.currency) },
    { key: "paid", header: "Paid", render: (invoice) => formatBillingMoney(invoice.paidAmount, invoice.currency) },
    { key: "balance", header: "Balance", render: (invoice) => formatBillingMoney(invoice.balanceAmount, invoice.currency) },
    {
      key: "actions",
      header: "Actions",
      render: (invoice) => (
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/billing/invoices/${invoice.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}><Eye className="size-4" />View</Link>
          <PermissionGuard permission="billing.manage"><Link href={`/billing/invoices/${invoice.id}/edit`} className={buttonVariants({ variant: "outline", size: "sm" })}><Edit className="size-4" />Edit</Link></PermissionGuard>
        </div>
      ),
    },
  ];
  const errorMessage = invoices.error instanceof ApiClientError ? invoices.error.message : invoices.error instanceof Error ? invoices.error.message : undefined;
  return (
    <PermissionGuard permission="billing.view" fallback={<ErrorState title="Permission required" message="You do not have access to invoices." />}>
      <div className="flex flex-col gap-6">
        <PageHeader title="Invoices" description="Manage invoices, receivables metadata, and payment status." actions={<PermissionGuard permission="billing.manage"><Link href="/billing/invoices/new" className={buttonVariants({ variant: "default" })}><Plus className="size-4" />New invoice</Link></PermissionGuard>} />
        <SearchFilterBar value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Search invoices" filters={<><SelectField value={status} onValueChange={(value) => { setStatus(value); setPage(1); }} className="w-full sm:w-48" options={statusOptions} /><SelectField value={clientId} onValueChange={(value) => { setClientId(value); setPage(1); }} className="w-full sm:w-56" options={clientOptions} /></>} onReset={() => { setSearch(""); setStatus(ALL); setClientId(ALL); setPage(1); }} />
        {invoices.isLoading ? <LoadingState rows={6} /> : null}
        {invoices.error ? <ErrorState title="Unable to load invoices" message={errorMessage} /> : null}
        {!invoices.isLoading && !invoices.error ? (
          <>
            <DataTable columns={columns} rows={invoices.data?.data ?? []} getRowKey={(invoice) => invoice.id} emptyTitle="No invoices found" />
            <PaginationControls page={invoices.data?.meta.page ?? page} totalPages={invoices.data?.meta.totalPages ?? 1} onPageChange={setPage} />
          </>
        ) : null}
      </div>
    </PermissionGuard>
  );
}
