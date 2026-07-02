"use client";

import Link from "next/link";
import { Edit, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { SelectField } from "@/components/forms/select-field";
import { Button, buttonVariants } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataCard } from "@/components/shared/data-card";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { PermissionGuard } from "@/components/shared/permission-guard";
import { StatusBadge } from "@/components/shared/status-badge";
import { useChangeQuotationStatus, useDeleteSalesQuotation, useSalesQuotation } from "@/features/sales/hooks";
import type { QuotationItem, QuotationStatus, QuotationVersion } from "@/features/sales/types";
import { formatSalesDate, formatSalesMoney } from "@/features/sales/utils";
import { ApiClientError } from "@/lib/api/client";

const statusOptions = ["DRAFT", "SENT", "ACCEPTED", "REJECTED", "EXPIRED", "CANCELLED"].map((value) => ({ value, label: value }));

export function QuotationDetailPage({ quotationId }: { quotationId: string }) {
  const router = useRouter();
  const quotation = useSalesQuotation(quotationId);
  const deleteQuotation = useDeleteSalesQuotation();
  const statusMutation = useChangeQuotationStatus(quotationId);
  const [nextStatus, setNextStatus] = useState<QuotationStatus | "">("");

  async function onDelete() {
    await deleteQuotation.mutateAsync(quotationId);
    router.replace("/sales/quotations");
  }
  const errorMessage = quotation.error instanceof ApiClientError ? quotation.error.message : quotation.error instanceof Error ? quotation.error.message : undefined;
  return (
    <PermissionGuard permission="sales.view" fallback={<ErrorState title="Permission required" message="You do not have access to quotations." />}>
      {quotation.isLoading ? <LoadingState rows={6} /> : null}
      {quotation.error ? <ErrorState title="Unable to load quotation" message={errorMessage} /> : null}
      {!quotation.isLoading && !quotation.error && quotation.data ? (
        <div className="flex flex-col gap-6">
          <PageHeader
            title={quotation.data.quotationNumber}
            description={`${quotation.data.title} - ${quotation.data.status}`}
            actions={
              <>
                <PermissionGuard permission="sales.manage"><Link href={`/sales/quotations/${quotationId}/edit`} className={buttonVariants({ variant: "outline" })}><Edit className="size-4" />Edit</Link></PermissionGuard>
                <PermissionGuard permission="sales.manage"><ConfirmDialog title="Delete quotation" description="This will remove the quotation from active sales lists." confirmLabel="Delete" destructive onConfirm={() => void onDelete()} trigger={<Button type="button" variant="destructive"><Trash2 className="size-4" />Delete</Button>} /></PermissionGuard>
              </>
            }
          />
          <div className="grid gap-4 xl:grid-cols-3">
            <DataCard title="Quotation Summary">
              <DetailRows rows={[
                ["Number", quotation.data.quotationNumber],
                ["Title", quotation.data.title],
                ["Status", <StatusBadge key="status" status={quotation.data.status} />],
                ["Version", quotation.data.versionNumber],
              ]} />
            </DataCard>
            <DataCard title="Relation">
              <DetailRows rows={[
                ["Client", quotation.data.client?.name ?? "-"],
                ["Opportunity", quotation.data.opportunity?.name ?? "-"],
                ["Lead", quotation.data.lead?.name ?? "-"],
                ["Valid until", formatSalesDate(quotation.data.validUntil)],
              ]} />
            </DataCard>
            <DataCard title="Totals">
              <DetailRows rows={[
                ["Subtotal", formatSalesMoney(quotation.data.subTotal, quotation.data.currency)],
                ["Discount", formatSalesMoney(quotation.data.discountTotal, quotation.data.currency)],
                ["Tax", formatSalesMoney(quotation.data.taxTotal, quotation.data.currency)],
                ["Grand total", formatSalesMoney(quotation.data.grandTotal, quotation.data.currency)],
              ]} />
            </DataCard>
          </div>
          <PermissionGuard permission="sales.manage">
            <DataCard title="Change Status" description="Supported status changes only. PDF generation and sending are not implemented.">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <SelectField value={nextStatus || quotation.data.status} onValueChange={(value) => setNextStatus(value as QuotationStatus)} className="w-full sm:w-52" options={statusOptions} />
                <Button type="button" disabled={statusMutation.isPending} onClick={() => void statusMutation.mutateAsync({ status: nextStatus || quotation.data.status })}>Save status</Button>
              </div>
            </DataCard>
          </PermissionGuard>
          <DataCard title="Line Items">
            <DataTable columns={[
              { key: "description", header: "Description", render: (item) => item.description },
              { key: "quantity", header: "Qty", render: (item) => String(item.quantity) },
              { key: "unitPrice", header: "Unit price", render: (item) => formatSalesMoney(item.unitPrice, quotation.data?.currency) },
              { key: "discount", header: "Discount", render: (item) => formatSalesMoney(item.discountAmount, quotation.data?.currency) },
              { key: "tax", header: "Tax", render: (item) => formatSalesMoney(item.taxAmount, quotation.data?.currency) },
              { key: "lineTotal", header: "Line total", render: (item) => formatSalesMoney(item.lineTotal, quotation.data?.currency) },
            ] satisfies DataTableColumn<QuotationItem>[]} rows={quotation.data.items ?? []} getRowKey={(item) => item.id ?? `${item.description}-${item.sortOrder ?? 0}`} emptyTitle="No line items found" />
          </DataCard>
          <div className="grid gap-4 xl:grid-cols-2">
            <DataCard title="Terms"><p className="text-sm text-muted-foreground">{quotation.data.terms ?? "No terms recorded."}</p></DataCard>
            <DataCard title="Notes"><p className="text-sm text-muted-foreground">{quotation.data.notes ?? "No notes recorded."}</p></DataCard>
          </div>
          <QuotationVersions rows={quotation.data.versions ?? []} />
        </div>
      ) : null}
    </PermissionGuard>
  );
}

function QuotationVersions({ rows }: { rows: QuotationVersion[] }) {
  return (
    <DataCard title="Version Metadata">
      <DataTable columns={[
        { key: "version", header: "Version", render: (row) => row.versionNumber },
        { key: "notes", header: "Notes", render: (row) => row.notes ?? "-" },
        { key: "created", header: "Created", render: (row) => formatSalesDate(row.createdAt) },
      ] satisfies DataTableColumn<QuotationVersion>[]} rows={rows} getRowKey={(row) => row.id} emptyTitle="No versions found" />
    </DataCard>
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
