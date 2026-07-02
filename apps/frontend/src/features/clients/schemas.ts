import { z } from "zod";

export const clientTypes = ["COMPANY", "INDIVIDUAL"] as const;
export const clientStatuses = ["ACTIVE", "INACTIVE", "PROSPECT", "ARCHIVED"] as const;
export const clientActivityTypes = [
  "CALL",
  "EMAIL",
  "MEETING",
  "FOLLOW_UP",
  "NOTE",
  "STATUS_CHANGE",
  "DOCUMENT",
  "OTHER",
] as const;
export const clientDocumentCategories = [
  "CONTRACT",
  "TAX",
  "PROPOSAL",
  "IDENTITY",
  "OTHER",
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

export const clientSchema = z.object({
  type: z.enum(clientTypes),
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: optionalEmail,
  phone: optionalString,
  website: optionalUrl,
  industry: optionalString,
  companySize: optionalString,
  taxNumber: optionalString,
  billingAddress: optionalString,
  status: z.enum(clientStatuses),
  ownerId: optionalString,
});

export const clientContactSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  designation: optionalString,
  email: optionalEmail,
  phone: optionalString,
  isPrimary: z.boolean().optional(),
});

export const clientActivitySchema = z.object({
  type: z.enum(clientActivityTypes),
  title: z.string().trim().min(2, "Title must be at least 2 characters"),
  description: optionalString,
  dueAt: optionalString,
  completedAt: optionalString,
});

export const clientNoteSchema = z.object({
  noteText: z.string().trim().min(1, "Note is required"),
});

export const clientDocumentSchema = z.object({
  fileName: z.string().trim().min(2, "File name must be at least 2 characters"),
  storageKey: z.string().trim().min(2, "Storage key must be at least 2 characters"),
  mimeType: z.string().trim().min(2, "MIME type is required"),
  size: z.number().int().min(1, "Size must be at least 1 byte"),
  category: z.enum(clientDocumentCategories),
});

export type ClientFormValues = z.infer<typeof clientSchema>;
export type ClientContactFormValues = z.infer<typeof clientContactSchema>;
export type ClientActivityFormValues = z.infer<typeof clientActivitySchema>;
export type ClientNoteFormValues = z.infer<typeof clientNoteSchema>;
export type ClientDocumentFormValues = z.infer<typeof clientDocumentSchema>;
