"use client";

import { useQueries } from "@tanstack/react-query";
import {
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  HelpCircle,
  Package,
  Users,
  UserCheck,
  Building2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { DateRangeFilter } from "@/components/data/date-range-filter";
import { DataCard } from "@/components/shared/data-card";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { dashboardApi } from "@/lib/api/endpoints";
import { ApiClientError } from "@/lib/api/client";
import { formatCurrency, formatNumber } from "@/lib/format";
import type { DateRangeQuery } from "@/types/api";

export function DashboardOverview() {
  const [draftRange, setDraftRange] = useState<DateRangeQuery>({});
  const [appliedRange, setAppliedRange] = useState<DateRangeQuery>({});

  const results = useQueries({
    queries: [
      {
        queryKey: ["dashboard", "company", appliedRange],
        queryFn: () => dashboardApi.company(appliedRange),
      },
      {
        queryKey: ["dashboard", "hr", appliedRange],
        queryFn: () => dashboardApi.hr(appliedRange),
      },
      {
        queryKey: ["dashboard", "projects-tasks", appliedRange],
        queryFn: () => dashboardApi.projectsTasks(appliedRange),
      },
      {
        queryKey: ["dashboard", "crm-sales", appliedRange],
        queryFn: () => dashboardApi.crmSales(appliedRange),
      },
      {
        queryKey: ["dashboard", "finance", appliedRange],
        queryFn: () => dashboardApi.finance(appliedRange),
      },
      {
        queryKey: ["dashboard", "inventory-assets", appliedRange],
        queryFn: () => dashboardApi.inventoryAssets(appliedRange),
      },
      {
        queryKey: ["dashboard", "helpdesk", appliedRange],
        queryFn: () => dashboardApi.helpdesk(appliedRange),
      },
      {
        queryKey: ["dashboard", "approvals", appliedRange],
        queryFn: () => dashboardApi.approvals(appliedRange),
      },
      {
        queryKey: ["dashboard", "calendar", appliedRange],
        queryFn: () => dashboardApi.calendar(appliedRange),
      },
    ],
  });

  const [
    company,
    hr,
    projectsTasks,
    crmSales,
    finance,
    inventoryAssets,
    helpdesk,
    approvals,
    calendar,
  ] = results;

  const isLoading = results.some((result) => result.isLoading);
  const firstError = results.find((result) => result.error)?.error;
  const errorMessage =
    firstError instanceof ApiClientError
      ? firstError.message
      : firstError instanceof Error
        ? firstError.message
        : undefined;

  const attendanceTotal = useMemo(() => {
    const attendance = hr.data?.todayAttendance ?? {};
    return Object.values(attendance).reduce((sum, count) => sum + count, 0);
  }, [hr.data?.todayAttendance]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Dashboard"
          description="Company-wide operational overview."
        />
        <LoadingState rows={8} />
      </div>
    );
  }

  if (firstError) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Dashboard"
          description="Company-wide operational overview."
        />
        <ErrorState
          title="Dashboard data could not be loaded"
          message={errorMessage}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Company-wide operational overview sourced from backend summary APIs."
        actions={
          <DateRangeFilter
            value={draftRange}
            onChange={setDraftRange}
            onApply={() => setAppliedRange(draftRange)}
          />
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Employees"
          value={formatNumber(company.data?.employees?.total)}
          description={`${formatNumber(company.data?.employees?.active)} active`}
          icon={Users}
          tone="primary"
        />
        <StatCard
          title="Attendance Today"
          value={formatNumber(attendanceTotal)}
          description={`${formatNumber(hr.data?.departmentsCount)} active departments`}
          icon={UserCheck}
          tone="success"
        />
        <StatCard
          title="Projects & Tasks"
          value={formatNumber(projectsTasks.data?.activeProjects)}
          description={`${formatNumber(projectsTasks.data?.overdueTasks)} overdue tasks`}
          icon={ClipboardList}
          tone="warning"
        />
        <StatCard
          title="Clients & Sales"
          value={formatNumber(crmSales.data?.totalClients)}
          description={`${formatNumber(crmSales.data?.activeClients)} active clients`}
          icon={Building2}
          tone="info"
        />
        <StatCard
          title="Finance"
          value={formatCurrency(finance.data?.outstandingReceivables?.amount)}
          description="Outstanding receivables"
          icon={CircleDollarSign}
          tone="primary"
        />
        <StatCard
          title="Approvals"
          value={formatNumber(approvals.data?.myPendingApprovals)}
          description={`${formatNumber(approvals.data?.companyPendingApprovals)} company pending`}
          icon={CheckCircle2}
          tone="warning"
        />
        <StatCard
          title="Helpdesk"
          value={formatNumber(helpdesk.data?.openTickets)}
          description={`${formatNumber(helpdesk.data?.urgentTickets)} urgent tickets`}
          icon={HelpCircle}
          tone="danger"
        />
        <StatCard
          title="Calendar"
          value={formatNumber(calendar.data?.todayEvents?.length)}
          description={`${formatNumber(calendar.data?.upcomingMeetings?.length)} upcoming meetings`}
          icon={CalendarDays}
          tone="info"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <DataCard title="Task Status" description="Current task distribution">
          <KeyValueList data={projectsTasks.data?.taskStatusCounts ?? {}} />
        </DataCard>
        <DataCard title="Leave Requests" description="Requests in selected range">
          <KeyValueList data={hr.data?.leaveRequests ?? {}} />
        </DataCard>
        <DataCard title="Tickets By Status" description="Helpdesk queue health">
          <KeyValueList data={helpdesk.data?.ticketsByStatus ?? {}} />
        </DataCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <DataCard
          title="Project Progress"
          description="Latest active and planned project snapshots"
        >
          <div className="space-y-3">
            {(projectsTasks.data?.projectProgress ?? []).slice(0, 5).map((project) => (
              <div key={project.id} className="space-y-1.5">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">
                      {project.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {project.completedTasks}/{project.totalTasks} tasks
                    </p>
                  </div>
                  <StatusBadge status={project.status} />
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${project.progressPercent}%` }}
                  />
                </div>
              </div>
            ))}
            {!projectsTasks.data?.projectProgress?.length ? (
              <p className="text-sm text-muted-foreground">No project progress available.</p>
            ) : null}
          </div>
        </DataCard>

        <DataCard title="Inventory & Assets" description="Stock and maintenance summary">
          <div className="grid gap-3 sm:grid-cols-3">
            <MiniMetric
              label="Low stock"
              value={inventoryAssets.data?.lowStockItems?.length ?? 0}
            />
            <MiniMetric
              label="Maintenance due"
              value={inventoryAssets.data?.maintenanceDue?.count ?? 0}
            />
            <MiniMetric
              label="Resource bookings"
              value={calendar.data?.resourceBookings?.length ?? 0}
              icon={Package}
            />
          </div>
        </DataCard>
      </div>
    </div>
  );
}

function KeyValueList({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data);
  if (!entries.length) {
    return <p className="text-sm text-muted-foreground">No summary data available.</p>;
  }

  return (
    <div className="space-y-2">
      {entries.map(([key, value]) => (
        <div key={key} className="flex items-center justify-between gap-3 text-sm">
          <StatusBadge status={key} />
          <span className="font-medium text-foreground">{formatNumber(value)}</span>
        </div>
      ))}
    </div>
  );
}

function MiniMetric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon?: typeof Package;
}) {
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">{label}</p>
        {Icon ? <Icon className="size-4 text-muted-foreground" /> : null}
      </div>
      <p className="mt-2 text-xl font-semibold">{formatNumber(value)}</p>
    </div>
  );
}
