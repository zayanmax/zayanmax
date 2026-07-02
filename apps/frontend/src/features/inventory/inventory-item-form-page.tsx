"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { FormFieldWrapper } from "@/components/forms/form-field-wrapper";
import { SelectField } from "@/components/forms/select-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataCard } from "@/components/shared/data-card";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { PermissionGuard } from "@/components/shared/permission-guard";
import { inventoryItemSchema, type InventoryItemFormValues } from "@/features/inventory/schemas";
import { useCreateInventoryItem, useInventoryCategories, useInventoryItem, useUpdateInventoryItem } from "@/features/inventory/hooks";
import type { InventoryItem } from "@/features/inventory/types";
import { NONE, toInventoryItemPayload } from "@/features/inventory/utils";
import { ApiClientError } from "@/lib/api/client";

export function InventoryItemFormPage({ itemId }: { itemId?: string }) {
  const router = useRouter();
  const isEdit = Boolean(itemId);
  const item = useInventoryItem(itemId ?? "");
  const categories = useInventoryCategories({ page: 1, limit: 100, sortBy: "name", sortOrder: "asc" });
  const createItem = useCreateInventoryItem();
  const updateItem = useUpdateInventoryItem(itemId ?? "");
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<InventoryItemFormValues>({ resolver: zodResolver(inventoryItemSchema), defaultValues: defaultValues() });
  useEffect(() => { if (item.data) form.reset(defaultValues(item.data)); }, [item.data, form]);
  const categoryOptions = useMemo(() => [{ value: NONE, label: "No category" }, ...(categories.data?.data ?? []).map((category) => ({ value: category.id, label: category.name }))], [categories.data?.data]);
  async function onSubmit(values: InventoryItemFormValues) {
    setFormError(null);
    try {
      const saved = isEdit ? await updateItem.mutateAsync(toInventoryItemPayload(values)) : await createItem.mutateAsync(toInventoryItemPayload(values));
      router.replace(`/inventory/items/${saved.id}`);
    } catch (caught) {
      setFormError(caught instanceof ApiClientError ? caught.message : "Unable to save inventory item");
    }
  }
  return (
    <PermissionGuard permission="inventory.manage" fallback={<ErrorState title="Permission required" message="You do not have permission to manage inventory." />}>
      <div className="flex flex-col gap-6">
        <PageHeader title={isEdit ? "Edit Inventory Item" : "New Inventory Item"} description="Maintain SKU, unit, category, and low stock metadata." />
        {isEdit && item.isLoading ? <LoadingState rows={6} /> : null}
        {item.error ? <ErrorState title="Unable to load item" message={item.error instanceof Error ? item.error.message : undefined} /> : null}
        {(!isEdit || item.data) && !item.error ? (
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <DataCard title="Item Details">
              <div className="grid gap-4 md:grid-cols-3">
                <FormFieldWrapper label="Category"><Controller control={form.control} name="inventoryCategoryId" render={({ field }) => <SelectField value={field.value || NONE} onValueChange={field.onChange} options={categoryOptions} />} /></FormFieldWrapper>
                <FormFieldWrapper label="Name" error={form.formState.errors.name?.message}><Input {...form.register("name")} /></FormFieldWrapper>
                <FormFieldWrapper label="Item code" error={form.formState.errors.itemCode?.message}><Input {...form.register("itemCode")} /></FormFieldWrapper>
                <FormFieldWrapper label="SKU"><Input {...form.register("sku")} /></FormFieldWrapper>
                <FormFieldWrapper label="Unit" error={form.formState.errors.unit?.message}><Input {...form.register("unit")} placeholder="pcs, kg, box" /></FormFieldWrapper>
                <FormFieldWrapper label="Low stock threshold"><Input type="number" min={0} step="0.01" {...form.register("lowStockThreshold", { valueAsNumber: true })} /></FormFieldWrapper>
              </div>
            </DataCard>
            {formError ? <ErrorState title="Unable to save item" message={formError} /> : null}
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button><Button type="submit" disabled={form.formState.isSubmitting || createItem.isPending || updateItem.isPending}><Save className="size-4" />Save item</Button></div>
          </form>
        ) : null}
      </div>
    </PermissionGuard>
  );
}

function defaultValues(item?: InventoryItem): InventoryItemFormValues {
  return {
    inventoryCategoryId: item?.inventoryCategoryId ?? NONE,
    name: item?.name ?? "",
    itemCode: item?.itemCode ?? "",
    sku: item?.sku ?? "",
    unit: item?.unit ?? "",
    lowStockThreshold: Number(item?.lowStockThreshold ?? 0),
  };
}
