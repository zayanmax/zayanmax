"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { PaginationControls } from "@/components/data/pagination-controls";
import { FormFieldWrapper } from "@/components/forms/form-field-wrapper";
import { SelectField } from "@/components/forms/select-field";
import { DataCard } from "@/components/shared/data-card";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { Employee } from "@/features/employees/types";
import { useCreateSalaryAssignment, useSalaryAssignments } from "@/features/payroll/hooks";
import { salaryAssignmentSchema, type SalaryAssignmentFormValues } from "@/features/payroll/schemas";
import type { SalaryAssignment, SalaryStructure } from "@/features/payroll/types";
import { ALL, formatPayrollDate, formatPayrollMoney, NONE, payrollEmployeeName, payrollErrorMessage } from "@/features/payroll/utils";

export function SalaryAssignments({ employees, structures, canManage }: { employees: Employee[]; structures: SalaryStructure[]; canManage: boolean }) {
  const [page, setPage] = useState(1);
  const [employeeId, setEmployeeId] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const query = useSalaryAssignments({ page, limit: 10, employeeId: employeeId === ALL ? undefined : employeeId, status: status === ALL ? undefined : status as "ACTIVE" | "INACTIVE", sortBy: "effectiveFrom", sortOrder: "desc" });
  const columns: DataTableColumn<SalaryAssignment>[] = [
    { key: "employee", header: "Employee", render: (row) => <div><p className="font-medium">{payrollEmployeeName(row.employee)}</p><p className="text-xs text-muted-foreground">{row.employee?.employeeCode ?? "—"}</p></div> },
    { key: "structure", header: "Structure", render: (row) => row.salaryStructure?.name ?? "—" },
    { key: "gross", header: "Monthly gross", render: (row) => <span className="font-medium tabular-nums">{formatPayrollMoney(row.monthlyGross)}</span> },
    { key: "dates", header: "Effective range", render: (row) => <span>{formatPayrollDate(row.effectiveFrom)} – {formatPayrollDate(row.effectiveTo)}</span> },
    { key: "status", header: "Status", render: (row) => <StatusBadge status={row.status} /> },
  ];
  return <DataCard title="Salary assignments" description="One non-overlapping active salary range is allowed per employee." action={canManage ? <AssignmentDialog employees={employees} structures={structures} /> : undefined}>
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-3"><SelectField value={employeeId} onValueChange={(value) => { setEmployeeId(value); setPage(1); }} options={[{ value: ALL, label: "All employees" }, ...employees.map((employee) => ({ value: employee.id, label: `${payrollEmployeeName(employee)} · ${employee.employeeCode}` }))]} className="w-56" /><SelectField value={status} onValueChange={(value) => { setStatus(value); setPage(1); }} options={[{ value: ALL, label: "All statuses" }, { value: "ACTIVE", label: "Active" }, { value: "INACTIVE", label: "Inactive" }]} className="w-40" /><Button type="button" variant="outline" onClick={() => { setEmployeeId(ALL); setStatus(ALL); setPage(1); }}><SlidersHorizontal className="size-4" />Reset</Button></div>
      {query.isLoading ? <LoadingState rows={5} /> : query.error ? <ErrorState title="Unable to load assignments" message={payrollErrorMessage(query.error)} onRetry={() => void query.refetch()} /> : <><DataTable columns={columns} rows={query.data?.data ?? []} getRowKey={(row) => row.id} emptyTitle="No salary assignments" /><PaginationControls page={page} totalPages={query.data?.meta.totalPages ?? 1} onPageChange={setPage} /></>}
    </div>
  </DataCard>;
}

function AssignmentDialog({ employees, structures }: { employees: Employee[]; structures: SalaryStructure[] }) {
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const mutation = useCreateSalaryAssignment();
  const form = useForm<SalaryAssignmentFormValues>({ resolver: zodResolver(salaryAssignmentSchema), defaultValues: { employeeId: NONE, salaryStructureId: NONE, effectiveFrom: new Date().toISOString().slice(0, 10), effectiveTo: "", monthlyGross: 0 } });
  const selectedEmployee = useWatch({ control: form.control, name: "employeeId" });
  const selectedStructure = useWatch({ control: form.control, name: "salaryStructureId" });
  async function submit(values: SalaryAssignmentFormValues) { setFormError(null); try { await mutation.mutateAsync({ ...values, effectiveTo: values.effectiveTo || undefined }); setOpen(false); form.reset(); } catch (error) { setFormError(payrollErrorMessage(error)); } }
  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger render={<Button type="button" />}><Plus className="size-4" />Assign salary</DialogTrigger><DialogContent className="sm:max-w-xl"><DialogHeader><DialogTitle>Assign salary</DialogTitle><DialogDescription>The backend rejects overlapping active ranges and foreign-company references.</DialogDescription></DialogHeader><form id="salary-assignment-form" className="grid gap-4 sm:grid-cols-2" onSubmit={form.handleSubmit(submit)}>
    <FormFieldWrapper label="Employee" error={form.formState.errors.employeeId?.message}><SelectField value={selectedEmployee} onValueChange={(value) => form.setValue("employeeId", value, { shouldValidate: true })} options={[{ value: NONE, label: "Select employee" }, ...employees.map((employee) => ({ value: employee.id, label: `${payrollEmployeeName(employee)} · ${employee.employeeCode}` }))]} /></FormFieldWrapper>
    <FormFieldWrapper label="Salary structure" error={form.formState.errors.salaryStructureId?.message}><SelectField value={selectedStructure} onValueChange={(value) => form.setValue("salaryStructureId", value, { shouldValidate: true })} options={[{ value: NONE, label: "Select structure" }, ...structures.map((structure) => ({ value: structure.id, label: structure.name }))]} /></FormFieldWrapper>
    <FormFieldWrapper label="Monthly gross" error={form.formState.errors.monthlyGross?.message}><Input type="number" step="0.01" {...form.register("monthlyGross", { valueAsNumber: true })} /></FormFieldWrapper>
    <FormFieldWrapper label="Effective from" error={form.formState.errors.effectiveFrom?.message}><Input type="date" {...form.register("effectiveFrom")} /></FormFieldWrapper>
    <FormFieldWrapper label="Effective to" error={form.formState.errors.effectiveTo?.message}><Input type="date" {...form.register("effectiveTo")} /></FormFieldWrapper>
    {formError ? <div className="sm:col-span-2"><ErrorState title="Unable to assign salary" message={formError} /></div> : null}
  </form><DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" form="salary-assignment-form" disabled={mutation.isPending}>{mutation.isPending ? "Assigning…" : "Create assignment"}</Button></DialogFooter></DialogContent></Dialog>;
}
