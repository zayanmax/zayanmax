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
import { assetSchema, assetStatuses, type AssetFormValues } from "@/features/assets/schemas";
import { useAsset, useAssetCategories, useCreateAsset, useUpdateAsset } from "@/features/assets/hooks";
import type { Asset } from "@/features/assets/types";
import { NONE, toAssetPayload, toDateInput } from "@/features/assets/utils";
import { ApiClientError } from "@/lib/api/client";

export function AssetFormPage({ assetId }: { assetId?: string }) {
  const router = useRouter();
  const isEdit = Boolean(assetId);
  const asset = useAsset(assetId ?? "");
  const categories = useAssetCategories({ page: 1, limit: 100, sortBy: "name", sortOrder: "asc" });
  const createAsset = useCreateAsset();
  const updateAsset = useUpdateAsset(assetId ?? "");
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<AssetFormValues>({ resolver: zodResolver(assetSchema), defaultValues: defaultValues() });
  useEffect(() => { if (asset.data) form.reset(defaultValues(asset.data)); }, [asset.data, form]);
  const categoryOptions = useMemo(() => [{ value: NONE, label: "No category" }, ...(categories.data?.data ?? []).map((category) => ({ value: category.id, label: category.name }))], [categories.data?.data]);
  async function onSubmit(values: AssetFormValues) {
    setFormError(null);
    try {
      const saved = isEdit ? await updateAsset.mutateAsync(toAssetPayload(values)) : await createAsset.mutateAsync(toAssetPayload(values));
      router.replace(`/assets/${saved.id}`);
    } catch (caught) {
      setFormError(caught instanceof ApiClientError ? caught.message : "Unable to save asset");
    }
  }
  return (
    <PermissionGuard permission="assets.manage" fallback={<ErrorState title="Permission required" message="You do not have permission to manage assets." />}>
      <div className="flex flex-col gap-6">
        <PageHeader title={isEdit ? "Edit Asset" : "New Asset"} description="Maintain asset tag, serial, category, warranty, and status metadata." />
        {isEdit && asset.isLoading ? <LoadingState rows={6} /> : null}
        {asset.error ? <ErrorState title="Unable to load asset" message={asset.error instanceof Error ? asset.error.message : undefined} /> : null}
        {(!isEdit || asset.data) && !asset.error ? (
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <DataCard title="Asset Details">
              <div className="grid gap-4 md:grid-cols-3">
                <FormFieldWrapper label="Category"><Controller control={form.control} name="assetCategoryId" render={({ field }) => <SelectField value={field.value || NONE} onValueChange={field.onChange} options={categoryOptions} />} /></FormFieldWrapper>
                <FormFieldWrapper label="Name" error={form.formState.errors.name?.message}><Input {...form.register("name")} /></FormFieldWrapper>
                <FormFieldWrapper label="Asset tag" error={form.formState.errors.assetTag?.message}><Input {...form.register("assetTag")} /></FormFieldWrapper>
                <FormFieldWrapper label="Serial number"><Input {...form.register("serialNumber")} /></FormFieldWrapper>
                <FormFieldWrapper label="Purchase date"><Input type="date" {...form.register("purchaseDate")} /></FormFieldWrapper>
                <FormFieldWrapper label="Warranty expiry"><Input type="date" {...form.register("warrantyExpiryDate")} /></FormFieldWrapper>
                <FormFieldWrapper label="Status"><Controller control={form.control} name="status" render={({ field }) => <SelectField value={field.value} onValueChange={field.onChange} options={assetStatuses.map((status) => ({ value: status, label: status.replaceAll("_", " ") }))} />} /></FormFieldWrapper>
                <FormFieldWrapper label="Notes"><Input {...form.register("notes")} /></FormFieldWrapper>
              </div>
            </DataCard>
            {formError ? <ErrorState title="Unable to save asset" message={formError} /> : null}
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button><Button type="submit" disabled={form.formState.isSubmitting || createAsset.isPending || updateAsset.isPending}><Save className="size-4" />Save asset</Button></div>
          </form>
        ) : null}
      </div>
    </PermissionGuard>
  );
}

function defaultValues(asset?: Asset): AssetFormValues {
  return {
    assetCategoryId: asset?.assetCategoryId ?? NONE,
    name: asset?.name ?? "",
    assetTag: asset?.assetTag ?? "",
    serialNumber: asset?.serialNumber ?? "",
    purchaseDate: toDateInput(asset?.purchaseDate),
    warrantyExpiryDate: toDateInput(asset?.warrantyExpiryDate),
    status: asset?.status ?? "AVAILABLE",
    notes: asset?.notes ?? "",
  };
}
