import { apiRequest } from "@/lib/api/client";
import type {
  AttendanceCorrectionPayload,
  AttendanceCorrectionQuery,
  AttendanceCorrectionRequest,
  AttendanceCorrectionResult,
  AttendanceCorrectionReviewPayload,
  AttendanceListQuery,
  AttendanceListResult,
  AttendanceRecord,
  CheckInPayload,
  CheckOutPayload,
  EmployeeAttendanceReport,
  EmployeeReportQuery,
  Holiday,
  HolidayListResult,
  HolidayPayload,
  HolidayQuery,
  ManualAttendancePayload,
  MonthlyAttendanceSummary,
  MonthlySummaryQuery,
  Shift,
  ShiftPayload,
} from "@/features/attendance/types";

export const attendanceApi = {
  records: (params: AttendanceListQuery) =>
    apiRequest<AttendanceListResult>({ url: "/attendance", method: "GET", params }),
  summary: (params: MonthlySummaryQuery) =>
    apiRequest<MonthlyAttendanceSummary>({
      url: "/attendance/monthly-summary",
      method: "GET",
      params,
    }),
  employeeReport: (employeeId: string, params: EmployeeReportQuery) =>
    apiRequest<EmployeeAttendanceReport>({
      url: `/attendance/employees/${employeeId}/report`,
      method: "GET",
      params,
    }),
  corrections: (params: AttendanceCorrectionQuery) =>
    apiRequest<AttendanceCorrectionResult>({
      url: "/attendance/corrections",
      method: "GET",
      params,
    }),
  shifts: () => apiRequest<Shift[]>({ url: "/shifts", method: "GET" }),
  holidays: (params: HolidayQuery) =>
    apiRequest<HolidayListResult>({ url: "/holidays", method: "GET", params }),
  checkIn: (payload: CheckInPayload) =>
    apiRequest<AttendanceRecord>({ url: "/attendance/check-in", method: "POST", data: payload }),
  checkOut: (payload: CheckOutPayload) =>
    apiRequest<AttendanceRecord>({ url: "/attendance/check-out", method: "POST", data: payload }),
  createManual: (payload: ManualAttendancePayload) =>
    apiRequest<AttendanceRecord>({ url: "/attendance/manual", method: "POST", data: payload }),
  createCorrection: (payload: AttendanceCorrectionPayload) =>
    apiRequest<AttendanceCorrectionRequest>({
      url: "/attendance/corrections",
      method: "POST",
      data: payload,
    }),
  reviewCorrection: (id: string, payload: AttendanceCorrectionReviewPayload) =>
    apiRequest<AttendanceCorrectionRequest>({
      url: `/attendance/corrections/${id}/review`,
      method: "PATCH",
      data: payload,
    }),
  createShift: (payload: ShiftPayload) =>
    apiRequest<Shift>({ url: "/shifts", method: "POST", data: payload }),
  createHoliday: (payload: HolidayPayload) =>
    apiRequest<Holiday>({ url: "/holidays", method: "POST", data: payload }),
  deleteHoliday: (id: string) =>
    apiRequest<{ deleted: boolean }>({ url: `/holidays/${id}`, method: "DELETE" }),
};
