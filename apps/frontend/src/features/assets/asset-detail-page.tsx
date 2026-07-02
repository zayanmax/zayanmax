"use client";

import Link from "next/link";
import { Edit, Wrench } from "lucide-react";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { buttonVariants } from "@/components/ui/button";
import { DataCard } from "@/components/shared/data-card";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { PermissionGuard } from "@/components/shared/permission-guard";
import { StatusBadge } from "@/components/shared/status-badge";
import { useAsset } from "@/features/assets/hooks";
import type { AssetAssignment, AssetMaintenanceRecord } from "@/features/assets/types";
import { employeeLabel, formatAssetDate, formatAssetMoney } from "@/features/assets/utils";

export function AssetDetailPage({ assetId }: { assetId: string }) {
  const asset = useAsset(assetId);
  const assignmentColumns: DataTableColumn<AssetAssignment>[] = [
    { key: "employee", header: "Employee", render: (row) => employeeLabel(row.employee) },
    { key: "assigned", header: "Assigned", render: (row) => formatAssetDate(row.assignedAt) },
    { key: "returned", header: "Returned", render: (row) => formatAssetDate(row.returnedAt) },
    { key: "status", header: "Status", render: (row) => <StatusBadge status={row.status} /> },
    { key: "notes", header: "Notes", render: (row) => row.notes ?? "-" },
  ];
  const maintenanceColumns: DataTableColumn<AssetMaintenanceRecord>[] = [
    { key: "date", header: "Date", render: (row) => formatAssetDate(row.maintenanceDate) },
    { key: "description", header: "Description", render: (row) => row.description },
    { key: "vendor", header: "Vendor", render: (row) => row.vendor?.name ?? "-" },
    { key: "cost", header: "Cost", render: (row) => formatAssetMoney(row.cost) },
    { key: "next", header: "Next Due", render: (row) => formatAssetDate(row.nextMaintenanceDate) },
  ];
  const row = asset.data;
  return (
    <PermissionGuard permission="assets.view" fallback={<ErrorState title="Permission required" message="You do not have access to assets." />}>
      <div className="flex flex-col gap-6">
        <PageHeader title={row ? row.assetTag : "Asset"} description={row?.name} actions={<div className="flex flex-wrap gap-2"><PermissionGuard permission="assets.manage"><Link href={`/assets/${assetId}/edit`} className={buttonVariants({ variant: "outline" })}><Edit className="size-4" />Edit</Link><Link href="/assets/maintenance" className={buttonVariants({ variant: "outline" })}><Wrench className="size-4" />Maintenance</Link></PermissionGuard></div>} />
        {asset.isLoading ? <LoadingState rows={6} /> : null}
        {asset.error ? <ErrorState title="Unable to load asset" message={asset.error instanceof Error ? asset.error.message : undefined} /> : null}
        {row ? (
          <>
            <DataCard title="Profile">
              <div className="grid gap-4 text-sm md:grid-cols-4">
                <div><p className="text-muted-foreground">Status</p><StatusBadge status={row.status} /></div>
                <div><p className="text-muted-foreground">Category</p><p className="font-medium">{row.assetCategory?.name ?? "-"}</p></div>
                <div><p className="text-muted-foreground">Assigned employee</p><p className="font-medium">{employeeLabel(row.assignedEmployee)}</p></div>
                <div><p className="text-muted-foreground">Created</p><p className="font-medium">{formatAssetDate(row.createdAt)}</p></div>
              </div>
            </DataCard>
            <DataCard title="Warranty & Serial Info">
              <div className="grid gap-4 text-sm md:grid-cols-3">
                <div><p className="text-muted-foreground">Serial number</p><p className="font-medium">{row.serialNumber ?? "-"}</p></div>
                <div><p className="text-muted-foreground">Purchase date</p><p className="font-medium">{formatAssetDate(row.purchaseDate)}</p></div>
                <div><p className="text-muted-foreground">Warranty expiry</p><p className="font-medium">{formatAssetDate(row.warrantyExpiryDate)}</p></div>
                <div className="md:col-span-3"><p className="text-muted-foreground">Notes</p><p className="font-medium">{row.notes ?? "-"}</p></div>
              </div>
            </DataCard>
            <DataCard title="Assignment History"><DataTable columns={assignmentColumns} rows={row.assignments ?? []} getRowKey={(assignment) => assignment.id} emptyTitle="No assignment history" /></DataCard>
            <DataCard title="Maintenance History"><DataTable columns={maintenanceColumns} rows={row.maintenanceRecords ?? []} getRowKey={(record) => record.id} emptyTitle="No maintenance history" /></DataCard>
          </>
        ) : null}
      </div>
    </PermissionGuard>
  );
}
