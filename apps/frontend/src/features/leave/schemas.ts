import { z } from "zod";

export const leaveRequestSchema = z
  .object({
    employeeId: z.string().min(1, "Select an employee"),
    leaveTypeId: z.string().min(1, "Select a leave type"),
    fromDate: z.string().min(1, "Start date is required"),
    toDate: z.string().min(1, "End date is required"),
    reason: z.string().trim().min(3, "Add a short reason").max(500),
  })
  .refine((value) => value.toDate >= value.fromDate, {
    message: "End date cannot be before start date",
    path: ["toDate"],
  })
  .refine((value) => value.fromDate.slice(0, 4) === value.toDate.slice(0, 4), {
    message: "A request cannot span two balance years",
    path: ["toDate"],
  });

export const leaveTypeSchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  code: z.string().trim().min(2, "Code is required").max(12),
  annualAllowance: z.number().min(0).max(366),
  requiresApproval: z.boolean(),
  paid: z.boolean(),
});

export const leaveBalanceSchema = z
  .object({
    employeeId: z.string().min(1, "Select an employee"),
    leaveTypeId: z.string().min(1, "Select a leave type"),
    year: z.number().int().min(2000).max(2100),
    openingBalance: z.number().min(0),
    accrued: z.number().min(0),
    used: z.number().min(0),
  })
  .refine((value) => value.used <= value.openingBalance + value.accrued, {
    message: "Used days cannot exceed available days",
    path: ["used"],
  });

export type LeaveRequestFormValues = z.infer<typeof leaveRequestSchema>;
export type LeaveTypeFormValues = z.infer<typeof leaveTypeSchema>;
export type LeaveBalanceFormValues = z.infer<typeof leaveBalanceSchema>;
