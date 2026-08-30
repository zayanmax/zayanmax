"use client";

import {
  CalendarCheck2,
  Clock3,
  Home,
  ShieldAlert,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";
import { useState } from "react";
import { DataCard } from "@/components/shared/data-card";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { PermissionGuard } from "@/components/shared/permission-guard";
import { StatCard } from "@/components/shared/stat-card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AttendanceActions } from "@/features/attendance/attendance-actions";
import { AttendanceCorrections } from "@/features/attendance/attendance-corrections";
import { AttendanceEmployeeReport } from "@/features/attendance/attendance-report";
import { AttendanceHolidays } from "@/features/attendance/attendance-holidays";
import { AttendanceRecords } from "@/features/attendance/attendance-records";
import { AttendanceShifts } from "@/features/attendance/attendance-shifts";
import { useAttendanceShifts, useAttendanceSummary } from "@/features/attendance/hooks";
import { queryErrorMessage } from "@/features/attendance/utils";
import { useEmployees } from "@/features/employees/hooks";

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

export function AttendanceOverviewPage() {
  const [month, setMonth] = useState(currentMonth);
  const [yearValue, monthValue] = month.split("-").map(Number);
  const summary = useAttendanceSummary({ year: yearValue, month: monthValue });
  const employees = useEmployees({ page: 1, limit: 100, status: "ACTIVE", sortBy: "firstName", sortOrder: "asc" });
  const shifts = useAttendanceShifts();
  const employeeRows = employees.data?.data ?? [];
  const shiftRows = shifts.data ?? [];

  return (
    <PermissionGuard
      permission="attendance.view"
      fallback={<ErrorState title="Permission required" message="You do not have access to Attendance." />}
    >
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Attendance"
          description="Daily attendance, corrections, shifts and company holidays."
          actions={
            <PermissionGuard permission="attendance.manage">
              <AttendanceActions employees={employeeRows} shifts={shiftRows} />
            </PermissionGuard>
          }
        />

        <DataCard
          title="Monthly attendance"
          description="Company-wide status totals from the backend monthly summary."
          action={<Input aria-label="Attendance month" type="month" value={month} onChange={(event) => setMonth(event.target.value || currentMonth())} className="w-40" />}
        >
          {summary.isLoading ? <LoadingState rows={2} /> : null}
          {summary.error ? <ErrorState title="Unable to load attendance summary" message={queryErrorMessage(summary.error)} onRetry={() => void summary.refetch()} /> : null}
          {summary.data ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
              <StatCard title="Total records" value={summary.data.total} description="Selected month" icon={UsersRound} />
              <StatCard title="Present" value={summary.data.byStatus.PRESENT ?? 0} description="On-time attendance" icon={UserRoundCheck} tone="success" />
              <StatCard title="Late" value={summary.data.byStatus.LATE ?? 0} description="Late arrivals" icon={Clock3} tone="warning" />
              <StatCard title="Absent" value={summary.data.byStatus.ABSENT ?? 0} description="Absent records" icon={ShieldAlert} tone="danger" />
              <StatCard title="Work from home" value={summary.data.byStatus.WORK_FROM_HOME ?? 0} description="Remote attendance" icon={Home} tone="info" />
              <StatCard title="Half day" value={summary.data.byStatus.HALF_DAY ?? 0} description="Partial attendance" icon={CalendarCheck2} tone="warning" />
            </div>
          ) : null}
        </DataCard>

        {employees.error ? <ErrorState title="Unable to load employee selectors" message={queryErrorMessage(employees.error)} onRetry={() => void employees.refetch()} /> : null}
        {shifts.error ? <ErrorState title="Unable to load shift selectors" message={queryErrorMessage(shifts.error)} onRetry={() => void shifts.refetch()} /> : null}

        <Tabs defaultValue="records">
          <TabsList variant="line" className="max-w-full justify-start overflow-x-auto">
            <TabsTrigger value="records">Records</TabsTrigger>
            <TabsTrigger value="corrections">Corrections</TabsTrigger>
            <TabsTrigger value="schedules">Shifts &amp; holidays</TabsTrigger>
            <TabsTrigger value="report">Employee report</TabsTrigger>
          </TabsList>
          <TabsContent value="records" className="pt-4"><AttendanceRecords employees={employeeRows} shifts={shiftRows} /></TabsContent>
          <TabsContent value="corrections" className="pt-4"><AttendanceCorrections employees={employeeRows} /></TabsContent>
          <TabsContent value="schedules" className="grid gap-6 pt-4"><AttendanceShifts /><AttendanceHolidays /></TabsContent>
          <TabsContent value="report" className="pt-4"><AttendanceEmployeeReport employees={employeeRows} /></TabsContent>
        </Tabs>
      </div>
    </PermissionGuard>
  );
}
