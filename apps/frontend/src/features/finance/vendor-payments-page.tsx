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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { PermissionGuard } from "@/components/shared/permission-guard";
import { paymentModes, vendorPaymentSchema, type VendorPaymentFormValues } from "@/features/finance/schemas";
import { useCreateVendorPayment, useVendorBills, useVendorPayments, useVendors } from "@/features/finance/hooks";
import type { VendorPayment } from "@/features/finance/types";
import { ALL, formatFinanceDate, formatFinanceMoney, NONE, toVendorPaymentPayload } from "@/features/finance/utils";
import { ApiClientError } from "@/lib/api/client";

export function VendorPaymentsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [vendorId, setVendorId] = useState(ALL);
  const payments = useVendorPayments({ page, limit: 20, vendorId: vendorId === ALL ? undefined : vendorId, sortBy: "paymentDate", sortOrder: "desc" });
  const vendors = useVendors({ page: 1, limit: 100, sortBy: "name", sortOrder: "asc" });
  const vendorOptions = useMemo(() => [{ value: ALL, label: "All vendors" }, ...(vendors.data?.data ?? []).map((vendor) => ({ value: vendor.id, label: vendor.name }))], [vendors.data?.data]);
  const rows = (payments.data?.data ?? []).filter((payment) => !search || payment.referenceNumber?.toLowerCase().includes(search.toLowerCase()) || payment.vendor?.name?.toLowerCase().includes(search.toLowerCase()));
  const columns: DataTableColumn<VendorPayment>[] = [
    { key: "vendor", header: "Vendor", render: (payment) => payment.vendor?.name ?? payment.vendorId },
    { key: "bill", header: "Bill", render: (payment) => payment.vendorBill?.billNumber ?? "-" },
    { key: "amount", header: "Amount", render: (payment) => formatFinanceMoney(payment.amount) },
    { key: "date", header: "Payment date", render: (payment) => formatFinanceDate(payment.paymentDate) },
    { key: "mode", header: "Mode", render: (payment) => payment.mode },
    { key: "reference", header: "Reference", render: (payment) => payment.referenceNumber ?? "-" },
  ];
  const errorMessage = payments.error instanceof ApiClientError ? payments.error.message : payments.error instanceof Error ? payments.error.message : undefined;
  return (
    <PermissionGuard permission="finance.view" fallback={<ErrorState title="Permission required" message="You do not have access to vendor payments." />}>
      <div className="flex flex-col gap-6">
        <PageHeader title="Vendor Payments" description="Recorded vendor payment metadata." actions={<PermissionGuard permission="finance.manage"><VendorPaymentDialog /></PermissionGuard>} />
        <SearchFilterBar value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Search payments" filters={<SelectField value={vendorId} onValueChange={(value) => { setVendorId(value); setPage(1); }} className="w-full sm:w-56" options={vendorOptions} />} onReset={() => { setSearch(""); setVendorId(ALL); setPage(1); }} />
        {payments.isLoading ? <LoadingState rows={6} /> : null}
        {payments.error ? <ErrorState title="Unable to load vendor payments" message={errorMessage} /> : null}
        {!payments.isLoading && !payments.error ? (
          <>
            <DataTable columns={columns} rows={rows} getRowKey={(payment) => payment.id} emptyTitle="No vendor payments found" />
            <PaginationControls page={payments.data?.meta.page ?? page} totalPages={payments.data?.meta.totalPages ?? 1} onPageChange={setPage} />
          </>
        ) : null}
      </div>
    </PermissionGuard>
  );
}

function VendorPaymentDialog() {
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const vendors = useVendors({ page: 1, limit: 100, sortBy: "name", sortOrder: "asc" });
  const bills = useVendorBills({ page: 1, limit: 100, sortBy: "createdAt", sortOrder: "desc" });
  const createPayment = useCreateVendorPayment();
  const form = useForm<VendorPaymentFormValues>({ resolver: zodResolver(vendorPaymentSchema), defaultValues: { vendorId: NONE, vendorBillId: NONE, paymentDate: new Date().toISOString().slice(0, 10), amount: 0, mode: "BANK_TRANSFER", referenceNumber: "", notes: "" } });
  const selectedVendorId = useWatch({ control: form.control, name: "vendorId" });
  const selectedBillId = useWatch({ control: form.control, name: "vendorBillId" });
  const selectedMode = useWatch({ control: form.control, name: "mode" });
  const vendorOptions = useMemo(() => [{ value: NONE, label: "Select vendor" }, ...(vendors.data?.data ?? []).map((vendor) => ({ value: vendor.id, label: vendor.name }))], [vendors.data?.data]);
  const billOptions = useMemo(() => [{ value: NONE, label: "No bill allocation" }, ...(bills.data?.data ?? []).map((bill) => ({ value: bill.id, label: `${bill.billNumber} - ${bill.vendor?.name ?? "Vendor"}` }))], [bills.data?.data]);
  async function onSubmit(values: VendorPaymentFormValues) {
    setFormError(null);
    try {
      await createPayment.mutateAsync(toVendorPaymentPayload(values));
      setOpen(false);
      form.reset();
    } catch (caught) {
      setFormError(caught instanceof ApiClientError ? caught.message : "Unable to create payment");
    }
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type="button" />}><Plus className="size-4" />New payment</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>New Vendor Payment</DialogTitle><DialogDescription>Records payment metadata and updates a linked bill balance when selected.</DialogDescription></DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
          <FormFieldWrapper label="Vendor"><SelectField value={selectedVendorId} onValueChange={(value) => form.setValue("vendorId", value)} options={vendorOptions} /></FormFieldWrapper>
          <FormFieldWrapper label="Bill"><SelectField value={selectedBillId || NONE} onValueChange={(value) => form.setValue("vendorBillId", value)} options={billOptions} /></FormFieldWrapper>
          <div className="grid gap-4 sm:grid-cols-2"><FormFieldWrapper label="Payment date"><Input type="date" {...form.register("paymentDate")} /></FormFieldWrapper><FormFieldWrapper label="Amount" error={form.formState.errors.amount?.message}><Input type="number" min={0} {...form.register("amount", { valueAsNumber: true })} /></FormFieldWrapper></div>
          <FormFieldWrapper label="Mode"><SelectField value={selectedMode} onValueChange={(value) => form.setValue("mode", value as VendorPaymentFormValues["mode"])} options={paymentModes.map((value) => ({ value, label: value }))} /></FormFieldWrapper>
          <FormFieldWrapper label="Reference"><Input {...form.register("referenceNumber")} /></FormFieldWrapper>
          <FormFieldWrapper label="Notes"><Input {...form.register("notes")} /></FormFieldWrapper>
          {formError ? <ErrorState title="Unable to create payment" message={formError} /> : null}
          <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" disabled={createPayment.isPending}>Save payment</Button></div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
