"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { PaginationControls } from "@/components/data/pagination-controls";
import { SearchFilterBar } from "@/components/data/search-filter-bar";
import { FormFieldWrapper } from "@/components/forms/form-field-wrapper";
import { DataCard } from "@/components/shared/data-card";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useCreatePayrollPeriod, usePayrollPeriods } from "@/features/payroll/hooks";
import { payrollPeriodSchema, type PayrollPeriodFormValues } from "@/features/payroll/schemas";
import type { PayrollPeriod } from "@/features/payroll/types";
import { formatPayrollDate, payrollErrorMessage } from "@/features/payroll/utils";

const columns: DataTableColumn<PayrollPeriod>[] = [
  { key: "name", header: "Period", render: (row) => <span className="font-medium">{row.name}</span> },
  { key: "start", header: "Start", render: (row) => formatPayrollDate(row.startDate) },
  { key: "end", header: "End", render: (row) => formatPayrollDate(row.endDate) },
  { key: "pay", header: "Pay date", render: (row) => formatPayrollDate(row.payDate) },
  { key: "created", header: "Created", render: (row) => formatPayrollDate(row.createdAt) },
];

export function PayrollPeriods({ canManage }: { canManage: boolean }) {
  const [page, setPage] = useState(1); const [search, setSearch] = useState(""); const query = usePayrollPeriods({ page, limit: 10, search: search || undefined, sortBy: "startDate", sortOrder: "desc" });
  return <DataCard title="Payroll periods" description="Periods cannot overlap; the optional pay date must be on or after the period end." action={canManage ? <PeriodDialog /> : undefined}><div className="space-y-4"><SearchFilterBar value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Search payroll periods" onReset={() => { setSearch(""); setPage(1); }} />{query.isLoading ? <LoadingState rows={5} /> : query.error ? <ErrorState title="Unable to load periods" message={payrollErrorMessage(query.error)} onRetry={() => void query.refetch()} /> : <><DataTable columns={columns} rows={query.data?.data ?? []} getRowKey={(row) => row.id} emptyTitle="No payroll periods" /><PaginationControls page={page} totalPages={query.data?.meta.totalPages ?? 1} onPageChange={setPage} /></>}</div></DataCard>;
}

function PeriodDialog() {
  const [open, setOpen] = useState(false); const [formError, setFormError] = useState<string | null>(null); const mutation = useCreatePayrollPeriod(); const today = new Date().toISOString().slice(0, 10);
  const form = useForm<PayrollPeriodFormValues>({ resolver: zodResolver(payrollPeriodSchema), defaultValues: { name: "", startDate: today, endDate: today, payDate: "" } });
  async function submit(values: PayrollPeriodFormValues) { setFormError(null); try { await mutation.mutateAsync({ ...values, name: values.name.trim(), payDate: values.payDate || undefined }); setOpen(false); form.reset(); } catch (error) { setFormError(payrollErrorMessage(error)); } }
  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger render={<Button type="button" />}><Plus className="size-4" />New period</DialogTrigger><DialogContent className="sm:max-w-xl"><DialogHeader><DialogTitle>Create payroll period</DialogTitle><DialogDescription>Payroll v1 supports custom, non-overlapping inclusive calendar periods.</DialogDescription></DialogHeader><form id="payroll-period-form" className="grid gap-4 sm:grid-cols-2" onSubmit={form.handleSubmit(submit)}><div className="sm:col-span-2"><FormFieldWrapper label="Period name" error={form.formState.errors.name?.message}><Input {...form.register("name")} placeholder="August 2026 Payroll" /></FormFieldWrapper></div><FormFieldWrapper label="Start date" error={form.formState.errors.startDate?.message}><Input type="date" {...form.register("startDate")} /></FormFieldWrapper><FormFieldWrapper label="End date" error={form.formState.errors.endDate?.message}><Input type="date" {...form.register("endDate")} /></FormFieldWrapper><FormFieldWrapper label="Pay date" error={form.formState.errors.payDate?.message}><Input type="date" {...form.register("payDate")} /></FormFieldWrapper>{formError ? <div className="sm:col-span-2"><ErrorState title="Unable to create period" message={formError} /></div> : null}</form><DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" form="payroll-period-form" disabled={mutation.isPending}>{mutation.isPending ? "Creating…" : "Create period"}</Button></DialogFooter></DialogContent></Dialog>;
}
