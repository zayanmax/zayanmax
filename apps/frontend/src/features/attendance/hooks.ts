import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { attendanceApi } from "@/features/attendance/api";
import type {
  AttendanceCorrectionPayload,
  AttendanceCorrectionQuery,
  AttendanceCorrectionReviewPayload,
  AttendanceListQuery,
  CheckInPayload,
  CheckOutPayload,
  EmployeeReportQuery,
  HolidayPayload,
  HolidayQuery,
  ManualAttendancePayload,
  MonthlySummaryQuery,
  ShiftPayload,
} from "@/features/attendance/types";

export const attendanceKeys = {
  all: ["attendance"] as const,
  recordsRoot: ["attendance", "records"] as const,
  records: (query: AttendanceListQuery) => [...attendanceKeys.recordsRoot, query] as const,
  summaryRoot: ["attendance", "summary"] as const,
  summary: (query: MonthlySummaryQuery) => [...attendanceKeys.summaryRoot, query] as const,
  reportsRoot: ["attendance", "employee-report"] as const,
  employeeReport: (employeeId: string, query: EmployeeReportQuery) =>
    [...attendanceKeys.reportsRoot, employeeId, query] as const,
  correctionsRoot: ["attendance", "corrections"] as const,
  corrections: (query: AttendanceCorrectionQuery) =>
    [...attendanceKeys.correctionsRoot, query] as const,
  shifts: ["attendance", "shifts"] as const,
  holidaysRoot: ["attendance", "holidays"] as const,
  holidays: (query: HolidayQuery) => [...attendanceKeys.holidaysRoot, query] as const,
};

export function useAttendanceRecords(query: AttendanceListQuery) {
  return useQuery({ queryKey: attendanceKeys.records(query), queryFn: () => attendanceApi.records(query) });
}

export function useAttendanceSummary(query: MonthlySummaryQuery) {
  return useQuery({ queryKey: attendanceKeys.summary(query), queryFn: () => attendanceApi.summary(query) });
}

export function useEmployeeAttendanceReport(employeeId: string, query: EmployeeReportQuery) {
  return useQuery({
    queryKey: attendanceKeys.employeeReport(employeeId, query),
    queryFn: () => attendanceApi.employeeReport(employeeId, query),
    enabled: Boolean(employeeId),
  });
}

export function useAttendanceCorrections(query: AttendanceCorrectionQuery) {
  return useQuery({ queryKey: attendanceKeys.corrections(query), queryFn: () => attendanceApi.corrections(query) });
}

export function useAttendanceShifts() {
  return useQuery({ queryKey: attendanceKeys.shifts, queryFn: attendanceApi.shifts });
}

export function useAttendanceHolidays(query: HolidayQuery) {
  return useQuery({ queryKey: attendanceKeys.holidays(query), queryFn: () => attendanceApi.holidays(query) });
}

async function invalidateAttendanceData(queryClient: ReturnType<typeof useQueryClient>) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: attendanceKeys.recordsRoot }),
    queryClient.invalidateQueries({ queryKey: attendanceKeys.summaryRoot }),
    queryClient.invalidateQueries({ queryKey: attendanceKeys.reportsRoot }),
  ]);
}

export function useCheckIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CheckInPayload) => attendanceApi.checkIn(payload),
    onSuccess: () => invalidateAttendanceData(queryClient),
  });
}

export function useCheckOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CheckOutPayload) => attendanceApi.checkOut(payload),
    onSuccess: () => invalidateAttendanceData(queryClient),
  });
}

export function useCreateManualAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ManualAttendancePayload) => attendanceApi.createManual(payload),
    onSuccess: () => invalidateAttendanceData(queryClient),
  });
}

export function useCreateAttendanceCorrection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AttendanceCorrectionPayload) => attendanceApi.createCorrection(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: attendanceKeys.correctionsRoot });
    },
  });
}

export function useReviewAttendanceCorrection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AttendanceCorrectionReviewPayload }) =>
      attendanceApi.reviewCorrection(id, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: attendanceKeys.correctionsRoot }),
        invalidateAttendanceData(queryClient),
      ]);
    },
  });
}

export function useCreateAttendanceShift() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ShiftPayload) => attendanceApi.createShift(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: attendanceKeys.shifts });
    },
  });
}

export function useCreateAttendanceHoliday() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: HolidayPayload) => attendanceApi.createHoliday(payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: attendanceKeys.holidaysRoot }),
        queryClient.invalidateQueries({ queryKey: attendanceKeys.summaryRoot }),
      ]);
    },
  });
}

export function useDeleteAttendanceHoliday() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => attendanceApi.deleteHoliday(id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: attendanceKeys.holidaysRoot }),
        queryClient.invalidateQueries({ queryKey: attendanceKeys.summaryRoot }),
      ]);
    },
  });
}
