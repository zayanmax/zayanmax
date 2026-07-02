"use client";

import Link from "next/link";
import { Edit } from "lucide-react";
import { useState } from "react";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { SelectField } from "@/components/forms/select-field";
import { buttonVariants } from "@/components/ui/button";
import { DataCard } from "@/components/shared/data-card";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { PermissionGuard } from "@/components/shared/permission-guard";
import { StatusBadge } from "@/components/shared/status-badge";
import { purchaseRequestStatuses } from "@/features/purchase/schemas";
import { useChangePurchaseRequestStatus, usePurchaseRequest } from "@/features/purchase/hooks";
import type { PurchaseRequestItem } from "@/features/purchase/types";
import { employeeLabel, formatPurchaseDate, formatPurchaseMoney, formatQuantity } from "@/features/purchase/utils";
import { ApiClientError } from "@/lib/api/client";

export function PurchaseRequestDetailPage({ requestId }: { requestId: string }) {
  const request = usePurchaseRequest(requestId);
  const statusMutation = useChangePurchaseRequestStatus(requestId);
  const [nextStatus, setNextStatus] = useState("");
  const [statusError, setStatusError] = useState<string | null>(null);
  const columns: DataTableColumn<PurchaseRequestItem>[] = [
    { key: "item", header: "Item", render: (item) => item.inventoryItem?.name ?? "-" },
    { key: "description", header: "Description", render: (item) => item.description },
    { key: "quantity", header: "Qty", render: (item) => formatQuantity(item.quantity, item.inventoryItem?.unit) },
    { key: "price", header: "Estimated Price", render: (item) => formatPurchaseMoney(item.estimatedUnitPrice) },
    { key: "total", header: "Estimated Total", render: (item) => formatPurchaseMoney(item.estimatedTotal) },
  ];
  async function changeStatus() {
    if (!nextStatus) return;
    setStatusError(null);
    try {
      await statusMutation.mutateAsync({ status: nextStatus });
      setNextStatus("");
    } catch (caught) {
      setStatusError(caught instanceof ApiClientError ? caught.message : "Unable to update status");
    }
  }
  const row = request.data;
  return (
    <PermissionGuard permission="purchases.view" fallback={<ErrorState title="Permission required" message="You do not have access to purchase requests." />}>
      <div className="flex flex-col gap-6">
        <PageHeader title={row ? `${row.requestNumber}` : "Purchase Request"} description={row?.title} actions={<PermissionGuard permission="purchases.manage"><Link href={`/purchase/requests/${requestId}/edit`} className={buttonVariants({ variant: "outline" })}><Edit className="size-4" />Edit</Link></PermissionGuard>} />
        {request.isLoading ? <LoadingState rows={6} /> : null}
        {request.error ? <ErrorState title="Unable to load purchase request" message={request.error instanceof Error ? request.error.message : undefined} /> : null}
        {row ? (
          <>
            <DataCard title="Request Summary">
              <div className="grid gap-4 text-sm md:grid-cols-3">
                <div><p className="text-muted-foreground">Status</p><StatusBadge status={row.status} /></div>
                <div><p className="text-muted-foreground">Requester</p><p className="font-medium">{employeeLabel(row.requesterEmployee)}</p></div>
                <div><p className="text-muted-foreground">Required by</p><p className="font-medium">{formatPurchaseDate(row.neededByDate)}</p></div>
                <div><p className="text-muted-foreground">Created</p><p className="font-medium">{formatPurchaseDate(row.createdAt)}</p></div>
                <div><p className="text-muted-foreground">Reviewed</p><p className="font-medium">{formatPurchaseDate(row.reviewedAt)}</p></div>
                <div><p className="text-muted-foreground">Notes</p><p className="font-medium">{row.notes ?? "-"}</p></div>
              </div>
            </DataCard>
            <PermissionGuard permission="purchases.manage">
              <DataCard title="Status Action">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <SelectField value={nextStatus} onValueChange={setNextStatus} placeholder="Select status" options={purchaseRequestStatuses.map((status) => ({ value: status, label: status.replaceAll("_", " ") }))} />
                  <button type="button" className={buttonVariants({ variant: "default" })} onClick={changeStatus} disabled={!nextStatus || statusMutation.isPending}>Apply status</button>
                </div>
                {statusError ? <p className="mt-3 text-sm text-destructive">{statusError}</p> : null}
              </DataCard>
            </PermissionGuard>
            <DataCard title="Line Items">
              <DataTable columns={columns} rows={row.items ?? []} getRowKey={(item) => item.id ?? item.description} emptyTitle="No request items" />
            </DataCard>
          </>
        ) : null}
      </div>
    </PermissionGuard>
  );
}
