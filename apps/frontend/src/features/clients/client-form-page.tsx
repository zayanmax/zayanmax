"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
import {
  clientSchema,
  type ClientFormValues,
} from "@/features/clients/schemas";
import {
  useClient,
  useCreateClient,
  useUpdateClient,
} from "@/features/clients/hooks";
import type { Client } from "@/features/clients/types";
import { toClientPayload } from "@/features/clients/utils";
import { ApiClientError } from "@/lib/api/client";

const typeOptions = [
  { value: "COMPANY", label: "Company" },
  { value: "INDIVIDUAL", label: "Individual" },
];

const statusOptions = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "PROSPECT", label: "Prospect" },
  { value: "ARCHIVED", label: "Archived" },
];

export function ClientFormPage({ clientId }: { clientId?: string }) {
  const router = useRouter();
  const isEdit = Boolean(clientId);
  const permission = isEdit ? "clients.update" : "clients.create";
  const client = useClient(clientId ?? "");
  const createMutation = useCreateClient();
  const updateMutation = useUpdateClient(clientId ?? "");
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: defaultValues(),
  });

  useEffect(() => {
    if (client.data) form.reset(defaultValues(client.data));
  }, [client.data, form]);

  async function onSubmit(values: ClientFormValues) {
    setFormError(null);
    try {
      const payload = toClientPayload(values);
      const saved = isEdit
        ? await updateMutation.mutateAsync(payload)
        : await createMutation.mutateAsync(payload);
      router.replace(`/clients/${saved.id}`);
    } catch (caught) {
      setFormError(
        caught instanceof ApiClientError
          ? caught.message
          : "Unable to save client",
      );
    }
  }

  const errorMessage =
    client.error instanceof ApiClientError
      ? client.error.message
      : client.error instanceof Error
        ? client.error.message
        : undefined;

  return (
    <PermissionGuard
      permission={permission}
      fallback={
        <ErrorState
          title="Permission required"
          message="You do not have permission to manage clients."
        />
      }
    >
      <div className="flex flex-col gap-6">
        <PageHeader
          title={isEdit ? "Edit Client" : "New Client"}
          description="Create and maintain CRM client profile records."
        />

        {isEdit && client.isLoading ? <LoadingState rows={6} /> : null}
        {client.error ? (
          <ErrorState title="Unable to load client" message={errorMessage} />
        ) : null}

        {(!isEdit || client.data) && !client.error ? (
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <DataCard title="Basic Client Details">
              <div className="grid gap-4 md:grid-cols-2">
                <FormFieldWrapper
                  label="Client name"
                  htmlFor="name"
                  error={form.formState.errors.name?.message}
                >
                  <Input id="name" {...form.register("name")} />
                </FormFieldWrapper>
                <FormFieldWrapper
                  label="Type"
                  error={form.formState.errors.type?.message}
                >
                  <Controller
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <SelectField
                        value={field.value}
                        onValueChange={field.onChange}
                        options={typeOptions}
                      />
                    )}
                  />
                </FormFieldWrapper>
                <FormFieldWrapper
                  label="Status"
                  error={form.formState.errors.status?.message}
                >
                  <Controller
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <SelectField
                        value={field.value}
                        onValueChange={field.onChange}
                        options={statusOptions}
                      />
                    )}
                  />
                </FormFieldWrapper>
                <FormFieldWrapper
                  label="Owner user ID"
                  htmlFor="ownerId"
                  error={form.formState.errors.ownerId?.message}
                  description="Optional backend user ID for ownership."
                >
                  <Input id="ownerId" {...form.register("ownerId")} />
                </FormFieldWrapper>
              </div>
            </DataCard>

            <DataCard title="Contact & Business Details">
              <div className="grid gap-4 md:grid-cols-2">
                <FormFieldWrapper
                  label="Email"
                  htmlFor="email"
                  error={form.formState.errors.email?.message}
                >
                  <Input id="email" type="email" {...form.register("email")} />
                </FormFieldWrapper>
                <FormFieldWrapper
                  label="Phone"
                  htmlFor="phone"
                  error={form.formState.errors.phone?.message}
                >
                  <Input id="phone" {...form.register("phone")} />
                </FormFieldWrapper>
                <FormFieldWrapper
                  label="Website"
                  htmlFor="website"
                  error={form.formState.errors.website?.message}
                >
                  <Input id="website" placeholder="https://example.com" {...form.register("website")} />
                </FormFieldWrapper>
                <FormFieldWrapper
                  label="Industry"
                  htmlFor="industry"
                  error={form.formState.errors.industry?.message}
                >
                  <Input id="industry" {...form.register("industry")} />
                </FormFieldWrapper>
                <FormFieldWrapper
                  label="Company size"
                  htmlFor="companySize"
                  error={form.formState.errors.companySize?.message}
                >
                  <Input id="companySize" {...form.register("companySize")} />
                </FormFieldWrapper>
                <FormFieldWrapper
                  label="Tax number"
                  htmlFor="taxNumber"
                  error={form.formState.errors.taxNumber?.message}
                >
                  <Input id="taxNumber" {...form.register("taxNumber")} />
                </FormFieldWrapper>
              </div>
            </DataCard>

            <DataCard title="Address & Location Details">
              <FormFieldWrapper
                label="Billing address"
                htmlFor="billingAddress"
                error={form.formState.errors.billingAddress?.message}
              >
                <Input id="billingAddress" {...form.register("billingAddress")} />
              </FormFieldWrapper>
            </DataCard>

            {formError ? (
              <ErrorState title="Unable to save client" message={formError} />
            ) : null}

            <div className="flex items-center justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  form.formState.isSubmitting ||
                  createMutation.isPending ||
                  updateMutation.isPending
                }
              >
                <Save className="size-4" />
                {isEdit ? "Update client" : "Create client"}
              </Button>
            </div>
          </form>
        ) : null}
      </div>
    </PermissionGuard>
  );
}

function defaultValues(client?: Client): ClientFormValues {
  return {
    type: client?.type ?? "COMPANY",
    name: client?.name ?? "",
    email: client?.email ?? "",
    phone: client?.phone ?? "",
    website: client?.website ?? "",
    industry: client?.industry ?? "",
    companySize: client?.companySize ?? "",
    taxNumber: client?.taxNumber ?? "",
    billingAddress: client?.billingAddress ?? "",
    status: client?.status ?? "ACTIVE",
    ownerId: client?.ownerId ?? "",
  };
}
