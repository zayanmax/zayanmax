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
import { StatusBadge } from "@/components/shared/status-badge";
import { useBranches } from "@/features/branches/hooks";
import { useDepartments } from "@/features/departments/hooks";
import { useDesignations } from "@/features/designations/hooks";
import {
  employeeSchema,
  type EmployeeFormValues,
} from "@/features/employees/schemas";
import {
  useCreateEmployee,
  useEmployee,
  useEmployees,
  useUpdateEmployee,
} from "@/features/employees/hooks";
import type { Employee } from "@/features/employees/types";
import { employeeName, toEmployeePayload } from "@/features/employees/utils";
import { ApiClientError } from "@/lib/api/client";

const NONE = "__none__";

const employmentTypeOptions = [
  { value: "FULL_TIME", label: "Full time" },
  { value: "PART_TIME", label: "Part time" },
  { value: "CONTRACT", label: "Contract" },
  { value: "INTERN", label: "Intern" },
];

export function EmployeeFormPage({ employeeId }: { employeeId?: string }) {
  const router = useRouter();
  const isEdit = Boolean(employeeId);
  const permission = isEdit ? "employees.update" : "employees.create";
  const employee = useEmployee(employeeId ?? "");
  const branches = useBranches();
  const departments = useDepartments();
  const designations = useDesignations();
  const managers = useEmployees({ page: 1, limit: 100, sortBy: "firstName", sortOrder: "asc" });
  const createMutation = useCreateEmployee();
  const updateMutation = useUpdateEmployee(employeeId ?? "");
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: defaultValues(),
  });

  useEffect(() => {
    if (employee.data) {
      form.reset(defaultValues(employee.data));
    }
  }, [employee.data, form]);

  const branchOptions = useMemo(
    () => [
      { value: NONE, label: "Unassigned" },
      ...(branches.data ?? []).map((branch) => ({
        value: branch.id,
        label: branch.name,
      })),
    ],
    [branches.data],
  );
  const departmentOptions = useMemo(
    () => [
      { value: NONE, label: "Unassigned" },
      ...(departments.data ?? []).map((department) => ({
        value: department.id,
        label: department.name,
      })),
    ],
    [departments.data],
  );
  const designationOptions = useMemo(
    () => [
      { value: NONE, label: "Unassigned" },
      ...(designations.data ?? []).map((designation) => ({
        value: designation.id,
        label: designation.name,
      })),
    ],
    [designations.data],
  );
  const managerOptions = useMemo(
    () => [
      { value: NONE, label: "Unassigned" },
      ...(managers.data?.data ?? [])
        .filter((manager) => manager.id !== employeeId)
        .map((manager) => ({
          value: manager.id,
          label: `${employeeName(manager)} (${manager.employeeCode})`,
        })),
    ],
    [employeeId, managers.data?.data],
  );

  const isLoading =
    (isEdit && employee.isLoading) ||
    branches.isLoading ||
    departments.isLoading ||
    designations.isLoading;

  const loadError =
    employee.error ?? branches.error ?? departments.error ?? designations.error;

  async function onSubmit(values: EmployeeFormValues) {
    setFormError(null);
    const payload = toEmployeePayload(values);

    try {
      const saved = isEdit
        ? await updateMutation.mutateAsync(payload)
        : await createMutation.mutateAsync(payload);
      router.replace(`/employees/${saved.id}`);
    } catch (caught) {
      setFormError(
        caught instanceof ApiClientError
          ? caught.message
          : "Unable to save employee",
      );
    }
  }

  const errorMessage =
    loadError instanceof ApiClientError
      ? loadError.message
      : loadError instanceof Error
        ? loadError.message
        : undefined;

  return (
    <PermissionGuard
      permission={permission}
      fallback={
        <ErrorState
          title="Permission required"
          message="You do not have permission to manage employees."
        />
      }
    >
      <div className="flex flex-col gap-6">
        <PageHeader
          title={isEdit ? "Edit Employee" : "New Employee"}
          description="Create and maintain core employee profile records."
        />

        {isLoading ? <LoadingState rows={6} /> : null}
        {loadError ? (
          <ErrorState title="Unable to load employee form" message={errorMessage} />
        ) : null}

        {!isLoading && !loadError ? (
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <DataCard title="Basic Details">
              <div className="grid gap-4 md:grid-cols-2">
                <FormFieldWrapper
                  label="Employee code"
                  htmlFor="employeeCode"
                  error={form.formState.errors.employeeCode?.message}
                >
                  <Input id="employeeCode" {...form.register("employeeCode")} />
                </FormFieldWrapper>
                <FormFieldWrapper
                  label="Employment type"
                  error={form.formState.errors.employmentType?.message}
                >
                  <Controller
                    control={form.control}
                    name="employmentType"
                    render={({ field }) => (
                      <SelectField
                        value={field.value}
                        onValueChange={field.onChange}
                        options={employmentTypeOptions}
                      />
                    )}
                  />
                </FormFieldWrapper>
                <FormFieldWrapper
                  label="First name"
                  htmlFor="firstName"
                  error={form.formState.errors.firstName?.message}
                >
                  <Input id="firstName" {...form.register("firstName")} />
                </FormFieldWrapper>
                <FormFieldWrapper
                  label="Last name"
                  htmlFor="lastName"
                  error={form.formState.errors.lastName?.message}
                >
                  <Input id="lastName" {...form.register("lastName")} />
                </FormFieldWrapper>
              </div>
            </DataCard>

            <DataCard title="Contact Details">
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
              </div>
            </DataCard>

            <DataCard title="Department, Branch & Designation">
              <div className="grid gap-4 md:grid-cols-2">
                <SelectController
                  control={form.control}
                  name="branchId"
                  label="Branch"
                  options={branchOptions}
                />
                <SelectController
                  control={form.control}
                  name="departmentId"
                  label="Department"
                  options={departmentOptions}
                />
                <SelectController
                  control={form.control}
                  name="designationId"
                  label="Designation"
                  options={designationOptions}
                />
                <SelectController
                  control={form.control}
                  name="reportingManagerId"
                  label="Reporting manager"
                  options={managerOptions}
                />
              </div>
            </DataCard>

            <DataCard title="Status & Joining Details">
              <div className="grid gap-4 md:grid-cols-2">
                <FormFieldWrapper
                  label="Joining date"
                  htmlFor="joiningDate"
                  error={form.formState.errors.joiningDate?.message}
                >
                  <Input
                    id="joiningDate"
                    type="date"
                    {...form.register("joiningDate")}
                  />
                </FormFieldWrapper>
                <FormFieldWrapper label="Status">
                  <div className="flex h-8 items-center">
                    <StatusBadge status={employee.data?.status ?? "ACTIVE"} />
                  </div>
                </FormFieldWrapper>
              </div>
            </DataCard>

            {formError ? (
              <ErrorState title="Unable to save employee" message={formError} />
            ) : null}

            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
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
                {isEdit ? "Update employee" : "Create employee"}
              </Button>
            </div>
          </form>
        ) : null}
      </div>
    </PermissionGuard>
  );
}

function SelectController({
  control,
  name,
  label,
  options,
}: {
  control: ReturnType<typeof useForm<EmployeeFormValues>>["control"];
  name: keyof EmployeeFormValues;
  label: string;
  options: { value: string; label: string }[];
}) {
  return (
    <FormFieldWrapper label={label}>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <SelectField
            value={field.value || NONE}
            onValueChange={(value) => field.onChange(value === NONE ? "" : value)}
            options={options}
          />
        )}
      />
    </FormFieldWrapper>
  );
}

function defaultValues(employee?: Employee): EmployeeFormValues {
  return {
    employeeCode: employee?.employeeCode ?? "",
    firstName: employee?.firstName ?? "",
    lastName: employee?.lastName ?? "",
    email: employee?.email ?? "",
    phone: employee?.phone ?? "",
    branchId: employee?.branchId ?? "",
    departmentId: employee?.departmentId ?? "",
    designationId: employee?.designationId ?? "",
    reportingManagerId: employee?.reportingManagerId ?? "",
    joiningDate: employee?.joiningDate
      ? employee.joiningDate.slice(0, 10)
      : new Date().toISOString().slice(0, 10),
    employmentType: employee?.employmentType ?? "FULL_TIME",
  };
}
