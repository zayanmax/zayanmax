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
import { StatusBadge } from "@/components/shared/status-badge";
import { useEmployees } from "@/features/employees/hooks";
import { assetAssignmentSchema, assetAssignmentStatuses, type AssetAssignmentFormValues } from "@/features/assets/schemas";
import { useAssetAssignments, useAssets, useAssignAsset } from "@/features/assets/hooks";
import type { AssetAssignment } from "@/features/assets/types";
import { ALL, employeeLabel, formatAssetDate, toAssetAssignmentPayload } from "@/features/assets/utils";

export function AssetAssignmentsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(ALL);
  const [open, setOpen] = useState(false);
  const assets = useAssets({ page: 1, limit: 100, sortBy: "name", sortOrder: "asc" });
  const employees = useEmployees({ page: 1, limit: 100, sortBy: "firstName", sortOrder: "asc" });
  const assignments = useAssetAssignments({ page, limit: 20, search: search || undefined, status: status === ALL ? undefined : status, sortBy: "assignedAt", sortOrder: "desc" });
  const form = useForm<AssetAssignmentFormValues>({ resolver: zodResolver(assetAssignmentSchema), defaultValues: { assetId: "", employeeId: "", assignedAt: new Date().toISOString().slice(0, 10), notes: "" } });
  const selectedAssetId = useWatch({ control: form.control, name: "assetId" });
  const assignAsset = useAssignAsset(selectedAssetId);
  const assetOptions = useMemo(() => (assets.data?.data ?? []).map((asset) => ({ value: asset.id, label: `${asset.assetTag} · ${asset.name}` })), [assets.data?.data]);
  const employeeOptions = useMemo(() => (employees.data?.data ?? []).map((employee) => ({ value: employee.id, label: `${employee.firstName} ${employee.lastName} (${employee.employeeCode})` })), [employees.data?.data]);
  async function onSubmit(values: AssetAssignmentFormValues) {
    await assignAsset.mutateAsync(toAssetAssignmentPayload(values));
    setOpen(false);
    form.reset({ assetId: "", employeeId: "", assignedAt: new Date().toISOString().slice(0, 10), notes: "" });
  }
  const columns: DataTableColumn<AssetAssignment>[] = [
    { key: "asset", header: "Asset", render: (row) => row.asset ? `${row.asset.assetTag} · ${row.asset.name}` : "-" },
    { key: "employee", header: "Employee", render: (row) => employeeLabel(row.employee) },
    { key: "assigned", header: "Assigned", render: (row) => formatAssetDate(row.assignedAt) },
    { key: "returned", header: "Returned", render: (row) => formatAssetDate(row.returnedAt) },
    { key: "status", header: "Status", render: (row) => <StatusBadge status={row.status} /> },
    { key: "notes", header: "Notes", render: (row) => row.notes ?? "-" },
  ];
  return (
    <PermissionGuard permission="assets.view" fallback={<ErrorState title="Permission required" message="You do not have access to asset assignments." />}>
      <div className="flex flex-col gap-6">
        <PageHeader title="Asset Assignments" description="Assignment history and current employee ownership metadata." actions={<PermissionGuard permission="assets.manage"><Dialog open={open} onOpenChange={setOpen}><DialogTrigger render={<Button type="button" />}><Plus className="size-4" />Assign asset</DialogTrigger><DialogContent><DialogHeader><DialogTitle>Assign Asset</DialogTitle></DialogHeader><form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4"><FormFieldWrapper label="Asset" error={form.formState.errors.assetId?.message}><Controller control={form.control} name="assetId" render={({ field }) => <SelectField value={field.value} onValueChange={field.onChange} options={assetOptions} />} /></FormFieldWrapper><FormFieldWrapper label="Employee" error={form.formState.errors.employeeId?.message}><Controller control={form.control} name="employeeId" render={({ field }) => <SelectField value={field.value} onValueChange={field.onChange} options={employeeOptions} />} /></FormFieldWrapper><FormFieldWrapper label="Assigned date"><Input type="date" {...form.register("assignedAt")} /></FormFieldWrapper><FormFieldWrapper label="Notes"><Input {...form.register("notes")} /></FormFieldWrapper><Button type="submit" disabled={assignAsset.isPending}><Save className="size-4" />Save assignment</Button></form></DialogContent></Dialog></PermissionGuard>} />
        <SearchFilterBar value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Search assignments" filters={<SelectField value={status} onValueChange={(value) => { setStatus(value); setPage(1); }} options={[{ value: ALL, label: "All statuses" }, ...assetAssignmentStatuses.map((value) => ({ value, label: value }))]} />} onReset={() => { setSearch(""); setStatus(ALL); setPage(1); }} />
        {assignments.isLoading ? <LoadingState rows={6} /> : null}
        {assignments.error ? <ErrorState title="Unable to load assignments" message={assignments.error instanceof Error ? assignments.error.message : undefined} /> : null}
        {!assignments.isLoading && !assignments.error ? <><DataTable columns={columns} rows={assignments.data?.data ?? []} getRowKey={(row) => row.id} emptyTitle="No asset assignments found" /><PaginationControls page={assignments.data?.meta.page ?? page} totalPages={assignments.data?.meta.totalPages ?? 1} onPageChange={setPage} /></> : null}
      </div>
    </PermissionGuard>
  );
}
