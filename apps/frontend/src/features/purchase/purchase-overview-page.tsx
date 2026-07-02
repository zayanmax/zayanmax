"use client";

import Link from "next/link";
import { ClipboardList, PackageCheck, ShoppingCart, Truck } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { DataCard } from "@/components/shared/data-card";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { PermissionGuard } from "@/components/shared/permission-guard";
import { StatCard } from "@/components/shared/stat-card";
import { useInventoryItems, useStockMovements } from "@/features/inventory/hooks";
import { isLowStock } from "@/features/inventory/utils";
import { useAssets, useAssetMaintenanceRecords } from "@/features/assets/hooks";
import { useGoodsReceivedNotes, usePurchaseOrders, usePurchaseRequests } from "@/features/purchase/hooks";
import { formatPurchaseDate } from "@/features/purchase/utils";

export function PurchaseOverviewPage() {
  const requests = usePurchaseRequests({ page: 1, limit: 50, sortBy: "createdAt", sortOrder: "desc" });
  const orders = usePurchaseOrders({ page: 1, limit: 50, sortBy: "createdAt", sortOrder: "desc" });
  const grns = useGoodsReceivedNotes({ page: 1, limit: 5, sortBy: "receivedDate", sortOrder: "desc" });
  const items = useInventoryItems({ page: 1, limit: 50, sortBy: "createdAt", sortOrder: "desc" });
  const movements = useStockMovements({ page: 1, limit: 5, sortBy: "movementDate", sortOrder: "desc" });
  const assets = useAssets({ page: 1, limit: 50, sortBy: "createdAt", sortOrder: "desc" });
  const maintenance = useAssetMaintenanceRecords({ page: 1, limit: 20, sortBy: "maintenanceDate", sortOrder: "desc" });
  const isLoading = [requests, orders, grns, items, movements, assets, maintenance].some((query) => query.isLoading);
  const hasError = [requests, orders, grns, items, movements, assets, maintenance].some((query) => query.error);
  const requestRows = requests.data?.data ?? [];
  const orderRows = orders.data?.data ?? [];
  const assetRows = assets.data?.data ?? [];
  const lowStock = (items.data?.data ?? []).filter(isLowStock);
  return (
    <PermissionGuard permission={["purchases.view", "inventory.view", "assets.view"]} fallback={<ErrorState title="Permission required" message="You do not have access to purchase, inventory, or assets." />}>
      <div className="flex flex-col gap-6">
        <PageHeader title="Purchase Overview" description="Purchase requests, receiving, inventory pressure, and asset operations." actions={<Link href="/purchase/requests/new" className={buttonVariants({ variant: "default" })}><ClipboardList className="size-4" />New request</Link>} />
        {isLoading ? <LoadingState rows={4} /> : null}
        {hasError ? <ErrorState title="Unable to load purchase overview" message="One or more purchase overview queries failed." /> : null}
        {!isLoading ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard title="Pending Requests" value={requestRows.filter((row) => row.status === "SUBMITTED").length} icon={ClipboardList} />
              <StatCard title="Approved Requests" value={requestRows.filter((row) => row.status === "APPROVED").length} icon={PackageCheck} />
              <StatCard title="Open Orders" value={orderRows.filter((row) => !["RECEIVED", "CANCELLED"].includes(row.status)).length} icon={ShoppingCart} />
              <StatCard title="Partially Received" value={orderRows.filter((row) => row.status === "PARTIALLY_RECEIVED").length} icon={Truck} />
              <StatCard title="Low Stock Items" value={lowStock.length} icon={PackageCheck} />
              <StatCard title="Recent Movements" value={movements.data?.data.length ?? 0} icon={Truck} />
              <StatCard title="Assets Assigned" value={assetRows.filter((row) => row.status === "ASSIGNED").length} icon={PackageCheck} />
              <StatCard title="Under Maintenance" value={assetRows.filter((row) => row.status === "UNDER_MAINTENANCE").length + (maintenance.data?.data.length ?? 0)} icon={Truck} />
            </div>
            <div className="grid gap-4 xl:grid-cols-3">
              <DataCard title="Recent GRNs">
                <div className="flex flex-col gap-3">
                  {(grns.data?.data ?? []).map((note) => <Link key={note.id} href={`/purchase/grn/${note.id}`} className="rounded-md border p-3 text-sm hover:bg-muted">{note.grnNumber} · {formatPurchaseDate(note.receivedDate)}</Link>)}
                  {!grns.data?.data.length ? <p className="text-sm text-muted-foreground">No receiving notes yet.</p> : null}
                </div>
              </DataCard>
              <DataCard title="Recent Stock Movements">
                <div className="flex flex-col gap-3">
                  {(movements.data?.data ?? []).map((movement) => <div key={movement.id} className="rounded-md border p-3 text-sm">{movement.inventoryItem?.name ?? "Item"} · {movement.type} · {formatPurchaseDate(movement.movementDate)}</div>)}
                  {!movements.data?.data.length ? <p className="text-sm text-muted-foreground">No stock movements yet.</p> : null}
                </div>
              </DataCard>
              <DataCard title="Low Stock Watch">
                <div className="flex flex-col gap-3">
                  {lowStock.slice(0, 5).map((item) => <Link key={item.id} href={`/inventory/items/${item.id}`} className="rounded-md border p-3 text-sm hover:bg-muted">{item.name} · {item.currentStock} / {item.lowStockThreshold} {item.unit}</Link>)}
                  {!lowStock.length ? <p className="text-sm text-muted-foreground">No low stock items in the current sample.</p> : null}
                </div>
              </DataCard>
            </div>
          </>
        ) : null}
      </div>
    </PermissionGuard>
  );
}
