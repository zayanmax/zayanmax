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
import { useVendor } from "@/features/finance/hooks";
import type { VendorBill, VendorPayment } from "@/features/finance/types";
import { formatFinanceDate, formatFinanceMoney } from "@/features/finance/utils";
import { ApiClientError } from "@/lib/api/client";

export function VendorDetailPage({ vendorId }: { vendorId: string }) {
  const vendor = useVendor(vendorId);
  const errorMessage = vendor.error instanceof ApiClientError ? vendor.error.message : vendor.error instanceof Error ? vendor.error.message : undefined;
  return (
    <PermissionGuard permission="vendors.view" fallback={<ErrorState title="Permission required" message="You do not have access to vendors." />}>
      {vendor.isLoading ? <LoadingState rows={6} /> : null}
      {vendor.error ? <ErrorState title="Unable to load vendor" message={errorMessage} /> : null}
      {!vendor.isLoading && !vendor.error && vendor.data ? (
        <div className="flex flex-col gap-6">
          <PageHeader title={vendor.data.name} description="Vendor profile, bills, and payment metadata." actions={<PermissionGuard permission="vendors.manage"><Link href={`/finance/vendors/${vendorId}/edit`} className={buttonVariants({ variant: "outline" })}><Edit className="size-4" />Edit</Link></PermissionGuard>} />
          <div className="grid gap-4 xl:grid-cols-2">
            <DataCard title="Vendor Profile"><DetailRows rows={[["Name", vendor.data.name], ["Status", <StatusBadge key="status" status={vendor.data.status ?? "ACTIVE"} />], ["Created", formatFinanceDate(vendor.data.createdAt)], ["Updated", formatFinanceDate(vendor.data.updatedAt)]]} /></DataCard>
            <DataCard title="Contact / Tax Details"><DetailRows rows={[["Email", vendor.data.email ?? "-"], ["Phone", vendor.data.phone ?? "-"], ["GSTIN / Tax ID", vendor.data.gstin ?? "-"], ["Address", vendor.data.address ?? "-"]]} /></DataCard>
          </div>
          <DataCard title="Vendor Bills">
            <DataTable columns={[
              { key: "number", header: "Bill", render: (bill) => <Link href={`/finance/vendor-bills/${bill.id}`} className="font-medium text-primary hover:underline">{bill.billNumber}</Link> },
              { key: "status", header: "Status", render: (bill) => <StatusBadge status={bill.status} /> },
              { key: "date", header: "Bill date", render: (bill) => formatFinanceDate(bill.billDate) },
              { key: "total", header: "Total", render: (bill) => formatFinanceMoney(bill.totalAmount) },
              { key: "balance", header: "Balance", render: (bill) => formatFinanceMoney(bill.balanceAmount) },
            ] satisfies DataTableColumn<VendorBill>[]} rows={vendor.data.bills ?? []} getRowKey={(bill) => bill.id} emptyTitle="No vendor bills found" />
          </DataCard>
          <DataCard title="Vendor Payments">
            <DataTable columns={[
              { key: "date", header: "Date", render: (payment) => formatFinanceDate(payment.paymentDate) },
              { key: "mode", header: "Mode", render: (payment) => payment.mode },
              { key: "reference", header: "Reference", render: (payment) => payment.referenceNumber ?? "-" },
              { key: "amount", header: "Amount", render: (payment) => formatFinanceMoney(payment.amount) },
            ] satisfies DataTableColumn<VendorPayment>[]} rows={vendor.data.payments ?? []} getRowKey={(payment) => payment.id} emptyTitle="No vendor payments found" />
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
