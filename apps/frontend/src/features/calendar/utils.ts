import type {
  CalendarEvent,
  CalendarEventPayload,
  CalendarEventUpdatePayload,
  CalendarResource,
  CalendarResourceBookingPayload,
  CalendarResourcePayload,
} from "@/features/calendar/types";
import type {
  CalendarEventFormValues,
  CalendarResourceBookingFormValues,
  CalendarResourceFormValues,
} from "@/features/calendar/schemas";

export const ALL = "__all__";
export const NONE = "__none__";

export function formatCalendarDateTime(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatCalendarDate(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(new Date(value));
}

export function toDateTimeLocal(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return offsetDate.toISOString().slice(0, 16);
}

export function toDateInput(value?: string | null) {
  if (!value) return undefined;
  return new Date(value).toISOString().slice(0, 10);
}

export function dateRangeToQuery(fromDate?: string, toDate?: string) {
  return {
    fromDate: fromDate ? new Date(`${fromDate}T00:00:00`).toISOString() : undefined,
    toDate: toDate ? new Date(`${toDate}T23:59:59`).toISOString() : undefined,
  };
}

export function toIsoDateTime(value?: string) {
  return value ? new Date(value).toISOString() : undefined;
}

export function readableEnum(value?: string | null) {
  if (!value) return "-";
  return value.replaceAll("_", " ");
}

export function linkedEntityLabel(event: Pick<CalendarEvent, "entityType" | "entityId">) {
  if (!event.entityType) return "-";
  return `${readableEnum(event.entityType)}${event.entityId ? ` (${event.entityId.slice(0, 8)})` : ""}`;
}

export function eventResourceLabel(event: Pick<CalendarEvent, "location" | "resourceBookings">) {
  const booking = event.resourceBookings?.[0];
  if (booking?.resource?.name) return booking.resource.name;
  if (event.location) return event.location;
  return "-";
}

export function splitIds(value?: string) {
  return (value ?? "")
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function optionalNumber(value?: string) {
  if (!value?.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function calendarEventDefaultValues(event?: CalendarEvent): CalendarEventFormValues {
  return {
    title: event?.title ?? "",
    description: event?.description ?? "",
    eventType: event?.eventType ?? "MEETING",
    startAt: toDateTimeLocal(event?.startAt),
    endAt: toDateTimeLocal(event?.endAt),
    timezone: event?.timezone ?? "Asia/Kolkata",
    location: event?.location ?? "",
    isAllDay: event?.isAllDay ?? false,
    recurrenceRule: event?.recurrenceRule ?? "",
    recurrenceEndsAt: toDateTimeLocal(event?.recurrenceEndsAt),
    entityType: event?.entityType ?? NONE,
    entityId: event?.entityId ?? "",
    attendeeUserIds: event?.attendees?.map((attendee) => attendee.userId).join(", ") ?? "",
    resourceId: event?.resourceBookings?.[0]?.resourceId ?? "",
    reminderMethod: event?.reminders?.[0]?.method ?? NONE,
    reminderAt: toDateTimeLocal(event?.reminders?.[0]?.remindAt),
    reminderMinutesBefore: event?.reminders?.[0]?.minutesBefore?.toString() ?? "",
    reminderMessage: event?.reminders?.[0]?.message ?? "",
  };
}

export function toCalendarEventPayload(values: CalendarEventFormValues): CalendarEventPayload {
  const attendeeIds = splitIds(values.attendeeUserIds);
  const startAt = toIsoDateTime(values.startAt) ?? "";
  const endAt = toIsoDateTime(values.endAt) ?? "";
  const reminderAt = toIsoDateTime(values.reminderAt);
  return {
    title: values.title.trim(),
    description: values.description?.trim() || undefined,
    eventType: values.eventType,
    startAt,
    endAt,
    timezone: values.timezone?.trim() || "Asia/Kolkata",
    location: values.location?.trim() || undefined,
    isAllDay: values.isAllDay,
    recurrenceRule: values.recurrenceRule?.trim() || undefined,
    recurrenceEndsAt: toIsoDateTime(values.recurrenceEndsAt),
    entityType: values.entityType === NONE ? undefined : values.entityType,
    entityId: values.entityId?.trim() || undefined,
    attendees: attendeeIds.map((userId) => ({ userId })),
    resourceBookings: values.resourceId
      ? [{ resourceId: values.resourceId, startAt, endAt }]
      : undefined,
    reminders: reminderAt
      ? [{
          method: values.reminderMethod === NONE ? undefined : values.reminderMethod,
          remindAt: reminderAt,
          minutesBefore: optionalNumber(values.reminderMinutesBefore),
          message: values.reminderMessage?.trim() || undefined,
        }]
      : undefined,
  };
}

export function toCalendarEventUpdatePayload(values: CalendarEventFormValues): CalendarEventUpdatePayload {
  return {
    title: values.title.trim(),
    description: values.description?.trim() || undefined,
    eventType: values.eventType,
    startAt: toIsoDateTime(values.startAt),
    endAt: toIsoDateTime(values.endAt),
    timezone: values.timezone?.trim() || "Asia/Kolkata",
    location: values.location?.trim() || undefined,
    isAllDay: values.isAllDay,
    recurrenceRule: values.recurrenceRule?.trim() || undefined,
    recurrenceEndsAt: toIsoDateTime(values.recurrenceEndsAt),
  };
}

export function toCalendarResourcePayload(values: CalendarResourceFormValues): CalendarResourcePayload {
  return {
    name: values.name.trim(),
    type: values.type?.trim() || undefined,
    location: values.location?.trim() || undefined,
    capacity: optionalNumber(values.capacity),
    description: values.description?.trim() || undefined,
  };
}

export function toCalendarBookingPayload(values: CalendarResourceBookingFormValues): CalendarResourceBookingPayload {
  return {
    eventId: values.eventId.trim(),
    startAt: toIsoDateTime(values.startAt) ?? "",
    endAt: toIsoDateTime(values.endAt) ?? "",
  };
}

export function resourceLabel(resource?: CalendarResource | null) {
  if (!resource) return "-";
  return [resource.name, resource.location].filter(Boolean).join(" · ");
}
