import { ApiClientError } from "@/lib/api/client";
import type { PayrollEmployee, PayrollRunStatus } from "@/features/payroll/types";

export const ALL = "all";
export const NONE = "none";

export function payrollEmployeeName(employee?: Pick<PayrollEmployee, "firstName" | "lastName"> | null) {
  return employee ? `${employee.firstName} ${employee.lastName}`.trim() : "Unknown employee";
}

export function formatPayrollMoney(value?: number | string | null, currency = "INR") {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number.isFinite(amount) ? amount : 0);
}

export function formatPayrollDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(date);
}

export function payrollErrorMessage(error: unknown) {
  return error instanceof ApiClientError ? error.message : "The payroll service did not return a usable response.";
}

export const legalPayrollActions: Record<PayrollRunStatus, PayrollRunStatus[]> = {
  DRAFT: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["APPROVED", "CANCELLED"],
  APPROVED: ["PAID"],
  PAID: [],
  CANCELLED: [],
};

export function statusActionLabel(status: PayrollRunStatus) {
  return ({ PROCESSING: "Start processing", APPROVED: "Approve run", PAID: "Mark paid", CANCELLED: "Cancel run", DRAFT: "Return to draft" } as const)[status];
}
