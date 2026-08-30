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
import { Textarea } from "@/components/ui/textarea";
import type { Employee } from "@/features/employees/types";
import { useCreateSalaryAdvance, useSalaryAdvances } from "@/features/payroll/hooks";
import { salaryAdvanceSchema, type SalaryAdvanceFormValues } from "@/features/payroll/schemas";
import type { SalaryAdvance } from "@/features/payroll/types";
import { ALL, formatPayrollDate, formatPayrollMoney, NONE, payrollEmployeeName, payrollErrorMessage } from "@/features/payroll/utils";

const columns: DataTableColumn<SalaryAdvance>[] = [
  { key: "employee", header: "Employee", render: (row) => <div><p className="font-medium">{payrollEmployeeName(row.employee)}</p><p className="text-xs text-muted-foreground">{row.employee?.employeeCode ?? "—"}</p></div> },
  { key: "amount", header: "Original", render: (row) => formatPayrollMoney(row.amount) },
  { key: "installment", header: "Installment", render: (row) => formatPayrollMoney(row.installmentAmount) },
  { key: "recovered", header: "Recovered", render: (row) => formatPayrollMoney(row.paidAmount) },
  { key: "remaining", header: "Remaining", render: (row) => <span className="font-medium">{formatPayrollMoney(row.balanceAmount)}</span> },
  { key: "status", header: "Status", render: (row) => <StatusBadge status={row.status} /> },
  { key: "date", header: "Requested", render: (row) => formatPayrollDate(row.requestedAt) },
];

export function SalaryAdvances({ employees, canManage }: { employees: Employee[]; canManage: boolean }) {
  const [page, setPage] = useState(1); const [employeeId, setEmployeeId] = useState(ALL); const [status, setStatus] = useState(ALL);
  const query = useSalaryAdvances({ page, limit: 10, employeeId: employeeId === ALL ? undefined : employeeId, status: status === ALL ? undefined : status as "ACTIVE" | "SETTLED" | "CANCELLED", sortBy: "requestedAt", sortOrder: "desc" });
  return <DataCard title="Salary advances" description="Draft runs plan installments; balances change only when an approved run is marked paid." action={canManage ? <AdvanceDialog employees={employees} /> : undefined}><div className="space-y-4"><div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-3"><SelectField value={employeeId} onValueChange={(value) => { setEmployeeId(value); setPage(1); }} options={[{ value: ALL, label: "All employees" }, ...employees.map((employee) => ({ value: employee.id, label: `${payrollEmployeeName(employee)} · ${employee.employeeCode}` }))]} className="w-56" /><SelectField value={status} onValueChange={(value) => { setStatus(value); setPage(1); }} options={[{ value: ALL, label: "All statuses" }, { value: "ACTIVE", label: "Active" }, { value: "SETTLED", label: "Settled" }, { value: "CANCELLED", label: "Cancelled" }]} className="w-40" /><Button type="button" variant="outline" onClick={() => { setEmployeeId(ALL); setStatus(ALL); setPage(1); }}><SlidersHorizontal className="size-4" />Reset</Button></div>{query.isLoading ? <LoadingState rows={5} /> : query.error ? <ErrorState title="Unable to load advances" message={payrollErrorMessage(query.error)} onRetry={() => void query.refetch()} /> : <><DataTable columns={columns} rows={query.data?.data ?? []} getRowKey={(row) => row.id} emptyTitle="No salary advances" /><PaginationControls page={page} totalPages={query.data?.meta.totalPages ?? 1} onPageChange={setPage} /></>}</div></DataCard>;
}

function AdvanceDialog({ employees }: { employees: Employee[] }) {
  const [open, setOpen] = useState(false); const [formError, setFormError] = useState<string | null>(null); const mutation = useCreateSalaryAdvance();
  const form = useForm<SalaryAdvanceFormValues>({ resolver: zodResolver(salaryAdvanceSchema), defaultValues: { employeeId: NONE, amount: 0, installmentAmount: 0, notes: "" } });
  const selectedEmployee = useWatch({ control: form.control, name: "employeeId" });
  async function submit(values: SalaryAdvanceFormValues) { setFormError(null); try { await mutation.mutateAsync({ ...values, notes: values.notes?.trim() || undefined }); setOpen(false); form.reset(); } catch (error) { setFormError(payrollErrorMessage(error)); } }
  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger render={<Button type="button" />}><Plus className="size-4" />New advance</DialogTrigger><DialogContent className="sm:max-w-xl"><DialogHeader><DialogTitle>Create salary advance</DialogTitle><DialogDescription>Recovery is capped by the installment, remaining balance, and employee net pay.</DialogDescription></DialogHeader><form id="salary-advance-form" className="grid gap-4 sm:grid-cols-2" onSubmit={form.handleSubmit(submit)}><div className="sm:col-span-2"><FormFieldWrapper label="Employee" error={form.formState.errors.employeeId?.message}><SelectField value={selectedEmployee} onValueChange={(value) => form.setValue("employeeId", value, { shouldValidate: true })} options={[{ value: NONE, label: "Select employee" }, ...employees.map((employee) => ({ value: employee.id, label: `${payrollEmployeeName(employee)} · ${employee.employeeCode}` }))]} /></FormFieldWrapper></div><FormFieldWrapper label="Advance amount" error={form.formState.errors.amount?.message}><Input type="number" step="0.01" {...form.register("amount", { valueAsNumber: true })} /></FormFieldWrapper><FormFieldWrapper label="Installment amount" error={form.formState.errors.installmentAmount?.message}><Input type="number" step="0.01" {...form.register("installmentAmount", { valueAsNumber: true })} /></FormFieldWrapper><div className="sm:col-span-2"><FormFieldWrapper label="Notes"><Textarea {...form.register("notes")} /></FormFieldWrapper></div>{formError ? <div className="sm:col-span-2"><ErrorState title="Unable to create advance" message={formError} /></div> : null}</form><DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" form="salary-advance-form" disabled={mutation.isPending}>{mutation.isPending ? "Creating…" : "Create advance"}</Button></DialogFooter></DialogContent></Dialog>;
}
