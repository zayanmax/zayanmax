"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { DateRangeFilter } from "@/components/data/date-range-filter";
import { PaginationControls } from "@/components/data/pagination-controls";
import { SearchFilterBar } from "@/components/data/search-filter-bar";
import { FormFieldWrapper } from "@/components/forms/form-field-wrapper";
import { SelectField } from "@/components/forms/select-field";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PermissionGuard } from "@/components/shared/permission-guard";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  correctionReviewSchema,
  type CorrectionReviewFormValues,
} from "@/features/attendance/schemas";
import {
  useAttendanceCorrections,
  useReviewAttendanceCorrection,
} from "@/features/attendance/hooks";
import type {
  AttendanceCorrectionRequest,
  AttendanceCorrectionStatus,
} from "@/features/attendance/types";
import {
  ALL,
  employeeName,
  formatAttendanceDate,
  formatAttendanceTime,
  queryErrorMessage,
} from "@/features/attendance/utils";
import type { Employee } from "@/features/employees/types";
import { ApiClientError } from "@/lib/api/client";
import type { DateRangeQuery } from "@/types/api";

export function AttendanceCorrections({ employees }: { employees: Employee[] }) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [employeeId, setEmployeeId] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [dateRange, setDateRange] = useState<DateRangeQuery>({});
  const [reviewTarget, setReviewTarget] = useState<AttendanceCorrectionRequest | null>(null);
  const [reviewStatus, setReviewStatus] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const corrections = useAttendanceCorrections({
    page,
    limit: 20,
    search: search || undefined,
    employeeId: employeeId === ALL ? undefined : employeeId,
    status: status === ALL ? undefined : (status as AttendanceCorrectionStatus),
    fromDate: dateRange.fromDate,
    toDate: dateRange.toDate,
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const employeeOptions = useMemo(
    () => [{ value: ALL, label: "All employees" }, ...employees.map((employee) => ({ value: employee.id, label: `${employeeName(employee)} · ${employee.employeeCode}` }))],
    [employees],
  );
  const columns: DataTableColumn<AttendanceCorrectionRequest>[] = [
    {
      key: "employee",
      header: "Employee",
      render: (correction) => (
        <div><p className="font-medium text-foreground">{employeeName(correction.employee)}</p><p className="text-xs text-muted-foreground">{correction.employee?.employeeCode ?? "—"}</p></div>
      ),
    },
    { key: "date", header: "Attendance date", render: (correction) => formatAttendanceDate(correction.date) },
    {
      key: "change",
      header: "Requested change",
      render: (correction) => (
        <div className="min-w-44 text-xs">
          <p>Status: {correction.requestedStatus?.replaceAll("_", " ") ?? "No change"}</p>
          <p>In: {formatAttendanceTime(correction.requestedCheckInAt)}</p>
          <p>Out: {formatAttendanceTime(correction.requestedCheckOutAt)}</p>
        </div>
      ),
    },
    { key: "reason", header: "Reason", render: (correction) => <p className="max-w-60 whitespace-normal">{correction.reason}</p> },
    { key: "status", header: "Status", render: (correction) => <StatusBadge status={correction.status} /> },
    { key: "submitted", header: "Submitted", render: (correction) => formatAttendanceDate(correction.createdAt) },
    {
      key: "review",
      header: "Review",
      render: (correction) => (
        <div className="max-w-56 text-xs">
          <p>{correction.reviewedAt ? formatAttendanceDate(correction.reviewedAt) : "Not reviewed"}</p>
          {correction.reviewComment ? <p className="mt-1 text-muted-foreground">{correction.reviewComment}</p> : null}
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (correction) => correction.status === "PENDING" ? (
        <PermissionGuard permission="attendance.manage">
          <div className="flex gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => { setReviewTarget(correction); setReviewStatus("APPROVED"); }}><Check className="size-4" />Approve</Button>
            <Button type="button" size="sm" variant="destructive" onClick={() => { setReviewTarget(correction); setReviewStatus("REJECTED"); }}><X className="size-4" />Reject</Button>
          </div>
        </PermissionGuard>
      ) : <span className="text-xs text-muted-foreground">Complete</span>,
    },
  ];

  return (
    <div className="grid gap-4">
      <SearchFilterBar
        value={search}
        onChange={(value) => { setSearch(value); setPage(1); }}
        placeholder="Search employee or reason"
        filters={
          <>
            <SelectField className="w-full sm:w-56" value={employeeId} onValueChange={(value) => { setEmployeeId(value); setPage(1); }} options={employeeOptions} />
            <SelectField className="w-full sm:w-44" value={status} onValueChange={(value) => { setStatus(value); setPage(1); }} options={[{ value: ALL, label: "All statuses" }, { value: "PENDING", label: "Pending" }, { value: "APPROVED", label: "Approved" }, { value: "REJECTED", label: "Rejected" }]} />
          </>
        }
        onReset={() => { setSearch(""); setEmployeeId(ALL); setStatus(ALL); setDateRange({}); setPage(1); }}
      />
      <DateRangeFilter value={dateRange} onChange={(value) => { setDateRange(value); setPage(1); }} />
      {corrections.isLoading ? <LoadingState rows={6} /> : null}
      {corrections.error ? <ErrorState title="Unable to load correction requests" message={queryErrorMessage(corrections.error)} onRetry={() => void corrections.refetch()} /> : null}
      {!corrections.isLoading && !corrections.error ? (
        <>
          <DataTable columns={columns} rows={corrections.data?.data ?? []} getRowKey={(correction) => correction.id} emptyTitle="No correction requests match these filters" />
          <PaginationControls page={corrections.data?.meta.page ?? page} totalPages={corrections.data?.meta.totalPages ?? 1} onPageChange={setPage} />
        </>
      ) : null}
      <CorrectionReviewDialog key={`${reviewTarget?.id ?? "closed"}:${reviewStatus}`} target={reviewTarget} status={reviewStatus} onClose={() => setReviewTarget(null)} />
    </div>
  );
}

function CorrectionReviewDialog({
  target,
  status,
  onClose,
}: {
  target: AttendanceCorrectionRequest | null;
  status: "APPROVED" | "REJECTED";
  onClose: () => void;
}) {
  const [formError, setFormError] = useState<string | null>(null);
  const review = useReviewAttendanceCorrection();
  const form = useForm<CorrectionReviewFormValues>({
    resolver: zodResolver(correctionReviewSchema),
    defaultValues: { status, reviewComment: "" },
  });

  async function onSubmit(values: CorrectionReviewFormValues) {
    if (!target) return;
    setFormError(null);
    try {
      await review.mutateAsync({ id: target.id, payload: { status: values.status, reviewComment: values.reviewComment || undefined } });
      onClose();
    } catch (caught) {
      setFormError(caught instanceof ApiClientError ? caught.message : "Unable to review correction");
    }
  }

  return (
    <Dialog open={Boolean(target)} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{status === "APPROVED" ? "Approve" : "Reject"} attendance correction</DialogTitle>
          <DialogDescription>{target ? `${employeeName(target.employee)} · ${formatAttendanceDate(target.date)}. This action can only be applied once.` : "Review correction"}</DialogDescription>
        </DialogHeader>
        <form id="correction-review-form" onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
          <FormFieldWrapper label="Review comment" error={form.formState.errors.reviewComment?.message}>
            <Textarea {...form.register("reviewComment")} placeholder={status === "REJECTED" ? "Explain why this request is rejected" : "Optional verification note"} />
          </FormFieldWrapper>
          {formError ? <ErrorState title="Unable to review correction" message={formError} /> : null}
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="correction-review-form" variant={status === "REJECTED" ? "destructive" : "default"} disabled={review.isPending}>
            {status === "APPROVED" ? <Check className="size-4" /> : <X className="size-4" />}
            {review.isPending ? "Saving…" : status === "APPROVED" ? "Approve request" : "Reject request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
