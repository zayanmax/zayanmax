import type { Employee, EmployeePayload } from "@/features/employees/types";
import type { EmployeeFormValues } from "@/features/employees/schemas";

export function employeeName(employee: Pick<Employee, "firstName" | "lastName">) {
  return `${employee.firstName} ${employee.lastName}`.trim();
}

export function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function toEmployeePayload(values: EmployeeFormValues): EmployeePayload {
  return {
    employeeCode: values.employeeCode.trim(),
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    email: values.email.trim().toLowerCase(),
    phone: optional(values.phone),
    branchId: optional(values.branchId),
    departmentId: optional(values.departmentId),
    designationId: optional(values.designationId),
    reportingManagerId: optional(values.reportingManagerId),
    joiningDate: values.joiningDate,
    employmentType: values.employmentType,
  };
}

function optional(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}
