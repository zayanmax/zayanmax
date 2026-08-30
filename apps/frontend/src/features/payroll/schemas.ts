import { z } from "zod";

export const salaryComponentSchema = z.object({
  name: z.string().trim().min(2, "Component name is required"),
  code: z.string().trim().min(2, "Code is required").max(20),
  type: z.enum(["EARNING", "DEDUCTION"]),
  calculationType: z.enum(["FIXED", "PERCENTAGE"]),
  amount: z.number().min(0, "Value cannot be negative"),
  taxable: z.boolean(),
}).refine((value) => value.calculationType !== "PERCENTAGE" || value.amount <= 100, { message: "Percentage cannot exceed 100", path: ["amount"] });

export const salaryStructureSchema = z.object({
  name: z.string().trim().min(2, "Structure name is required"),
  description: z.string().trim().max(500).optional(),
  components: z.array(salaryComponentSchema).min(1, "Add at least one component"),
});

export const salaryAssignmentSchema = z.object({
  employeeId: z.string().min(1, "Select an employee"),
  salaryStructureId: z.string().min(1, "Select a salary structure"),
  effectiveFrom: z.string().min(1, "Effective date is required"),
  effectiveTo: z.string(),
  monthlyGross: z.number().min(0, "Monthly gross cannot be negative"),
}).refine((value) => !value.effectiveTo || value.effectiveTo >= value.effectiveFrom, { message: "End date cannot precede start date", path: ["effectiveTo"] });

export const salaryAdvanceSchema = z.object({
  employeeId: z.string().min(1, "Select an employee"),
  amount: z.number().positive("Advance must be greater than zero"),
  installmentAmount: z.number().positive("Installment must be greater than zero"),
  notes: z.string().trim().max(500).optional(),
}).refine((value) => value.installmentAmount <= value.amount, { message: "Installment cannot exceed advance", path: ["installmentAmount"] });

export const payrollPeriodSchema = z.object({
  name: z.string().trim().min(2, "Period name is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  payDate: z.string(),
}).refine((value) => value.endDate >= value.startDate, { message: "End date cannot precede start date", path: ["endDate"] }).refine((value) => !value.payDate || value.payDate >= value.endDate, { message: "Pay date cannot precede period end", path: ["payDate"] });

export const payrollRunSchema = z.object({ payrollPeriodId: z.string().min(1, "Select a payroll period"), notes: z.string().trim().max(500).optional() });

export type SalaryStructureFormValues = z.infer<typeof salaryStructureSchema>;
export type SalaryAssignmentFormValues = z.infer<typeof salaryAssignmentSchema>;
export type SalaryAdvanceFormValues = z.infer<typeof salaryAdvanceSchema>;
export type PayrollPeriodFormValues = z.infer<typeof payrollPeriodSchema>;
export type PayrollRunFormValues = z.infer<typeof payrollRunSchema>;
