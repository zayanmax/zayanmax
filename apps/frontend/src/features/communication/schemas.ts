import { z } from "zod";

export const announcementStatusOptions = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
export const announcementAudienceTypeOptions = [
  "ALL_COMPANY",
  "BRANCH",
  "DEPARTMENT",
  "EMPLOYEE",
  "ROLE",
] as const;

export const announcementSchema = z.object({
  title: z.string().min(1, "Title is required"),
  body: z.string().min(1, "Body is required"),
  audienceType: z.enum(announcementAudienceTypeOptions),
  branchId: z.string(),
  departmentId: z.string(),
  employeeId: z.string(),
  roleId: z.string(),
});

export type AnnouncementFormValues = z.infer<typeof announcementSchema>;
