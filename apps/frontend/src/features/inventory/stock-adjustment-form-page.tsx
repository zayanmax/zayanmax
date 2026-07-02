"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { FormFieldWrapper } from "@/components/forms/form-field-wrapper";
import { SelectField } from "@/components/forms/select-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataCard } from "@/components/shared/data-card";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { PermissionGuard } from "@/components/shared/permission-guard";
import { stockAdjustmentSchema, type StockAdjustmentFormValues } from "@/features/inventory/schemas";
import { useCreateStockAdjustment, useInventoryItems } from "@/features/inventory/hooks";
import { toStockAdjustmentPayload } from "@/features/inventory/utils";
import { ApiClientError } from "@/lib/api/client";

export function StockAdjustmentFormPage() {
  const router = useRouter();
  const items = useInventoryItems({ page: 1, limit: 100, sortBy: "name", sortOrder: "asc" });
  const createAdjustment = useCreateStockAdjustment();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<StockAdjustmentFormValues>({ resolver: zodResolver(stockAdjustmentSchema), defaultValues: { inventoryItemId: "", quantity: 0, movementDate: new Date().toISOString().slice(0, 10), reason: "" } });
  const itemOptions = useMemo(() => (items.data?.data ?? []).map((item) => ({ value: item.id, label: `${item.name} (${item.itemCode})` })), [items.data?.data]);
  async function onSubmit(values: StockAdjustmentFormValues) {
    setFormError(null);
    try {
      await createAdjustment.mutateAsync(toStockAdjustmentPayload(values));
      router.replace("/inventory/stock-movements");
    } catch (caught) {
      setFormError(caught instanceof ApiClientError ? caught.message : "Unable to record adjustment");
    }
  }
  return (
    <PermissionGuard permission="inventory.manage" fallback={<ErrorState title="Permission required" message="You do not have permission to adjust stock." />}>
      <div className="flex flex-col gap-6">
        <PageHeader title="New Stock Adjustment" description="Record a positive or negative stock adjustment with a reason." />
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <DataCard title="Adjustment Details">
            <div className="grid gap-4 md:grid-cols-2">
              <FormFieldWrapper label="Inventory item" error={form.formState.errors.inventoryItemId?.message}><Controller control={form.control} name="inventoryItemId" render={({ field }) => <SelectField value={field.value} onValueChange={field.onChange} options={itemOptions} />} /></FormFieldWrapper>
              <FormFieldWrapper label="Movement date" error={form.formState.errors.movementDate?.message}><Input type="date" {...form.register("movementDate")} /></FormFieldWrapper>
              <FormFieldWrapper label="Quantity adjustment" error={form.formState.errors.quantity?.message}><Input type="number" step="0.01" {...form.register("quantity", { valueAsNumber: true })} /></FormFieldWrapper>
              <FormFieldWrapper label="Reason" error={form.formState.errors.reason?.message}><Input {...form.register("reason")} /></FormFieldWrapper>
            </div>
          </DataCard>
          {formError ? <ErrorState title="Unable to save adjustment" message={formError} /> : null}
          <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button><Button type="submit" disabled={form.formState.isSubmitting || createAdjustment.isPending}><Save className="size-4" />Save adjustment</Button></div>
        </form>
      </div>
    </PermissionGuard>
  );
}
