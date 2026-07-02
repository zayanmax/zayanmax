"use client";

import Link from "next/link";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { DataCard } from "@/components/shared/data-card";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { PermissionGuard } from "@/components/shared/permission-guard";
import { useGoodsReceivedNote } from "@/features/purchase/hooks";
import type { GoodsReceivedNoteItem } from "@/features/purchase/types";
import { formatPurchaseDate, formatQuantity, grnQuantityTotal } from "@/features/purchase/utils";

export function GrnDetailPage({ grnId }: { grnId: string }) {
  const grn = useGoodsReceivedNote(grnId);
  const columns: DataTableColumn<GoodsReceivedNoteItem>[] = [
    { key: "item", header: "Inventory Item", render: (item) => item.inventoryItem?.name ?? "-" },
    { key: "description", header: "Description", render: (item) => item.description },
    { key: "quantity", header: "Received Qty", render: (item) => formatQuantity(item.quantityReceived, item.inventoryItem?.unit) },
    { key: "poItem", header: "PO Item", render: (item) => item.purchaseOrderItem?.description ?? "-" },
  ];
  const row = grn.data;
  return (
    <PermissionGuard permission="purchases.view" fallback={<ErrorState title="Permission required" message="You do not have access to GRNs." />}>
      <div className="flex flex-col gap-6">
        <PageHeader title={row ? row.grnNumber : "Goods Received Note"} description="Received item metadata and stock impact." />
        {grn.isLoading ? <LoadingState rows={6} /> : null}
        {grn.error ? <ErrorState title="Unable to load GRN" message={grn.error instanceof Error ? grn.error.message : undefined} /> : null}
        {row ? (
          <>
            <DataCard title="GRN Summary">
              <div className="grid gap-4 text-sm md:grid-cols-4">
                <div><p className="text-muted-foreground">Purchase order</p><p className="font-medium">{row.purchaseOrder ? <Link href={`/purchase/orders/${row.purchaseOrder.id}`} className="text-primary hover:underline">{row.purchaseOrder.orderNumber}</Link> : "-"}</p></div>
                <div><p className="text-muted-foreground">Vendor</p><p className="font-medium">{row.purchaseOrder?.vendor?.name ?? "-"}</p></div>
                <div><p className="text-muted-foreground">Received date</p><p className="font-medium">{formatPurchaseDate(row.receivedDate)}</p></div>
                <div><p className="text-muted-foreground">Total received</p><p className="font-medium">{formatQuantity(grnQuantityTotal(row))}</p></div>
                <div className="md:col-span-4"><p className="text-muted-foreground">Notes</p><p className="font-medium">{row.notes ?? "-"}</p></div>
              </div>
            </DataCard>
            <DataCard title="Received Items"><DataTable columns={columns} rows={row.items ?? []} getRowKey={(item) => item.id ?? item.description} emptyTitle="No received items" /></DataCard>
          </>
        ) : null}
      </div>
    </PermissionGuard>
  );
}
