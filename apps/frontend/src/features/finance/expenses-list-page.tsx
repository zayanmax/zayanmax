"use client";

import Link from "next/link";
import { Edit, Eye, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { DateRangeFilter } from "@/components/data/date-range-filter";
import { PaginationControls } from "@/components/data/pagination-controls";
import { SearchFilterBar } from "@/components/data/search-filter-bar";
import { SelectField } from "@/components/forms/select-field";
import { buttonVariants } from "@/components/ui/button";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { PermissionGuard } from "@/components/shared/permission-guard";
import { StatusBadge } from "@/components/shared/status-badge";
import { expenseStatuses } from "@/features/finance/schemas";
import { useExpenses, useExpenseCategories } from "@/features/finance/hooks";
import type { ExpenseClaim, ExpenseClaimStatus } from "@/features/finance/types";
import { ALL, employeeLabel, formatFinanceDate, formatFinanceMoney } from "@/features/finance/utils";
import { ApiClientError } from "@/lib/api/client";

const statusOptions = [{ value: ALL, label: "All statuses" }, ...expenseStatuses.map((value) => ({ value, label: value }))];

export function ExpensesListPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(ALL);
  const [categoryId, setCategoryId] = useState(ALL);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const expenses = useExpenses({
    page,
    limit: 20,
    search: search || undefined,
    status: status === ALL ? undefined : (status as ExpenseClaimStatus),
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const categories = useExpenseCategories({ page: 1, limit: 100, sortBy: "name", sortOrder: "asc" });
  const categoryOptions = useMemo(
    () => [{ value: ALL, label: "All categories" }, ...(categories.data?.data ?? []).map((category) => ({ value: category.id, label: category.name }))],
    [categories.data?.data],
  );
  const filteredRows = (expenses.data?.data ?? []).filter((claim) => {
    if (categoryId === ALL) return true;
    return claim.items?.some((item) => item.expenseCategoryId === categoryId);
  });
  const columns: DataTableColumn<ExpenseClaim>[] = [
    { key: "claim", header: "Claim", render: (claim) => <Link href={`/finance/expenses/${claim.id}`} className="font-medium text-primary hover:underline">{claim.claimNumber}</Link> },
    { key: "title", header: "Title", render: (claim) => claim.title },
    { key: "employee", header: "Employee", render: (claim) => employeeLabel(claim.employee) },
    { key: "category", header: "Category", render: (claim) => claim.items?.[0]?.expenseCategory?.name ?? "-" },
    { key: "status", header: "Status", render: (claim) => <StatusBadge status={claim.status} /> },
    { key: "amount", header: "Total", render: (claim) => formatFinanceMoney(claim.totalAmount) },
    { key: "submitted", header: "Submitted", render: (claim) => formatFinanceDate(claim.submittedAt ?? claim.claimDate) },
    { key: "paid", header: "Paid", render: (claim) => formatFinanceDate(claim.paidAt) },
    {
      key: "actions",
      header: "Actions",
      render: (claim) => (
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/finance/expenses/${claim.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}><Eye className="size-4" />View</Link>
          <PermissionGuard permission="finance.manage"><Link href={`/finance/expenses/${claim.id}/edit`} className={buttonVariants({ variant: "outline", size: "sm" })}><Edit className="size-4" />Edit</Link></PermissionGuard>
        </div>
      ),
    },
  ];
  const errorMessage = expenses.error instanceof ApiClientError ? expenses.error.message : expenses.error instanceof Error ? expenses.error.message : undefined;
  return (
    <PermissionGuard permission="finance.view" fallback={<ErrorState title="Permission required" message="You do not have access to expenses." />}>
      <div className="flex flex-col gap-6">
        <PageHeader title="Expense Claims" description="Employee expense claims, item metadata, attachments metadata, and approval/payment status." actions={<PermissionGuard permission="finance.manage"><Link href="/finance/expenses/new" className={buttonVariants({ variant: "default" })}><Plus className="size-4" />New expense</Link></PermissionGuard>} />
        <SearchFilterBar value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Search expenses" filters={<><SelectField value={status} onValueChange={(value) => { setStatus(value); setPage(1); }} className="w-full sm:w-48" options={statusOptions} /><SelectField value={categoryId} onValueChange={(value) => { setCategoryId(value); setPage(1); }} className="w-full sm:w-56" options={categoryOptions} /><DateRangeFilter value={{ fromDate: fromDate || undefined, toDate: toDate || undefined }} onChange={(value) => { setFromDate(value.fromDate ?? ""); setToDate(value.toDate ?? ""); setPage(1); }} /></>} onReset={() => { setSearch(""); setStatus(ALL); setCategoryId(ALL); setFromDate(""); setToDate(""); setPage(1); }} />
        {expenses.isLoading ? <LoadingState rows={6} /> : null}
        {expenses.error ? <ErrorState title="Unable to load expenses" message={errorMessage} /> : null}
        {!expenses.isLoading && !expenses.error ? (
          <>
            <DataTable columns={columns} rows={filteredRows} getRowKey={(claim) => claim.id} emptyTitle="No expense claims found" />
            <PaginationControls page={expenses.data?.meta.page ?? page} totalPages={expenses.data?.meta.totalPages ?? 1} onPageChange={setPage} />
          </>
        ) : null}
      </div>
    </PermissionGuard>
  );
}
