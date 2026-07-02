"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Ban, Edit, FileMinus2, FilePlus2, ReceiptText, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { useForm, useWatch } from "react-hook-form";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { FormFieldWrapper } from "@/components/forms/form-field-wrapper";
import { SelectField } from "@/components/forms/select-field";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataCard } from "@/components/shared/data-card";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { PermissionGuard } from "@/components/shared/permission-guard";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  creditNoteSchema,
  debitNoteSchema,
  paymentModes,
  receiptSchema,
  type CreditNoteFormValues,
  type DebitNoteFormValues,
  type ReceiptFormValues,
} from "@/features/billing/schemas";
import {
  useBillingInvoice,
  useCancelBillingInvoice,
  useCreateCreditNote,
  useCreateDebitNote,
  useCreatePaymentReceipt,
  useIssueBillingInvoice,
  useWriteOffBillingInvoice,
} from "@/features/billing/hooks";
import type { CreditNote, DebitNote, InvoiceItem, ReceiptAllocation } from "@/features/billing/types";
import {
  formatBillingDate,
  formatBillingMoney,
  toCreditNotePayload,
  toDebitNotePayload,
  toReceiptPayload,
} from "@/features/billing/utils";
import { ApiClientError } from "@/lib/api/client";

export function InvoiceDetailPage({ invoiceId }: { invoiceId: string }) {
  const router = useRouter();
  const invoice = useBillingInvoice(invoiceId);
  const issueInvoice = useIssueBillingInvoice(invoiceId);
  const cancelInvoice = useCancelBillingInvoice(invoiceId);
  const writeOffInvoice = useWriteOffBillingInvoice(invoiceId);
  const errorMessage = invoice.error instanceof ApiClientError ? invoice.error.message : invoice.error instanceof Error ? invoice.error.message : undefined;
  return (
    <PermissionGuard permission="billing.view" fallback={<ErrorState title="Permission required" message="You do not have access to invoices." />}>
      {invoice.isLoading ? <LoadingState rows={6} /> : null}
      {invoice.error ? <ErrorState title="Unable to load invoice" message={errorMessage} /> : null}
      {!invoice.isLoading && !invoice.error && invoice.data ? (
        <div className="flex flex-col gap-6">
          <PageHeader
            title={invoice.data.invoiceNumber}
            description={`${invoice.data.title} - ${invoice.data.status}`}
            actions={
              <>
                <PermissionGuard permission="billing.manage"><Link href={`/billing/invoices/${invoiceId}/edit`} className={buttonVariants({ variant: "outline" })}><Edit className="size-4" />Edit</Link></PermissionGuard>
                <PermissionGuard permission="billing.manage"><ConfirmDialog title="Issue invoice" description="Mark this draft invoice as issued." confirmLabel="Issue" onConfirm={() => void issueInvoice.mutateAsync()} trigger={<Button type="button"><Send className="size-4" />Issue</Button>} /></PermissionGuard>
                <PermissionGuard permission="billing.manage"><ConfirmDialog title="Cancel invoice" description="Cancel this invoice metadata record. PDFs and emails are not generated." confirmLabel="Cancel invoice" destructive onConfirm={() => void cancelInvoice.mutateAsync("Cancelled from frontend")} trigger={<Button type="button" variant="destructive"><Ban className="size-4" />Cancel</Button>} /></PermissionGuard>
                <PermissionGuard permission="billing.manage"><ConfirmDialog title="Write off invoice" description="Write off the outstanding balance metadata." confirmLabel="Write off" destructive onConfirm={() => void writeOffInvoice.mutateAsync("Written off from frontend")} trigger={<Button type="button" variant="destructive">Write off</Button>} /></PermissionGuard>
              </>
            }
          />
          <div className="grid gap-4 xl:grid-cols-3">
            <DataCard title="Invoice Summary">
              <DetailRows rows={[
                ["Number", invoice.data.invoiceNumber],
                ["Title", invoice.data.title],
                ["Status", <StatusBadge key="status" status={invoice.data.status} />],
                ["Currency", invoice.data.currency],
                ["Issue date", formatBillingDate(invoice.data.issueDate)],
                ["Due date", formatBillingDate(invoice.data.dueDate)],
              ]} />
            </DataCard>
            <DataCard title="Customer / Relation">
              <DetailRows rows={[
                ["Client", invoice.data.client?.name ?? "-"],
                ["Project", invoice.data.project?.name ?? "-"],
                ["Opportunity", invoice.data.opportunity?.name ?? "-"],
                ["Quotation", invoice.data.quotation?.quotationNumber ?? "-"],
                ["Series", invoice.data.series?.name ?? "-"],
              ]} />
            </DataCard>
            <DataCard title="Totals">
              <DetailRows rows={[
                ["Subtotal", formatBillingMoney(invoice.data.subTotal, invoice.data.currency)],
                ["Discount", formatBillingMoney(invoice.data.discountTotal, invoice.data.currency)],
                ["Tax", formatBillingMoney(invoice.data.taxTotal, invoice.data.currency)],
                ["Adjustment", formatBillingMoney(invoice.data.adjustmentTotal, invoice.data.currency)],
                ["Grand total", formatBillingMoney(invoice.data.grandTotal, invoice.data.currency)],
                ["Paid", formatBillingMoney(invoice.data.paidAmount, invoice.data.currency)],
                ["Balance", formatBillingMoney(invoice.data.balanceAmount, invoice.data.currency)],
              ]} />
            </DataCard>
          </div>
          <DataCard title="Line Items">
            <DataTable
              columns={[
                { key: "description", header: "Description", render: (item) => item.description },
                { key: "quantity", header: "Qty", render: (item) => String(item.quantity) },
                { key: "unitPrice", header: "Unit price", render: (item) => formatBillingMoney(item.unitPrice, invoice.data?.currency) },
                { key: "discount", header: "Discount", render: (item) => formatBillingMoney(item.discountAmount, invoice.data?.currency) },
                { key: "tax", header: "Tax", render: (item) => formatBillingMoney(item.taxAmount, invoice.data?.currency) },
                { key: "lineTotal", header: "Line total", render: (item) => formatBillingMoney(item.lineTotal, invoice.data?.currency) },
              ] satisfies DataTableColumn<InvoiceItem>[]}
              rows={invoice.data.items ?? []}
              getRowKey={(item) => item.id ?? `${item.description}-${item.sortOrder ?? 0}`}
              emptyTitle="No line items found"
            />
          </DataCard>
          <div className="grid gap-4 xl:grid-cols-2">
            <ReceiptAllocations rows={invoice.data.allocations ?? []} currency={invoice.data.currency} invoiceId={invoiceId} clientId={invoice.data.clientId} balanceAmount={Number(invoice.data.balanceAmount ?? 0)} />
            <CreditDebitNotes
              creditNotes={invoice.data.creditNotes ?? []}
              debitNotes={invoice.data.debitNotes ?? []}
              invoiceId={invoiceId}
              clientId={invoice.data.clientId}
              currency={invoice.data.currency}
            />
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            <DataCard title="Terms"><p className="text-sm text-muted-foreground">{invoice.data.terms ?? "No terms recorded."}</p></DataCard>
            <DataCard title="Notes"><p className="text-sm text-muted-foreground">{invoice.data.notes ?? "No notes recorded."}</p></DataCard>
          </div>
          <div className="flex justify-end">
            <Button type="button" variant="outline" onClick={() => router.push("/billing/invoices")}>Back to invoices</Button>
          </div>
        </div>
      ) : null}
    </PermissionGuard>
  );
}

function ReceiptAllocations({
  rows,
  currency,
  invoiceId,
  clientId,
  balanceAmount,
}: {
  rows: ReceiptAllocation[];
  currency: string;
  invoiceId: string;
  clientId: string;
  balanceAmount: number;
}) {
  return (
    <DataCard title="Payment Allocations / Receipts" action={<PermissionGuard permission="billing.manage"><ReceiptDialog invoiceId={invoiceId} clientId={clientId} defaultAmount={balanceAmount} /></PermissionGuard>}>
      <DataTable
        columns={[
          { key: "receipt", header: "Receipt", render: (row) => row.receipt?.receiptNumber ?? row.receiptId },
          { key: "date", header: "Date", render: (row) => formatBillingDate(row.allocatedAt ?? row.receipt?.receiptDate) },
          { key: "mode", header: "Mode", render: (row) => row.receipt?.paymentMode ?? "-" },
          { key: "amount", header: "Amount", render: (row) => formatBillingMoney(row.amount, currency) },
        ] satisfies DataTableColumn<ReceiptAllocation>[]}
        rows={rows}
        getRowKey={(row) => row.id}
        emptyTitle="No payment allocations found"
      />
    </DataCard>
  );
}

function CreditDebitNotes({
  creditNotes,
  debitNotes,
  invoiceId,
  clientId,
  currency,
}: {
  creditNotes: CreditNote[];
  debitNotes: DebitNote[];
  invoiceId: string;
  clientId: string;
  currency: string;
}) {
  return (
    <DataCard title="Credit / Debit Note Metadata" action={<PermissionGuard permission="billing.manage"><div className="flex gap-2"><CreditNoteDialog invoiceId={invoiceId} clientId={clientId} /><DebitNoteDialog invoiceId={invoiceId} clientId={clientId} /></div></PermissionGuard>}>
      <div className="grid gap-5">
        <DataTable
          columns={[
            { key: "number", header: "Credit note", render: (note) => note.creditNoteNumber },
            { key: "amount", header: "Amount", render: (note) => formatBillingMoney(note.amount, currency) },
            { key: "reason", header: "Reason", render: (note) => note.reason ?? "-" },
          ] satisfies DataTableColumn<CreditNote>[]}
          rows={creditNotes}
          getRowKey={(note) => note.id}
          emptyTitle="No credit notes found"
        />
        <DataTable
          columns={[
            { key: "number", header: "Debit note", render: (note) => note.debitNoteNumber },
            { key: "amount", header: "Amount", render: (note) => formatBillingMoney(note.amount, currency) },
            { key: "reason", header: "Reason", render: (note) => note.reason ?? "-" },
          ] satisfies DataTableColumn<DebitNote>[]}
          rows={debitNotes}
          getRowKey={(note) => note.id}
          emptyTitle="No debit notes found"
        />
      </div>
    </DataCard>
  );
}

function ReceiptDialog({ invoiceId, clientId, defaultAmount }: { invoiceId: string; clientId: string; defaultAmount: number }) {
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const createReceipt = useCreatePaymentReceipt();
  const form = useForm<ReceiptFormValues>({
    resolver: zodResolver(receiptSchema),
    defaultValues: {
      clientId,
      invoiceId,
      receiptNumber: "",
      receiptDate: new Date().toISOString().slice(0, 10),
      amount: Math.max(defaultAmount, 0),
      paymentMode: "BANK_TRANSFER",
      referenceNumber: "",
      notes: "",
    },
  });
  const paymentMode = useWatch({ control: form.control, name: "paymentMode" });
  async function onSubmit(values: ReceiptFormValues) {
    setFormError(null);
    try {
      await createReceipt.mutateAsync(toReceiptPayload(values));
      setOpen(false);
      form.reset();
    } catch (caught) {
      setFormError(caught instanceof ApiClientError ? caught.message : "Unable to record receipt");
    }
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type="button" variant="outline" size="sm" />}><ReceiptText className="size-4" />Record payment</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>Record Payment Receipt</DialogTitle><DialogDescription>Stores receipt metadata and allocates it to this invoice.</DialogDescription></DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
          <FormFieldWrapper label="Receipt number" error={form.formState.errors.receiptNumber?.message}><Input {...form.register("receiptNumber")} /></FormFieldWrapper>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormFieldWrapper label="Receipt date"><Input type="date" {...form.register("receiptDate")} /></FormFieldWrapper>
            <FormFieldWrapper label="Amount" error={form.formState.errors.amount?.message}><Input type="number" min={0} {...form.register("amount", { valueAsNumber: true })} /></FormFieldWrapper>
          </div>
          <FormFieldWrapper label="Payment mode"><SelectField value={paymentMode} onValueChange={(value) => form.setValue("paymentMode", value as ReceiptFormValues["paymentMode"])} options={paymentModes.map((value) => ({ value, label: value }))} /></FormFieldWrapper>
          <FormFieldWrapper label="Reference number"><Input {...form.register("referenceNumber")} /></FormFieldWrapper>
          <FormFieldWrapper label="Notes"><Input {...form.register("notes")} /></FormFieldWrapper>
          {formError ? <ErrorState title="Unable to record receipt" message={formError} /> : null}
          <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" disabled={createReceipt.isPending}>Save receipt</Button></div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CreditNoteDialog({ invoiceId, clientId }: { invoiceId: string; clientId: string }) {
  const [open, setOpen] = useState(false);
  const createNote = useCreateCreditNote();
  const form = useForm<CreditNoteFormValues>({ resolver: zodResolver(creditNoteSchema), defaultValues: { invoiceId, clientId, creditNoteNumber: "", amount: 0, reason: "" } });
  async function onSubmit(values: CreditNoteFormValues) {
    await createNote.mutateAsync(toCreditNotePayload(values));
    setOpen(false);
    form.reset();
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type="button" variant="outline" size="sm" />}><FileMinus2 className="size-4" />Credit</DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Credit Note</DialogTitle><DialogDescription>Metadata only. No document generation is performed.</DialogDescription></DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
          <FormFieldWrapper label="Credit note number" error={form.formState.errors.creditNoteNumber?.message}><Input {...form.register("creditNoteNumber")} /></FormFieldWrapper>
          <FormFieldWrapper label="Amount" error={form.formState.errors.amount?.message}><Input type="number" min={0} {...form.register("amount", { valueAsNumber: true })} /></FormFieldWrapper>
          <FormFieldWrapper label="Reason"><Input {...form.register("reason")} /></FormFieldWrapper>
          <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" disabled={createNote.isPending}>Save credit note</Button></div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DebitNoteDialog({ invoiceId, clientId }: { invoiceId: string; clientId: string }) {
  const [open, setOpen] = useState(false);
  const createNote = useCreateDebitNote();
  const form = useForm<DebitNoteFormValues>({ resolver: zodResolver(debitNoteSchema), defaultValues: { invoiceId, clientId, debitNoteNumber: "", amount: 0, reason: "" } });
  async function onSubmit(values: DebitNoteFormValues) {
    await createNote.mutateAsync(toDebitNotePayload(values));
    setOpen(false);
    form.reset();
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type="button" variant="outline" size="sm" />}><FilePlus2 className="size-4" />Debit</DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Debit Note</DialogTitle><DialogDescription>Metadata only. No document generation is performed.</DialogDescription></DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
          <FormFieldWrapper label="Debit note number" error={form.formState.errors.debitNoteNumber?.message}><Input {...form.register("debitNoteNumber")} /></FormFieldWrapper>
          <FormFieldWrapper label="Amount" error={form.formState.errors.amount?.message}><Input type="number" min={0} {...form.register("amount", { valueAsNumber: true })} /></FormFieldWrapper>
          <FormFieldWrapper label="Reason"><Input {...form.register("reason")} /></FormFieldWrapper>
          <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" disabled={createNote.isPending}>Save debit note</Button></div>
        </form>
      </DialogContent>
    </Dialog>
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
