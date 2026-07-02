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
import { useClients } from "@/features/clients/hooks";
import { quotationSchema, type QuotationFormValues, type QuotationUpdateFormValues } from "@/features/sales/schemas";
import { useCreateSalesQuotation, useSalesLeads, useSalesOpportunities, useSalesQuotation, useUpdateSalesQuotation } from "@/features/sales/hooks";
import type { Quotation } from "@/features/sales/types";
import { formatSalesMoney, NONE, toDateInput, toQuotationPayload, toQuotationUpdatePayload } from "@/features/sales/utils";
import { ApiClientError } from "@/lib/api/client";

export function QuotationFormPage({ quotationId }: { quotationId?: string }) {
  const router = useRouter();
  const isEdit = Boolean(quotationId);
  const quotation = useSalesQuotation(quotationId ?? "");
  const leads = useSalesLeads({ page: 1, limit: 100, sortBy: "name", sortOrder: "asc" });
  const opportunities = useSalesOpportunities({ page: 1, limit: 100, sortBy: "name", sortOrder: "asc" });
  const clients = useClients({ page: 1, limit: 100, sortBy: "name", sortOrder: "asc" });
  const createQuotation = useCreateSalesQuotation();
  const updateQuotation = useUpdateSalesQuotation(quotationId ?? "");
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<QuotationFormValues>({
    resolver: zodResolver(quotationSchema),
    defaultValues: defaultValues(),
  });
  const items = useFieldArray({ control: form.control, name: "items" });
  useEffect(() => { if (quotation.data) form.reset(defaultValues(quotation.data)); }, [form, quotation.data]);
  const leadOptions = useMemo(() => [{ value: NONE, label: "No lead" }, ...(leads.data?.data ?? []).map((lead) => ({ value: lead.id, label: lead.name }))], [leads.data?.data]);
  const opportunityOptions = useMemo(() => [{ value: NONE, label: "No opportunity" }, ...(opportunities.data?.data ?? []).map((opportunity) => ({ value: opportunity.id, label: opportunity.name }))], [opportunities.data?.data]);
  const clientOptions = useMemo(() => [{ value: NONE, label: "No client" }, ...(clients.data?.data ?? []).map((client) => ({ value: client.id, label: client.name }))], [clients.data?.data]);
  const currentValues = useWatch({ control: form.control });
  const displayTotal = (currentValues.items ?? []).reduce(
    (total, item) =>
      total +
      (item?.quantity ?? 0) * (item?.unitPrice ?? 0) -
      (item?.discountAmount ?? 0) +
      (item?.taxAmount ?? 0),
    0,
  );

  async function onSubmit(values: QuotationFormValues) {
    setFormError(null);
    try {
      const saved = isEdit
        ? await updateQuotation.mutateAsync(toQuotationUpdatePayload(values as QuotationUpdateFormValues))
        : await createQuotation.mutateAsync(toQuotationPayload(values));
      router.replace(`/sales/quotations/${saved.id}`);
    } catch (caught) {
      setFormError(caught instanceof ApiClientError ? caught.message : "Unable to save quotation");
    }
  }
  const errorMessage = quotation.error instanceof ApiClientError ? quotation.error.message : quotation.error instanceof Error ? quotation.error.message : undefined;
  return (
    <PermissionGuard permission="sales.manage" fallback={<ErrorState title="Permission required" message="You do not have permission to manage quotations." />}>
      <div className="flex flex-col gap-6">
        <PageHeader title={isEdit ? "Edit Quotation" : "New Quotation"} description={isEdit ? "Edit quotation metadata. Line items are immutable in the current backend." : "Create quotation metadata and line items."} />
        {isEdit && quotation.isLoading ? <LoadingState rows={6} /> : null}
        {quotation.error ? <ErrorState title="Unable to load quotation" message={errorMessage} /> : null}
        {(!isEdit || quotation.data) && !quotation.error ? (
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
            {!isEdit ? (
              <DataCard title="Customer / Opportunity">
                <div className="grid gap-4 md:grid-cols-3">
                  <FormFieldWrapper label="Client"><Controller control={form.control} name="clientId" render={({ field }) => <SelectField value={field.value || NONE} onValueChange={field.onChange} options={clientOptions} />} /></FormFieldWrapper>
                  <FormFieldWrapper label="Lead"><Controller control={form.control} name="leadId" render={({ field }) => <SelectField value={field.value || NONE} onValueChange={field.onChange} options={leadOptions} />} /></FormFieldWrapper>
                  <FormFieldWrapper label="Opportunity"><Controller control={form.control} name="opportunityId" render={({ field }) => <SelectField value={field.value || NONE} onValueChange={field.onChange} options={opportunityOptions} />} /></FormFieldWrapper>
                </div>
              </DataCard>
            ) : null}
            <DataCard title="Quotation Metadata">
              <div className="grid gap-4 md:grid-cols-2">
                {!isEdit ? <FormFieldWrapper label="Quotation number" htmlFor="quotationNumber" error={form.formState.errors.quotationNumber?.message}><Input id="quotationNumber" {...form.register("quotationNumber")} /></FormFieldWrapper> : null}
                <FormFieldWrapper label="Title" htmlFor="title" error={form.formState.errors.title?.message}><Input id="title" {...form.register("title")} /></FormFieldWrapper>
                <FormFieldWrapper label="Currency" htmlFor="currency"><Input id="currency" {...form.register("currency")} /></FormFieldWrapper>
                <FormFieldWrapper label="Valid until" htmlFor="validUntil"><Input id="validUntil" type="date" {...form.register("validUntil")} /></FormFieldWrapper>
              </div>
              <FormFieldWrapper label="Terms" htmlFor="terms"><Input id="terms" {...form.register("terms")} /></FormFieldWrapper>
              <FormFieldWrapper label="Notes" htmlFor="notes"><Input id="notes" {...form.register("notes")} /></FormFieldWrapper>
            </DataCard>
            {!isEdit ? (
              <DataCard title="Line Items" description={`Display total: ${formatSalesMoney(displayTotal, currentValues.currency || "INR")}`} action={<Button type="button" variant="outline" onClick={() => items.append({ description: "", quantity: 1, unitPrice: 0, discountAmount: 0, taxAmount: 0 })}><Plus className="size-4" />Add item</Button>}>
                <div className="flex flex-col gap-4">
                  {items.fields.map((item, index) => (
                    <div key={item.id} className="grid gap-3 rounded-md border p-3 md:grid-cols-6">
                      <FormFieldWrapper label="Description" htmlFor={`item-description-${index}`} error={form.formState.errors.items?.[index]?.description?.message}><Input id={`item-description-${index}`} {...form.register(`items.${index}.description`)} /></FormFieldWrapper>
                      <FormFieldWrapper label="Quantity" htmlFor={`item-quantity-${index}`}><Input id={`item-quantity-${index}`} type="number" min={0} {...form.register(`items.${index}.quantity`, { valueAsNumber: true })} /></FormFieldWrapper>
                      <FormFieldWrapper label="Unit price" htmlFor={`item-price-${index}`}><Input id={`item-price-${index}`} type="number" min={0} {...form.register(`items.${index}.unitPrice`, { valueAsNumber: true })} /></FormFieldWrapper>
                      <FormFieldWrapper label="Discount" htmlFor={`item-discount-${index}`}><Input id={`item-discount-${index}`} type="number" min={0} {...form.register(`items.${index}.discountAmount`, { valueAsNumber: true })} /></FormFieldWrapper>
                      <FormFieldWrapper label="Tax" htmlFor={`item-tax-${index}`}><Input id={`item-tax-${index}`} type="number" min={0} {...form.register(`items.${index}.taxAmount`, { valueAsNumber: true })} /></FormFieldWrapper>
                      <div className="flex items-end"><Button type="button" variant="destructive" onClick={() => items.remove(index)} disabled={items.fields.length === 1}><Trash2 className="size-4" />Remove</Button></div>
                    </div>
                  ))}
                </div>
              </DataCard>
            ) : null}
            {formError ? <ErrorState title="Unable to save quotation" message={formError} /> : null}
            <div className="flex items-center justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
              <Button type="submit" disabled={form.formState.isSubmitting || createQuotation.isPending || updateQuotation.isPending}><Save className="size-4" />{isEdit ? "Update quotation" : "Create quotation"}</Button>
            </div>
          </form>
        ) : null}
      </div>
    </PermissionGuard>
  );
}

function defaultValues(quotation?: Quotation): QuotationFormValues {
  return {
    opportunityId: quotation?.opportunityId ?? NONE,
    leadId: quotation?.leadId ?? NONE,
    clientId: quotation?.clientId ?? NONE,
    quotationNumber: quotation?.quotationNumber ?? "",
    title: quotation?.title ?? "",
    currency: quotation?.currency ?? "INR",
    validUntil: toDateInput(quotation?.validUntil),
    terms: quotation?.terms ?? "",
    notes: quotation?.notes ?? "",
    items: quotation?.items?.length
      ? quotation.items.map((item) => ({
          description: item.description,
          quantity: Number(item.quantity ?? 1),
          unitPrice: Number(item.unitPrice ?? 0),
          discountAmount: Number(item.discountAmount ?? 0),
          taxAmount: Number(item.taxAmount ?? 0),
        }))
      : [{ description: "", quantity: 1, unitPrice: 0, discountAmount: 0, taxAmount: 0 }],
  };
}
