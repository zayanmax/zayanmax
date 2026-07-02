import { z } from "zod";

export const notificationCategoryOptions = [
  "GENERAL",
  "SYSTEM",
  "HR",
  "ATTENDANCE",
  "LEAVE",
  "PAYROLL",
  "FINANCE",
  "PURCHASE",
  "INVENTORY",
  "ASSET",
  "CLIENT",
  "PROJECT",
  "TASK",
  "DOCUMENT",
  "KNOWLEDGE_BASE",
] as const;

export const notificationPriorityOptions = ["LOW", "NORMAL", "HIGH", "URGENT"] as const;
export const notificationChannelOptions = ["IN_APP", "EMAIL", "SMS", "WHATSAPP", "PUSH"] as const;
export const reminderStatusOptions = ["PENDING", "SENT", "CANCELLED"] as const;
export const notificationEntityTypeOptions = [
  "EMPLOYEE",
  "CLIENT",
  "PROJECT",
  "TASK",
  "ATTENDANCE",
  "LEAVE",
  "PAYROLL",
  "FINANCE",
  "PURCHASE",
  "INVENTORY",
  "ASSET",
  "DOCUMENT",
  "KNOWLEDGE_BASE",
] as const;

export const notificationTypeSchema = z.object({
  code: z.string().min(1, "Code is required"),
  name: z.string().min(1, "Name is required"),
  category: z.enum(notificationCategoryOptions),
  description: z.string(),
});

export type NotificationTypeFormValues = z.infer<typeof notificationTypeSchema>;

export const notificationTemplateSchema = z.object({
  notificationTypeId: z.string(),
  code: z.string().min(1, "Code is required"),
  name: z.string().min(1, "Name is required"),
  channel: z.enum(notificationChannelOptions),
  category: z.enum(notificationCategoryOptions),
  subject: z.string(),
  bodyTemplate: z.string().min(1, "Template body is required"),
});

export type NotificationTemplateFormValues = z.infer<typeof notificationTemplateSchema>;

export const notificationPreferenceSchema = z.object({
  category: z.enum(notificationCategoryOptions),
  channel: z.enum(notificationChannelOptions),
  enabled: z.boolean(),
});

export type NotificationPreferenceFormValues = z.infer<typeof notificationPreferenceSchema>;

export const reminderSchema = z.object({
  recipientUserId: z.string().min(1, "Recipient user ID is required"),
  title: z.string().min(1, "Title is required"),
  body: z.string(),
  remindAt: z.string().min(1, "Reminder date/time is required"),
  category: z.enum(notificationCategoryOptions),
  priority: z.enum(notificationPriorityOptions),
  entityType: z.union([z.enum(notificationEntityTypeOptions), z.literal("__none__")]),
  entityId: z.string(),
});

export type ReminderFormValues = z.infer<typeof reminderSchema>;
