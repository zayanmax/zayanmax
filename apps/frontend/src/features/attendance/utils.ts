import type { Employee } from "@/features/employees/types";
import type {
  AttendanceCorrectionFormValues,
  HolidayFormValues,
  ManualAttendanceFormValues,
  ShiftFormValues,
} from "@/features/attendance/schemas";
import type {
  AttendanceCorrectionPayload,
  AttendanceEmployee,
  AttendanceRecord,
  HolidayPayload,
  ManualAttendancePayload,
  ShiftPayload,
} from "@/features/attendance/types";

export const ALL = "ALL";
export const NONE = "NONE";

export function employeeName(employee?: AttendanceEmployee | Employee | null) {
  if (!employee) return "Unknown employee";
  return `${employee.firstName} ${employee.lastName}`.trim();
}

export function formatAttendanceDate(value?: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function formatAttendanceTime(value?: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatWorkingTime(record: Pick<AttendanceRecord, "checkInAt" | "checkOutAt">) {
  if (!record.checkInAt || !record.checkOutAt) return "—";
  const minutes = Math.max(
    0,
    Math.round((new Date(record.checkOutAt).getTime() - new Date(record.checkInAt).getTime()) / 60_000),
  );
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

export function toIsoDateTime(value?: string) {
  return value ? new Date(value).toISOString() : undefined;
}

export function toManualAttendancePayload(values: ManualAttendanceFormValues): ManualAttendancePayload {
  return {
    employeeId: values.employeeId,
    shiftId: values.shiftId && values.shiftId !== NONE ? values.shiftId : undefined,
    date: values.date,
    status: values.status,
    checkInAt: toIsoDateTime(values.checkInAt),
    checkOutAt: toIsoDateTime(values.checkOutAt),
    location: values.location || undefined,
    notes: values.notes || undefined,
  };
}

export function toCorrectionPayload(
  values: AttendanceCorrectionFormValues,
): AttendanceCorrectionPayload {
  return {
    employeeId: values.employeeId,
    attendanceRecordId:
      values.attendanceRecordId && values.attendanceRecordId !== NONE
        ? values.attendanceRecordId
        : undefined,
    date: values.date,
    requestedCheckInAt: toIsoDateTime(values.requestedCheckInAt),
    requestedCheckOutAt: toIsoDateTime(values.requestedCheckOutAt),
    requestedStatus:
      values.requestedStatus && values.requestedStatus !== NONE
        ? (values.requestedStatus as AttendanceCorrectionPayload["requestedStatus"])
        : undefined,
    reason: values.reason,
  };
}

export function toShiftPayload(values: ShiftFormValues): ShiftPayload {
  return values;
}

export function toHolidayPayload(values: HolidayFormValues): HolidayPayload {
  return {
    ...values,
    description: values.description || undefined,
  };
}

export function queryErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : undefined;
}
