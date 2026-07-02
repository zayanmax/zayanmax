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
import { useClients } from "@/features/clients/hooks";
import { useEmployees } from "@/features/employees/hooks";
import { opportunitySchema, type OpportunityFormValues } from "@/features/sales/schemas";
import { useCreateSalesOpportunity, useSalesLeads, useSalesOpportunity, useUpdateSalesOpportunity } from "@/features/sales/hooks";
import type { SalesOpportunity } from "@/features/sales/types";
import { NONE, toDateInput, toOpportunityPayload } from "@/features/sales/utils";
import { ApiClientError } from "@/lib/api/client";

export function OpportunityFormPage({ opportunityId }: { opportunityId?: string }) {
  const router = useRouter();
  const isEdit = Boolean(opportunityId);
  const opportunity = useSalesOpportunity(opportunityId ?? "");
  const leads = useSalesLeads({ page: 1, limit: 100, sortBy: "name", sortOrder: "asc" });
  const clients = useClients({ page: 1, limit: 100, sortBy: "name", sortOrder: "asc" });
  const employees = useEmployees({ page: 1, limit: 100, sortBy: "firstName", sortOrder: "asc" });
  const createOpportunity = useCreateSalesOpportunity();
  const updateOpportunity = useUpdateSalesOpportunity(opportunityId ?? "");
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<OpportunityFormValues>({ resolver: zodResolver(opportunitySchema), defaultValues: defaultValues() });
  useEffect(() => { if (opportunity.data) form.reset(defaultValues(opportunity.data)); }, [form, opportunity.data]);

  const leadOptions = useMemo(() => [{ value: NONE, label: "No lead" }, ...(leads.data?.data ?? []).map((lead) => ({ value: lead.id, label: lead.name }))], [leads.data?.data]);
  const clientOptions = useMemo(() => [{ value: NONE, label: "No client" }, ...(clients.data?.data ?? []).map((client) => ({ value: client.id, label: client.name }))], [clients.data?.data]);
  const employeeOptions = useMemo(() => [{ value: NONE, label: "No owner" }, ...(employees.data?.data ?? []).map((employee) => ({ value: employee.id, label: `${employee.firstName} ${employee.lastName}`.trim() || employee.email }))], [employees.data?.data]);

  async function onSubmit(values: OpportunityFormValues) {
    setFormError(null);
    try {
      const payload = toOpportunityPayload(values);
      const saved = isEdit ? await updateOpportunity.mutateAsync(payload) : await createOpportunity.mutateAsync(payload);
      router.replace(`/sales/opportunities/${saved.id}`);
    } catch (caught) {
      setFormError(caught instanceof ApiClientError ? caught.message : "Unable to save opportunity");
    }
  }
  const errorMessage = opportunity.error instanceof ApiClientError ? opportunity.error.message : opportunity.error instanceof Error ? opportunity.error.message : undefined;
  return (
    <PermissionGuard permission="sales.manage" fallback={<ErrorState title="Permission required" message="You do not have permission to manage opportunities." />}>
      <div className="flex flex-col gap-6">
        <PageHeader title={isEdit ? "Edit Opportunity" : "New Opportunity"} description="Create and maintain sales opportunities." />
        {isEdit && opportunity.isLoading ? <LoadingState rows={6} /> : null}
        {opportunity.error ? <ErrorState title="Unable to load opportunity" message={errorMessage} /> : null}
        {(!isEdit || opportunity.data) && !opportunity.error ? (
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <DataCard title="Opportunity Details">
              <div className="grid gap-4 md:grid-cols-2">
                <FormFieldWrapper label="Opportunity name" htmlFor="name" error={form.formState.errors.name?.message}><Input id="name" {...form.register("name")} /></FormFieldWrapper>
                <FormFieldWrapper label="Stage ID" htmlFor="stageId" description="Opportunity stage list endpoint is not available yet."><Input id="stageId" {...form.register("stageId")} /></FormFieldWrapper>
                <FormFieldWrapper label="Lead"><Controller control={form.control} name="leadId" render={({ field }) => <SelectField value={field.value || NONE} onValueChange={field.onChange} options={leadOptions} />} /></FormFieldWrapper>
                <FormFieldWrapper label="Client"><Controller control={form.control} name="clientId" render={({ field }) => <SelectField value={field.value || NONE} onValueChange={field.onChange} options={clientOptions} />} /></FormFieldWrapper>
                <FormFieldWrapper label="Expected value" htmlFor="expectedValue"><Input id="expectedValue" type="number" min={0} {...form.register("expectedValue", { valueAsNumber: true })} /></FormFieldWrapper>
                <FormFieldWrapper label="Probability" htmlFor="probability"><Input id="probability" type="number" min={0} max={100} {...form.register("probability", { valueAsNumber: true })} /></FormFieldWrapper>
                <FormFieldWrapper label="Expected close date" htmlFor="expectedCloseDate"><Input id="expectedCloseDate" type="date" {...form.register("expectedCloseDate")} /></FormFieldWrapper>
                <FormFieldWrapper label="Owner"><Controller control={form.control} name="assignedEmployeeId" render={({ field }) => <SelectField value={field.value || NONE} onValueChange={field.onChange} options={employeeOptions} />} /></FormFieldWrapper>
              </div>
              <FormFieldWrapper label="Description" htmlFor="description"><Input id="description" {...form.register("description")} /></FormFieldWrapper>
            </DataCard>
            {formError ? <ErrorState title="Unable to save opportunity" message={formError} /> : null}
            <div className="flex items-center justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
              <Button type="submit" disabled={form.formState.isSubmitting || createOpportunity.isPending || updateOpportunity.isPending}><Save className="size-4" />{isEdit ? "Update opportunity" : "Create opportunity"}</Button>
            </div>
          </form>
        ) : null}
      </div>
    </PermissionGuard>
  );
}

function defaultValues(opportunity?: SalesOpportunity): OpportunityFormValues {
  return {
    leadId: opportunity?.leadId ?? NONE,
    clientId: opportunity?.clientId ?? NONE,
    stageId: opportunity?.stageId ?? "",
    name: opportunity?.name ?? "",
    description: opportunity?.description ?? "",
    expectedValue: opportunity?.expectedValue ? Number(opportunity.expectedValue) : undefined,
    probability: opportunity?.probability ?? undefined,
    expectedCloseDate: toDateInput(opportunity?.expectedCloseDate),
    assignedEmployeeId: opportunity?.assignedEmployeeId ?? NONE,
  };
}
