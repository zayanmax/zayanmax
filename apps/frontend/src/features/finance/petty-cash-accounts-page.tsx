"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { PaginationControls } from "@/components/data/pagination-controls";
import { SearchFilterBar } from "@/components/data/search-filter-bar";
import { FormFieldWrapper } from "@/components/forms/form-field-wrapper";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { PermissionGuard } from "@/components/shared/permission-guard";
import { StatusBadge } from "@/components/shared/status-badge";
import { pettyCashAccountSchema, type PettyCashAccountFormValues } from "@/features/finance/schemas";
import { useCreatePettyCashAccount, usePettyCashAccounts } from "@/features/finance/hooks";
import type { PettyCashAccount } from "@/features/finance/types";
import { formatFinanceDate, formatFinanceMoney, toPettyCashAccountPayload } from "@/features/finance/utils";
import { ApiClientError } from "@/lib/api/client";

export function PettyCashAccountsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const accounts = usePettyCashAccounts({ page, limit: 20, search: search || undefined, sortBy: "name", sortOrder: "asc" });
  const columns: DataTableColumn<PettyCashAccount>[] = [
    { key: "name", header: "Account", render: (account) => account.name },
    { key: "balance", header: "Current balance", render: (account) => formatFinanceMoney(account.currentBalance) },
    { key: "status", header: "Status", render: (account) => <StatusBadge status={account.status ?? "ACTIVE"} /> },
    { key: "created", header: "Created", render: (account) => formatFinanceDate(account.createdAt) },
  ];
  const errorMessage = accounts.error instanceof ApiClientError ? accounts.error.message : accounts.error instanceof Error ? accounts.error.message : undefined;
  return (
    <PermissionGuard permission="finance.view" fallback={<ErrorState title="Permission required" message="You do not have access to petty cash accounts." />}>
      <div className="flex flex-col gap-6">
        <PageHeader title="Petty Cash Accounts" description="Petty cash account metadata and balances." actions={<PermissionGuard permission="finance.manage"><PettyCashAccountDialog /></PermissionGuard>} />
        <SearchFilterBar value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Search accounts" onReset={() => { setSearch(""); setPage(1); }} />
        {accounts.isLoading ? <LoadingState rows={6} /> : null}
        {accounts.error ? <ErrorState title="Unable to load petty cash accounts" message={errorMessage} /> : null}
        {!accounts.isLoading && !accounts.error ? (
          <>
            <DataTable columns={columns} rows={accounts.data?.data ?? []} getRowKey={(account) => account.id} emptyTitle="No petty cash accounts found" />
            <PaginationControls page={accounts.data?.meta.page ?? page} totalPages={accounts.data?.meta.totalPages ?? 1} onPageChange={setPage} />
          </>
        ) : null}
      </div>
    </PermissionGuard>
  );
}

function PettyCashAccountDialog() {
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const createAccount = useCreatePettyCashAccount();
  const form = useForm<PettyCashAccountFormValues>({ resolver: zodResolver(pettyCashAccountSchema), defaultValues: { name: "", openingBalance: 0 } });
  async function onSubmit(values: PettyCashAccountFormValues) {
    setFormError(null);
    try {
      await createAccount.mutateAsync(toPettyCashAccountPayload(values));
      setOpen(false);
      form.reset();
    } catch (caught) {
      setFormError(caught instanceof ApiClientError ? caught.message : "Unable to create petty cash account");
    }
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type="button" />}><Plus className="size-4" />New account</DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>New Petty Cash Account</DialogTitle><DialogDescription>Create petty cash account metadata and opening balance.</DialogDescription></DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
          <FormFieldWrapper label="Name" error={form.formState.errors.name?.message}><Input {...form.register("name")} /></FormFieldWrapper>
          <FormFieldWrapper label="Opening balance"><Input type="number" min={0} {...form.register("openingBalance", { valueAsNumber: true })} /></FormFieldWrapper>
          {formError ? <ErrorState title="Unable to create account" message={formError} /> : null}
          <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" disabled={createAccount.isPending}>Save account</Button></div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
