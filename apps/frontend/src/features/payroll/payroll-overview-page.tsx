"use client";

import { Banknote, CalendarRange, CircleDollarSign, ReceiptText } from "lucide-react";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { PermissionGuard } from "@/components/shared/permission-guard";
import { StatCard } from "@/components/shared/stat-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEmployees } from "@/features/employees/hooks";
import { PayrollPeriods } from "@/features/payroll/payroll-periods";
import { PayrollRuns } from "@/features/payroll/payroll-runs";
import { Payslips } from "@/features/payroll/payslips";
import { SalaryAdvances } from "@/features/payroll/salary-advances";
import { SalaryAssignments } from "@/features/payroll/salary-assignments";
import { SalaryStructures } from "@/features/payroll/salary-structures";
import {
  usePayrollPeriods,
  usePayrollRun,
  usePayrollRuns,
  useSalaryAdvances,
  useSalaryStructures,
} from "@/features/payroll/hooks";
import { formatPayrollMoney, payrollErrorMessage } from "@/features/payroll/utils";
import { useAuthStore } from "@/lib/auth/auth-store";

export function PayrollOverviewPage() {
  const user = useAuthStore((state) => state.user);
  const canManage = user?.permissions.includes("payroll.manage") ?? false;
  const employees = useEmployees({ page: 1, limit: 100, status: "ACTIVE", sortBy: "firstName", sortOrder: "asc" });
  const structures = useSalaryStructures({ page: 1, limit: 100, sortBy: "name", sortOrder: "asc" });
  const periods = usePayrollPeriods({ page: 1, limit: 100, sortBy: "startDate", sortOrder: "desc" });
  const runs = usePayrollRuns({ page: 1, limit: 5, sortBy: "createdAt", sortOrder: "desc" });
  const advances = useSalaryAdvances({ page: 1, limit: 1, status: "ACTIVE" });
  const latestRunId = runs.data?.data[0]?.id ?? "";
  const latestRun = usePayrollRun(latestRunId, Boolean(latestRunId));
  const baseError = employees.error ?? structures.error ?? periods.error ?? runs.error;

  return (
    <PermissionGuard permission="payroll.view" fallback={<ErrorState title="Permission required" message="You do not have access to sensitive Payroll information." />}>
      <div className="flex flex-col gap-6">
        <PageHeader title="Payroll" description="Salary setup, attendance-based payroll runs, advance recovery and payslip metadata from the live financial API." />

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Current period" value={periods.data?.data[0]?.name ?? "Not configured"} description="Latest configured period" icon={CalendarRange} tone="info" />
          <StatCard title="Latest run" value={latestRun.data?.status ?? runs.data?.data[0]?.status ?? "No run"} description="Authoritative server status" icon={CircleDollarSign} tone="warning" />
          <StatCard title="Employees in run" value={latestRun.data?.lineItems?.length ?? runs.data?.data[0]?._count?.lineItems ?? 0} description="Latest payroll run" icon={ReceiptText} tone="primary" />
          <StatCard title="Net payroll" value={latestRun.data ? formatPayrollMoney(latestRun.data.totalNet) : "—"} description={`${advances.data?.meta.total ?? 0} active advance(s)`} icon={Banknote} tone="success" />
        </div>

        {baseError ? <ErrorState title="Unable to load Payroll" message={payrollErrorMessage(baseError)} onRetry={() => { void employees.refetch(); void structures.refetch(); void periods.refetch(); void runs.refetch(); }} /> : null}

        <Tabs defaultValue="runs">
          <TabsList variant="line" className="max-w-full justify-start overflow-x-auto">
            <TabsTrigger value="runs">Payroll runs</TabsTrigger>
            <TabsTrigger value="periods">Periods</TabsTrigger>
            <TabsTrigger value="structures">Salary structures</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="advances">Advances</TabsTrigger>
            <TabsTrigger value="payslips">Payslips</TabsTrigger>
          </TabsList>
          <TabsContent value="runs" className="pt-4"><PayrollRuns periods={periods.data?.data ?? []} canManage={canManage} /></TabsContent>
          <TabsContent value="periods" className="pt-4"><PayrollPeriods canManage={canManage} /></TabsContent>
          <TabsContent value="structures" className="pt-4"><SalaryStructures canManage={canManage} /></TabsContent>
          <TabsContent value="assignments" className="pt-4"><SalaryAssignments employees={employees.data?.data ?? []} structures={structures.data?.data ?? []} canManage={canManage} /></TabsContent>
          <TabsContent value="advances" className="pt-4"><SalaryAdvances employees={employees.data?.data ?? []} canManage={canManage} /></TabsContent>
          <TabsContent value="payslips" className="pt-4"><Payslips employees={employees.data?.data ?? []} runs={runs.data?.data ?? []} /></TabsContent>
        </Tabs>
      </div>
    </PermissionGuard>
  );
}
