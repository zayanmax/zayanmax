"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Save } from "lucide-react";
import { useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { PaginationControls } from "@/components/data/pagination-controls";
import { SearchFilterBar } from "@/components/data/search-filter-bar";
import { FormFieldWrapper } from "@/components/forms/form-field-wrapper";
import { SelectField } from "@/components/forms/select-field";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { PermissionGuard } from "@/components/shared/permission-guard";
import { useVendors } from "@/features/finance/hooks";
import { assetMaintenanceSchema, type AssetMaintenanceFormValues } from "@/features/assets/schemas";
import { useAssetMaintenanceRecords, useAssets, useCreateAssetMaintenance } from "@/features/assets/hooks";
import type { AssetMaintenanceRecord } from "@/features/assets/types";
import { NONE, formatAssetDate, formatAssetMoney, toAssetMaintenancePayload } from "@/features/assets/utils";

export function AssetMaintenancePage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const assets = useAssets({ page: 1, limit: 100, sortBy: "name", sortOrder: "asc" });
  const vendors = useVendors({ page: 1, limit: 100, sortBy: "name", sortOrder: "asc" });
  const records = useAssetMaintenanceRecords({ page, limit: 20, search: search || undefined, sortBy: "maintenanceDate", sortOrder: "desc" });
  const form = useForm<AssetMaintenanceFormValues>({ resolver: zodResolver(assetMaintenanceSchema), defaultValues: { assetId: "", vendorId: NONE, maintenanceDate: new Date().toISOString().slice(0, 10), description: "", cost: 0, nextMaintenanceDate: "" } });
  const selectedAssetId = useWatch({ control: form.control, name: "assetId" });
  const createMaintenance = useCreateAssetMaintenance(selectedAssetId);
  const assetOptions = useMemo(() => (assets.data?.data ?? []).map((asset) => ({ value: asset.id, label: `${asset.assetTag} · ${asset.name}` })), [assets.data?.data]);
  const vendorOptions = useMemo(() => [{ value: NONE, label: "No vendor" }, ...(vendors.data?.data ?? []).map((vendor) => ({ value: vendor.id, label: vendor.name }))], [vendors.data?.data]);
  async function onSubmit(values: AssetMaintenanceFormValues) {
    await createMaintenance.mutateAsync(toAssetMaintenancePayload(values));
    setOpen(false);
    form.reset({ assetId: "", vendorId: NONE, maintenanceDate: new Date().toISOString().slice(0, 10), description: "", cost: 0, nextMaintenanceDate: "" });
  }
  const columns: DataTableColumn<AssetMaintenanceRecord>[] = [
    { key: "asset", header: "Asset", render: (row) => row.asset ? `${row.asset.assetTag} · ${row.asset.name}` : "-" },
    { key: "date", header: "Date", render: (row) => formatAssetDate(row.maintenanceDate) },
    { key: "description", header: "Description", render: (row) => row.description },
    { key: "vendor", header: "Vendor", render: (row) => row.vendor?.name ?? "-" },
    { key: "cost", header: "Cost", render: (row) => formatAssetMoney(row.cost) },
    { key: "next", header: "Next Due", render: (row) => formatAssetDate(row.nextMaintenanceDate) },
  ];
  return (
    <PermissionGuard permission="assets.view" fallback={<ErrorState title="Permission required" message="You do not have access to asset maintenance." />}>
      <div className="flex flex-col gap-6">
        <PageHeader title="Asset Maintenance" description="Maintenance records, vendor metadata, and next-due dates." actions={<PermissionGuard permission="assets.manage"><Dialog open={open} onOpenChange={setOpen}><DialogTrigger render={<Button type="button" />}><Plus className="size-4" />New maintenance</DialogTrigger><DialogContent><DialogHeader><DialogTitle>New Maintenance</DialogTitle></DialogHeader><form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4"><FormFieldWrapper label="Asset" error={form.formState.errors.assetId?.message}><Controller control={form.control} name="assetId" render={({ field }) => <SelectField value={field.value} onValueChange={field.onChange} options={assetOptions} />} /></FormFieldWrapper><FormFieldWrapper label="Vendor"><Controller control={form.control} name="vendorId" render={({ field }) => <SelectField value={field.value || NONE} onValueChange={field.onChange} options={vendorOptions} />} /></FormFieldWrapper><FormFieldWrapper label="Maintenance date"><Input type="date" {...form.register("maintenanceDate")} /></FormFieldWrapper><FormFieldWrapper label="Description" error={form.formState.errors.description?.message}><Input {...form.register("description")} /></FormFieldWrapper><FormFieldWrapper label="Cost"><Input type="number" min={0} step="0.01" {...form.register("cost", { valueAsNumber: true })} /></FormFieldWrapper><FormFieldWrapper label="Next maintenance"><Input type="date" {...form.register("nextMaintenanceDate")} /></FormFieldWrapper><Button type="submit" disabled={createMaintenance.isPending}><Save className="size-4" />Save maintenance</Button></form></DialogContent></Dialog></PermissionGuard>} />
        <SearchFilterBar value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Search maintenance" onReset={() => { setSearch(""); setPage(1); }} />
        {records.isLoading ? <LoadingState rows={6} /> : null}
        {records.error ? <ErrorState title="Unable to load maintenance records" message={records.error instanceof Error ? records.error.message : undefined} /> : null}
        {!records.isLoading && !records.error ? <><DataTable columns={columns} rows={records.data?.data ?? []} getRowKey={(row) => row.id} emptyTitle="No maintenance records found" /><PaginationControls page={records.data?.meta.page ?? page} totalPages={records.data?.meta.totalPages ?? 1} onPageChange={setPage} /></> : null}
      </div>
    </PermissionGuard>
  );
}
