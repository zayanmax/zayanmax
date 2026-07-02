"use client";

import Link from "next/link";
import { Package, TrendingDown, TrendingUp } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { DataCard } from "@/components/shared/data-card";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { PermissionGuard } from "@/components/shared/permission-guard";
import { StatCard } from "@/components/shared/stat-card";
import { useInventoryItems, useStockMovements } from "@/features/inventory/hooks";
import { formatInventoryDate, formatQuantity, isLowStock } from "@/features/inventory/utils";

export function InventoryOverviewPage() {
  const items = useInventoryItems({ page: 1, limit: 50, sortBy: "createdAt", sortOrder: "desc" });
  const movements = useStockMovements({ page: 1, limit: 8, sortBy: "movementDate", sortOrder: "desc" });
  const lowStock = (items.data?.data ?? []).filter(isLowStock);
  return (
    <PermissionGuard permission="inventory.view" fallback={<ErrorState title="Permission required" message="You do not have access to inventory." />}>
      <div className="flex flex-col gap-6">
        <PageHeader title="Inventory Overview" description="Stock levels, low stock watch, and recent movements." actions={<Link href="/inventory/items/new" className={buttonVariants({ variant: "default" })}><Package className="size-4" />New item</Link>} />
        {items.isLoading || movements.isLoading ? <LoadingState rows={4} /> : null}
        {items.error || movements.error ? <ErrorState title="Unable to load inventory overview" /> : null}
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard title="Inventory Items" value={items.data?.meta.total ?? 0} icon={Package} />
          <StatCard title="Low Stock Items" value={lowStock.length} icon={TrendingDown} tone="warning" />
          <StatCard title="Recent Movements" value={movements.data?.meta.total ?? 0} icon={TrendingUp} tone="info" />
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          <DataCard title="Low Stock Items">
            <div className="flex flex-col gap-3">
              {lowStock.slice(0, 8).map((item) => <Link key={item.id} href={`/inventory/items/${item.id}`} className="rounded-md border p-3 text-sm hover:bg-muted">{item.name} · {formatQuantity(item.currentStock, item.unit)} / {formatQuantity(item.lowStockThreshold, item.unit)}</Link>)}
              {!lowStock.length ? <p className="text-sm text-muted-foreground">No low stock items in the current sample.</p> : null}
            </div>
          </DataCard>
          <DataCard title="Recent Stock Movements">
            <div className="flex flex-col gap-3">
              {(movements.data?.data ?? []).map((movement) => <div key={movement.id} className="rounded-md border p-3 text-sm">{movement.inventoryItem?.name ?? "Item"} · {movement.type} · {formatQuantity(movement.quantity, movement.inventoryItem?.unit)} · {formatInventoryDate(movement.movementDate)}</div>)}
              {!movements.data?.data.length ? <p className="text-sm text-muted-foreground">No stock movements yet.</p> : null}
            </div>
          </DataCard>
        </div>
      </div>
    </PermissionGuard>
  );
}
