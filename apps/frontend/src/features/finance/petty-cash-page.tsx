"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { PaginationControls } from "@/components/data/pagination-controls";
import { SearchFilterBar } from "@/components/data/search-filter-bar";
import { FormFieldWrapper } from "@/components/forms/form-field-wrapper";
import { SelectField } from "@/components/forms/select-field";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { PermissionGuard } from "@/components/shared/permission-guard";
import { pettyCashTransactionSchema, pettyCashTransactionTypes, type PettyCashTransactionFormValues } from "@/features/finance/schemas";
import { useCreatePettyCashTransaction, usePettyCashAccounts, usePettyCashTransactions } from "@/features/finance/hooks";
import type { PettyCashTransaction } from "@/features/finance/types";
import { ALL, formatFinanceDate, formatFinanceMoney, NONE, toPettyCashTransactionPayload } from "@/features/finance/utils";
import { ApiClientError } from "@/lib/api/client";

export function PettyCashPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [accountId, setAccountId] = useState(ALL);
  const [type, setType] = useState(ALL);
  const transactions = usePettyCashTransactions({ page, limit: 20, pettyCashAccountId: accountId === ALL ? undefined : accountId, type: type === ALL ? undefined : (type as PettyCashTransaction["type"]), sortBy: "transactionDate", sortOrder: "desc" });
  const accounts = usePettyCashAccounts({ page: 1, limit: 100, sortBy: "name", sortOrder: "asc" });
  const accountOptions = useMemo(() => [{ value: ALL, label: "All accounts" }, ...(accounts.data?.data ?? []).map((account) => ({ value: account.id, label: account.name }))], [accounts.data?.data]);
  const typeOptions = [{ value: ALL, label: "All types" }, ...pettyCashTransactionTypes.map((value) => ({ value, label: value }))];
  const rows = (transactions.data?.data ?? []).filter((transaction) => !search || transaction.description.toLowerCase().includes(search.toLowerCase()) || transaction.referenceNumber?.toLowerCase().includes(search.toLowerCase()));
  const columns: DataTableColumn<PettyCashTransaction>[] = [
    { key: "account", header: "Account", render: (transaction) => transaction.pettyCashAccount?.name ?? transaction.pettyCashAccountId },
    { key: "type", header: "Type", render: (transaction) => transaction.type },
    { key: "date", header: "Date", render: (transaction) => formatFinanceDate(transaction.transactionDate) },
    { key: "description", header: "Description", render: (transaction) => transaction.description },
    { key: "reference", header: "Reference", render: (transaction) => transaction.referenceNumber ?? "-" },
    { key: "amount", header: "Amount", render: (transaction) => formatFinanceMoney(transaction.amount) },
  ];
  const errorMessage = transactions.error instanceof ApiClientError ? transactions.error.message : transactions.error instanceof Error ? transactions.error.message : undefined;
  return (
    <PermissionGuard permission="finance.view" fallback={<ErrorState title="Permission required" message="You do not have access to petty cash." />}>
      <div className="flex flex-col gap-6">
        <PageHeader title="Petty Cash" description="Petty cash accounts and transaction metadata." actions={<><Link href="/finance/petty-cash/accounts" className={buttonVariants({ variant: "outline" })}>Accounts</Link><PermissionGuard permission="finance.manage"><PettyCashTransactionDialog /></PermissionGuard></>} />
        <SearchFilterBar value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Search transactions" filters={<><SelectField value={accountId} onValueChange={(value) => { setAccountId(value); setPage(1); }} className="w-full sm:w-56" options={accountOptions} /><SelectField value={type} onValueChange={(value) => { setType(value); setPage(1); }} className="w-full sm:w-44" options={typeOptions} /></>} onReset={() => { setSearch(""); setAccountId(ALL); setType(ALL); setPage(1); }} />
        {transactions.isLoading ? <LoadingState rows={6} /> : null}
        {transactions.error ? <ErrorState title="Unable to load petty cash transactions" message={errorMessage} /> : null}
        {!transactions.isLoading && !transactions.error ? (
          <>
            <DataTable columns={columns} rows={rows} getRowKey={(transaction) => transaction.id} emptyTitle="No petty cash transactions found" />
            <PaginationControls page={transactions.data?.meta.page ?? page} totalPages={transactions.data?.meta.totalPages ?? 1} onPageChange={setPage} />
          </>
        ) : null}
      </div>
    </PermissionGuard>
  );
}

function PettyCashTransactionDialog() {
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const accounts = usePettyCashAccounts({ page: 1, limit: 100, sortBy: "name", sortOrder: "asc" });
  const createTransaction = useCreatePettyCashTransaction();
  const form = useForm<PettyCashTransactionFormValues>({ resolver: zodResolver(pettyCashTransactionSchema), defaultValues: { pettyCashAccountId: NONE, type: "OUTFLOW", transactionDate: new Date().toISOString().slice(0, 10), amount: 0, description: "", referenceNumber: "" } });
  const accountId = useWatch({ control: form.control, name: "pettyCashAccountId" });
  const type = useWatch({ control: form.control, name: "type" });
  const accountOptions = useMemo(() => [{ value: NONE, label: "Select account" }, ...(accounts.data?.data ?? []).map((account) => ({ value: account.id, label: account.name }))], [accounts.data?.data]);
  async function onSubmit(values: PettyCashTransactionFormValues) {
    setFormError(null);
    try {
      await createTransaction.mutateAsync(toPettyCashTransactionPayload(values));
      setOpen(false);
      form.reset();
    } catch (caught) {
      setFormError(caught instanceof ApiClientError ? caught.message : "Unable to create transaction");
    }
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type="button" />}><Plus className="size-4" />New transaction</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>New Petty Cash Transaction</DialogTitle><DialogDescription>Records petty cash inflow or outflow metadata.</DialogDescription></DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
          <FormFieldWrapper label="Account"><SelectField value={accountId} onValueChange={(value) => form.setValue("pettyCashAccountId", value)} options={accountOptions} /></FormFieldWrapper>
          <div className="grid gap-4 sm:grid-cols-2"><FormFieldWrapper label="Type"><SelectField value={type} onValueChange={(value) => form.setValue("type", value as PettyCashTransactionFormValues["type"])} options={pettyCashTransactionTypes.map((value) => ({ value, label: value }))} /></FormFieldWrapper><FormFieldWrapper label="Date"><Input type="date" {...form.register("transactionDate")} /></FormFieldWrapper></div>
          <FormFieldWrapper label="Amount" error={form.formState.errors.amount?.message}><Input type="number" min={0} {...form.register("amount", { valueAsNumber: true })} /></FormFieldWrapper>
          <FormFieldWrapper label="Description" error={form.formState.errors.description?.message}><Input {...form.register("description")} /></FormFieldWrapper>
          <FormFieldWrapper label="Reference number"><Input {...form.register("referenceNumber")} /></FormFieldWrapper>
          {formError ? <ErrorState title="Unable to create transaction" message={formError} /> : null}
          <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" disabled={createTransaction.isPending}>Save transaction</Button></div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
