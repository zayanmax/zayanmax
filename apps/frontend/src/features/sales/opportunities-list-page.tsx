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
import { useClients } from "@/features/clients/hooks";
import { useDeleteSalesOpportunity, useSalesOpportunities } from "@/features/sales/hooks";
import type { OpportunityStatus, SalesOpportunity } from "@/features/sales/types";
import { formatSalesDate, formatSalesMoney } from "@/features/sales/utils";
import { ApiClientError } from "@/lib/api/client";

const ALL = "__all__";
const statusOptions = [
  { value: ALL, label: "All statuses" },
  ...["OPEN", "WON", "LOST", "CANCELLED"].map((value) => ({ value, label: value })),
];

export function OpportunitiesListPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(ALL);
  const [clientId, setClientId] = useState(ALL);
  const opportunities = useSalesOpportunities({
    page,
    limit: 20,
    search: search || undefined,
    status: status === ALL ? undefined : (status as OpportunityStatus),
    clientId: clientId === ALL ? undefined : clientId,
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const clients = useClients({ page: 1, limit: 100, sortBy: "name", sortOrder: "asc" });
  const deleteOpportunity = useDeleteSalesOpportunity();
  const clientOptions = useMemo(
    () => [{ value: ALL, label: "All clients" }, ...(clients.data?.data ?? []).map((client) => ({ value: client.id, label: client.name }))],
    [clients.data?.data],
  );

  const columns: DataTableColumn<SalesOpportunity>[] = [
    {
      key: "name",
      header: "Opportunity",
      render: (opportunity) => (
        <Link href={`/sales/opportunities/${opportunity.id}`} className="font-medium text-primary hover:underline">
          {opportunity.name}
        </Link>
      ),
    },
    { key: "client", header: "Client / Lead", render: (opportunity) => opportunity.client?.name ?? opportunity.lead?.name ?? "-" },
    { key: "stage", header: "Stage", render: (opportunity) => opportunity.stage?.name ?? "-" },
    { key: "status", header: "Status", render: (opportunity) => <StatusBadge status={opportunity.status} /> },
    { key: "value", header: "Value", render: (opportunity) => formatSalesMoney(opportunity.expectedValue) },
    { key: "close", header: "Expected close", render: (opportunity) => formatSalesDate(opportunity.expectedCloseDate) },
    { key: "owner", header: "Owner", render: (opportunity) => opportunity.assignedEmployeeId?.slice(0, 8) ?? opportunity.assignedUserId?.slice(0, 8) ?? "-" },
    {
      key: "actions",
      header: "Actions",
      render: (opportunity) => (
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/sales/opportunities/${opportunity.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}><Eye className="size-4" />View</Link>
          <PermissionGuard permission="sales.manage">
            <Link href={`/sales/opportunities/${opportunity.id}/edit`} className={buttonVariants({ variant: "outline", size: "sm" })}><Edit className="size-4" />Edit</Link>
          </PermissionGuard>
          <PermissionGuard permission="sales.manage">
            <ConfirmDialog
              title="Delete opportunity"
              description="This will remove the opportunity from active sales lists."
              confirmLabel="Delete"
              destructive
              onConfirm={() => void deleteOpportunity.mutateAsync(opportunity.id)}
              trigger={<Button type="button" variant="destructive" size="sm"><Trash2 className="size-4" />Delete</Button>}
            />
          </PermissionGuard>
        </div>
      ),
    },
  ];
  const errorMessage = opportunities.error instanceof ApiClientError ? opportunities.error.message : opportunities.error instanceof Error ? opportunities.error.message : undefined;
  return (
    <PermissionGuard permission="sales.view" fallback={<ErrorState title="Permission required" message="You do not have access to opportunities." />}>
      <div className="flex flex-col gap-6">
        <PageHeader title="Opportunities" description="Manage pipeline opportunities and expected revenue." actions={<PermissionGuard permission="sales.manage"><Link href="/sales/opportunities/new" className={buttonVariants({ variant: "default" })}><Plus className="size-4" />New opportunity</Link></PermissionGuard>} />
        <SearchFilterBar
          value={search}
          onChange={(value) => { setSearch(value); setPage(1); }}
          placeholder="Search opportunities"
          filters={<><SelectField value={status} onValueChange={(value) => { setStatus(value); setPage(1); }} className="w-full sm:w-44" options={statusOptions} /><SelectField value={clientId} onValueChange={(value) => { setClientId(value); setPage(1); }} className="w-full sm:w-56" options={clientOptions} /></>}
          onReset={() => { setSearch(""); setStatus(ALL); setClientId(ALL); setPage(1); }}
        />
        {opportunities.isLoading ? <LoadingState rows={6} /> : null}
        {opportunities.error ? <ErrorState title="Unable to load opportunities" message={errorMessage} /> : null}
        {!opportunities.isLoading && !opportunities.error ? (
          <>
            <DataTable columns={columns} rows={opportunities.data?.data ?? []} getRowKey={(opportunity) => opportunity.id} emptyTitle="No opportunities found" />
            <PaginationControls page={opportunities.data?.meta.page ?? page} totalPages={opportunities.data?.meta.totalPages ?? 1} onPageChange={setPage} />
          </>
        ) : null}
      </div>
    </PermissionGuard>
  );
}
