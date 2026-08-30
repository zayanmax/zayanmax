"use client";

import { useState } from "react";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { PaginationControls } from "@/components/data/pagination-controls";
import { SelectField } from "@/components/forms/select-field";
import { DataCard } from "@/components/shared/data-card";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { StatusBadge } from "@/components/shared/status-badge";
import type { Employee } from "@/features/employees/types";
import { usePayslips } from "@/features/payroll/hooks";
import type { PayrollRun, Payslip } from "@/features/payroll/types";
import { ALL, formatPayrollDate, formatPayrollMoney, NONE, payrollEmployeeName, payrollErrorMessage } from "@/features/payroll/utils";

const columns: DataTableColumn<Payslip>[] = [
  { key: "number", header: "Payslip", render: (row) => <div><p className="font-medium">{row.payslipNumber}</p><p className="text-xs text-muted-foreground">{formatPayrollDate(row.generatedAt)}</p></div> },
  { key: "period", header: "Period", render: (row) => row.payrollRun?.payrollPeriod?.name ?? "—" },
  { key: "run", header: "Run status", render: (row) => row.payrollRun ? <StatusBadge status={row.payrollRun.status} /> : "—" },
  { key: "gross", header: "Gross", render: (row) => formatPayrollMoney(row.payrollLineItem?.grossEarnings) },
  { key: "deductions", header: "Deductions", render: (row) => formatPayrollMoney(row.payrollLineItem?.totalDeductions) },
  { key: "net", header: "Net", render: (row) => <span className="font-medium">{formatPayrollMoney(row.payrollLineItem?.netPay)}</span> },
  { key: "status", header: "Metadata", render: (row) => <StatusBadge status={row.status} /> },
];

export function Payslips({ employees, runs }: { employees: Employee[]; runs: PayrollRun[] }) {
  const [employeeId, setEmployeeId] = useState(NONE); const [runId, setRunId] = useState(ALL); const [page, setPage] = useState(1);
  const query = usePayslips(employeeId === NONE ? "" : employeeId, { page, limit: 10, payrollRunId: runId === ALL ? undefined : runId });
  return <DataCard title="Payslips" description="Stored payslip metadata and financial detail. PDF generation and delivery are not configured."><div className="space-y-4"><div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3 sm:flex-row"><SelectField value={employeeId} onValueChange={(value) => { setEmployeeId(value); setPage(1); }} options={[{ value: NONE, label: "Select employee" }, ...employees.map((employee) => ({ value: employee.id, label: `${payrollEmployeeName(employee)} · ${employee.employeeCode}` }))]} className="w-full sm:w-72" /><SelectField value={runId} onValueChange={(value) => { setRunId(value); setPage(1); }} options={[{ value: ALL, label: "All payroll runs" }, ...runs.map((run) => ({ value: run.id, label: `${run.payrollPeriod?.name ?? "Payroll run"} · ${run.status}` }))]} className="w-full sm:w-64" /></div>{employeeId === NONE ? <EmptyState title="Select an employee" description="Payslips are intentionally employee-scoped." /> : query.isLoading ? <LoadingState rows={4} /> : query.error ? <ErrorState title="Unable to load payslips" message={payrollErrorMessage(query.error)} onRetry={() => void query.refetch()} /> : <><DataTable columns={columns} rows={query.data?.data ?? []} getRowKey={(row) => row.id} emptyTitle="No payslips for this employee" /><PaginationControls page={page} totalPages={query.data?.meta.totalPages ?? 1} onPageChange={setPage} /></>}</div></DataCard>;
}
