"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { FormFieldWrapper } from "@/components/forms/form-field-wrapper";
import { SelectField } from "@/components/forms/select-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataCard } from "@/components/shared/data-card";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { PermissionGuard } from "@/components/shared/permission-guard";
import {
  convertQuotationSchema,
  invoiceSchema,
  type ConvertQuotationFormValues,
  type InvoiceFormValues,
  type InvoiceUpdateFormValues,
} from "@/features/billing/schemas";
import {
  useBillingInvoice,
  useConvertQuotationToInvoice,
  useCreateBillingInvoice,
  useInvoiceSeries,
  useUpdateBillingInvoice,
} from "@/features/billing/hooks";
import type { Invoice } from "@/features/billing/types";
import {
  formatBillingMoney,
  invoiceDisplayTotal,
  NONE,
  toConvertQuotationPayload,
  toDateInput,
  toInvoicePayload,
  toInvoiceUpdatePayload,
} from "@/features/billing/utils";
import { useClients } from "@/features/clients/hooks";
import { useProjects } from "@/features/projects/hooks";
import { useSalesOpportunities, useSalesQuotations } from "@/features/sales/hooks";
import { ApiClientError } from "@/lib/api/client";

export function InvoiceFormPage({ invoiceId }: { invoiceId?: string }) {
  const router = useRouter();
  const isEdit = Boolean(invoiceId);
  const invoice = useBillingInvoice(invoiceId ?? "");
  const clients = useClients({ page: 1, limit: 100, sortBy: "name", sortOrder: "asc" });
  const projects = useProjects({ page: 1, limit: 100, sortBy: "name", sortOrder: "asc" });
  const opportunities = useSalesOpportunities({ page: 1, limit: 100, sortBy: "name", sortOrder: "asc" });
  const quotations = useSalesQuotations({ page: 1, limit: 100, sortBy: "createdAt", sortOrder: "desc" });
  const series = useInvoiceSeries();
  const createInvoice = useCreateBillingInvoice();
  const updateInvoice = useUpdateBillingInvoice(invoiceId ?? "");
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: defaultValues(),
  });
  const items = useFieldArray({ control: form.control, name: "items" });
  const currentValues = useWatch({ control: form.control });
  const displayTotal = invoiceDisplayTotal({
    ...defaultValues(),
    ...currentValues,
    items: (currentValues.items ?? defaultValues().items) as InvoiceFormValues["items"],
  });

  useEffect(() => {
    if (invoice.data) form.reset(defaultValues(invoice.data));
  }, [form, invoice.data]);

  const clientOptions = useMemo(
    () => [{ value: NONE, label: "Select client" }, ...(clients.data?.data ?? []).map((client) => ({ value: client.id, label: client.name }))],
    [clients.data?.data],
  );
  const projectOptions = useMemo(
    () => [{ value: NONE, label: "No project" }, ...(projects.data?.data ?? []).map((project) => ({ value: project.id, label: project.name }))],
    [projects.data?.data],
  );
  const opportunityOptions = useMemo(
    () => [{ value: NONE, label: "No opportunity" }, ...(opportunities.data?.data ?? []).map((opportunity) => ({ value: opportunity.id, label: opportunity.name }))],
    [opportunities.data?.data],
  );
  const quotationOptions = useMemo(
    () => [{ value: NONE, label: "No quotation" }, ...(quotations.data?.data ?? []).map((quotation) => ({ value: quotation.id, label: `${quotation.quotationNumber} - ${quotation.title}` }))],
    [quotations.data?.data],
  );
  const seriesOptions = useMemo(
    () => [{ value: NONE, label: "No series" }, ...(series.data?.data ?? []).map((row) => ({ value: row.id, label: row.name }))],
    [series.data?.data],
  );

  async function onSubmit(values: InvoiceFormValues) {
    setFormError(null);
    try {
      const saved = isEdit
        ? await updateInvoice.mutateAsync(toInvoiceUpdatePayload(values as InvoiceUpdateFormValues))
        : await createInvoice.mutateAsync(toInvoicePayload(values));
      router.replace(`/billing/invoices/${saved.id}`);
    } catch (caught) {
      setFormError(caught instanceof ApiClientError ? caught.message : "Unable to save invoice");
    }
  }

  const errorMessage = invoice.error instanceof ApiClientError ? invoice.error.message : invoice.error instanceof Error ? invoice.error.message : undefined;
  return (
    <PermissionGuard permission="billing.manage" fallback={<ErrorState title="Permission required" message="You do not have permission to manage invoices." />}>
      <div className="flex flex-col gap-6">
        <PageHeader title={isEdit ? "Edit Invoice" : "New Invoice"} description={isEdit ? "Edit invoice metadata. Line items are immutable in the current backend." : "Create invoice metadata, relations, and line items."} />
        {!isEdit ? <QuotationConversionCard quotationOptions={quotationOptions} seriesOptions={seriesOptions} /> : null}
        {isEdit && invoice.isLoading ? <LoadingState rows={6} /> : null}
        {invoice.error ? <ErrorState title="Unable to load invoice" message={errorMessage} /> : null}
        {(!isEdit || invoice.data) && !invoice.error ? (
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
            {!isEdit ? (
              <DataCard title="Customer / Relation">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <FormFieldWrapper label="Client" error={form.formState.errors.clientId?.message}><Controller control={form.control} name="clientId" render={({ field }) => <SelectField value={field.value || NONE} onValueChange={field.onChange} options={clientOptions} />} /></FormFieldWrapper>
                  <FormFieldWrapper label="Project"><Controller control={form.control} name="projectId" render={({ field }) => <SelectField value={field.value || NONE} onValueChange={field.onChange} options={projectOptions} />} /></FormFieldWrapper>
                  <FormFieldWrapper label="Opportunity"><Controller control={form.control} name="opportunityId" render={({ field }) => <SelectField value={field.value || NONE} onValueChange={field.onChange} options={opportunityOptions} />} /></FormFieldWrapper>
                  <FormFieldWrapper label="Quotation"><Controller control={form.control} name="quotationId" render={({ field }) => <SelectField value={field.value || NONE} onValueChange={field.onChange} options={quotationOptions} />} /></FormFieldWrapper>
                </div>
              </DataCard>
            ) : null}
            <DataCard title="Invoice Metadata">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {!isEdit ? <FormFieldWrapper label="Invoice series"><Controller control={form.control} name="seriesId" render={({ field }) => <SelectField value={field.value || NONE} onValueChange={field.onChange} options={seriesOptions} />} /></FormFieldWrapper> : null}
                {!isEdit ? <FormFieldWrapper label="Invoice number" htmlFor="invoiceNumber" error={form.formState.errors.invoiceNumber?.message}><Input id="invoiceNumber" {...form.register("invoiceNumber")} /></FormFieldWrapper> : null}
                <FormFieldWrapper label="Title" htmlFor="title" error={form.formState.errors.title?.message}><Input id="title" {...form.register("title")} /></FormFieldWrapper>
                {!isEdit ? <FormFieldWrapper label="Currency" htmlFor="currency"><Input id="currency" {...form.register("currency")} /></FormFieldWrapper> : null}
                {!isEdit ? <FormFieldWrapper label="Issue date" htmlFor="issueDate" error={form.formState.errors.issueDate?.message}><Input id="issueDate" type="date" {...form.register("issueDate")} /></FormFieldWrapper> : null}
                <FormFieldWrapper label="Due date" htmlFor="dueDate"><Input id="dueDate" type="date" {...form.register("dueDate")} /></FormFieldWrapper>
                {!isEdit ? <FormFieldWrapper label="Adjustment" htmlFor="adjustmentTotal"><Input id="adjustmentTotal" type="number" {...form.register("adjustmentTotal", { valueAsNumber: true })} /></FormFieldWrapper> : null}
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <FormFieldWrapper label="Terms" htmlFor="terms"><Input id="terms" {...form.register("terms")} /></FormFieldWrapper>
                <FormFieldWrapper label="Notes" htmlFor="notes"><Input id="notes" {...form.register("notes")} /></FormFieldWrapper>
              </div>
            </DataCard>
            {!isEdit ? (
              <DataCard title="Line Items" description={`Display total: ${formatBillingMoney(displayTotal, currentValues.currency || "INR")}`} action={<Button type="button" variant="outline" onClick={() => items.append({ description: "", quantity: 1, unitPrice: 0, discountAmount: 0, taxAmount: 0 })}><Plus className="size-4" />Add item</Button>}>
                <div className="flex flex-col gap-4">
                  {items.fields.map((item, index) => (
                    <div key={item.id} className="grid gap-3 rounded-md border p-3 md:grid-cols-6">
                      <FormFieldWrapper label="Description" htmlFor={`invoice-item-description-${index}`} error={form.formState.errors.items?.[index]?.description?.message}><Input id={`invoice-item-description-${index}`} {...form.register(`items.${index}.description`)} /></FormFieldWrapper>
                      <FormFieldWrapper label="Quantity" htmlFor={`invoice-item-quantity-${index}`}><Input id={`invoice-item-quantity-${index}`} type="number" min={0} {...form.register(`items.${index}.quantity`, { valueAsNumber: true })} /></FormFieldWrapper>
                      <FormFieldWrapper label="Unit price" htmlFor={`invoice-item-price-${index}`}><Input id={`invoice-item-price-${index}`} type="number" min={0} {...form.register(`items.${index}.unitPrice`, { valueAsNumber: true })} /></FormFieldWrapper>
                      <FormFieldWrapper label="Discount" htmlFor={`invoice-item-discount-${index}`}><Input id={`invoice-item-discount-${index}`} type="number" min={0} {...form.register(`items.${index}.discountAmount`, { valueAsNumber: true })} /></FormFieldWrapper>
                      <FormFieldWrapper label="Tax" htmlFor={`invoice-item-tax-${index}`}><Input id={`invoice-item-tax-${index}`} type="number" min={0} {...form.register(`items.${index}.taxAmount`, { valueAsNumber: true })} /></FormFieldWrapper>
                      <div className="flex items-end"><Button type="button" variant="destructive" onClick={() => items.remove(index)} disabled={items.fields.length === 1}><Trash2 className="size-4" />Remove</Button></div>
                    </div>
                  ))}
                </div>
              </DataCard>
            ) : null}
            {formError ? <ErrorState title="Unable to save invoice" message={formError} /> : null}
            <div className="flex items-center justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
              <Button type="submit" disabled={form.formState.isSubmitting || createInvoice.isPending || updateInvoice.isPending}><Save className="size-4" />{isEdit ? "Update invoice" : "Create invoice"}</Button>
            </div>
          </form>
        ) : null}
      </div>
    </PermissionGuard>
  );
}

function QuotationConversionCard({
  quotationOptions,
  seriesOptions,
}: {
  quotationOptions: Array<{ value: string; label: string }>;
  seriesOptions: Array<{ value: string; label: string }>;
}) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<ConvertQuotationFormValues>({
    resolver: zodResolver(convertQuotationSchema),
    defaultValues: {
      quotationId: NONE,
      invoiceNumber: "",
      issueDate: toDateInput(new Date().toISOString()),
      dueDate: "",
      seriesId: NONE,
    },
  });
  const quotationId = useWatch({ control: form.control, name: "quotationId" });
  const convert = useConvertQuotationToInvoice(quotationId === NONE ? "" : quotationId);
  async function onConvert(values: ConvertQuotationFormValues) {
    setFormError(null);
    try {
      const saved = await convert.mutateAsync(toConvertQuotationPayload(values));
      router.replace(`/billing/invoices/${saved.id}`);
    } catch (caught) {
      setFormError(caught instanceof ApiClientError ? caught.message : "Unable to convert quotation");
    }
  }
  return (
    <DataCard title="Convert Quotation" description="Create an invoice from accepted quotation metadata without generating PDFs or emails.">
      <form onSubmit={form.handleSubmit(onConvert)} className="grid gap-4 lg:grid-cols-5">
        <FormFieldWrapper label="Quotation" error={form.formState.errors.quotationId?.message}><Controller control={form.control} name="quotationId" render={({ field }) => <SelectField value={field.value || NONE} onValueChange={field.onChange} options={quotationOptions} />} /></FormFieldWrapper>
        <FormFieldWrapper label="Series"><Controller control={form.control} name="seriesId" render={({ field }) => <SelectField value={field.value || NONE} onValueChange={field.onChange} options={seriesOptions} />} /></FormFieldWrapper>
        <FormFieldWrapper label="Invoice number" htmlFor="convertInvoiceNumber" error={form.formState.errors.invoiceNumber?.message}><Input id="convertInvoiceNumber" {...form.register("invoiceNumber")} /></FormFieldWrapper>
        <FormFieldWrapper label="Issue date" htmlFor="convertIssueDate"><Input id="convertIssueDate" type="date" {...form.register("issueDate")} /></FormFieldWrapper>
        <div className="flex items-end"><Button type="submit" disabled={convert.isPending} className="w-full"><Save className="size-4" />Convert</Button></div>
      </form>
      {formError ? <div className="mt-4"><ErrorState title="Unable to convert quotation" message={formError} /></div> : null}
    </DataCard>
  );
}

function defaultValues(invoice?: Invoice): InvoiceFormValues {
  return {
    clientId: invoice?.clientId ?? NONE,
    projectId: invoice?.projectId ?? NONE,
    opportunityId: invoice?.opportunityId ?? NONE,
    quotationId: invoice?.quotationId ?? NONE,
    seriesId: invoice?.seriesId ?? NONE,
    invoiceNumber: invoice?.invoiceNumber ?? "",
    title: invoice?.title ?? "",
    currency: invoice?.currency ?? "INR",
    issueDate: toDateInput(invoice?.issueDate ?? new Date().toISOString()),
    dueDate: toDateInput(invoice?.dueDate),
    adjustmentTotal: Number(invoice?.adjustmentTotal ?? 0),
    terms: invoice?.terms ?? "",
    notes: invoice?.notes ?? "",
    items: invoice?.items?.length
      ? invoice.items.map((item) => ({
          description: item.description,
          quantity: Number(item.quantity ?? 1),
          unitPrice: Number(item.unitPrice ?? 0),
          discountAmount: Number(item.discountAmount ?? 0),
          taxAmount: Number(item.taxAmount ?? 0),
        }))
      : [{ description: "", quantity: 1, unitPrice: 0, discountAmount: 0, taxAmount: 0 }],
  };
}
