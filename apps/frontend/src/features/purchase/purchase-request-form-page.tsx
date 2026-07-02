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
import { useEmployees } from "@/features/employees/hooks";
import { useInventoryItems } from "@/features/inventory/hooks";
import { purchaseRequestSchema, type PurchaseRequestFormValues } from "@/features/purchase/schemas";
import { useCreatePurchaseRequest, usePurchaseRequest, useUpdatePurchaseRequest } from "@/features/purchase/hooks";
import type { PurchaseRequest } from "@/features/purchase/types";
import { formatPurchaseMoney, NONE, purchaseRequestTotal, toDateInput, toPurchaseRequestPayload } from "@/features/purchase/utils";
import { ApiClientError } from "@/lib/api/client";

export function PurchaseRequestFormPage({ requestId }: { requestId?: string }) {
  const router = useRouter();
  const isEdit = Boolean(requestId);
  const request = usePurchaseRequest(requestId ?? "");
  const employees = useEmployees({ page: 1, limit: 100, sortBy: "firstName", sortOrder: "asc" });
  const itemsLookup = useInventoryItems({ page: 1, limit: 100, sortBy: "name", sortOrder: "asc" });
  const createRequest = useCreatePurchaseRequest();
  const updateRequest = useUpdatePurchaseRequest(requestId ?? "");
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<PurchaseRequestFormValues>({ resolver: zodResolver(purchaseRequestSchema), defaultValues: defaultValues() });
  const items = useFieldArray({ control: form.control, name: "items" });
  const currentValues = useWatch({ control: form.control });
  const displayTotal = purchaseRequestTotal({ ...defaultValues(), ...currentValues, items: (currentValues.items ?? defaultValues().items) as PurchaseRequestFormValues["items"] });
  useEffect(() => { if (request.data) form.reset(defaultValues(request.data)); }, [request.data, form]);
  const employeeOptions = useMemo(() => [{ value: NONE, label: "No requester" }, ...(employees.data?.data ?? []).map((employee) => ({ value: employee.id, label: `${employee.firstName} ${employee.lastName} (${employee.employeeCode})` }))], [employees.data?.data]);
  const inventoryOptions = useMemo(() => [{ value: NONE, label: "No linked item" }, ...(itemsLookup.data?.data ?? []).map((item) => ({ value: item.id, label: `${item.name} (${item.itemCode})` }))], [itemsLookup.data?.data]);
  async function onSubmit(values: PurchaseRequestFormValues) {
    setFormError(null);
    try {
      const saved = isEdit ? await updateRequest.mutateAsync(toPurchaseRequestPayload(values)) : await createRequest.mutateAsync(toPurchaseRequestPayload(values));
      router.replace(`/purchase/requests/${saved.id}`);
    } catch (caught) {
      setFormError(caught instanceof ApiClientError ? caught.message : "Unable to save purchase request");
    }
  }
  return (
    <PermissionGuard permission="purchases.manage" fallback={<ErrorState title="Permission required" message="You do not have permission to manage purchase requests." />}>
      <div className="flex flex-col gap-6">
        <PageHeader title={isEdit ? "Edit Purchase Request" : "New Purchase Request"} description="Capture requester, need date, notes, and requested line items." />
        {isEdit && request.isLoading ? <LoadingState rows={6} /> : null}
        {request.error ? <ErrorState title="Unable to load request" message={request.error instanceof Error ? request.error.message : undefined} /> : null}
        {(!isEdit || request.data) && !request.error ? (
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <DataCard title="Request Details">
              <div className="grid gap-4 md:grid-cols-2">
                <FormFieldWrapper label="Requester"><Controller control={form.control} name="requesterEmployeeId" render={({ field }) => <SelectField value={field.value || NONE} onValueChange={field.onChange} options={employeeOptions} />} /></FormFieldWrapper>
                <FormFieldWrapper label="Required date"><Input type="date" {...form.register("neededByDate")} /></FormFieldWrapper>
                <FormFieldWrapper label="Title" error={form.formState.errors.title?.message}><Input {...form.register("title")} /></FormFieldWrapper>
                <FormFieldWrapper label="Notes"><Input {...form.register("notes")} /></FormFieldWrapper>
              </div>
            </DataCard>
            <DataCard title="Requested Items" description={`Estimated total: ${formatPurchaseMoney(displayTotal)}`} action={<Button type="button" variant="outline" onClick={() => items.append({ inventoryItemId: NONE, description: "", quantity: 1, estimatedUnitPrice: 0 })}><Plus className="size-4" />Add item</Button>}>
              <div className="flex flex-col gap-4">
                {items.fields.map((item, index) => (
                  <div key={item.id} className="grid gap-3 rounded-md border p-3 md:grid-cols-5">
                    <FormFieldWrapper label="Inventory item"><Controller control={form.control} name={`items.${index}.inventoryItemId`} render={({ field }) => <SelectField value={field.value || NONE} onValueChange={field.onChange} options={inventoryOptions} />} /></FormFieldWrapper>
                    <FormFieldWrapper label="Description" error={form.formState.errors.items?.[index]?.description?.message}><Input {...form.register(`items.${index}.description`)} /></FormFieldWrapper>
                    <FormFieldWrapper label="Qty"><Input type="number" min={0} step="0.01" {...form.register(`items.${index}.quantity`, { valueAsNumber: true })} /></FormFieldWrapper>
                    <FormFieldWrapper label="Estimated price"><Input type="number" min={0} step="0.01" {...form.register(`items.${index}.estimatedUnitPrice`, { valueAsNumber: true })} /></FormFieldWrapper>
                    <div className="flex items-end"><Button type="button" variant="destructive" onClick={() => items.remove(index)} disabled={items.fields.length === 1}><Trash2 className="size-4" />Remove</Button></div>
                  </div>
                ))}
              </div>
            </DataCard>
            {formError ? <ErrorState title="Unable to save request" message={formError} /> : null}
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button><Button type="submit" disabled={form.formState.isSubmitting || createRequest.isPending || updateRequest.isPending}><Save className="size-4" />Save request</Button></div>
          </form>
        ) : null}
      </div>
    </PermissionGuard>
  );
}

function defaultValues(request?: PurchaseRequest): PurchaseRequestFormValues {
  return {
    requesterEmployeeId: request?.requesterEmployeeId ?? NONE,
    title: request?.title ?? "",
    neededByDate: toDateInput(request?.neededByDate),
    notes: request?.notes ?? "",
    items: request?.items?.length ? request.items.map((item) => ({ inventoryItemId: item.inventoryItemId ?? NONE, description: item.description, quantity: Number(item.quantity ?? 0), estimatedUnitPrice: Number(item.estimatedUnitPrice ?? 0) })) : [{ inventoryItemId: NONE, description: "", quantity: 1, estimatedUnitPrice: 0 }],
  };
}
