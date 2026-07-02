"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { PaginationControls } from "@/components/data/pagination-controls";
import { SearchFilterBar } from "@/components/data/search-filter-bar";
import { FormFieldWrapper } from "@/components/forms/form-field-wrapper";
import { SelectField } from "@/components/forms/select-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { PermissionGuard } from "@/components/shared/permission-guard";
import { paymentModes, receiptSchema, type ReceiptFormValues } from "@/features/billing/schemas";
import { useBillingInvoices, useCreatePaymentReceipt, usePaymentReceipts } from "@/features/billing/hooks";
import type { PaymentReceipt } from "@/features/billing/types";
import { ALL, formatBillingDate, formatBillingMoney, NONE, toReceiptPayload } from "@/features/billing/utils";
import { useClients } from "@/features/clients/hooks";
import { ApiClientError } from "@/lib/api/client";

export function ReceiptsListPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [clientId, setClientId] = useState(ALL);
  const receipts = usePaymentReceipts({
    page,
    limit: 20,
    search: search || undefined,
    clientId: clientId === ALL ? undefined : clientId,
    sortBy: "receiptDate",
    sortOrder: "desc",
  });
  const clients = useClients({ page: 1, limit: 100, sortBy: "name", sortOrder: "asc" });
  const clientOptions = useMemo(
    () => [{ value: ALL, label: "All clients" }, ...(clients.data?.data ?? []).map((client) => ({ value: client.id, label: client.name }))],
    [clients.data?.data],
  );
  const columns: DataTableColumn<PaymentReceipt>[] = [
    { key: "receipt", header: "Receipt", render: (receipt) => receipt.receiptNumber },
    { key: "client", header: "Client", render: (receipt) => receipt.client?.name ?? "-" },
    { key: "date", header: "Receipt date", render: (receipt) => formatBillingDate(receipt.receiptDate) },
    { key: "mode", header: "Mode", render: (receipt) => receipt.paymentMode },
    { key: "reference", header: "Reference", render: (receipt) => receipt.referenceNumber ?? "-" },
    { key: "amount", header: "Amount", render: (receipt) => formatBillingMoney(receipt.amount) },
    { key: "allocations", header: "Allocations", render: (receipt) => String(receipt.allocations?.length ?? 0) },
  ];
  const errorMessage = receipts.error instanceof ApiClientError ? receipts.error.message : receipts.error instanceof Error ? receipts.error.message : undefined;
  return (
    <PermissionGuard permission="billing.view" fallback={<ErrorState title="Permission required" message="You do not have access to receipts." />}>
      <div className="flex flex-col gap-6">
        <PageHeader title="Payment Receipts" description="Receipt metadata and invoice allocations." actions={<PermissionGuard permission="billing.manage"><ReceiptCreateDialog /></PermissionGuard>} />
        <SearchFilterBar value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Search receipts" filters={<SelectField value={clientId} onValueChange={(value) => { setClientId(value); setPage(1); }} className="w-full sm:w-56" options={clientOptions} />} onReset={() => { setSearch(""); setClientId(ALL); setPage(1); }} />
        {receipts.isLoading ? <LoadingState rows={6} /> : null}
        {receipts.error ? <ErrorState title="Unable to load receipts" message={errorMessage} /> : null}
        {!receipts.isLoading && !receipts.error ? (
          <>
            <DataTable columns={columns} rows={receipts.data?.data ?? []} getRowKey={(receipt) => receipt.id} emptyTitle="No receipts found" />
            <PaginationControls page={receipts.data?.meta.page ?? page} totalPages={receipts.data?.meta.totalPages ?? 1} onPageChange={setPage} />
          </>
        ) : null}
      </div>
    </PermissionGuard>
  );
}

function ReceiptCreateDialog() {
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const clients = useClients({ page: 1, limit: 100, sortBy: "name", sortOrder: "asc" });
  const invoices = useBillingInvoices({ page: 1, limit: 100, sortBy: "createdAt", sortOrder: "desc" });
  const createReceipt = useCreatePaymentReceipt();
  const form = useForm<ReceiptFormValues>({
    resolver: zodResolver(receiptSchema),
    defaultValues: {
      clientId: NONE,
      invoiceId: NONE,
      receiptNumber: "",
      receiptDate: new Date().toISOString().slice(0, 10),
      amount: 0,
      paymentMode: "BANK_TRANSFER",
      referenceNumber: "",
      notes: "",
    },
  });
  const selectedClientId = useWatch({ control: form.control, name: "clientId" });
  const selectedInvoiceId = useWatch({ control: form.control, name: "invoiceId" });
  const paymentMode = useWatch({ control: form.control, name: "paymentMode" });
  const clientOptions = useMemo(
    () => [{ value: NONE, label: "Select client" }, ...(clients.data?.data ?? []).map((client) => ({ value: client.id, label: client.name }))],
    [clients.data?.data],
  );
  const invoiceOptions = useMemo(
    () => [{ value: NONE, label: "No allocation" }, ...(invoices.data?.data ?? []).map((invoice) => ({ value: invoice.id, label: `${invoice.invoiceNumber} - ${invoice.client?.name ?? "Client"}` }))],
    [invoices.data?.data],
  );
  async function onSubmit(values: ReceiptFormValues) {
    setFormError(null);
    try {
      await createReceipt.mutateAsync(toReceiptPayload(values));
      setOpen(false);
      form.reset();
    } catch (caught) {
      setFormError(caught instanceof ApiClientError ? caught.message : "Unable to create receipt");
    }
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type="button" />}><Plus className="size-4" />New receipt</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>New Payment Receipt</DialogTitle><DialogDescription>Stores receipt metadata and optional invoice allocation.</DialogDescription></DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
          <FormFieldWrapper label="Client" error={form.formState.errors.clientId?.message}><SelectField value={selectedClientId} onValueChange={(value) => form.setValue("clientId", value)} options={clientOptions} /></FormFieldWrapper>
          <FormFieldWrapper label="Invoice allocation"><SelectField value={selectedInvoiceId || NONE} onValueChange={(value) => form.setValue("invoiceId", value)} options={invoiceOptions} /></FormFieldWrapper>
          <FormFieldWrapper label="Receipt number" error={form.formState.errors.receiptNumber?.message}><Input {...form.register("receiptNumber")} /></FormFieldWrapper>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormFieldWrapper label="Receipt date"><Input type="date" {...form.register("receiptDate")} /></FormFieldWrapper>
            <FormFieldWrapper label="Amount" error={form.formState.errors.amount?.message}><Input type="number" min={0} {...form.register("amount", { valueAsNumber: true })} /></FormFieldWrapper>
          </div>
          <FormFieldWrapper label="Payment mode"><SelectField value={paymentMode} onValueChange={(value) => form.setValue("paymentMode", value as ReceiptFormValues["paymentMode"])} options={paymentModes.map((value) => ({ value, label: value }))} /></FormFieldWrapper>
          <FormFieldWrapper label="Reference number"><Input {...form.register("referenceNumber")} /></FormFieldWrapper>
          <FormFieldWrapper label="Notes"><Input {...form.register("notes")} /></FormFieldWrapper>
          {formError ? <ErrorState title="Unable to create receipt" message={formError} /> : null}
          <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" disabled={createReceipt.isPending}>Save receipt</Button></div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
