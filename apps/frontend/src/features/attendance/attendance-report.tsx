"use client";

import { CalendarCheck2, Clock3, UserRoundCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { DateRangeFilter } from "@/components/data/date-range-filter";
import { SelectField } from "@/components/forms/select-field";
import { DataCard } from "@/components/shared/data-card";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { useEmployeeAttendanceReport } from "@/features/attendance/hooks";
import type { AttendanceRecord } from "@/features/attendance/types";
import {
  NONE,
  employeeName,
  formatAttendanceDate,
  formatAttendanceTime,
  formatWorkingTime,
  queryErrorMessage,
} from "@/features/attendance/utils";
import type { Employee } from "@/features/employees/types";
import type { DateRangeQuery } from "@/types/api";

function currentMonthRange(): DateRangeQuery {
  const now = new Date();
  return {
    fromDate: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().slice(0, 10),
    toDate: now.toISOString().slice(0, 10),
  };
}

export function AttendanceEmployeeReport({ employees }: { employees: Employee[] }) {
  const [employeeId, setEmployeeId] = useState(NONE);
  const [dateRange, setDateRange] = useState<DateRangeQuery>(currentMonthRange);
  const report = useEmployeeAttendanceReport(employeeId === NONE ? "" : employeeId, dateRange);
  const selectedEmployee = employees.find((employee) => employee.id === employeeId);
  const options = useMemo(
    () => [{ value: NONE, label: "Select employee" }, ...employees.map((employee) => ({ value: employee.id, label: `${employeeName(employee)} · ${employee.employeeCode}` }))],
    [employees],
  );
  const columns: DataTableColumn<AttendanceRecord>[] = [
    { key: "date", header: "Date", render: (record) => formatAttendanceDate(record.date) },
    { key: "status", header: "Status", render: (record) => <StatusBadge status={record.status} /> },
    { key: "shift", header: "Shift", render: (record) => record.shift?.name ?? "—" },
    { key: "check-in", header: "Check in", render: (record) => formatAttendanceTime(record.checkInAt) },
    { key: "check-out", header: "Check out", render: (record) => formatAttendanceTime(record.checkOutAt) },
    { key: "working", header: "Working time", render: formatWorkingTime },
  ];
  return (
    <div className="grid gap-4">
      <DataCard title="Employee attendance report" description="Review one employee's attendance status and history for a selected date range.">
        <div className="grid gap-3 lg:grid-cols-[minmax(240px,1fr)_auto] lg:items-center">
          <SelectField value={employeeId} onValueChange={setEmployeeId} options={options} />
          <DateRangeFilter value={dateRange} onChange={setDateRange} />
        </div>
      </DataCard>
      {employeeId === NONE ? <EmptyState title="Select an employee to load their attendance report" /> : null}
      {report.isLoading ? <LoadingState rows={6} /> : null}
      {report.error ? <ErrorState title="Unable to load employee report" message={queryErrorMessage(report.error)} onRetry={() => void report.refetch()} /> : null}
      {report.data ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard title="Employee" value={selectedEmployee?.employeeCode ?? "—"} description={selectedEmployee ? employeeName(selectedEmployee) : undefined} icon={UserRoundCheck} />
            <StatCard title="Total records" value={report.data.total} description="Selected date range" icon={CalendarCheck2} tone="info" />
            <StatCard title="Present" value={report.data.byStatus.PRESENT ?? 0} description="On-time attendance" icon={UserRoundCheck} tone="success" />
            <StatCard title="Late" value={report.data.byStatus.LATE ?? 0} description="Late arrivals" icon={Clock3} tone="warning" />
          </div>
          <DataTable columns={columns} rows={report.data.records} getRowKey={(record) => record.id} emptyTitle="No attendance records in this date range" />
        </>
      ) : null}
    </div>
  );
}
