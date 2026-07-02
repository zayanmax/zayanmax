"use client";

import Link from "next/link";
import { FileText, Plus, ReceiptText, WalletCards } from "lucide-react";
import { useMemo } from "react";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { buttonVariants } from "@/components/ui/button";
import { DataCard } from "@/components/shared/data-card";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { PermissionGuard } from "@/components/shared/permission-guard";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { useBillingInvoices, useInvoiceAgingSummary, useReceivablesSummary } from "@/features/billing/hooks";
import type { Invoice, InvoiceStatus } from "@/features/billing/types";
import { formatBillingDate, formatBillingMoney } from "@/features/billing/utils";
import { ApiClientError } from "@/lib/api/client";

const countStatuses: InvoiceStatus[] = ["DRAFT", "ISSUED", "PARTIALLY_PAID", "PAID", "OVERDUE"];

export function BillingOverviewPage() {
  const summary = useReceivablesSummary();
  const aging = useInvoiceAgingSummary();
  const invoices = useBillingInvoices({
    page: 1,
    limit: 100,
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const statusCounts = useMemo(() => {
    const counts = Object.fromEntries(countStatuses.map((status) => [status, 0])) as Record<InvoiceStatus, number>;
    for (const invoice of invoices.data?.data ?? []) {
      counts[invoice.status] = (counts[invoice.status] ?? 0) + 1;
    }
    return counts;
  }, [invoices.data?.data]);
  const paidThisPeriod = useMemo(() => {
    const today = new Date();
    return (invoices.data?.data ?? []).reduce((total, invoice) => {
      if (invoice.status !== "PAID" || !invoice.paidAt) return total;
      const paidAt = new Date(invoice.paidAt);
      if (paidAt.getFullYear() === today.getFullYear() && paidAt.getMonth() === today.getMonth()) {
        return total + Number(invoice.paidAmount ?? 0);
      }
      return total;
    }, 0);
  }, [invoices.data?.data]);
  const overdueRows = (invoices.data?.data ?? []).filter((invoice) => invoice.status === "OVERDUE" || Number(invoice.balanceAmount ?? 0) > 0 && invoice.dueDate && new Date(invoice.dueDate) < new Date()).slice(0, 8);
  const errorMessage = summary.error instanceof ApiClientError ? summary.error.message : summary.error instanceof Error ? summary.error.message : undefined;

  return (
    <PermissionGuard permission="billing.view" fallback={<ErrorState title="Permission required" message="You do not have access to billing." />}>
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Billing Overview"
          description="Receivables, invoice status, aging, and recent overdue billing metadata."
          actions={<PermissionGuard permission="billing.manage"><Link href="/billing/invoices/new" className={buttonVariants({ variant: "default" })}><Plus className="size-4" />New invoice</Link></PermissionGuard>}
        />
        {summary.isLoading || aging.isLoading || invoices.isLoading ? <LoadingState rows={4} /> : null}
        {summary.error ? <ErrorState title="Unable to load billing summary" message={errorMessage} /> : null}
        {!summary.isLoading && !summary.error ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard title="Outstanding" value={formatBillingMoney(summary.data?.outstandingAmount)} icon={WalletCards} tone="warning" />
              <StatCard title="Invoice Amount" value={formatBillingMoney(summary.data?.invoiceAmount)} icon={FileText} tone="primary" />
              <StatCard title="Paid Amount" value={formatBillingMoney(summary.data?.paidAmount)} icon={ReceiptText} tone="success" />
              <StatCard title="Paid This Period" value={formatBillingMoney(paidThisPeriod)} icon={ReceiptText} tone="info" description="Current month, based on fetched invoice metadata." />
            </div>
            <div className="grid gap-4 xl:grid-cols-2">
              <DataCard title="Invoice Status Counts" description="Counts are based on the latest fetched invoice page.">
                <div className="grid gap-3 sm:grid-cols-2">
                  {countStatuses.map((status) => (
                    <div key={status} className="flex items-center justify-between rounded-md border border-border p-3">
                      <StatusBadge status={status} />
                      <span className="text-lg font-semibold">{statusCounts[status] ?? 0}</span>
                    </div>
                  ))}
                </div>
              </DataCard>
              <DataCard title="Aging Summary">
                <div className="grid gap-3">
                  {[
                    ["Current", aging.data?.buckets.current],
                    ["1-30 days", aging.data?.buckets.days1To30],
                    ["31-60 days", aging.data?.buckets.days31To60],
                    ["61-90 days", aging.data?.buckets.days61To90],
                    ["Over 90 days", aging.data?.buckets.over90],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between border-b border-border pb-2 last:border-0 last:pb-0">
                      <span className="text-sm text-muted-foreground">{label}</span>
                      <span className="text-sm font-semibold">{formatBillingMoney(value as number | undefined)}</span>
                    </div>
                  ))}
                </div>
              </DataCard>
            </div>
            <DataCard title="Overdue / At-Risk Invoices" description="Open invoices past due or explicitly marked overdue.">
              <DataTable
                columns={[
                  { key: "invoice", header: "Invoice", render: (invoice) => <Link href={`/billing/invoices/${invoice.id}`} className="font-medium text-primary hover:underline">{invoice.invoiceNumber}</Link> },
                  { key: "client", header: "Client", render: (invoice) => invoice.client?.name ?? "-" },
                  { key: "due", header: "Due", render: (invoice) => formatBillingDate(invoice.dueDate) },
                  { key: "balance", header: "Balance", render: (invoice) => formatBillingMoney(invoice.balanceAmount, invoice.currency) },
                  { key: "status", header: "Status", render: (invoice) => <StatusBadge status={invoice.status} /> },
                ] satisfies DataTableColumn<Invoice>[]}
                rows={overdueRows}
                getRowKey={(invoice) => invoice.id}
                emptyTitle="No overdue invoices found"
              />
            </DataCard>
          </>
        ) : null}
      </div>
    </PermissionGuard>
  );
}
