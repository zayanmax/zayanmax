import { z } from "zod";

export const calendarEventTypeOptions = [
  "MEETING",
  "TASK_DEADLINE",
  "PROJECT_MILESTONE",
  "HOLIDAY",
  "INTERVIEW",
  "CLIENT_MEETING",
  "REMINDER",
  "BIRTHDAY",
  "WORK_ANNIVERSARY",
  "CUSTOM",
] as const;

export const calendarEventStatusOptions = ["SCHEDULED", "COMPLETED", "CANCELLED", "POSTPONED"] as const;
export const calendarRsvpStatusOptions = ["ACCEPTED", "DECLINED", "TENTATIVE"] as const;
export const calendarEntityTypeOptions = ["EMPLOYEE", "CLIENT", "PROJECT", "TASK", "LEAVE", "HOLIDAY", "DOCUMENT"] as const;
export const notificationChannelOptions = ["IN_APP", "EMAIL", "SMS", "WHATSAPP", "PUSH"] as const;
export const recordStatusOptions = ["ACTIVE", "INACTIVE"] as const;

const optionalUuid = z.string().trim().uuid("Must be a valid UUID").or(z.literal("")).optional();

export const calendarEventSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().optional(),
  eventType: z.enum(calendarEventTypeOptions),
  startAt: z.string().min(1, "Start date/time is required"),
  endAt: z.string().min(1, "End date/time is required"),
  timezone: z.string().trim().optional(),
  location: z.string().trim().optional(),
  isAllDay: z.boolean(),
  recurrenceRule: z.string().trim().optional(),
  recurrenceEndsAt: z.string().optional(),
  entityType: z.enum(calendarEntityTypeOptions).or(z.literal("__none__")),
  entityId: optionalUuid,
  attendeeUserIds: z.string().optional(),
  resourceId: optionalUuid,
  reminderMethod: z.enum(notificationChannelOptions).or(z.literal("__none__")),
  reminderAt: z.string().optional(),
  reminderMinutesBefore: z.string().optional(),
  reminderMessage: z.string().optional(),
}).refine((values) => new Date(values.startAt).getTime() < new Date(values.endAt).getTime(), {
  path: ["endAt"],
  message: "End date/time must be after start date/time",
});

export type CalendarEventFormValues = z.infer<typeof calendarEventSchema>;

export const calendarResourceSchema = z.object({
  name: z.string().trim().min(1, "Resource name is required"),
  type: z.string().trim().optional(),
  location: z.string().trim().optional(),
  capacity: z.string().optional(),
  description: z.string().trim().optional(),
});

export type CalendarResourceFormValues = z.infer<typeof calendarResourceSchema>;

export const calendarResourceBookingSchema = z.object({
  resourceId: z.string().trim().uuid("Resource is required"),
  eventId: z.string().trim().uuid("Event ID must be a valid UUID"),
  startAt: z.string().min(1, "Start date/time is required"),
  endAt: z.string().min(1, "End date/time is required"),
}).refine((values) => new Date(values.startAt).getTime() < new Date(values.endAt).getTime(), {
  path: ["endAt"],
  message: "End date/time must be after start date/time",
});

export type CalendarResourceBookingFormValues = z.infer<typeof calendarResourceBookingSchema>;
