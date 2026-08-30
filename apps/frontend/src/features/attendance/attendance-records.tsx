"use client";

import { useMemo, useState } from "react";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { DateRangeFilter } from "@/components/data/date-range-filter";
import { PaginationControls } from "@/components/data/pagination-controls";
import { SearchFilterBar } from "@/components/data/search-filter-bar";
import { SelectField } from "@/components/forms/select-field";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { attendanceStatuses } from "@/features/attendance/schemas";
import { useAttendanceRecords } from "@/features/attendance/hooks";
import type { AttendanceRecord, Shift } from "@/features/attendance/types";
import {
  ALL,
  employeeName,
  formatAttendanceDate,
  formatAttendanceTime,
  formatWorkingTime,
  queryErrorMessage,
} from "@/features/attendance/utils";
import type { Employee } from "@/features/employees/types";
import type { DateRangeQuery } from "@/types/api";

function initialRange(): DateRangeQuery {
  const now = new Date();
  return {
    fromDate: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().slice(0, 10),
    toDate: now.toISOString().slice(0, 10),
  };
}

export function AttendanceRecords({ employees, shifts }: { employees: Employee[]; shifts: Shift[] }) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [employeeId, setEmployeeId] = useState(ALL);
  const [shiftId, setShiftId] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [dateRange, setDateRange] = useState<DateRangeQuery>(initialRange);
  const records = useAttendanceRecords({
    page,
    limit: 20,
    search: search || undefined,
    employeeId: employeeId === ALL ? undefined : employeeId,
    shiftId: shiftId === ALL ? undefined : shiftId,
    status: status === ALL ? undefined : (status as AttendanceRecord["status"]),
    fromDate: dateRange.fromDate,
    toDate: dateRange.toDate,
    sortBy: "date",
    sortOrder: "desc",
  });
  const employeeOptions = useMemo(
    () => [
      { value: ALL, label: "All employees" },
      ...employees.map((employee) => ({ value: employee.id, label: `${employeeName(employee)} · ${employee.employeeCode}` })),
    ],
    [employees],
  );
  const shiftOptions = useMemo(
    () => [{ value: ALL, label: "All shifts" }, ...shifts.map((shift) => ({ value: shift.id, label: shift.name }))],
    [shifts],
  );
  const columns: DataTableColumn<AttendanceRecord>[] = [
    {
      key: "employee",
      header: "Employee",
      render: (record) => (
        <div>
          <p className="font-medium text-foreground">{employeeName(record.employee)}</p>
          <p className="text-xs text-muted-foreground">{record.employee?.employeeCode ?? "—"}</p>
        </div>
      ),
    },
    { key: "date", header: "Date", render: (record) => formatAttendanceDate(record.date) },
    { key: "status", header: "Status", render: (record) => <StatusBadge status={record.status} /> },
    { key: "source", header: "Source", render: (record) => record.source.replaceAll("_", " ") },
    { key: "shift", header: "Shift", render: (record) => record.shift?.name ?? "—" },
    { key: "check-in", header: "Check in", render: (record) => formatAttendanceTime(record.checkInAt) },
    { key: "check-out", header: "Check out", render: (record) => formatAttendanceTime(record.checkOutAt) },
    { key: "working-time", header: "Working time", render: formatWorkingTime },
    {
      key: "context",
      header: "Context",
      render: (record) => (
        <div className="max-w-56">
          <p>{record.location ?? "—"}</p>
          {record.notes ? <p className="truncate text-xs text-muted-foreground" title={record.notes}>{record.notes}</p> : null}
        </div>
      ),
    },
  ];

  function resetFilters() {
    setSearch("");
    setEmployeeId(ALL);
    setShiftId(ALL);
    setStatus(ALL);
    setDateRange(initialRange());
    setPage(1);
  }

  return (
    <div className="grid gap-4">
      <SearchFilterBar
        value={search}
        onChange={(value) => { setSearch(value); setPage(1); }}
        placeholder="Search notes or location"
        filters={
          <>
            <SelectField className="w-full sm:w-56" value={employeeId} onValueChange={(value) => { setEmployeeId(value); setPage(1); }} options={employeeOptions} />
            <SelectField className="w-full sm:w-44" value={shiftId} onValueChange={(value) => { setShiftId(value); setPage(1); }} options={shiftOptions} />
            <SelectField className="w-full sm:w-48" value={status} onValueChange={(value) => { setStatus(value); setPage(1); }} options={[{ value: ALL, label: "All statuses" }, ...attendanceStatuses.map((item) => ({ value: item, label: item.replaceAll("_", " ") }))]} />
          </>
        }
        onReset={resetFilters}
      />
      <DateRangeFilter value={dateRange} onChange={(value) => { setDateRange(value); setPage(1); }} />
      {records.isLoading ? <LoadingState rows={8} /> : null}
      {records.error ? <ErrorState title="Unable to load attendance records" message={queryErrorMessage(records.error)} onRetry={() => void records.refetch()} /> : null}
      {!records.isLoading && !records.error ? (
        <>
          <DataTable columns={columns} rows={records.data?.data ?? []} getRowKey={(record) => record.id} emptyTitle="No attendance records match these filters" />
          <PaginationControls page={records.data?.meta.page ?? page} totalPages={records.data?.meta.totalPages ?? 1} onPageChange={setPage} />
        </>
      ) : null}
    </div>
  );
}
