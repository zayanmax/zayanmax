"use client";

import Link from "next/link";
import { Edit } from "lucide-react";
import type { ReactNode } from "react";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { buttonVariants } from "@/components/ui/button";
import { DataCard } from "@/components/shared/data-card";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { PermissionGuard } from "@/components/shared/permission-guard";
import { StatusBadge } from "@/components/shared/status-badge";
import { useVendorBill } from "@/features/finance/hooks";
import type { VendorBillItem, VendorPayment } from "@/features/finance/types";
import { formatFinanceDate, formatFinanceMoney } from "@/features/finance/utils";
import { ApiClientError } from "@/lib/api/client";

export function VendorBillDetailPage({ billId }: { billId: string }) {
  const bill = useVendorBill(billId);
  const errorMessage = bill.error instanceof ApiClientError ? bill.error.message : bill.error instanceof Error ? bill.error.message : undefined;
  return (
    <PermissionGuard permission={["finance.view", "vendors.view"]} fallback={<ErrorState title="Permission required" message="You do not have access to vendor bills." />}>
      {bill.isLoading ? <LoadingState rows={6} /> : null}
      {bill.error ? <ErrorState title="Unable to load vendor bill" message={errorMessage} /> : null}
      {!bill.isLoading && !bill.error && bill.data ? (
        <div className="flex flex-col gap-6">
          <PageHeader title={bill.data.billNumber} description={`${bill.data.vendor?.name ?? "Vendor"} - ${bill.data.status}`} actions={<PermissionGuard permission="finance.manage"><Link href={`/finance/vendor-bills/${billId}/edit`} className={buttonVariants({ variant: "outline" })}><Edit className="size-4" />Edit</Link></PermissionGuard>} />
          <div className="grid gap-4 xl:grid-cols-3">
            <DataCard title="Bill Summary"><DetailRows rows={[["Bill number", bill.data.billNumber], ["Vendor", bill.data.vendor?.name ?? "-"], ["Status", <StatusBadge key="status" status={bill.data.status} />], ["Bill date", formatFinanceDate(bill.data.billDate)], ["Due date", formatFinanceDate(bill.data.dueDate)]]} /></DataCard>
            <DataCard title="Totals"><DetailRows rows={[["Subtotal", formatFinanceMoney(bill.data.subTotal)], ["Tax", formatFinanceMoney(bill.data.taxAmount)], ["Total", formatFinanceMoney(bill.data.totalAmount)], ["Paid", formatFinanceMoney(bill.data.paidAmount)], ["Balance", formatFinanceMoney(bill.data.balanceAmount)]]} /></DataCard>
            <DataCard title="Notes"><p className="text-sm text-muted-foreground">{bill.data.notes ?? "No notes recorded."}</p></DataCard>
          </div>
          <DataCard title="Line Items">
            <DataTable columns={[
              { key: "description", header: "Description", render: (item) => item.description },
              { key: "quantity", header: "Qty", render: (item) => String(item.quantity) },
              { key: "unitPrice", header: "Unit price", render: (item) => formatFinanceMoney(item.unitPrice) },
              { key: "tax", header: "Tax", render: (item) => formatFinanceMoney(item.taxAmount) },
              { key: "lineTotal", header: "Line total", render: (item) => formatFinanceMoney(item.lineTotal) },
            ] satisfies DataTableColumn<VendorBillItem>[]} rows={bill.data.items ?? []} getRowKey={(item) => item.id ?? item.description} emptyTitle="No bill items found" />
          </DataCard>
          <DataCard title="Payments">
            <DataTable columns={[
              { key: "date", header: "Date", render: (payment) => formatFinanceDate(payment.paymentDate) },
              { key: "mode", header: "Mode", render: (payment) => payment.mode },
              { key: "reference", header: "Reference", render: (payment) => payment.referenceNumber ?? "-" },
              { key: "amount", header: "Amount", render: (payment) => formatFinanceMoney(payment.amount) },
            ] satisfies DataTableColumn<VendorPayment>[]} rows={bill.data.payments ?? []} getRowKey={(payment) => payment.id} emptyTitle="No payments found" />
          </DataCard>
        </div>
      ) : null}
    </PermissionGuard>
  );
}

function DetailRows({ rows }: { rows: Array<[string, ReactNode]> }) {
  return (
    <dl className="grid gap-3">
      {rows.map(([label, value]) => (
        <div key={label} className="grid gap-1 sm:grid-cols-3 sm:gap-3">
          <dt className="text-sm text-muted-foreground">{label}</dt>
          <dd className="text-sm font-medium text-foreground sm:col-span-2">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
