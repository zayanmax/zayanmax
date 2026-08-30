"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Ban,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Plus,
  Save,
  ShieldCheck,
  Tags,
} from "lucide-react";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { DateRangeFilter } from "@/components/data/date-range-filter";
import { PaginationControls } from "@/components/data/pagination-controls";
import { FormFieldWrapper } from "@/components/forms/form-field-wrapper";
import { SelectField } from "@/components/forms/select-field";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataCard } from "@/components/shared/data-card";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { PermissionGuard } from "@/components/shared/permission-guard";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useEmployees } from "@/features/employees/hooks";
import type { Employee } from "@/features/employees/types";
import {
  useCancelLeaveRequest,
  useCreateLeaveRequest,
  useCreateLeaveType,
  useLeaveBalances,
  useLeaveRequests,
  useLeaveTypes,
  useReviewLeaveRequest,
  useUpsertLeaveBalance,
} from "@/features/leave/hooks";
import {
  leaveBalanceSchema,
  leaveRequestSchema,
  leaveTypeSchema,
  type LeaveBalanceFormValues,
  type LeaveRequestFormValues,
  type LeaveTypeFormValues,
} from "@/features/leave/schemas";
import type {
  LeaveBalance,
  LeaveRequest,
  LeaveRequestStatus,
  LeaveType,
} from "@/features/leave/types";
import {
  ALL,
  employeeName,
  formatLeaveDate,
  inclusiveDays,
  NONE,
  queryErrorMessage,
} from "@/features/leave/utils";
import { ApiClientError } from "@/lib/api/client";
import { useAuthStore } from "@/lib/auth/auth-store";
import type { DateRangeQuery } from "@/types/api";

const currentYear = () => new Date().getUTCFullYear();
const today = () => new Date().toISOString().slice(0, 10);

function employeeOptions(employees: Employee[]) {
  return [
    { value: NONE, label: "Select employee" },
    ...employees.map((employee) => ({
      value: employee.id,
      label: `${employeeName(employee)} · ${employee.employeeCode}`,
    })),
  ];
}

function typeOptions(types: LeaveType[]) {
  return [
    { value: NONE, label: "Select leave type" },
    ...types.map((type) => ({ value: type.id, label: `${type.name} · ${type.code}` })),
  ];
}

function canCancelRequest(request: LeaveRequest) {
  return request.status === "PENDING" || (request.status === "APPROVED" && request.fromDate.slice(0, 10) > today());
}

export function LeaveOverviewPage() {
  const user = useAuthStore((state) => state.user);
  const canApprove = user?.permissions.includes("leaves.approve") ?? false;
  const canRequest = user?.permissions.includes("leaves.request") ?? false;
  const types = useLeaveTypes();
  const employees = useEmployees({ page: 1, limit: 100, status: "ACTIVE", sortBy: "firstName", sortOrder: "asc" });
  const pending = useLeaveRequests({ page: 1, limit: 1, status: "PENDING" });
  const approved = useLeaveRequests({ page: 1, limit: 1, status: "APPROVED" });
  const rejected = useLeaveRequests({ page: 1, limit: 1, status: "REJECTED" });
  const cancelled = useLeaveRequests({ page: 1, limit: 1, status: "CANCELLED" });
  const employeeRows = employees.data?.data ?? [];
  const typeRows = types.data ?? [];

  return (
    <PermissionGuard
      permission="leaves.view"
      fallback={<ErrorState title="Permission required" message="You do not have access to Leave management." />}
    >
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Leave management"
          description="Requests, approvals, balances and company leave policies backed by the live API."
          actions={canRequest ? <LeaveRequestDialog employees={employeeRows} types={typeRows} canApprove={canApprove} employeeId={user?.employeeId ?? null} /> : undefined}
        />

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Pending" value={pending.data?.meta.total ?? "—"} description="Awaiting a decision" icon={Clock3} tone="warning" />
          <StatCard title="Approved" value={approved.data?.meta.total ?? "—"} description="Approved requests" icon={CheckCircle2} tone="success" />
          <StatCard title="Rejected" value={rejected.data?.meta.total ?? "—"} description="Declined requests" icon={Ban} tone="danger" />
          <StatCard title="Cancelled" value={cancelled.data?.meta.total ?? "—"} description="Withdrawn requests" icon={CalendarClock} tone="info" />
        </div>

        {types.error ? <ErrorState title="Unable to load leave types" message={queryErrorMessage(types.error)} onRetry={() => void types.refetch()} /> : null}
        {employees.error ? <ErrorState title="Unable to load employees" message={queryErrorMessage(employees.error)} onRetry={() => void employees.refetch()} /> : null}

        <Tabs defaultValue="requests">
          <TabsList variant="line" className="max-w-full justify-start overflow-x-auto">
            <TabsTrigger value="requests">Requests</TabsTrigger>
            {canApprove ? <TabsTrigger value="approvals">Approvals</TabsTrigger> : null}
            <TabsTrigger value="balances">Balances</TabsTrigger>
            {canApprove ? <TabsTrigger value="types">Leave types</TabsTrigger> : null}
          </TabsList>
          <TabsContent value="requests" className="pt-4">
            <LeaveRequestsTable employees={employeeRows} types={typeRows} canApprove={canApprove} actorEmployeeId={user?.employeeId ?? null} />
          </TabsContent>
          {canApprove ? <TabsContent value="approvals" className="pt-4"><LeaveApprovals /></TabsContent> : null}
          <TabsContent value="balances" className="pt-4"><LeaveBalances employees={employeeRows} types={typeRows} canApprove={canApprove} actorEmployeeId={user?.employeeId ?? null} /></TabsContent>
          {canApprove ? <TabsContent value="types" className="pt-4"><LeaveTypes types={typeRows} /></TabsContent> : null}
        </Tabs>
      </div>
    </PermissionGuard>
  );
}

function LeaveRequestDialog({ employees, types, canApprove, employeeId }: { employees: Employee[]; types: LeaveType[]; canApprove: boolean; employeeId: string | null }) {
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const createRequest = useCreateLeaveRequest();
  const form = useForm<LeaveRequestFormValues>({
    resolver: zodResolver(leaveRequestSchema),
    defaultValues: { employeeId: employeeId ?? NONE, leaveTypeId: NONE, fromDate: today(), toDate: today(), reason: "" },
  });
  const selectedEmployee = useWatch({ control: form.control, name: "employeeId" });
  const selectedType = useWatch({ control: form.control, name: "leaveTypeId" });
  const fromDate = useWatch({ control: form.control, name: "fromDate" });
  const toDate = useWatch({ control: form.control, name: "toDate" });
  const balance = useLeaveBalances(
    { page: 1, limit: 1, employeeId: selectedEmployee !== NONE ? selectedEmployee : undefined, leaveTypeId: selectedType !== NONE ? selectedType : undefined, year: Number(fromDate.slice(0, 4)) || currentYear() },
    selectedEmployee !== NONE && selectedType !== NONE,
  );
  const balanceRow = balance.data?.data[0];

  async function submit(values: LeaveRequestFormValues) {
    setFormError(null);
    try {
      await createRequest.mutateAsync({ ...values, reason: values.reason.trim() });
      setOpen(false);
      form.reset({ employeeId: employeeId ?? NONE, leaveTypeId: NONE, fromDate: today(), toDate: today(), reason: "" });
    } catch (caught) {
      setFormError(caught instanceof ApiClientError ? caught.message : "Unable to submit leave request");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type="button" />}><Plus className="size-4" />Request leave</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader><DialogTitle>Request leave</DialogTitle><DialogDescription>Dates are counted as inclusive calendar days. Requests cannot cross a balance year.</DialogDescription></DialogHeader>
        <form id="leave-request-form" className="grid gap-4" onSubmit={form.handleSubmit(submit)}>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormFieldWrapper label="Employee" error={form.formState.errors.employeeId?.message}>
              <SelectField value={selectedEmployee} onValueChange={(value) => form.setValue("employeeId", value, { shouldValidate: true })} options={employeeOptions(employees)} disabled={!canApprove} />
            </FormFieldWrapper>
            <FormFieldWrapper label="Leave type" error={form.formState.errors.leaveTypeId?.message}>
              <SelectField value={selectedType} onValueChange={(value) => form.setValue("leaveTypeId", value, { shouldValidate: true })} options={typeOptions(types)} />
            </FormFieldWrapper>
            <FormFieldWrapper label="From" error={form.formState.errors.fromDate?.message}><Input type="date" {...form.register("fromDate")} /></FormFieldWrapper>
            <FormFieldWrapper label="To" error={form.formState.errors.toDate?.message}><Input type="date" {...form.register("toDate")} /></FormFieldWrapper>
          </div>
          <div className="rounded-lg border border-border bg-muted/35 p-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2"><span className="font-medium">Request context</span><span>{inclusiveDays(fromDate, toDate)} calendar day(s)</span></div>
            <p className="mt-1 text-muted-foreground">{balance.isLoading ? "Checking balance…" : balanceRow ? `${Number(balanceRow.remaining)} days remaining for ${balanceRow.year}.` : selectedType !== NONE ? "No balance record found for this selection." : "Select a leave type to see its balance."}</p>
          </div>
          <FormFieldWrapper label="Reason" error={form.formState.errors.reason?.message}><Textarea {...form.register("reason")} placeholder="Briefly explain the leave request" /></FormFieldWrapper>
          {formError ? <ErrorState title="Unable to submit request" message={formError} /> : null}
        </form>
        <DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" form="leave-request-form" disabled={createRequest.isPending}><Save className="size-4" />{createRequest.isPending ? "Submitting…" : "Submit request"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LeaveRequestsTable({ employees, types, canApprove, actorEmployeeId }: { employees: Employee[]; types: LeaveType[]; canApprove: boolean; actorEmployeeId: string | null }) {
  const [page, setPage] = useState(1);
  const [employeeId, setEmployeeId] = useState(ALL);
  const [leaveTypeId, setLeaveTypeId] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [dateRange, setDateRange] = useState<DateRangeQuery>({});
  const [actionError, setActionError] = useState<string | null>(null);
  const cancelRequest = useCancelLeaveRequest();
  const requests = useLeaveRequests({
    page, limit: 20,
    employeeId: canApprove && employeeId !== ALL ? employeeId : undefined,
    leaveTypeId: leaveTypeId !== ALL ? leaveTypeId : undefined,
    status: status !== ALL ? status as LeaveRequestStatus : undefined,
    fromDate: dateRange.fromDate, toDate: dateRange.toDate,
    sortBy: "createdAt", sortOrder: "desc",
  });
  const columns: DataTableColumn<LeaveRequest>[] = [
    { key: "employee", header: "Employee", render: (row) => <div><p className="font-medium">{employeeName(row.employee)}</p><p className="text-xs text-muted-foreground">{row.employee?.employeeCode ?? "—"}</p></div> },
    { key: "type", header: "Leave type", render: (row) => <div><p>{row.leaveType?.name ?? "—"}</p><p className="text-xs text-muted-foreground">{row.leaveType?.code ?? "—"}</p></div> },
    { key: "dates", header: "Dates", render: (row) => <div><p>{formatLeaveDate(row.fromDate)} – {formatLeaveDate(row.toDate)}</p><p className="text-xs text-muted-foreground">{Number(row.days)} calendar day(s)</p></div> },
    { key: "reason", header: "Reason", render: (row) => <p className="max-w-64 whitespace-normal">{row.reason ?? "—"}</p> },
    { key: "requested", header: "Requested", render: (row) => formatLeaveDate(row.createdAt) },
    { key: "status", header: "Status", render: (row) => <StatusBadge status={row.status} /> },
    { key: "review", header: "Review", render: (row) => <div><p className="max-w-56 whitespace-normal">{row.reviewComment ?? "—"}</p>{row.reviewedAt ? <p className="text-xs text-muted-foreground">{formatLeaveDate(row.reviewedAt)}</p> : null}</div> },
    { key: "actions", header: "Actions", render: (row) => {
      const ownsRequest = row.employeeId === actorEmployeeId;
      if ((!canApprove && !ownsRequest) || !canCancelRequest(row)) return <span className="text-muted-foreground">—</span>;
      return <ConfirmDialog trigger={<Button type="button" variant="outline" size="sm"><Ban className="size-4" />Cancel</Button>} title="Cancel leave request?" description={row.status === "APPROVED" ? "The approved days will be restored to the matching balance." : "This pending request will be withdrawn."} confirmLabel="Cancel request" destructive onConfirm={() => { setActionError(null); cancelRequest.mutate(row.id, { onError: (error) => setActionError(queryErrorMessage(error)) }); }} />;
    } },
  ];

  return <DataCard title="Leave requests" description="Company requests are tenant-scoped; employees see only their own records.">
    <div className="grid gap-4">
      <div className="flex flex-wrap gap-2 rounded-lg border border-border bg-card p-3">
        {canApprove ? <SelectField className="w-full sm:w-56" value={employeeId} onValueChange={(value) => { setEmployeeId(value); setPage(1); }} options={[{ value: ALL, label: "All employees" }, ...employeeOptions(employees).filter((item) => item.value !== NONE)]} /> : null}
        <SelectField className="w-full sm:w-52" value={leaveTypeId} onValueChange={(value) => { setLeaveTypeId(value); setPage(1); }} options={[{ value: ALL, label: "All leave types" }, ...typeOptions(types).filter((item) => item.value !== NONE)]} />
        <SelectField className="w-full sm:w-44" value={status} onValueChange={(value) => { setStatus(value); setPage(1); }} options={[{ value: ALL, label: "All statuses" }, ...["PENDING", "APPROVED", "REJECTED", "CANCELLED"].map((value) => ({ value, label: value[0] + value.slice(1).toLowerCase() }))]} />
        <Button type="button" variant="outline" onClick={() => { setEmployeeId(ALL); setLeaveTypeId(ALL); setStatus(ALL); setDateRange({}); setPage(1); }}>Reset</Button>
      </div>
      <DateRangeFilter value={dateRange} onChange={(value) => { setDateRange(value); setPage(1); }} />
      {actionError ? <ErrorState title="Unable to update request" message={actionError} /> : null}
      {requests.isLoading ? <LoadingState rows={8} /> : null}
      {requests.error ? <ErrorState title="Unable to load leave requests" message={queryErrorMessage(requests.error)} onRetry={() => void requests.refetch()} /> : null}
      {!requests.isLoading && !requests.error ? <><DataTable columns={columns} rows={requests.data?.data ?? []} getRowKey={(row) => row.id} emptyTitle="No leave requests match these filters" /><PaginationControls page={requests.data?.meta.page ?? page} totalPages={requests.data?.meta.totalPages ?? 1} onPageChange={setPage} /></> : null}
    </div>
  </DataCard>;
}

function LeaveApprovals() {
  const [actionError, setActionError] = useState<string | null>(null);
  const [decision, setDecision] = useState<{ request: LeaveRequest; status: "APPROVED" | "REJECTED" } | null>(null);
  const [reviewComment, setReviewComment] = useState("");
  const review = useReviewLeaveRequest();
  const requests = useLeaveRequests({ page: 1, limit: 100, status: "PENDING", sortBy: "createdAt", sortOrder: "asc" });
  async function decide() {
    if (!decision) return;
    setActionError(null);
    try {
      await review.mutateAsync({ id: decision.request.id, data: { status: decision.status, reviewComment: reviewComment.trim() || undefined } });
      setDecision(null);
      setReviewComment("");
    } catch (error) {
      setActionError(queryErrorMessage(error));
    }
  }
  const columns: DataTableColumn<LeaveRequest>[] = [
    { key: "employee", header: "Employee", render: (row) => <div><p className="font-medium">{employeeName(row.employee)}</p><p className="text-xs text-muted-foreground">{row.employee?.employeeCode}</p></div> },
    { key: "type", header: "Leave type", render: (row) => row.leaveType?.name ?? "—" },
    { key: "dates", header: "Dates", render: (row) => `${formatLeaveDate(row.fromDate)} – ${formatLeaveDate(row.toDate)}` },
    { key: "days", header: "Days", render: (row) => Number(row.days) },
    { key: "reason", header: "Reason", render: (row) => <p className="max-w-72 whitespace-normal">{row.reason ?? "—"}</p> },
    { key: "actions", header: "Decision", render: (row) => <div className="flex gap-2"><Button type="button" size="sm" onClick={() => setDecision({ request: row, status: "APPROVED" })}><CheckCircle2 className="size-4" />Approve</Button><Button type="button" variant="outline" size="sm" onClick={() => setDecision({ request: row, status: "REJECTED" })}><Ban className="size-4" />Reject</Button></div> },
  ];
  return <DataCard title="Pending approvals" description="Approval succeeds only when a balance-consuming leave type has enough remaining days."><div className="grid gap-4">{actionError ? <ErrorState title="Unable to review request" message={actionError} /> : null}{requests.isLoading ? <LoadingState rows={6} /> : null}{requests.error ? <ErrorState title="Unable to load approvals" message={queryErrorMessage(requests.error)} onRetry={() => void requests.refetch()} /> : null}{!requests.isLoading && !requests.error ? <DataTable columns={columns} rows={requests.data?.data ?? []} getRowKey={(row) => row.id} emptyTitle="No leave requests are waiting for approval" /> : null}</div><Dialog open={Boolean(decision)} onOpenChange={(open) => { if (!open) { setDecision(null); setReviewComment(""); } }}><DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>{decision?.status === "APPROVED" ? "Approve" : "Reject"} leave request</DialogTitle><DialogDescription>{decision?.status === "APPROVED" ? "Approval will consume the matching balance transactionally." : "The request will be declined without consuming balance."}</DialogDescription></DialogHeader><FormFieldWrapper label="Review comment"><Textarea value={reviewComment} onChange={(event) => setReviewComment(event.target.value)} placeholder="Optional decision context" /></FormFieldWrapper><DialogFooter><Button type="button" variant="outline" onClick={() => setDecision(null)}>Cancel</Button><Button type="button" variant={decision?.status === "REJECTED" ? "destructive" : "default"} disabled={review.isPending} onClick={() => void decide()}>{review.isPending ? "Saving…" : `Confirm ${decision?.status === "APPROVED" ? "approval" : "rejection"}`}</Button></DialogFooter></DialogContent></Dialog></DataCard>;
}

function LeaveBalances({ employees, types, canApprove, actorEmployeeId }: { employees: Employee[]; types: LeaveType[]; canApprove: boolean; actorEmployeeId: string | null }) {
  const [employeeId, setEmployeeId] = useState(ALL);
  const [leaveTypeId, setLeaveTypeId] = useState(ALL);
  const [year, setYear] = useState(currentYear());
  const balances = useLeaveBalances({ page: 1, limit: 100, employeeId: canApprove && employeeId !== ALL ? employeeId : actorEmployeeId ?? undefined, leaveTypeId: leaveTypeId !== ALL ? leaveTypeId : undefined, year });
  const columns: DataTableColumn<LeaveBalance>[] = [
    { key: "employee", header: "Employee", render: (row) => <div><p className="font-medium">{employeeName(row.employee)}</p><p className="text-xs text-muted-foreground">{row.employee?.employeeCode ?? "—"}</p></div> },
    { key: "type", header: "Leave type", render: (row) => `${row.leaveType?.name ?? "—"} · ${row.leaveType?.code ?? "—"}` },
    { key: "year", header: "Year", render: (row) => row.year },
    { key: "opening", header: "Opening", render: (row) => Number(row.openingBalance) },
    { key: "accrued", header: "Accrued", render: (row) => Number(row.accrued) },
    { key: "used", header: "Used", render: (row) => Number(row.used) },
    { key: "remaining", header: "Remaining", render: (row) => <span className="font-semibold text-primary">{Number(row.remaining)}</span> },
  ];
  return <DataCard title="Leave balances" description="Remaining is authoritative: opening plus accrued minus used." action={canApprove ? <LeaveBalanceDialog employees={employees} types={types} /> : undefined}><div className="grid gap-4"><div className="flex flex-wrap gap-2 rounded-lg border border-border bg-card p-3">{canApprove ? <SelectField className="w-full sm:w-56" value={employeeId} onValueChange={setEmployeeId} options={[{ value: ALL, label: "All employees" }, ...employeeOptions(employees).filter((item) => item.value !== NONE)]} /> : null}<SelectField className="w-full sm:w-52" value={leaveTypeId} onValueChange={setLeaveTypeId} options={[{ value: ALL, label: "All leave types" }, ...typeOptions(types).filter((item) => item.value !== NONE)]} /><Input aria-label="Balance year" className="w-28" type="number" min={2000} max={2100} value={year} onChange={(event) => setYear(Number(event.target.value) || currentYear())} /></div>{balances.isLoading ? <LoadingState rows={6} /> : null}{balances.error ? <ErrorState title="Unable to load leave balances" message={queryErrorMessage(balances.error)} onRetry={() => void balances.refetch()} /> : null}{!balances.isLoading && !balances.error ? <DataTable columns={columns} rows={balances.data?.data ?? []} getRowKey={(row) => row.id} emptyTitle="No leave balances found for this year" /> : null}</div></DataCard>;
}

function LeaveBalanceDialog({ employees, types }: { employees: Employee[]; types: LeaveType[] }) {
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const upsert = useUpsertLeaveBalance();
  const form = useForm<LeaveBalanceFormValues>({ resolver: zodResolver(leaveBalanceSchema), defaultValues: { employeeId: NONE, leaveTypeId: NONE, year: currentYear(), openingBalance: 0, accrued: 0, used: 0 } });
  const selectedEmployee = useWatch({ control: form.control, name: "employeeId" });
  const selectedType = useWatch({ control: form.control, name: "leaveTypeId" });
  async function submit(values: LeaveBalanceFormValues) { setFormError(null); try { await upsert.mutateAsync(values); setOpen(false); form.reset({ employeeId: NONE, leaveTypeId: NONE, year: currentYear(), openingBalance: 0, accrued: 0, used: 0 }); } catch (caught) { setFormError(caught instanceof ApiClientError ? caught.message : "Unable to save leave balance"); } }
  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger render={<Button type="button" variant="outline" size="sm" />}><CircleDollarSign className="size-4" />Set balance</DialogTrigger><DialogContent className="sm:max-w-xl"><DialogHeader><DialogTitle>Set employee leave balance</DialogTitle><DialogDescription>Saving the same employee, type and year updates that balance. Used days are never allowed to exceed availability.</DialogDescription></DialogHeader><form id="leave-balance-form" onSubmit={form.handleSubmit(submit)} className="grid gap-4"><div className="grid gap-4 sm:grid-cols-2"><FormFieldWrapper label="Employee" error={form.formState.errors.employeeId?.message}><SelectField value={selectedEmployee} onValueChange={(value) => form.setValue("employeeId", value, { shouldValidate: true })} options={employeeOptions(employees)} /></FormFieldWrapper><FormFieldWrapper label="Leave type" error={form.formState.errors.leaveTypeId?.message}><SelectField value={selectedType} onValueChange={(value) => form.setValue("leaveTypeId", value, { shouldValidate: true })} options={typeOptions(types)} /></FormFieldWrapper><FormFieldWrapper label="Year" error={form.formState.errors.year?.message}><Input type="number" {...form.register("year", { valueAsNumber: true })} /></FormFieldWrapper><FormFieldWrapper label="Opening balance"><Input type="number" step="0.5" {...form.register("openingBalance", { valueAsNumber: true })} /></FormFieldWrapper><FormFieldWrapper label="Accrued"><Input type="number" step="0.5" {...form.register("accrued", { valueAsNumber: true })} /></FormFieldWrapper><FormFieldWrapper label="Used" error={form.formState.errors.used?.message}><Input type="number" step="0.5" {...form.register("used", { valueAsNumber: true })} /></FormFieldWrapper></div>{formError ? <ErrorState title="Unable to save balance" message={formError} /> : null}</form><DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" form="leave-balance-form" disabled={upsert.isPending}><Save className="size-4" />{upsert.isPending ? "Saving…" : "Save balance"}</Button></DialogFooter></DialogContent></Dialog>;
}

function LeaveTypes({ types }: { types: LeaveType[] }) {
  const columns: DataTableColumn<LeaveType>[] = [
    { key: "name", header: "Leave type", render: (row) => <div><p className="font-medium">{row.name}</p><p className="text-xs text-muted-foreground">{row.code}</p></div> },
    { key: "allowance", header: "Annual allowance", render: (row) => `${Number(row.annualAllowance)} days` },
    { key: "approval", header: "Approval", render: (row) => row.requiresApproval ? <StatusBadge status="REQUIRED" /> : <StatusBadge status="NOT REQUIRED" /> },
    { key: "paid", header: "Pay treatment", render: (row) => row.paid ? "Paid" : "Unpaid" },
    { key: "status", header: "Status", render: (row) => <StatusBadge status={row.status} /> },
  ];
  return <DataCard title="Company leave types" description="Policy definitions are company-scoped and used by requests and balances." action={<LeaveTypeDialog />}><DataTable columns={columns} rows={types} getRowKey={(row) => row.id} emptyTitle="No leave types have been configured" /></DataCard>;
}

function LeaveTypeDialog() {
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const createType = useCreateLeaveType();
  const form = useForm<LeaveTypeFormValues>({ resolver: zodResolver(leaveTypeSchema), defaultValues: { name: "", code: "", annualAllowance: 0, requiresApproval: true, paid: true } });
  const requiresApproval = useWatch({ control: form.control, name: "requiresApproval" });
  const paid = useWatch({ control: form.control, name: "paid" });
  async function submit(values: LeaveTypeFormValues) { setFormError(null); try { await createType.mutateAsync({ ...values, code: values.code.toUpperCase() }); setOpen(false); form.reset(); } catch (caught) { setFormError(caught instanceof ApiClientError ? caught.message : "Unable to create leave type"); } }
  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger render={<Button type="button" size="sm" />}><Plus className="size-4" />New leave type</DialogTrigger><DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>Create leave type</DialogTitle><DialogDescription>Define the company policy used by leave requests and annual balances.</DialogDescription></DialogHeader><form id="leave-type-form" className="grid gap-4" onSubmit={form.handleSubmit(submit)}><div className="grid gap-4 sm:grid-cols-2"><FormFieldWrapper label="Name" error={form.formState.errors.name?.message}><Input {...form.register("name")} placeholder="Casual Leave" /></FormFieldWrapper><FormFieldWrapper label="Code" error={form.formState.errors.code?.message}><Input {...form.register("code")} placeholder="CL" className="uppercase" /></FormFieldWrapper></div><FormFieldWrapper label="Annual allowance" error={form.formState.errors.annualAllowance?.message}><Input type="number" step="0.5" {...form.register("annualAllowance", { valueAsNumber: true })} /></FormFieldWrapper><div className="grid gap-3 rounded-lg border border-border p-3"><label className="flex items-center gap-2 text-sm"><Checkbox checked={requiresApproval} onCheckedChange={(checked) => form.setValue("requiresApproval", checked === true)} /><ShieldCheck className="size-4 text-muted-foreground" />Requires approval</label><label className="flex items-center gap-2 text-sm"><Checkbox checked={paid} onCheckedChange={(checked) => form.setValue("paid", checked === true)} /><CircleDollarSign className="size-4 text-muted-foreground" />Paid leave</label></div>{formError ? <ErrorState title="Unable to create leave type" message={formError} /> : null}</form><DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" form="leave-type-form" disabled={createType.isPending}><Tags className="size-4" />{createType.isPending ? "Creating…" : "Create type"}</Button></DialogFooter></DialogContent></Dialog>;
}
