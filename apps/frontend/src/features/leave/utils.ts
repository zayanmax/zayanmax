import { ApiClientError } from "@/lib/api/client";

export const ALL = "all";
export const NONE = "none";

export function employeeName(employee?: { firstName: string; lastName: string } | null) {
  return employee ? `${employee.firstName} ${employee.lastName}`.trim() : "Unknown employee";
}

export function formatLeaveDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(value));
}

export function inclusiveDays(fromDate: string, toDate: string) {
  if (!fromDate || !toDate || toDate < fromDate) return 0;
  return Math.floor((Date.parse(`${toDate}T00:00:00Z`) - Date.parse(`${fromDate}T00:00:00Z`)) / 86_400_000) + 1;
}

export function queryErrorMessage(error: unknown) {
  return error instanceof ApiClientError ? error.message : "The server did not return a usable response.";
}
