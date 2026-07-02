"use client";

import Link from "next/link";
import { FileText, Plus, ReceiptText, WalletCards } from "lucide-react";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { buttonVariants } from "@/components/ui/button";
import { DataCard } from "@/components/shared/data-card";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { PermissionGuard } from "@/components/shared/permission-guard";
import { StatCard } from "@/components/shared/stat-card";
import { useFinanceSummary, useVendorPayments } from "@/features/finance/hooks";
import type { VendorPayment } from "@/features/finance/types";
import { formatFinanceDate, formatFinanceMoney } from "@/features/finance/utils";
import { ApiClientError } from "@/lib/api/client";

export function FinanceOverviewPage() {
  const summary = useFinanceSummary();
  const payments = useVendorPayments({
    page: 1,
    limit: 8,
    sortBy: "paymentDate",
    sortOrder: "desc",
  });
  const pettyCashBalance =
    summary.data?.pettyCash.balanceAmount ?? summary.data?.pettyCash.transactionAmount ?? 0;
  const errorMessage = summary.error instanceof ApiClientError ? summary.error.message : summary.error instanceof Error ? summary.error.message : undefined;
  return (
    <PermissionGuard permission="finance.view" fallback={<ErrorState title="Permission required" message="You do not have access to finance." />}>
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Finance Overview"
          description="Expenses, vendor bills, payments, and petty cash metadata."
          actions={<PermissionGuard permission="finance.manage"><Link href="/finance/expenses/new" className={buttonVariants({ variant: "default" })}><Plus className="size-4" />New expense</Link></PermissionGuard>}
        />
        {summary.isLoading ? <LoadingState rows={4} /> : null}
        {summary.error ? <ErrorState title="Unable to load finance summary" message={errorMessage} /> : null}
        {!summary.isLoading && !summary.error ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard title="Total Expense Claims" value={summary.data?.expenseClaims.total ?? 0} icon={FileText} tone="primary" />
              <StatCard title="Approved Expenses" value={formatFinanceMoney(summary.data?.expenseClaims.approvedAmount)} icon={ReceiptText} tone="success" />
              <StatCard title="Paid Expenses" value={formatFinanceMoney(summary.data?.expenseClaims.paidAmount)} icon={ReceiptText} tone="info" />
              <StatCard title="Vendor Outstanding" value={formatFinanceMoney(summary.data?.vendorBills.outstandingAmount)} icon={WalletCards} tone="warning" />
              <StatCard title="Vendor Payments" value={formatFinanceMoney(summary.data?.vendorPayments.paidAmount)} icon={WalletCards} tone="success" />
              <StatCard title="Petty Cash Balance" value={formatFinanceMoney(pettyCashBalance)} icon={WalletCards} tone="primary" />
            </div>
            <DataCard title="Recent Vendor Payments">
              {payments.isLoading ? <LoadingState rows={4} /> : null}
              {!payments.isLoading ? (
                <DataTable
                  columns={[
                    { key: "vendor", header: "Vendor", render: (payment) => payment.vendor?.name ?? payment.vendorId },
                    { key: "bill", header: "Bill", render: (payment) => payment.vendorBill?.billNumber ?? "-" },
                    { key: "date", header: "Payment date", render: (payment) => formatFinanceDate(payment.paymentDate) },
                    { key: "mode", header: "Mode", render: (payment) => payment.mode },
                    { key: "amount", header: "Amount", render: (payment) => formatFinanceMoney(payment.amount) },
                  ] satisfies DataTableColumn<VendorPayment>[]}
                  rows={payments.data?.data ?? []}
                  getRowKey={(payment) => payment.id}
                  emptyTitle="No recent payments found"
                />
              ) : null}
            </DataCard>
          </>
        ) : null}
      </div>
    </PermissionGuard>
  );
}
