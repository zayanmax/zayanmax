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
import { useChangeOpportunityStatus, useDeleteSalesOpportunity, useSalesOpportunity } from "@/features/sales/hooks";
import type { OpportunityStatus, Quotation } from "@/features/sales/types";
import { formatSalesDate, formatSalesMoney } from "@/features/sales/utils";
import { ApiClientError } from "@/lib/api/client";

const statusOptions = ["OPEN", "WON", "LOST", "CANCELLED"].map((value) => ({ value, label: value }));

export function OpportunityDetailPage({ opportunityId }: { opportunityId: string }) {
  const router = useRouter();
  const opportunity = useSalesOpportunity(opportunityId);
  const deleteOpportunity = useDeleteSalesOpportunity();
  const statusMutation = useChangeOpportunityStatus(opportunityId);
  const [nextStatus, setNextStatus] = useState<OpportunityStatus | "">("");

  async function onDelete() {
    await deleteOpportunity.mutateAsync(opportunityId);
    router.replace("/sales/opportunities");
  }

  const errorMessage = opportunity.error instanceof ApiClientError ? opportunity.error.message : opportunity.error instanceof Error ? opportunity.error.message : undefined;
  return (
    <PermissionGuard permission="sales.view" fallback={<ErrorState title="Permission required" message="You do not have access to opportunities." />}>
      {opportunity.isLoading ? <LoadingState rows={6} /> : null}
      {opportunity.error ? <ErrorState title="Unable to load opportunity" message={errorMessage} /> : null}
      {!opportunity.isLoading && !opportunity.error && opportunity.data ? (
        <div className="flex flex-col gap-6">
          <PageHeader
            title={opportunity.data.name}
            description={`${opportunity.data.client?.name ?? opportunity.data.lead?.name ?? "No relation"} - ${opportunity.data.status}`}
            actions={
              <>
                <PermissionGuard permission="sales.manage">
                  <Link href={`/sales/opportunities/${opportunityId}/edit`} className={buttonVariants({ variant: "outline" })}><Edit className="size-4" />Edit</Link>
                </PermissionGuard>
                <PermissionGuard permission="sales.manage">
                  <ConfirmDialog title="Delete opportunity" description="This will remove the opportunity from active sales lists." confirmLabel="Delete" destructive onConfirm={() => void onDelete()} trigger={<Button type="button" variant="destructive"><Trash2 className="size-4" />Delete</Button>} />
                </PermissionGuard>
              </>
            }
          />
          <div className="grid gap-4 xl:grid-cols-3">
            <DataCard title="Opportunity Summary">
              <DetailRows rows={[
                ["Name", opportunity.data.name],
                ["Status", <StatusBadge key="status" status={opportunity.data.status} />],
                ["Stage", opportunity.data.stage?.name ?? "-"],
                ["Value", formatSalesMoney(opportunity.data.expectedValue)],
              ]} />
            </DataCard>
            <DataCard title="Relation">
              <DetailRows rows={[
                ["Client", opportunity.data.client?.name ?? "-"],
                ["Lead", opportunity.data.lead?.name ?? "-"],
                ["Owner", opportunity.data.assignedEmployeeId?.slice(0, 8) ?? opportunity.data.assignedUserId?.slice(0, 8) ?? "-"],
              ]} />
            </DataCard>
            <DataCard title="Timing">
              <DetailRows rows={[
                ["Probability", opportunity.data.probability != null ? `${opportunity.data.probability}%` : "-"],
                ["Expected close", formatSalesDate(opportunity.data.expectedCloseDate)],
                ["Won", formatSalesDate(opportunity.data.wonAt)],
                ["Lost", formatSalesDate(opportunity.data.lostAt)],
              ]} />
            </DataCard>
          </div>
          <DataCard title="Description"><p className="text-sm text-muted-foreground">{opportunity.data.description ?? "No description recorded."}</p></DataCard>
          <PermissionGuard permission="sales.manage">
            <DataCard title="Change Status" description="Update opportunity status.">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <SelectField value={nextStatus || opportunity.data.status} onValueChange={(value) => setNextStatus(value as OpportunityStatus)} className="w-full sm:w-52" options={statusOptions} />
                <Button type="button" disabled={statusMutation.isPending} onClick={() => void statusMutation.mutateAsync({ status: nextStatus || opportunity.data.status })}>Save status</Button>
              </div>
            </DataCard>
          </PermissionGuard>
          <RelatedQuotations rows={opportunity.data.quotations ?? []} />
        </div>
      ) : null}
    </PermissionGuard>
  );
}

function RelatedQuotations({ rows }: { rows: Quotation[] }) {
  const columns: DataTableColumn<Quotation>[] = [
    { key: "number", header: "Quotation", render: (row) => <Link href={`/sales/quotations/${row.id}`} className="font-medium text-primary hover:underline">{row.quotationNumber}</Link> },
    { key: "status", header: "Status", render: (row) => <StatusBadge status={row.status} /> },
    { key: "total", header: "Total", render: (row) => formatSalesMoney(row.grandTotal, row.currency) },
    { key: "validUntil", header: "Valid until", render: (row) => formatSalesDate(row.validUntil) },
  ];
  return (
    <DataCard title="Related Quotations">
      <DataTable columns={columns} rows={rows} getRowKey={(row) => row.id} emptyTitle="No quotations found" />
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
