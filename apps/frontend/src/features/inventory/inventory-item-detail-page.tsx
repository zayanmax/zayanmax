"use client";

import Link from "next/link";
import { Edit } from "lucide-react";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { DataCard } from "@/components/shared/data-card";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { PermissionGuard } from "@/components/shared/permission-guard";
import { StatusBadge } from "@/components/shared/status-badge";
import { useInventoryItem } from "@/features/inventory/hooks";
import type { StockMovement } from "@/features/inventory/types";
import { formatInventoryDate, formatQuantity, isLowStock } from "@/features/inventory/utils";

export function InventoryItemDetailPage({ itemId }: { itemId: string }) {
  const item = useInventoryItem(itemId);
  const columns: DataTableColumn<StockMovement>[] = [
    { key: "date", header: "Date", render: (row) => formatInventoryDate(row.movementDate) },
    { key: "type", header: "Type", render: (row) => <StatusBadge status={row.type} /> },
    { key: "quantity", header: "Qty", render: (row) => formatQuantity(row.quantity, item.data?.unit) },
    { key: "previous", header: "Previous", render: (row) => formatQuantity(row.previousStock, item.data?.unit) },
    { key: "new", header: "New", render: (row) => formatQuantity(row.newStock, item.data?.unit) },
    { key: "reason", header: "Reason", render: (row) => row.reason ?? "-" },
  ];
  const row = item.data;
  return (
    <PermissionGuard permission="inventory.view" fallback={<ErrorState title="Permission required" message="You do not have access to inventory items." />}>
      <div className="flex flex-col gap-6">
        <PageHeader title={row ? row.name : "Inventory Item"} description={row ? `${row.itemCode}${row.sku ? ` · ${row.sku}` : ""}` : undefined} actions={<PermissionGuard permission="inventory.manage"><Link href={`/inventory/items/${itemId}/edit`} className={buttonVariants({ variant: "outline" })}><Edit className="size-4" />Edit</Link></PermissionGuard>} />
        {item.isLoading ? <LoadingState rows={6} /> : null}
        {item.error ? <ErrorState title="Unable to load item" message={item.error instanceof Error ? item.error.message : undefined} /> : null}
        {row ? (
          <>
            <DataCard title="Item Summary">
              <div className="grid gap-4 text-sm md:grid-cols-4">
                <div><p className="text-muted-foreground">Category</p><p className="font-medium">{row.inventoryCategory?.name ?? "-"}</p></div>
                <div><p className="text-muted-foreground">Current stock</p><p className="font-medium">{formatQuantity(row.currentStock, row.unit)}</p>{isLowStock(row) ? <Badge variant="secondary">Low stock</Badge> : null}</div>
                <div><p className="text-muted-foreground">Threshold</p><p className="font-medium">{formatQuantity(row.lowStockThreshold, row.unit)}</p></div>
                <div><p className="text-muted-foreground">Status</p><StatusBadge status={row.status ?? "ACTIVE"} /></div>
              </div>
            </DataCard>
            <DataCard title="Recent Stock Movements"><DataTable columns={columns} rows={row.stockMovements ?? []} getRowKey={(movement) => movement.id} emptyTitle="No stock movements" /></DataCard>
          </>
        ) : null}
      </div>
    </PermissionGuard>
  );
}
