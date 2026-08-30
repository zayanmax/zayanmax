"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { PaginationControls } from "@/components/data/pagination-controls";
import { SearchFilterBar } from "@/components/data/search-filter-bar";
import { FormFieldWrapper } from "@/components/forms/form-field-wrapper";
import { SelectField } from "@/components/forms/select-field";
import { DataCard } from "@/components/shared/data-card";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCreateSalaryStructure, useSalaryStructures } from "@/features/payroll/hooks";
import { salaryStructureSchema, type SalaryStructureFormValues } from "@/features/payroll/schemas";
import type { SalaryStructure } from "@/features/payroll/types";
import { formatPayrollDate, formatPayrollMoney, payrollErrorMessage } from "@/features/payroll/utils";

const columns: DataTableColumn<SalaryStructure>[] = [
  { key: "name", header: "Structure", render: (row) => <div><p className="font-medium">{row.name}</p><p className="text-xs text-muted-foreground">{row.description || "No description"}</p></div> },
  { key: "components", header: "Components", render: (row) => <div className="flex max-w-xl flex-wrap gap-1.5">{row.components.map((component) => <span key={component.id} className="rounded-full border border-border bg-muted/40 px-2 py-1 text-xs">{component.code} · {component.calculationType === "PERCENTAGE" ? `${Number(component.amount)}%` : formatPayrollMoney(component.amount)}</span>)}</div> },
  { key: "created", header: "Created", render: (row) => formatPayrollDate(row.createdAt) },
];

export function SalaryStructures({ canManage }: { canManage: boolean }) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const query = useSalaryStructures({ page, limit: 10, search: search || undefined, sortBy: "createdAt", sortOrder: "desc" });
  return <DataCard title="Salary structures" description="Components are evaluated by the backend; percentages use monthly gross as their base." action={canManage ? <StructureDialog /> : undefined}>
    <div className="space-y-4">
      <SearchFilterBar value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Search structures" onReset={() => { setSearch(""); setPage(1); }} />
      {query.isLoading ? <LoadingState rows={5} /> : query.error ? <ErrorState title="Unable to load structures" message={payrollErrorMessage(query.error)} onRetry={() => void query.refetch()} /> : <><DataTable columns={columns} rows={query.data?.data ?? []} getRowKey={(row) => row.id} emptyTitle="No salary structures" /><PaginationControls page={page} totalPages={query.data?.meta.totalPages ?? 1} onPageChange={setPage} /></>}
    </div>
  </DataCard>;
}

function StructureDialog() {
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const mutation = useCreateSalaryStructure();
  const form = useForm<SalaryStructureFormValues>({ resolver: zodResolver(salaryStructureSchema), defaultValues: { name: "", description: "", components: [{ name: "Basic pay", code: "BASIC", type: "EARNING", calculationType: "PERCENTAGE", amount: 60, taxable: true }] } });
  const fields = useFieldArray({ control: form.control, name: "components" });
  const watchedComponents = useWatch({ control: form.control, name: "components" });
  async function submit(values: SalaryStructureFormValues) {
    setFormError(null);
    try { await mutation.mutateAsync({ ...values, name: values.name.trim(), description: values.description?.trim() || undefined, components: values.components.map((component) => ({ ...component, name: component.name.trim(), code: component.code.trim().toUpperCase() })) }); setOpen(false); form.reset(); }
    catch (error) { setFormError(payrollErrorMessage(error)); }
  }
  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger render={<Button type="button" />}><Plus className="size-4" />New structure</DialogTrigger>
    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
      <DialogHeader><DialogTitle>Create salary structure</DialogTitle><DialogDescription>Fixed values are currency. Percentage values are calculated from each employee&apos;s monthly gross.</DialogDescription></DialogHeader>
      <form id="salary-structure-form" className="space-y-4" onSubmit={form.handleSubmit(submit)}>
        <div className="grid gap-4 sm:grid-cols-2"><FormFieldWrapper label="Structure name" error={form.formState.errors.name?.message}><Input {...form.register("name")} placeholder="Standard Staff" /></FormFieldWrapper><FormFieldWrapper label="Description"><Textarea {...form.register("description")} placeholder="Who this structure applies to" /></FormFieldWrapper></div>
        <div className="space-y-3"><div className="flex items-center justify-between"><div><p className="text-sm font-medium">Components</p><p className="text-xs text-muted-foreground">Use unique component codes.</p></div><Button type="button" variant="outline" size="sm" onClick={() => fields.append({ name: "", code: "", type: "EARNING", calculationType: "FIXED", amount: 0, taxable: true })}><Plus className="size-4" />Add component</Button></div>
          {fields.fields.map((field, index) => <div key={field.id} className="grid gap-3 rounded-lg border border-border p-3 md:grid-cols-6">
            <FormFieldWrapper label="Name" error={form.formState.errors.components?.[index]?.name?.message}><Input className="md:col-span-2" {...form.register(`components.${index}.name`)} /></FormFieldWrapper>
            <FormFieldWrapper label="Code" error={form.formState.errors.components?.[index]?.code?.message}><Input {...form.register(`components.${index}.code`)} /></FormFieldWrapper>
            <FormFieldWrapper label="Type"><SelectField value={watchedComponents[index]?.type ?? "EARNING"} onValueChange={(value) => form.setValue(`components.${index}.type`, value as "EARNING" | "DEDUCTION")} options={[{ value: "EARNING", label: "Earning" }, { value: "DEDUCTION", label: "Deduction" }]} /></FormFieldWrapper>
            <FormFieldWrapper label="Calculation"><SelectField value={watchedComponents[index]?.calculationType ?? "FIXED"} onValueChange={(value) => form.setValue(`components.${index}.calculationType`, value as "FIXED" | "PERCENTAGE")} options={[{ value: "FIXED", label: "Fixed amount" }, { value: "PERCENTAGE", label: "Percentage (%)" }]} /></FormFieldWrapper>
            <FormFieldWrapper label={watchedComponents[index]?.calculationType === "PERCENTAGE" ? "Percentage (%)" : "Amount"} error={form.formState.errors.components?.[index]?.amount?.message}><Input type="number" step="0.01" {...form.register(`components.${index}.amount`, { valueAsNumber: true })} /></FormFieldWrapper>
            <label className="flex items-center gap-2 text-sm md:col-span-5"><Checkbox checked={watchedComponents[index]?.taxable ?? true} onCheckedChange={(checked) => form.setValue(`components.${index}.taxable`, checked === true)} />Taxable component</label>
            <Button type="button" variant="ghost" size="icon" disabled={fields.fields.length === 1} onClick={() => fields.remove(index)}><Trash2 className="size-4" /><span className="sr-only">Remove component</span></Button>
          </div>)}
        </div>
        {formError ? <ErrorState title="Unable to create structure" message={formError} /> : null}
      </form>
      <DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" form="salary-structure-form" disabled={mutation.isPending}>{mutation.isPending ? "Creating…" : "Create structure"}</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}
