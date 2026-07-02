"use client";

import Link from "next/link";
import { Edit } from "lucide-react";
import { useState, type ReactNode } from "react";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { SelectField } from "@/components/forms/select-field";
import { Button, buttonVariants } from "@/components/ui/button";
import { DataCard } from "@/components/shared/data-card";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { PermissionGuard } from "@/components/shared/permission-guard";
import { StatusBadge } from "@/components/shared/status-badge";
import { expenseStatuses } from "@/features/finance/schemas";
import { useChangeExpenseStatus, useExpense } from "@/features/finance/hooks";
import type { ExpenseAttachment, ExpenseClaimItem, ExpenseClaimStatus } from "@/features/finance/types";
import { employeeLabel, formatFinanceDate, formatFinanceMoney } from "@/features/finance/utils";
import { ApiClientError } from "@/lib/api/client";

export function ExpenseDetailPage({ expenseId }: { expenseId: string }) {
  const expense = useExpense(expenseId);
  const statusMutation = useChangeExpenseStatus(expenseId);
  const [nextStatus, setNextStatus] = useState<ExpenseClaimStatus | "">("");
  const errorMessage = expense.error instanceof ApiClientError ? expense.error.message : expense.error instanceof Error ? expense.error.message : undefined;
  return (
    <PermissionGuard permission="finance.view" fallback={<ErrorState title="Permission required" message="You do not have access to expense claims." />}>
      {expense.isLoading ? <LoadingState rows={6} /> : null}
      {expense.error ? <ErrorState title="Unable to load expense claim" message={errorMessage} /> : null}
      {!expense.isLoading && !expense.error && expense.data ? (
        <div className="flex flex-col gap-6">
          <PageHeader title={expense.data.claimNumber} description={`${expense.data.title} - ${expense.data.status}`} actions={<PermissionGuard permission="finance.manage"><Link href={`/finance/expenses/${expenseId}/edit`} className={buttonVariants({ variant: "outline" })}><Edit className="size-4" />Edit</Link></PermissionGuard>} />
          <div className="grid gap-4 xl:grid-cols-3">
            <DataCard title="Claim Summary"><DetailRows rows={[["Claim number", expense.data.claimNumber], ["Title", expense.data.title], ["Status", <StatusBadge key="status" status={expense.data.status} />], ["Claim date", formatFinanceDate(expense.data.claimDate)], ["Total", formatFinanceMoney(expense.data.totalAmount)]]} /></DataCard>
            <DataCard title="Employee / Review"><DetailRows rows={[["Employee", employeeLabel(expense.data.employee)], ["Submitted", formatFinanceDate(expense.data.submittedAt)], ["Reviewed", formatFinanceDate(expense.data.reviewedAt)], ["Paid", formatFinanceDate(expense.data.paidAt)], ["Review comment", expense.data.reviewComment ?? "-"]]} /></DataCard>
            <PermissionGuard permission="finance.manage">
              <DataCard title="Status Actions" description="Uses backend expense status transition metadata.">
                <div className="flex flex-col gap-3">
                  <SelectField value={nextStatus || expense.data.status} onValueChange={(value) => setNextStatus(value as ExpenseClaimStatus)} options={expenseStatuses.map((value) => ({ value, label: value }))} />
                  <Button type="button" disabled={statusMutation.isPending} onClick={() => void statusMutation.mutateAsync({ status: nextStatus || expense.data.status })}>Save status</Button>
                </div>
              </DataCard>
            </PermissionGuard>
          </div>
          <DataCard title="Expense Items">
            <DataTable columns={[
              { key: "category", header: "Category", render: (item) => item.expenseCategory?.name ?? "-" },
              { key: "description", header: "Description", render: (item) => item.description },
              { key: "date", header: "Date", render: (item) => formatFinanceDate(item.expenseDate) },
              { key: "amount", header: "Amount", render: (item) => formatFinanceMoney(item.amount) },
              { key: "tax", header: "Tax", render: (item) => formatFinanceMoney(item.taxAmount) },
            ] satisfies DataTableColumn<ExpenseClaimItem>[]} rows={expense.data.items ?? []} getRowKey={(item) => item.id ?? `${item.description}-${item.expenseDate}`} emptyTitle="No expense items found" />
          </DataCard>
          <DataCard title="Attachment Metadata">
            <DataTable columns={[
              { key: "file", header: "File name", render: (attachment) => attachment.fileName },
              { key: "mime", header: "MIME type", render: (attachment) => attachment.mimeType },
              { key: "size", header: "Size", render: (attachment) => String(attachment.size) },
              { key: "storage", header: "Storage key", render: (attachment) => attachment.storageKey },
            ] satisfies DataTableColumn<ExpenseAttachment>[]} rows={expense.data.attachments ?? []} getRowKey={(attachment) => attachment.id ?? attachment.storageKey} emptyTitle="No attachment metadata found" />
          </DataCard>
        </div>
      ) : null}
    </PermissionGuard>
  );
}

function DetailRows({ rows }: { rows: Array<[string, ReactNode]> }) {
  return (
    <dl className="grid gap-3">
      {rows.map(([label, value]) => (
        <div key={label} className="grid gap-1 sm:grid-cols-3 sm:gap-3">
          <dt className="text-sm text-muted-foreground">{label}</dt>
          <dd className="text-sm font-medium text-foreground sm:col-span-2">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
