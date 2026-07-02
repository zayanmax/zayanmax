import { z } from "zod";

export const employmentTypes = [
  "FULL_TIME",
  "PART_TIME",
  "CONTRACT",
  "INTERN",
] as const;

export const employeeSchema = z.object({
  employeeCode: z.string().min(2, "Employee code must be at least 2 characters"),
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Enter a valid email address"),
  phone: z.string().optional(),
  branchId: z.string().optional(),
  departmentId: z.string().optional(),
  designationId: z.string().optional(),
  reportingManagerId: z.string().optional(),
  joiningDate: z.string().min(1, "Joining date is required"),
  employmentType: z.enum(employmentTypes),
});

export type EmployeeFormValues = z.infer<typeof employeeSchema>;
