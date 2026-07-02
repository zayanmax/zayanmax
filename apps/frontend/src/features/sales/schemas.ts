import { z } from "zod";

export const leadStatuses = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "PROPOSAL",
  "NEGOTIATION",
  "WON",
  "LOST",
  "ARCHIVED",
] as const;

export const opportunityStatuses = ["OPEN", "WON", "LOST", "CANCELLED"] as const;

export const quotationStatuses = [
  "DRAFT",
  "SENT",
  "ACCEPTED",
  "REJECTED",
  "EXPIRED",
  "CANCELLED",
] as const;

const optionalString = z.string().trim().optional();
const optionalEmail = z
  .string()
  .trim()
  .optional()
  .refine((value) => !value || z.string().email().safeParse(value).success, {
    message: "Enter a valid email address",
  });
const optionalUrl = z
  .string()
  .trim()
  .optional()
  .refine((value) => !value || z.string().url().safeParse(value).success, {
    message: "Enter a valid URL",
  });

export const leadSchema = z.object({
  sourceId: optionalString,
  stageId: optionalString,
  name: z.string().trim().min(2, "Lead name must be at least 2 characters"),
  companyName: optionalString,
  email: optionalEmail,
  phone: optionalString,
  website: optionalUrl,
  industry: optionalString,
  estimatedValue: z.number().min(0).optional(),
  assignedEmployeeId: optionalString,
  notes: optionalString,
});

export const leadActivitySchema = z.object({
  activityType: z.string().trim().min(1, "Activity type is required"),
  title: z.string().trim().min(2, "Title must be at least 2 characters"),
  description: optionalString,
  activityAt: optionalString,
});

export const leadNoteSchema = z.object({
  note: z.string().trim().min(1, "Note is required"),
});

export const opportunitySchema = z.object({
  leadId: optionalString,
  clientId: optionalString,
  stageId: optionalString,
  name: z.string().trim().min(2, "Opportunity name must be at least 2 characters"),
  description: optionalString,
  expectedValue: z.number().min(0).optional(),
  probability: z.number().int().min(0).max(100).optional(),
  expectedCloseDate: optionalString,
  assignedEmployeeId: optionalString,
});

export const quotationItemSchema = z.object({
  description: z.string().trim().min(1, "Description is required"),
  quantity: z.number().min(0),
  unitPrice: z.number().min(0),
  discountAmount: z.number().min(0).optional(),
  taxAmount: z.number().min(0).optional(),
});

export const quotationSchema = z.object({
  opportunityId: optionalString,
  leadId: optionalString,
  clientId: optionalString,
  quotationNumber: z.string().trim().min(1, "Quotation number is required"),
  title: z.string().trim().min(2, "Title must be at least 2 characters"),
  currency: z.string().trim().min(1, "Currency is required"),
  validUntil: optionalString,
  terms: optionalString,
  notes: optionalString,
  items: z.array(quotationItemSchema).min(1, "Add at least one line item"),
});

export const quotationUpdateSchema = quotationSchema.omit({
  opportunityId: true,
  leadId: true,
  clientId: true,
  quotationNumber: true,
  items: true,
});

export type LeadFormValues = z.infer<typeof leadSchema>;
export type LeadActivityFormValues = z.infer<typeof leadActivitySchema>;
export type LeadNoteFormValues = z.infer<typeof leadNoteSchema>;
export type OpportunityFormValues = z.infer<typeof opportunitySchema>;
export type QuotationFormValues = z.infer<typeof quotationSchema>;
export type QuotationUpdateFormValues = z.infer<typeof quotationUpdateSchema>;
