"use client";

import Link from "next/link";
import { Edit, PackageCheck } from "lucide-react";
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
import { purchaseOrderStatuses } from "@/features/purchase/schemas";
import { useChangePurchaseOrderStatus, usePurchaseOrder } from "@/features/purchase/hooks";
import type { PurchaseOrderItem } from "@/features/purchase/types";
import { formatPurchaseDate, formatPurchaseMoney, formatQuantity } from "@/features/purchase/utils";
import { ApiClientError } from "@/lib/api/client";

export function PurchaseOrderDetailPage({ orderId }: { orderId: string }) {
  const order = usePurchaseOrder(orderId);
  const statusMutation = useChangePurchaseOrderStatus(orderId);
  const [nextStatus, setNextStatus] = useState("");
  const [statusError, setStatusError] = useState<string | null>(null);
  const columns: DataTableColumn<PurchaseOrderItem>[] = [
    { key: "item", header: "Item", render: (item) => item.inventoryItem?.name ?? "-" },
    { key: "description", header: "Description", render: (item) => item.description },
    { key: "quantity", header: "Ordered", render: (item) => formatQuantity(item.quantity, item.inventoryItem?.unit) },
    { key: "received", header: "Received", render: (item) => formatQuantity(item.receivedQuantity, item.inventoryItem?.unit) },
    { key: "unitPrice", header: "Unit Price", render: (item) => formatPurchaseMoney(item.unitPrice) },
    { key: "lineTotal", header: "Line Total", render: (item) => formatPurchaseMoney(item.lineTotal) },
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
  const row = order.data;
  return (
    <PermissionGuard permission="purchases.view" fallback={<ErrorState title="Permission required" message="You do not have access to purchase orders." />}>
      <div className="flex flex-col gap-6">
        <PageHeader title={row ? row.orderNumber : "Purchase Order"} description={row?.vendor?.name ?? "Vendor purchase order"} actions={<div className="flex flex-wrap gap-2"><PermissionGuard permission="purchases.manage"><Link href={`/purchase/grn/new?purchaseOrderId=${orderId}`} className={buttonVariants({ variant: "default" })}><PackageCheck className="size-4" />Receive</Link><Link href={`/purchase/orders/${orderId}/edit`} className={buttonVariants({ variant: "outline" })}><Edit className="size-4" />Edit</Link></PermissionGuard></div>} />
        {order.isLoading ? <LoadingState rows={6} /> : null}
        {order.error ? <ErrorState title="Unable to load order" message={order.error instanceof Error ? order.error.message : undefined} /> : null}
        {row ? (
          <>
            <DataCard title="Order Summary">
              <div className="grid gap-4 text-sm md:grid-cols-4">
                <div><p className="text-muted-foreground">Status</p><StatusBadge status={row.status} /></div>
                <div><p className="text-muted-foreground">Vendor</p><p className="font-medium">{row.vendor?.name ?? "-"}</p></div>
                <div><p className="text-muted-foreground">Order date</p><p className="font-medium">{formatPurchaseDate(row.orderDate)}</p></div>
                <div><p className="text-muted-foreground">Expected</p><p className="font-medium">{formatPurchaseDate(row.expectedDeliveryDate)}</p></div>
                <div><p className="text-muted-foreground">Sub total</p><p className="font-medium">{formatPurchaseMoney(row.subTotal)}</p></div>
                <div><p className="text-muted-foreground">Tax</p><p className="font-medium">{formatPurchaseMoney(row.taxAmount)}</p></div>
                <div><p className="text-muted-foreground">Total</p><p className="font-medium">{formatPurchaseMoney(row.totalAmount)}</p></div>
                <div><p className="text-muted-foreground">Linked request</p><p className="font-medium">{row.purchaseRequest?.requestNumber ?? "-"}</p></div>
              </div>
            </DataCard>
            <PermissionGuard permission="purchases.manage">
              <DataCard title="Status Action">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <SelectField value={nextStatus} onValueChange={setNextStatus} placeholder="Select status" options={purchaseOrderStatuses.map((status) => ({ value: status, label: status.replaceAll("_", " ") }))} />
                  <button type="button" className={buttonVariants({ variant: "default" })} onClick={changeStatus} disabled={!nextStatus || statusMutation.isPending}>Apply status</button>
                </div>
                {statusError ? <p className="mt-3 text-sm text-destructive">{statusError}</p> : null}
              </DataCard>
            </PermissionGuard>
            <DataCard title="Line Items"><DataTable columns={columns} rows={row.items ?? []} getRowKey={(item) => item.id ?? item.description} emptyTitle="No order items" /></DataCard>
            <DataCard title="Goods Received Notes">
              <div className="flex flex-col gap-3">
                {(row.goodsReceivedNotes ?? []).map((note) => <Link key={note.id} href={`/purchase/grn/${note.id}`} className="rounded-md border p-3 text-sm hover:bg-muted">{note.grnNumber} · {formatPurchaseDate(note.receivedDate)}</Link>)}
                {!row.goodsReceivedNotes?.length ? <p className="text-sm text-muted-foreground">No GRNs recorded for this order.</p> : null}
              </div>
            </DataCard>
          </>
        ) : null}
      </div>
    </PermissionGuard>
  );
}
