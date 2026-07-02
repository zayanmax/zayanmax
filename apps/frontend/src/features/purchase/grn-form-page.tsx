"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Save, Trash2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { FormFieldWrapper } from "@/components/forms/form-field-wrapper";
import { SelectField } from "@/components/forms/select-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataCard } from "@/components/shared/data-card";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { PermissionGuard } from "@/components/shared/permission-guard";
import { useInventoryItems } from "@/features/inventory/hooks";
import { grnSchema, type GrnFormValues } from "@/features/purchase/schemas";
import { useCreateGoodsReceivedNote, usePurchaseOrder, usePurchaseOrders } from "@/features/purchase/hooks";
import { NONE, toGrnPayload } from "@/features/purchase/utils";
import { ApiClientError } from "@/lib/api/client";

export function GrnFormPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedOrderId = searchParams.get("purchaseOrderId") ?? "";
  const selectedOrder = usePurchaseOrder(preselectedOrderId);
  const orders = usePurchaseOrders({ page: 1, limit: 100, sortBy: "createdAt", sortOrder: "desc" });
  const inventoryItems = useInventoryItems({ page: 1, limit: 100, sortBy: "name", sortOrder: "asc" });
  const createGrn = useCreateGoodsReceivedNote();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<GrnFormValues>({ resolver: zodResolver(grnSchema), defaultValues: { purchaseOrderId: preselectedOrderId, grnNumber: "", receivedDate: new Date().toISOString().slice(0, 10), notes: "", items: [{ purchaseOrderItemId: NONE, inventoryItemId: NONE, description: "", quantityReceived: 1 }] } });
  const items = useFieldArray({ control: form.control, name: "items" });
  useEffect(() => {
    if (selectedOrder.data?.items?.length) {
      form.setValue("purchaseOrderId", selectedOrder.data.id);
      form.setValue("items", selectedOrder.data.items.map((item) => ({ purchaseOrderItemId: item.id ?? NONE, inventoryItemId: item.inventoryItemId ?? NONE, description: item.description, quantityReceived: Math.max(Number(item.quantity ?? 0) - Number(item.receivedQuantity ?? 0), 0) || 1 })));
    }
  }, [selectedOrder.data, form]);
  const orderOptions = useMemo(() => (orders.data?.data ?? []).map((order) => ({ value: order.id, label: `${order.orderNumber} · ${order.vendor?.name ?? "No vendor"}` })), [orders.data?.data]);
  const orderItemOptions = useMemo(() => [{ value: NONE, label: "No PO item" }, ...(selectedOrder.data?.items ?? []).map((item) => ({ value: item.id ?? item.description, label: item.description }))], [selectedOrder.data?.items]);
  const inventoryOptions = useMemo(() => [{ value: NONE, label: "No inventory item" }, ...(inventoryItems.data?.data ?? []).map((item) => ({ value: item.id, label: `${item.name} (${item.itemCode})` }))], [inventoryItems.data?.data]);
  async function onSubmit(values: GrnFormValues) {
    setFormError(null);
    try {
      const saved = await createGrn.mutateAsync(toGrnPayload(values));
      router.replace(`/purchase/grn/${saved.id}`);
    } catch (caught) {
      setFormError(caught instanceof ApiClientError ? caught.message : "Unable to save GRN");
    }
  }
  return (
    <PermissionGuard permission="purchases.manage" fallback={<ErrorState title="Permission required" message="You do not have permission to create GRNs." />}>
      <div className="flex flex-col gap-6">
        <PageHeader title="New Goods Received Note" description="Record received quantities and create stock movements for linked inventory items." />
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <DataCard title="Receiving Details">
            <div className="grid gap-4 md:grid-cols-3">
              <FormFieldWrapper label="Purchase order" error={form.formState.errors.purchaseOrderId?.message}><Controller control={form.control} name="purchaseOrderId" render={({ field }) => <SelectField value={field.value} onValueChange={field.onChange} options={orderOptions} />} /></FormFieldWrapper>
              <FormFieldWrapper label="GRN number"><Input {...form.register("grnNumber")} placeholder="Auto if blank" /></FormFieldWrapper>
              <FormFieldWrapper label="Received date" error={form.formState.errors.receivedDate?.message}><Input type="date" {...form.register("receivedDate")} /></FormFieldWrapper>
              <FormFieldWrapper label="Notes"><Input {...form.register("notes")} /></FormFieldWrapper>
            </div>
          </DataCard>
          <DataCard title="Received Items" action={<Button type="button" variant="outline" onClick={() => items.append({ purchaseOrderItemId: NONE, inventoryItemId: NONE, description: "", quantityReceived: 1 })}><Plus className="size-4" />Add item</Button>}>
            <div className="flex flex-col gap-4">
              {items.fields.map((item, index) => (
                <div key={item.id} className="grid gap-3 rounded-md border p-3 md:grid-cols-5">
                  <FormFieldWrapper label="PO item"><Controller control={form.control} name={`items.${index}.purchaseOrderItemId`} render={({ field }) => <SelectField value={field.value || NONE} onValueChange={field.onChange} options={orderItemOptions} />} /></FormFieldWrapper>
                  <FormFieldWrapper label="Inventory item"><Controller control={form.control} name={`items.${index}.inventoryItemId`} render={({ field }) => <SelectField value={field.value || NONE} onValueChange={field.onChange} options={inventoryOptions} />} /></FormFieldWrapper>
                  <FormFieldWrapper label="Description"><Input {...form.register(`items.${index}.description`)} /></FormFieldWrapper>
                  <FormFieldWrapper label="Received qty"><Input type="number" min={0} step="0.01" {...form.register(`items.${index}.quantityReceived`, { valueAsNumber: true })} /></FormFieldWrapper>
                  <div className="flex items-end"><Button type="button" variant="destructive" onClick={() => items.remove(index)} disabled={items.fields.length === 1}><Trash2 className="size-4" />Remove</Button></div>
                </div>
              ))}
            </div>
          </DataCard>
          {formError ? <ErrorState title="Unable to save GRN" message={formError} /> : null}
          <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button><Button type="submit" disabled={form.formState.isSubmitting || createGrn.isPending}><Save className="size-4" />Save GRN</Button></div>
        </form>
      </div>
    </PermissionGuard>
  );
}
