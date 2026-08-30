import { z } from "zod";

export const attendanceStatuses = [
  "PRESENT",
  "ABSENT",
  "LATE",
  "HALF_DAY",
  "WORK_FROM_HOME",
  "HOLIDAY",
  "LEAVE",
] as const;

const optionalText = z.string().optional();

export const manualAttendanceSchema = z
  .object({
    employeeId: z.string().min(1, "Select an employee"),
    shiftId: optionalText,
    date: z.string().min(1, "Date is required"),
    status: z.enum(attendanceStatuses),
    checkInAt: optionalText,
    checkOutAt: optionalText,
    location: optionalText,
    notes: optionalText,
  })
  .refine((value) => !value.checkInAt || !value.checkOutAt || value.checkOutAt >= value.checkInAt, {
    message: "Check-out cannot be before check-in",
    path: ["checkOutAt"],
  });

export const attendanceActionSchema = z.object({
  employeeId: z.string().min(1, "Select an employee"),
  shiftId: optionalText,
  date: z.string().min(1, "Date is required"),
  at: optionalText,
  location: optionalText,
  notes: optionalText,
});

export const attendanceCorrectionSchema = z
  .object({
    employeeId: z.string().min(1, "Select an employee"),
    attendanceRecordId: optionalText,
    date: z.string().min(1, "Attendance date is required"),
    requestedCheckInAt: optionalText,
    requestedCheckOutAt: optionalText,
    requestedStatus: optionalText,
    reason: z.string().min(5, "Explain why this correction is needed"),
  })
  .refine(
    (value) =>
      !value.requestedCheckInAt ||
      !value.requestedCheckOutAt ||
      value.requestedCheckOutAt >= value.requestedCheckInAt,
    { message: "Requested check-out cannot be before check-in", path: ["requestedCheckOutAt"] },
  );

export const correctionReviewSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  reviewComment: optionalText,
});

export const shiftSchema = z.object({
  name: z.string().min(2, "Shift name is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  graceMinutes: z.number().int().min(0).max(240),
});

export const holidaySchema = z.object({
  name: z.string().min(2, "Holiday name is required"),
  date: z.string().min(1, "Date is required"),
  description: optionalText,
  recurring: z.boolean(),
});

export type ManualAttendanceFormValues = z.infer<typeof manualAttendanceSchema>;
export type AttendanceActionFormValues = z.infer<typeof attendanceActionSchema>;
export type AttendanceCorrectionFormValues = z.infer<typeof attendanceCorrectionSchema>;
export type CorrectionReviewFormValues = z.infer<typeof correctionReviewSchema>;
export type ShiftFormValues = z.infer<typeof shiftSchema>;
export type HolidayFormValues = z.infer<typeof holidaySchema>;
