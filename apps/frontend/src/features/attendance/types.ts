import type { PaginatedResult } from "@/types/api";

export type AttendanceStatus =
  | "PRESENT"
  | "ABSENT"
  | "LATE"
  | "HALF_DAY"
  | "WORK_FROM_HOME"
  | "HOLIDAY"
  | "LEAVE";

export type AttendanceSource = "SELF" | "MANUAL" | "BIOMETRIC" | "IMPORT";
export type AttendanceCorrectionStatus = "PENDING" | "APPROVED" | "REJECTED";

export type AttendanceEmployee = {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
};

export type Shift = {
  id: string;
  companyId: string;
  name: string;
  startTime: string;
  endTime: string;
  graceMinutes: number;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type AttendanceRecord = {
  id: string;
  companyId: string;
  employeeId: string;
  shiftId?: string | null;
  date: string;
  checkInAt?: string | null;
  checkOutAt?: string | null;
  status: AttendanceStatus;
  lateMinutes: number;
  overtimeMinutes: number;
  source: AttendanceSource;
  location?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  employee?: AttendanceEmployee;
  shift?: Pick<Shift, "id" | "name"> | null;
};

export type MonthlyAttendanceSummary = {
  year: number;
  month: number;
  total: number;
  byStatus: Partial<Record<AttendanceStatus, number>>;
};

export type EmployeeAttendanceReport = {
  employeeId: string;
  total: number;
  byStatus: Partial<Record<AttendanceStatus, number>>;
  records: AttendanceRecord[];
};

export type AttendanceCorrectionRequest = {
  id: string;
  companyId: string;
  attendanceRecordId?: string | null;
  employeeId: string;
  date: string;
  requestedCheckInAt?: string | null;
  requestedCheckOutAt?: string | null;
  requestedStatus?: AttendanceStatus | null;
  reason: string;
  status: AttendanceCorrectionStatus;
  reviewedById?: string | null;
  reviewedAt?: string | null;
  reviewComment?: string | null;
  createdAt: string;
  updatedAt: string;
  employee?: AttendanceEmployee;
  attendanceRecord?: Pick<
    AttendanceRecord,
    "id" | "date" | "checkInAt" | "checkOutAt" | "status" | "source"
  > | null;
};

export type Holiday = {
  id: string;
  companyId: string;
  name: string;
  date: string;
  description?: string | null;
  recurring: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type AttendanceListQuery = {
  page?: number;
  limit?: number;
  search?: string;
  employeeId?: string;
  shiftId?: string;
  status?: AttendanceStatus;
  fromDate?: string;
  toDate?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

export type AttendanceCorrectionQuery = {
  page?: number;
  limit?: number;
  search?: string;
  employeeId?: string;
  status?: AttendanceCorrectionStatus;
  fromDate?: string;
  toDate?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

export type HolidayQuery = {
  page?: number;
  limit?: number;
  search?: string;
  fromDate?: string;
  toDate?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

export type MonthlySummaryQuery = {
  year: number;
  month: number;
  employeeId?: string;
};

export type EmployeeReportQuery = {
  fromDate?: string;
  toDate?: string;
};

export type CheckInPayload = {
  employeeId: string;
  shiftId?: string;
  date?: string;
  checkInAt?: string;
  status?: AttendanceStatus;
  location?: string;
  notes?: string;
};

export type CheckOutPayload = {
  employeeId: string;
  date?: string;
  checkOutAt?: string;
  notes?: string;
};

export type ManualAttendancePayload = {
  employeeId: string;
  shiftId?: string;
  date: string;
  checkInAt?: string;
  checkOutAt?: string;
  status: AttendanceStatus;
  location?: string;
  notes?: string;
};

export type AttendanceCorrectionPayload = {
  attendanceRecordId?: string;
  employeeId: string;
  date: string;
  requestedCheckInAt?: string;
  requestedCheckOutAt?: string;
  requestedStatus?: AttendanceStatus;
  reason: string;
};

export type AttendanceCorrectionReviewPayload = {
  status: "APPROVED" | "REJECTED";
  reviewComment?: string;
};

export type ShiftPayload = {
  name: string;
  startTime: string;
  endTime: string;
  graceMinutes?: number;
};

export type HolidayPayload = {
  name: string;
  date: string;
  description?: string;
  recurring?: boolean;
};

export type AttendanceListResult = PaginatedResult<AttendanceRecord>;
export type AttendanceCorrectionResult = PaginatedResult<AttendanceCorrectionRequest>;
export type HolidayListResult = PaginatedResult<Holiday>;
