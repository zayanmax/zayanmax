"use client";

import Link from "next/link";
import { Edit, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataCard } from "@/components/shared/data-card";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { PermissionGuard } from "@/components/shared/permission-guard";
import { StatusBadge } from "@/components/shared/status-badge";
import { useBranches } from "@/features/branches/hooks";
import { useDepartments } from "@/features/departments/hooks";
import { useDesignations } from "@/features/designations/hooks";
import {
  useDeleteEmployee,
  useEmployee,
  useEmployees,
} from "@/features/employees/hooks";
import { employeeName, formatDate } from "@/features/employees/utils";
import { ApiClientError } from "@/lib/api/client";

export function EmployeeDetailPage({ employeeId }: { employeeId: string }) {
  const router = useRouter();
  const employee = useEmployee(employeeId);
  const branches = useBranches();
  const departments = useDepartments();
  const designations = useDesignations();
  const managers = useEmployees({ page: 1, limit: 100, sortBy: "firstName", sortOrder: "asc" });
  const deleteMutation = useDeleteEmployee();

  const branchMap = useMemo(
    () => new Map((branches.data ?? []).map((branch) => [branch.id, branch.name])),
    [branches.data],
  );
  const departmentMap = useMemo(
    () =>
      new Map(
        (departments.data ?? []).map((department) => [
          department.id,
          department.name,
        ]),
      ),
    [departments.data],
  );
  const designationMap = useMemo(
    () =>
      new Map(
        (designations.data ?? []).map((designation) => [
          designation.id,
          designation.name,
        ]),
      ),
    [designations.data],
  );
  const managerMap = useMemo(
    () =>
      new Map(
        (managers.data?.data ?? []).map((manager) => [
          manager.id,
          employeeName(manager),
        ]),
      ),
    [managers.data?.data],
  );

  const isLoading =
    employee.isLoading ||
    branches.isLoading ||
    departments.isLoading ||
    designations.isLoading;
  const error =
    employee.error ?? branches.error ?? departments.error ?? designations.error;
  const errorMessage =
    error instanceof ApiClientError
      ? error.message
      : error instanceof Error
        ? error.message
        : undefined;

  async function deleteEmployee() {
    await deleteMutation.mutateAsync(employeeId);
    router.replace("/employees");
  }

  return (
    <PermissionGuard
      permission="employees.view"
      fallback={
        <ErrorState
          title="Permission required"
          message="You do not have access to employee records."
        />
      }
    >
      {isLoading ? <LoadingState rows={6} /> : null}
      {error ? <ErrorState title="Unable to load employee" message={errorMessage} /> : null}
      {!isLoading && !error && employee.data ? (
        <div className="flex flex-col gap-6">
          <PageHeader
            title={employeeName(employee.data)}
            description={`${employee.data.employeeCode} · ${employee.data.email}`}
            actions={
              <>
                <PermissionGuard permission="employees.update">
                  <Link
                    href={`/employees/${employeeId}/edit`}
                    className={buttonVariants({ variant: "outline" })}
                  >
                    <Edit className="size-4" />
                    Edit
                  </Link>
                </PermissionGuard>
                <PermissionGuard permission="employees.delete">
                  <ConfirmDialog
                    title="Delete employee"
                    description="This will remove the employee from active lists."
                    confirmLabel="Delete"
                    destructive
                    onConfirm={() => void deleteEmployee()}
                    trigger={
                      <Button type="button" variant="destructive">
                        <Trash2 className="size-4" />
                        Delete
                      </Button>
                    }
                  />
                </PermissionGuard>
              </>
            }
          />

          <div className="grid gap-4 xl:grid-cols-3">
            <DataCard title="Profile Summary">
              <DetailRows
                rows={[
                  ["Employee code", employee.data.employeeCode],
                  ["Name", employeeName(employee.data)],
                  ["Status", <StatusBadge key="status" status={employee.data.status} />],
                  ["Employment type", employee.data.employmentType.replaceAll("_", " ")],
                  ["Joining date", formatDate(employee.data.joiningDate)],
                ]}
              />
            </DataCard>
            <DataCard title="Contact Info">
              <DetailRows
                rows={[
                  ["Email", employee.data.email],
                  ["Phone", employee.data.phone ?? "-"],
                ]}
              />
            </DataCard>
            <DataCard title="Work Info">
              <DetailRows
                rows={[
                  ["Branch", branchMap.get(employee.data.branchId ?? "") ?? "-"],
                  [
                    "Department",
                    departmentMap.get(employee.data.departmentId ?? "") ?? "-",
                  ],
                  [
                    "Designation",
                    designationMap.get(employee.data.designationId ?? "") ?? "-",
                  ],
                  [
                    "Reporting manager",
                    managerMap.get(employee.data.reportingManagerId ?? "") ?? "-",
                  ],
                ]}
              />
            </DataCard>
          </div>

          <DataCard title="Record Metadata">
            <DetailRows
              rows={[
                ["Created", formatDate(employee.data.createdAt)],
                ["Updated", formatDate(employee.data.updatedAt)],
                ["Created by", employee.data.createdById ?? "-"],
                ["Updated by", employee.data.updatedById ?? "-"],
              ]}
            />
          </DataCard>
        </div>
      ) : null}
    </PermissionGuard>
  );
}

function DetailRows({ rows }: { rows: Array<[string, ReactNode]> }) {
  return (
    <dl className="grid gap-3">
      {rows.map(([label, value]) => (
        <div key={label} className="grid gap-1 sm:grid-cols-3 sm:gap-3">
          <dt className="text-sm text-muted-foreground">{label}</dt>
          <dd className="text-sm font-medium text-foreground sm:col-span-2">
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
