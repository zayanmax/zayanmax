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
import { vendorBillSchema, type VendorBillFormValues } from "@/features/finance/schemas";
import { useCreateVendorBill, useUpdateVendorBill, useVendorBill, useVendors } from "@/features/finance/hooks";
import type { VendorBill } from "@/features/finance/types";
import { formatFinanceMoney, NONE, toDateInput, toVendorBillPayload, vendorBillTotal } from "@/features/finance/utils";
import { ApiClientError } from "@/lib/api/client";

export function VendorBillFormPage({ billId }: { billId?: string }) {
  const router = useRouter();
  const isEdit = Boolean(billId);
  const bill = useVendorBill(billId ?? "");
  const vendors = useVendors({ page: 1, limit: 100, sortBy: "name", sortOrder: "asc" });
  const createBill = useCreateVendorBill();
  const updateBill = useUpdateVendorBill(billId ?? "");
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<VendorBillFormValues>({ resolver: zodResolver(vendorBillSchema), defaultValues: defaultValues() });
  const items = useFieldArray({ control: form.control, name: "items" });
  const currentValues = useWatch({ control: form.control });
  const displayTotal = vendorBillTotal({ ...defaultValues(), ...currentValues, items: (currentValues.items ?? defaultValues().items) as VendorBillFormValues["items"] });
  useEffect(() => { if (bill.data) form.reset(defaultValues(bill.data)); }, [bill.data, form]);
  const vendorOptions = useMemo(() => [{ value: NONE, label: "Select vendor" }, ...(vendors.data?.data ?? []).map((vendor) => ({ value: vendor.id, label: vendor.name }))], [vendors.data?.data]);
  async function onSubmit(values: VendorBillFormValues) {
    setFormError(null);
    try {
      const saved = isEdit
        ? await updateBill.mutateAsync(toVendorBillPayload(values))
        : await createBill.mutateAsync(toVendorBillPayload(values));
      router.replace(`/finance/vendor-bills/${saved.id}`);
    } catch (caught) {
      setFormError(caught instanceof ApiClientError ? caught.message : "Unable to save vendor bill");
    }
  }
  const errorMessage = bill.error instanceof ApiClientError ? bill.error.message : bill.error instanceof Error ? bill.error.message : undefined;
  return (
    <PermissionGuard permission="finance.manage" fallback={<ErrorState title="Permission required" message="You do not have permission to manage vendor bills." />}>
      <div className="flex flex-col gap-6">
        <PageHeader title={isEdit ? "Edit Vendor Bill" : "New Vendor Bill"} description="Create or update vendor bill metadata and line items." />
        {isEdit && bill.isLoading ? <LoadingState rows={6} /> : null}
        {bill.error ? <ErrorState title="Unable to load vendor bill" message={errorMessage} /> : null}
        {(!isEdit || bill.data) && !bill.error ? (
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <DataCard title="Bill Details">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <FormFieldWrapper label="Vendor" error={form.formState.errors.vendorId?.message}><Controller control={form.control} name="vendorId" render={({ field }) => <SelectField value={field.value || NONE} onValueChange={field.onChange} options={vendorOptions} />} /></FormFieldWrapper>
                <FormFieldWrapper label="Bill number" error={form.formState.errors.billNumber?.message}><Input {...form.register("billNumber")} /></FormFieldWrapper>
                <FormFieldWrapper label="Bill date"><Input type="date" {...form.register("billDate")} /></FormFieldWrapper>
                <FormFieldWrapper label="Due date"><Input type="date" {...form.register("dueDate")} /></FormFieldWrapper>
              </div>
              <FormFieldWrapper label="Notes"><Input {...form.register("notes")} /></FormFieldWrapper>
            </DataCard>
            <DataCard title="Bill Items" description={`Display total: ${formatFinanceMoney(displayTotal)}`} action={<Button type="button" variant="outline" onClick={() => items.append({ description: "", quantity: 1, unitPrice: 0, taxAmount: 0 })}><Plus className="size-4" />Add item</Button>}>
              <div className="flex flex-col gap-4">
                {items.fields.map((item, index) => (
                  <div key={item.id} className="grid gap-3 rounded-md border p-3 md:grid-cols-5">
                    <FormFieldWrapper label="Description" error={form.formState.errors.items?.[index]?.description?.message}><Input {...form.register(`items.${index}.description`)} /></FormFieldWrapper>
                    <FormFieldWrapper label="Quantity"><Input type="number" min={0} {...form.register(`items.${index}.quantity`, { valueAsNumber: true })} /></FormFieldWrapper>
                    <FormFieldWrapper label="Unit price"><Input type="number" min={0} {...form.register(`items.${index}.unitPrice`, { valueAsNumber: true })} /></FormFieldWrapper>
                    <FormFieldWrapper label="Tax"><Input type="number" min={0} {...form.register(`items.${index}.taxAmount`, { valueAsNumber: true })} /></FormFieldWrapper>
                    <div className="flex items-end"><Button type="button" variant="destructive" onClick={() => items.remove(index)} disabled={items.fields.length === 1}><Trash2 className="size-4" />Remove</Button></div>
                  </div>
                ))}
              </div>
            </DataCard>
            {formError ? <ErrorState title="Unable to save vendor bill" message={formError} /> : null}
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button><Button type="submit" disabled={form.formState.isSubmitting || createBill.isPending || updateBill.isPending}><Save className="size-4" />Save bill</Button></div>
          </form>
        ) : null}
      </div>
    </PermissionGuard>
  );
}

function defaultValues(bill?: VendorBill): VendorBillFormValues {
  return {
    vendorId: bill?.vendorId ?? NONE,
    billNumber: bill?.billNumber ?? "",
    billDate: toDateInput(bill?.billDate ?? new Date().toISOString()),
    dueDate: toDateInput(bill?.dueDate),
    notes: bill?.notes ?? "",
    items: bill?.items?.length
      ? bill.items.map((item) => ({
          description: item.description,
          quantity: Number(item.quantity ?? 1),
          unitPrice: Number(item.unitPrice ?? 0),
          taxAmount: Number(item.taxAmount ?? 0),
        }))
      : [{ description: "", quantity: 1, unitPrice: 0, taxAmount: 0 }],
  };
}
