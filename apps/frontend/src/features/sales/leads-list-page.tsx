"use client";

import Link from "next/link";
import { Edit, Eye, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { PaginationControls } from "@/components/data/pagination-controls";
import { SearchFilterBar } from "@/components/data/search-filter-bar";
import { SelectField } from "@/components/forms/select-field";
import { Button, buttonVariants } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { PermissionGuard } from "@/components/shared/permission-guard";
import { StatusBadge } from "@/components/shared/status-badge";
import { useEmployees } from "@/features/employees/hooks";
import { useDeleteSalesLead, useLeadSources, useLeadStages, useSalesLeads } from "@/features/sales/hooks";
import type { LeadStatus, SalesLead } from "@/features/sales/types";
import { formatSalesDate, formatSalesMoney } from "@/features/sales/utils";
import { ApiClientError } from "@/lib/api/client";

const ALL = "__all__";

const leadStatusOptions = [
  { value: ALL, label: "All statuses" },
  ...["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "NEGOTIATION", "WON", "LOST", "ARCHIVED"].map((value) => ({
    value,
    label: value.replaceAll("_", " "),
  })),
];

export function LeadsListPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(ALL);
  const [sourceId, setSourceId] = useState(ALL);
  const [stageId, setStageId] = useState(ALL);
  const [assignedEmployeeId, setAssignedEmployeeId] = useState(ALL);
  const leads = useSalesLeads({
    page,
    limit: 20,
    search: search || undefined,
    status: status === ALL ? undefined : (status as LeadStatus),
    sourceId: sourceId === ALL ? undefined : sourceId,
    stageId: stageId === ALL ? undefined : stageId,
    assignedEmployeeId: assignedEmployeeId === ALL ? undefined : assignedEmployeeId,
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const sources = useLeadSources();
  const stages = useLeadStages();
  const employees = useEmployees({ page: 1, limit: 100, sortBy: "firstName", sortOrder: "asc" });
  const deleteLead = useDeleteSalesLead();

  const sourceOptions = useMemo(
    () => [{ value: ALL, label: "All sources" }, ...(sources.data?.data ?? []).map((source) => ({ value: source.id, label: source.name }))],
    [sources.data?.data],
  );
  const stageOptions = useMemo(
    () => [{ value: ALL, label: "All stages" }, ...(stages.data?.data ?? []).map((stage) => ({ value: stage.id, label: stage.name }))],
    [stages.data?.data],
  );
  const ownerOptions = useMemo(
    () => [
      { value: ALL, label: "All owners" },
      ...(employees.data?.data ?? []).map((employee) => ({
        value: employee.id,
        label: `${employee.firstName} ${employee.lastName}`.trim() || employee.email,
      })),
    ],
    [employees.data?.data],
  );

  const columns: DataTableColumn<SalesLead>[] = [
    {
      key: "name",
      header: "Lead",
      render: (lead) => (
        <Link href={`/sales/leads/${lead.id}`} className="font-medium text-primary hover:underline">
          {lead.name}
        </Link>
      ),
    },
    { key: "companyName", header: "Company", render: (lead) => lead.companyName ?? "-" },
    {
      key: "contact",
      header: "Email / Phone",
      render: (lead) => [lead.email, lead.phone].filter(Boolean).join(" / ") || "-",
    },
    { key: "source", header: "Source", render: (lead) => lead.source?.name ?? "-" },
    { key: "stage", header: "Stage", render: (lead) => lead.stage?.name ?? "-" },
    { key: "status", header: "Status", render: (lead) => <StatusBadge status={lead.status} /> },
    {
      key: "owner",
      header: "Owner",
      render: (lead) =>
        lead.assignedEmployee
          ? `${lead.assignedEmployee.firstName ?? ""} ${lead.assignedEmployee.lastName ?? ""}`.trim() || lead.assignedEmployee.email
          : lead.assignedUser?.email ?? "-",
    },
    { key: "value", header: "Value", render: (lead) => formatSalesMoney(lead.estimatedValue) },
    { key: "created", header: "Created", render: (lead) => formatSalesDate(lead.createdAt) },
    {
      key: "actions",
      header: "Actions",
      render: (lead) => (
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/sales/leads/${lead.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
            <Eye className="size-4" />
            View
          </Link>
          <PermissionGuard permission="sales.manage">
            <Link href={`/sales/leads/${lead.id}/edit`} className={buttonVariants({ variant: "outline", size: "sm" })}>
              <Edit className="size-4" />
              Edit
            </Link>
          </PermissionGuard>
          <PermissionGuard permission="sales.manage">
            <ConfirmDialog
              title="Delete lead"
              description="This will remove the lead from active sales lists."
              confirmLabel="Delete"
              destructive
              onConfirm={() => void deleteLead.mutateAsync(lead.id)}
              trigger={
                <Button type="button" variant="destructive" size="sm">
                  <Trash2 className="size-4" />
                  Delete
                </Button>
              }
            />
          </PermissionGuard>
        </div>
      ),
    },
  ];

  const errorMessage = leads.error instanceof ApiClientError ? leads.error.message : leads.error instanceof Error ? leads.error.message : undefined;

  return (
    <PermissionGuard permission="sales.view" fallback={<ErrorState title="Permission required" message="You do not have access to sales leads." />}>
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Leads"
          description="Manage sales leads, sources, stages, owners, activities, and notes."
          actions={
            <PermissionGuard permission="sales.manage">
              <Link href="/sales/leads/new" className={buttonVariants({ variant: "default" })}>
                <Plus className="size-4" />
                New lead
              </Link>
            </PermissionGuard>
          }
        />
        <SearchFilterBar
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder="Search leads"
          filters={
            <>
              <SelectField value={status} onValueChange={(value) => { setStatus(value); setPage(1); }} className="w-full sm:w-44" options={leadStatusOptions} />
              <SelectField value={sourceId} onValueChange={(value) => { setSourceId(value); setPage(1); }} className="w-full sm:w-48" options={sourceOptions} />
              <SelectField value={stageId} onValueChange={(value) => { setStageId(value); setPage(1); }} className="w-full sm:w-48" options={stageOptions} />
              <SelectField value={assignedEmployeeId} onValueChange={(value) => { setAssignedEmployeeId(value); setPage(1); }} className="w-full sm:w-52" options={ownerOptions} />
            </>
          }
          onReset={() => {
            setSearch("");
            setStatus(ALL);
            setSourceId(ALL);
            setStageId(ALL);
            setAssignedEmployeeId(ALL);
            setPage(1);
          }}
        />
        {leads.isLoading ? <LoadingState rows={6} /> : null}
        {leads.error ? <ErrorState title="Unable to load leads" message={errorMessage} /> : null}
        {!leads.isLoading && !leads.error ? (
          <>
            <DataTable columns={columns} rows={leads.data?.data ?? []} getRowKey={(lead) => lead.id} emptyTitle="No leads found" />
            <PaginationControls page={leads.data?.meta.page ?? page} totalPages={leads.data?.meta.totalPages ?? 1} onPageChange={setPage} />
          </>
        ) : null}
      </div>
    </PermissionGuard>
  );
}
