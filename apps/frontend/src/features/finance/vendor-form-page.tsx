"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { FormFieldWrapper } from "@/components/forms/form-field-wrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataCard } from "@/components/shared/data-card";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { PermissionGuard } from "@/components/shared/permission-guard";
import { vendorSchema, type VendorFormValues } from "@/features/finance/schemas";
import { useCreateVendor, useUpdateVendor, useVendor } from "@/features/finance/hooks";
import type { Vendor } from "@/features/finance/types";
import { toVendorPayload } from "@/features/finance/utils";
import { ApiClientError } from "@/lib/api/client";

export function VendorFormPage({ vendorId }: { vendorId?: string }) {
  const router = useRouter();
  const isEdit = Boolean(vendorId);
  const vendor = useVendor(vendorId ?? "");
  const createVendor = useCreateVendor();
  const updateVendor = useUpdateVendor(vendorId ?? "");
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<VendorFormValues>({
    resolver: zodResolver(vendorSchema),
    defaultValues: defaultValues(),
  });
  useEffect(() => { if (vendor.data) form.reset(defaultValues(vendor.data)); }, [vendor.data, form]);
  async function onSubmit(values: VendorFormValues) {
    setFormError(null);
    try {
      const saved = isEdit
        ? await updateVendor.mutateAsync(toVendorPayload(values))
        : await createVendor.mutateAsync(toVendorPayload(values));
      router.replace(`/finance/vendors/${saved.id}`);
    } catch (caught) {
      setFormError(caught instanceof ApiClientError ? caught.message : "Unable to save vendor");
    }
  }
  const errorMessage = vendor.error instanceof ApiClientError ? vendor.error.message : vendor.error instanceof Error ? vendor.error.message : undefined;
  return (
    <PermissionGuard permission="vendors.manage" fallback={<ErrorState title="Permission required" message="You do not have permission to manage vendors." />}>
      <div className="flex flex-col gap-6">
        <PageHeader title={isEdit ? "Edit Vendor" : "New Vendor"} description="Vendor profile, contact, tax, and address metadata." />
        {isEdit && vendor.isLoading ? <LoadingState rows={6} /> : null}
        {vendor.error ? <ErrorState title="Unable to load vendor" message={errorMessage} /> : null}
        {(!isEdit || vendor.data) && !vendor.error ? (
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <DataCard title="Vendor Details">
              <div className="grid gap-4 md:grid-cols-2">
                <FormFieldWrapper label="Vendor name" error={form.formState.errors.name?.message}><Input {...form.register("name")} /></FormFieldWrapper>
                <FormFieldWrapper label="Email" error={form.formState.errors.email?.message}><Input type="email" {...form.register("email")} /></FormFieldWrapper>
                <FormFieldWrapper label="Phone"><Input {...form.register("phone")} /></FormFieldWrapper>
                <FormFieldWrapper label="GSTIN / Tax ID"><Input {...form.register("gstin")} /></FormFieldWrapper>
              </div>
              <FormFieldWrapper label="Address"><Input {...form.register("address")} /></FormFieldWrapper>
            </DataCard>
            {formError ? <ErrorState title="Unable to save vendor" message={formError} /> : null}
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button><Button type="submit" disabled={form.formState.isSubmitting || createVendor.isPending || updateVendor.isPending}><Save className="size-4" />Save vendor</Button></div>
          </form>
        ) : null}
      </div>
    </PermissionGuard>
  );
}

function defaultValues(vendor?: Vendor): VendorFormValues {
  return {
    name: vendor?.name ?? "",
    email: vendor?.email ?? "",
    phone: vendor?.phone ?? "",
    gstin: vendor?.gstin ?? "",
    address: vendor?.address ?? "",
  };
}
