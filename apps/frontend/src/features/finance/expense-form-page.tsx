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
import { expenseSchema, type ExpenseFormValues } from "@/features/finance/schemas";
import { useCreateExpense, useExpense, useExpenseCategories, useUpdateExpense } from "@/features/finance/hooks";
import type { ExpenseClaim } from "@/features/finance/types";
import { expenseTotal, formatFinanceMoney, NONE, toDateInput, toExpensePayload } from "@/features/finance/utils";
import { useEmployees } from "@/features/employees/hooks";
import { ApiClientError } from "@/lib/api/client";

export function ExpenseFormPage({ expenseId }: { expenseId?: string }) {
  const router = useRouter();
  const isEdit = Boolean(expenseId);
  const expense = useExpense(expenseId ?? "");
  const employees = useEmployees({ page: 1, limit: 100, sortBy: "firstName", sortOrder: "asc" });
  const categories = useExpenseCategories({ page: 1, limit: 100, sortBy: "name", sortOrder: "asc" });
  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense(expenseId ?? "");
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: defaultValues(),
  });
  const items = useFieldArray({ control: form.control, name: "items" });
  const attachments = useFieldArray({ control: form.control, name: "attachments" });
  const currentValues = useWatch({ control: form.control });
  const displayTotal = expenseTotal({
    ...defaultValues(),
    ...currentValues,
    items: (currentValues.items ?? defaultValues().items) as ExpenseFormValues["items"],
    attachments: (currentValues.attachments ?? defaultValues().attachments) as ExpenseFormValues["attachments"],
  });
  useEffect(() => { if (expense.data) form.reset(defaultValues(expense.data)); }, [expense.data, form]);
  const employeeOptions = useMemo(
    () => [{ value: NONE, label: "No employee" }, ...(employees.data?.data ?? []).map((employee) => ({ value: employee.id, label: `${employee.firstName} ${employee.lastName} (${employee.employeeCode})` }))],
    [employees.data?.data],
  );
  const categoryOptions = useMemo(
    () => [{ value: NONE, label: "No category" }, ...(categories.data?.data ?? []).map((category) => ({ value: category.id, label: category.name }))],
    [categories.data?.data],
  );
  async function onSubmit(values: ExpenseFormValues) {
    setFormError(null);
    try {
      const saved = isEdit
        ? await updateExpense.mutateAsync(toExpensePayload(values))
        : await createExpense.mutateAsync(toExpensePayload(values));
      router.replace(`/finance/expenses/${saved.id}`);
    } catch (caught) {
      setFormError(caught instanceof ApiClientError ? caught.message : "Unable to save expense claim");
    }
  }
  const errorMessage = expense.error instanceof ApiClientError ? expense.error.message : expense.error instanceof Error ? expense.error.message : undefined;
  return (
    <PermissionGuard permission="finance.manage" fallback={<ErrorState title="Permission required" message="You do not have permission to manage expenses." />}>
      <div className="flex flex-col gap-6">
        <PageHeader title={isEdit ? "Edit Expense Claim" : "New Expense Claim"} description="Create or update expense item metadata and attachment metadata only." />
        {isEdit && expense.isLoading ? <LoadingState rows={6} /> : null}
        {expense.error ? <ErrorState title="Unable to load expense" message={errorMessage} /> : null}
        {(!isEdit || expense.data) && !expense.error ? (
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <DataCard title="Claim Details">
              <div className="grid gap-4 md:grid-cols-3">
                <FormFieldWrapper label="Employee"><Controller control={form.control} name="employeeId" render={({ field }) => <SelectField value={field.value || NONE} onValueChange={field.onChange} options={employeeOptions} />} /></FormFieldWrapper>
                <FormFieldWrapper label="Claim date" error={form.formState.errors.claimDate?.message}><Input type="date" {...form.register("claimDate")} /></FormFieldWrapper>
                <FormFieldWrapper label="Title" error={form.formState.errors.title?.message}><Input {...form.register("title")} /></FormFieldWrapper>
              </div>
            </DataCard>
            <DataCard title="Expense Items" description={`Display total: ${formatFinanceMoney(displayTotal)}`} action={<Button type="button" variant="outline" onClick={() => items.append({ expenseCategoryId: NONE, description: "", expenseDate: new Date().toISOString().slice(0, 10), amount: 0, taxAmount: 0 })}><Plus className="size-4" />Add item</Button>}>
              <div className="flex flex-col gap-4">
                {items.fields.map((item, index) => (
                  <div key={item.id} className="grid gap-3 rounded-md border p-3 md:grid-cols-6">
                    <FormFieldWrapper label="Category"><Controller control={form.control} name={`items.${index}.expenseCategoryId`} render={({ field }) => <SelectField value={field.value || NONE} onValueChange={field.onChange} options={categoryOptions} />} /></FormFieldWrapper>
                    <FormFieldWrapper label="Description" error={form.formState.errors.items?.[index]?.description?.message}><Input {...form.register(`items.${index}.description`)} /></FormFieldWrapper>
                    <FormFieldWrapper label="Date"><Input type="date" {...form.register(`items.${index}.expenseDate`)} /></FormFieldWrapper>
                    <FormFieldWrapper label="Amount"><Input type="number" min={0} {...form.register(`items.${index}.amount`, { valueAsNumber: true })} /></FormFieldWrapper>
                    <FormFieldWrapper label="Tax"><Input type="number" min={0} {...form.register(`items.${index}.taxAmount`, { valueAsNumber: true })} /></FormFieldWrapper>
                    <div className="flex items-end"><Button type="button" variant="destructive" onClick={() => items.remove(index)} disabled={items.fields.length === 1}><Trash2 className="size-4" />Remove</Button></div>
                  </div>
                ))}
              </div>
            </DataCard>
            <DataCard title="Attachment Metadata" description="Metadata only. No binary upload is performed." action={<Button type="button" variant="outline" onClick={() => attachments.append({ fileName: "", storageKey: "", mimeType: "", size: 1 })}><Plus className="size-4" />Add metadata</Button>}>
              <div className="flex flex-col gap-4">
                {attachments.fields.length ? attachments.fields.map((attachment, index) => (
                  <div key={attachment.id} className="grid gap-3 rounded-md border p-3 md:grid-cols-5">
                    <FormFieldWrapper label="File name"><Input {...form.register(`attachments.${index}.fileName`)} /></FormFieldWrapper>
                    <FormFieldWrapper label="Storage key"><Input {...form.register(`attachments.${index}.storageKey`)} /></FormFieldWrapper>
                    <FormFieldWrapper label="MIME type"><Input {...form.register(`attachments.${index}.mimeType`)} /></FormFieldWrapper>
                    <FormFieldWrapper label="Size"><Input type="number" min={1} {...form.register(`attachments.${index}.size`, { valueAsNumber: true })} /></FormFieldWrapper>
                    <div className="flex items-end"><Button type="button" variant="destructive" onClick={() => attachments.remove(index)}><Trash2 className="size-4" />Remove</Button></div>
                  </div>
                )) : <p className="text-sm text-muted-foreground">No attachment metadata added.</p>}
              </div>
            </DataCard>
            {formError ? <ErrorState title="Unable to save expense claim" message={formError} /> : null}
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button><Button type="submit" disabled={form.formState.isSubmitting || createExpense.isPending || updateExpense.isPending}><Save className="size-4" />Save expense</Button></div>
          </form>
        ) : null}
      </div>
    </PermissionGuard>
  );
}

function defaultValues(expense?: ExpenseClaim): ExpenseFormValues {
  return {
    employeeId: expense?.employeeId ?? NONE,
    claimDate: toDateInput(expense?.claimDate ?? new Date().toISOString()),
    title: expense?.title ?? "",
    items: expense?.items?.length
      ? expense.items.map((item) => ({
          expenseCategoryId: item.expenseCategoryId ?? NONE,
          description: item.description,
          expenseDate: toDateInput(item.expenseDate),
          amount: Number(item.amount ?? 0),
          taxAmount: Number(item.taxAmount ?? 0),
        }))
      : [{ expenseCategoryId: NONE, description: "", expenseDate: new Date().toISOString().slice(0, 10), amount: 0, taxAmount: 0 }],
    attachments: expense?.attachments?.map((attachment) => ({
      fileName: attachment.fileName,
      storageKey: attachment.storageKey,
      mimeType: attachment.mimeType,
      size: attachment.size,
    })) ?? [],
  };
}
