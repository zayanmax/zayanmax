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
import { useVendors } from "@/features/finance/hooks";
import { useInventoryItems } from "@/features/inventory/hooks";
import { purchaseOrderSchema, type PurchaseOrderFormValues } from "@/features/purchase/schemas";
import { useCreatePurchaseOrder, usePurchaseOrder, usePurchaseRequests, useUpdatePurchaseOrder } from "@/features/purchase/hooks";
import type { PurchaseOrder } from "@/features/purchase/types";
import { formatPurchaseMoney, NONE, purchaseOrderTotal, toDateInput, toPurchaseOrderPayload } from "@/features/purchase/utils";
import { ApiClientError } from "@/lib/api/client";

export function PurchaseOrderFormPage({ orderId }: { orderId?: string }) {
  const router = useRouter();
  const isEdit = Boolean(orderId);
  const order = usePurchaseOrder(orderId ?? "");
  const vendors = useVendors({ page: 1, limit: 100, sortBy: "name", sortOrder: "asc" });
  const requests = usePurchaseRequests({ page: 1, limit: 100, sortBy: "createdAt", sortOrder: "desc" });
  const itemsLookup = useInventoryItems({ page: 1, limit: 100, sortBy: "name", sortOrder: "asc" });
  const createOrder = useCreatePurchaseOrder();
  const updateOrder = useUpdatePurchaseOrder(orderId ?? "");
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<PurchaseOrderFormValues>({ resolver: zodResolver(purchaseOrderSchema), defaultValues: defaultValues() });
  const items = useFieldArray({ control: form.control, name: "items" });
  const currentValues = useWatch({ control: form.control });
  const displayTotal = purchaseOrderTotal({ ...defaultValues(), ...currentValues, items: (currentValues.items ?? defaultValues().items) as PurchaseOrderFormValues["items"] });
  useEffect(() => { if (order.data) form.reset(defaultValues(order.data)); }, [order.data, form]);
  const vendorOptions = useMemo(() => [{ value: NONE, label: "No vendor" }, ...(vendors.data?.data ?? []).map((vendor) => ({ value: vendor.id, label: vendor.name }))], [vendors.data?.data]);
  const requestOptions = useMemo(() => [{ value: NONE, label: "No linked request" }, ...(requests.data?.data ?? []).map((request) => ({ value: request.id, label: `${request.requestNumber} · ${request.title}` }))], [requests.data?.data]);
  const inventoryOptions = useMemo(() => [{ value: NONE, label: "No linked item" }, ...(itemsLookup.data?.data ?? []).map((item) => ({ value: item.id, label: `${item.name} (${item.itemCode})` }))], [itemsLookup.data?.data]);
  async function onSubmit(values: PurchaseOrderFormValues) {
    setFormError(null);
    try {
      const saved = isEdit ? await updateOrder.mutateAsync(toPurchaseOrderPayload(values)) : await createOrder.mutateAsync(toPurchaseOrderPayload(values));
      router.replace(`/purchase/orders/${saved.id}`);
    } catch (caught) {
      setFormError(caught instanceof ApiClientError ? caught.message : "Unable to save purchase order");
    }
  }
  return (
    <PermissionGuard permission="purchases.manage" fallback={<ErrorState title="Permission required" message="You do not have permission to manage purchase orders." />}>
      <div className="flex flex-col gap-6">
        <PageHeader title={isEdit ? "Edit Purchase Order" : "New Purchase Order"} description="Create vendor purchase order metadata and line items." />
        {isEdit && order.isLoading ? <LoadingState rows={6} /> : null}
        {order.error ? <ErrorState title="Unable to load order" message={order.error instanceof Error ? order.error.message : undefined} /> : null}
        {(!isEdit || order.data) && !order.error ? (
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <DataCard title="Order Details">
              <div className="grid gap-4 md:grid-cols-3">
                <FormFieldWrapper label="Vendor"><Controller control={form.control} name="vendorId" render={({ field }) => <SelectField value={field.value || NONE} onValueChange={field.onChange} options={vendorOptions} />} /></FormFieldWrapper>
                <FormFieldWrapper label="Purchase request"><Controller control={form.control} name="purchaseRequestId" render={({ field }) => <SelectField value={field.value || NONE} onValueChange={field.onChange} options={requestOptions} />} /></FormFieldWrapper>
                <FormFieldWrapper label="PO number"><Input {...form.register("orderNumber")} placeholder="Auto if blank" /></FormFieldWrapper>
                <FormFieldWrapper label="Order date" error={form.formState.errors.orderDate?.message}><Input type="date" {...form.register("orderDate")} /></FormFieldWrapper>
                <FormFieldWrapper label="Expected delivery"><Input type="date" {...form.register("expectedDeliveryDate")} /></FormFieldWrapper>
                <FormFieldWrapper label="Notes"><Input {...form.register("notes")} /></FormFieldWrapper>
              </div>
            </DataCard>
            <DataCard title="Order Items" description={`Order total: ${formatPurchaseMoney(displayTotal)}`} action={<Button type="button" variant="outline" onClick={() => items.append({ inventoryItemId: NONE, description: "", quantity: 1, unitPrice: 0, taxAmount: 0 })}><Plus className="size-4" />Add item</Button>}>
              <div className="flex flex-col gap-4">
                {items.fields.map((item, index) => (
                  <div key={item.id} className="grid gap-3 rounded-md border p-3 md:grid-cols-6">
                    <FormFieldWrapper label="Inventory item"><Controller control={form.control} name={`items.${index}.inventoryItemId`} render={({ field }) => <SelectField value={field.value || NONE} onValueChange={field.onChange} options={inventoryOptions} />} /></FormFieldWrapper>
                    <FormFieldWrapper label="Description"><Input {...form.register(`items.${index}.description`)} /></FormFieldWrapper>
                    <FormFieldWrapper label="Qty"><Input type="number" min={0} step="0.01" {...form.register(`items.${index}.quantity`, { valueAsNumber: true })} /></FormFieldWrapper>
                    <FormFieldWrapper label="Unit price"><Input type="number" min={0} step="0.01" {...form.register(`items.${index}.unitPrice`, { valueAsNumber: true })} /></FormFieldWrapper>
                    <FormFieldWrapper label="Tax"><Input type="number" min={0} step="0.01" {...form.register(`items.${index}.taxAmount`, { valueAsNumber: true })} /></FormFieldWrapper>
                    <div className="flex items-end"><Button type="button" variant="destructive" onClick={() => items.remove(index)} disabled={items.fields.length === 1}><Trash2 className="size-4" />Remove</Button></div>
                  </div>
                ))}
              </div>
            </DataCard>
            {formError ? <ErrorState title="Unable to save order" message={formError} /> : null}
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button><Button type="submit" disabled={form.formState.isSubmitting || createOrder.isPending || updateOrder.isPending}><Save className="size-4" />Save order</Button></div>
          </form>
        ) : null}
      </div>
    </PermissionGuard>
  );
}

function defaultValues(order?: PurchaseOrder): PurchaseOrderFormValues {
  return {
    vendorId: order?.vendorId ?? NONE,
    purchaseRequestId: order?.purchaseRequestId ?? NONE,
    orderNumber: order?.orderNumber ?? "",
    orderDate: toDateInput(order?.orderDate) || new Date().toISOString().slice(0, 10),
    expectedDeliveryDate: toDateInput(order?.expectedDeliveryDate),
    notes: order?.notes ?? "",
    items: order?.items?.length ? order.items.map((item) => ({ inventoryItemId: item.inventoryItemId ?? NONE, description: item.description, quantity: Number(item.quantity ?? 0), unitPrice: Number(item.unitPrice ?? 0), taxAmount: Number(item.taxAmount ?? 0) })) : [{ inventoryItemId: NONE, description: "", quantity: 1, unitPrice: 0, taxAmount: 0 }],
  };
}
