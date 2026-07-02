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
import { useEmployees } from "@/features/employees/hooks";
import { leadSchema, type LeadFormValues } from "@/features/sales/schemas";
import { useCreateSalesLead, useLeadSources, useLeadStages, useSalesLead, useUpdateSalesLead } from "@/features/sales/hooks";
import type { SalesLead } from "@/features/sales/types";
import { NONE, toLeadPayload } from "@/features/sales/utils";
import { ApiClientError } from "@/lib/api/client";

export function LeadFormPage({ leadId }: { leadId?: string }) {
  const router = useRouter();
  const isEdit = Boolean(leadId);
  const lead = useSalesLead(leadId ?? "");
  const sources = useLeadSources();
  const stages = useLeadStages();
  const employees = useEmployees({ page: 1, limit: 100, sortBy: "firstName", sortOrder: "asc" });
  const createLead = useCreateSalesLead();
  const updateLead = useUpdateSalesLead(leadId ?? "");
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: defaultValues(),
  });

  useEffect(() => {
    if (lead.data) form.reset(defaultValues(lead.data));
  }, [form, lead.data]);

  const sourceOptions = useMemo(
    () => [{ value: NONE, label: "No source" }, ...(sources.data?.data ?? []).map((source) => ({ value: source.id, label: source.name }))],
    [sources.data?.data],
  );
  const stageOptions = useMemo(
    () => [{ value: NONE, label: "No stage" }, ...(stages.data?.data ?? []).map((stage) => ({ value: stage.id, label: stage.name }))],
    [stages.data?.data],
  );
  const employeeOptions = useMemo(
    () => [{ value: NONE, label: "No owner" }, ...(employees.data?.data ?? []).map((employee) => ({ value: employee.id, label: `${employee.firstName} ${employee.lastName}`.trim() || employee.email }))],
    [employees.data?.data],
  );

  async function onSubmit(values: LeadFormValues) {
    setFormError(null);
    try {
      const payload = toLeadPayload(values);
      const saved = isEdit ? await updateLead.mutateAsync(payload) : await createLead.mutateAsync(payload);
      router.replace(`/sales/leads/${saved.id}`);
    } catch (caught) {
      setFormError(caught instanceof ApiClientError ? caught.message : "Unable to save lead");
    }
  }

  const errorMessage = lead.error instanceof ApiClientError ? lead.error.message : lead.error instanceof Error ? lead.error.message : undefined;

  return (
    <PermissionGuard permission="sales.manage" fallback={<ErrorState title="Permission required" message="You do not have permission to manage leads." />}>
      <div className="flex flex-col gap-6">
        <PageHeader title={isEdit ? "Edit Lead" : "New Lead"} description="Create and maintain sales lead records." />
        {isEdit && lead.isLoading ? <LoadingState rows={6} /> : null}
        {lead.error ? <ErrorState title="Unable to load lead" message={errorMessage} /> : null}
        {(!isEdit || lead.data) && !lead.error ? (
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <DataCard title="Lead Details">
              <div className="grid gap-4 md:grid-cols-2">
                <FormFieldWrapper label="Lead name" htmlFor="name" error={form.formState.errors.name?.message}>
                  <Input id="name" {...form.register("name")} />
                </FormFieldWrapper>
                <FormFieldWrapper label="Company" htmlFor="companyName">
                  <Input id="companyName" {...form.register("companyName")} />
                </FormFieldWrapper>
                <FormFieldWrapper label="Expected value" htmlFor="estimatedValue">
                  <Input id="estimatedValue" type="number" min={0} {...form.register("estimatedValue", { valueAsNumber: true })} />
                </FormFieldWrapper>
                <FormFieldWrapper label="Industry" htmlFor="industry">
                  <Input id="industry" {...form.register("industry")} />
                </FormFieldWrapper>
              </div>
            </DataCard>
            <DataCard title="Contact Details">
              <div className="grid gap-4 md:grid-cols-3">
                <FormFieldWrapper label="Email" htmlFor="email" error={form.formState.errors.email?.message}>
                  <Input id="email" type="email" {...form.register("email")} />
                </FormFieldWrapper>
                <FormFieldWrapper label="Phone" htmlFor="phone">
                  <Input id="phone" {...form.register("phone")} />
                </FormFieldWrapper>
                <FormFieldWrapper label="Website" htmlFor="website" error={form.formState.errors.website?.message}>
                  <Input id="website" placeholder="https://example.com" {...form.register("website")} />
                </FormFieldWrapper>
              </div>
            </DataCard>
            <DataCard title="Source, Stage & Owner">
              <div className="grid gap-4 md:grid-cols-3">
                <FormFieldWrapper label="Source">
                  <Controller control={form.control} name="sourceId" render={({ field }) => <SelectField value={field.value || NONE} onValueChange={field.onChange} options={sourceOptions} />} />
                </FormFieldWrapper>
                <FormFieldWrapper label="Stage">
                  <Controller control={form.control} name="stageId" render={({ field }) => <SelectField value={field.value || NONE} onValueChange={field.onChange} options={stageOptions} />} />
                </FormFieldWrapper>
                <FormFieldWrapper label="Owner">
                  <Controller control={form.control} name="assignedEmployeeId" render={({ field }) => <SelectField value={field.value || NONE} onValueChange={field.onChange} options={employeeOptions} />} />
                </FormFieldWrapper>
              </div>
              <FormFieldWrapper label="Notes" htmlFor="notes">
                <Input id="notes" {...form.register("notes")} />
              </FormFieldWrapper>
            </DataCard>
            {formError ? <ErrorState title="Unable to save lead" message={formError} /> : null}
            <div className="flex items-center justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
              <Button type="submit" disabled={form.formState.isSubmitting || createLead.isPending || updateLead.isPending}>
                <Save className="size-4" />
                {isEdit ? "Update lead" : "Create lead"}
              </Button>
            </div>
          </form>
        ) : null}
      </div>
    </PermissionGuard>
  );
}

function defaultValues(lead?: SalesLead): LeadFormValues {
  return {
    sourceId: lead?.sourceId ?? NONE,
    stageId: lead?.stageId ?? NONE,
    name: lead?.name ?? "",
    companyName: lead?.companyName ?? "",
    email: lead?.email ?? "",
    phone: lead?.phone ?? "",
    website: lead?.website ?? "",
    industry: lead?.industry ?? "",
    estimatedValue: lead?.estimatedValue ? Number(lead.estimatedValue) : undefined,
    assignedEmployeeId: lead?.assignedEmployeeId ?? NONE,
    notes: lead?.notes ?? "",
  };
}
