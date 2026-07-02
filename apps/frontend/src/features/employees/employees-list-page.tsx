"use client";

import Link from "next/link";
import { Edit, Eye, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { PaginationControls } from "@/components/data/pagination-controls";
import { SearchFilterBar } from "@/components/data/search-filter-bar";
import { SelectField } from "@/components/forms/select-field";
import { Button, buttonVariants } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
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
  useEmployees,
} from "@/features/employees/hooks";
import type { Employee } from "@/features/employees/types";
import { employeeName, formatDate } from "@/features/employees/utils";
import { ApiClientError } from "@/lib/api/client";

const ALL = "__all__";

export function EmployeesListPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(ALL);
  const [branchId, setBranchId] = useState(ALL);
  const [departmentId, setDepartmentId] = useState(ALL);
  const [designationId, setDesignationId] = useState(ALL);

  const employees = useEmployees({
    page,
    limit: 20,
    search: search || undefined,
    status: status === ALL ? undefined : status,
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const branches = useBranches();
  const departments = useDepartments();
  const designations = useDesignations();
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

  const rows = useMemo(
    () =>
      (employees.data?.data ?? []).filter((employee) => {
        if (branchId !== ALL && employee.branchId !== branchId) return false;
        if (departmentId !== ALL && employee.departmentId !== departmentId) {
          return false;
        }
        if (designationId !== ALL && employee.designationId !== designationId) {
          return false;
        }
        return true;
      }),
    [branchId, departmentId, designationId, employees.data?.data],
  );

  const columns: DataTableColumn<Employee>[] = [
    {
      key: "employeeCode",
      header: "Code",
      render: (employee) => (
        <Link
          href={`/employees/${employee.id}`}
          className="font-medium text-primary hover:underline"
        >
          {employee.employeeCode}
        </Link>
      ),
    },
    {
      key: "name",
      header: "Name",
      render: (employee) => (
        <div>
          <p className="font-medium text-foreground">{employeeName(employee)}</p>
          <p className="text-xs text-muted-foreground">{employee.employmentType.replaceAll("_", " ")}</p>
        </div>
      ),
    },
    {
      key: "contact",
      header: "Email / Phone",
      render: (employee) => (
        <div>
          <p className="text-sm">{employee.email}</p>
          <p className="text-xs text-muted-foreground">{employee.phone ?? "-"}</p>
        </div>
      ),
    },
    {
      key: "department",
      header: "Department",
      render: (employee) => departmentMap.get(employee.departmentId ?? "") ?? "-",
    },
    {
      key: "designation",
      header: "Designation",
      render: (employee) => designationMap.get(employee.designationId ?? "") ?? "-",
    },
    {
      key: "branch",
      header: "Branch",
      render: (employee) => branchMap.get(employee.branchId ?? "") ?? "-",
    },
    {
      key: "status",
      header: "Status",
      render: (employee) => <StatusBadge status={employee.status} />,
    },
    {
      key: "joiningDate",
      header: "Joining Date",
      render: (employee) => formatDate(employee.joiningDate),
    },
    {
      key: "actions",
      header: "Actions",
      render: (employee) => (
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/employees/${employee.id}`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <Eye className="size-4" />
            View
          </Link>
          <PermissionGuard permission="employees.update">
            <Link
              href={`/employees/${employee.id}/edit`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
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
              onConfirm={() => void deleteMutation.mutateAsync(employee.id)}
              trigger={
                <Button type="button" variant="destructive" size="sm">
                  <Trash2 className="size-4" />
                  Delete
                </Button>
              }
            />
          </PermissionGuard>
        </div>
      ),
    },
  ];

  const isLoading =
    employees.isLoading ||
    branches.isLoading ||
    departments.isLoading ||
    designations.isLoading;
  const error =
    employees.error ?? branches.error ?? departments.error ?? designations.error;
  const errorMessage =
    error instanceof ApiClientError
      ? error.message
      : error instanceof Error
        ? error.message
        : undefined;

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
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Employees"
          description="Search, filter, and maintain employee profile records."
          actions={
            <PermissionGuard permission="employees.create">
              <Link
                href="/employees/new"
                className={buttonVariants({ variant: "default" })}
              >
                <Plus className="size-4" />
                New employee
              </Link>
            </PermissionGuard>
          }
        />

        <SearchFilterBar
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder="Search employees"
          filters={
            <>
              <SelectField
                value={status}
                onValueChange={(value) => {
                  setStatus(value);
                  setPage(1);
                }}
                className="w-full sm:w-40"
                options={[
                  { value: ALL, label: "All statuses" },
                  { value: "ACTIVE", label: "Active" },
                  { value: "INACTIVE", label: "Inactive" },
                  { value: "ARCHIVED", label: "Archived" },
                ]}
              />
              <SelectField
                value={branchId}
                onValueChange={setBranchId}
                className="w-full sm:w-44"
                options={[
                  { value: ALL, label: "All branches" },
                  ...(branches.data ?? []).map((branch) => ({
                    value: branch.id,
                    label: branch.name,
                  })),
                ]}
              />
              <SelectField
                value={departmentId}
                onValueChange={setDepartmentId}
                className="w-full sm:w-48"
                options={[
                  { value: ALL, label: "All departments" },
                  ...(departments.data ?? []).map((department) => ({
                    value: department.id,
                    label: department.name,
                  })),
                ]}
              />
              <SelectField
                value={designationId}
                onValueChange={setDesignationId}
                className="w-full sm:w-48"
                options={[
                  { value: ALL, label: "All designations" },
                  ...(designations.data ?? []).map((designation) => ({
                    value: designation.id,
                    label: designation.name,
                  })),
                ]}
              />
            </>
          }
          onReset={() => {
            setSearch("");
            setStatus(ALL);
            setBranchId(ALL);
            setDepartmentId(ALL);
            setDesignationId(ALL);
            setPage(1);
          }}
        />

        {isLoading ? <LoadingState rows={6} /> : null}
        {error ? <ErrorState title="Unable to load employees" message={errorMessage} /> : null}
        {!isLoading && !error ? (
          <>
            <DataTable
              columns={columns}
              rows={rows}
              getRowKey={(employee) => employee.id}
              emptyTitle="No employees found"
            />
            <PaginationControls
              page={employees.data?.meta.page ?? page}
              totalPages={employees.data?.meta.totalPages ?? 1}
              onPageChange={setPage}
            />
          </>
        ) : null}
      </div>
    </PermissionGuard>
  );
}
