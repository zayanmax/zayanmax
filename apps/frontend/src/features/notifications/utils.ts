import type {
  NotificationPreferenceFormValues,
  NotificationTemplateFormValues,
  NotificationTypeFormValues,
  ReminderFormValues,
} from "@/features/notifications/schemas";
import type {
  NotificationPreferencePayload,
  NotificationTemplatePayload,
  NotificationTypePayload,
  ReminderPayload,
} from "@/features/notifications/types";

export const ALL = "__all__";
export const NONE = "__none__";

export function formatNotificationDate(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function entityLabel(entityType?: string | null, entityId?: string | null) {
  if (!entityType) return "-";
  return `${entityType.replaceAll("_", " ")}${entityId ? ` (${entityId.slice(0, 8)})` : ""}`;
}

export function deliveryChannels(channels?: Array<{ channel: string }>) {
  if (!channels?.length) return "-";
  return channels.map((delivery) => delivery.channel.replaceAll("_", " ")).join(", ");
}

export function toNotificationTypePayload(values: NotificationTypeFormValues): NotificationTypePayload {
  return {
    code: values.code.trim(),
    name: values.name.trim(),
    category: values.category,
    description: values.description.trim() || undefined,
  };
}

export function toTemplatePayload(values: NotificationTemplateFormValues): NotificationTemplatePayload {
  return {
    notificationTypeId: values.notificationTypeId === NONE ? undefined : values.notificationTypeId,
    code: values.code.trim(),
    name: values.name.trim(),
    channel: values.channel,
    category: values.category,
    subject: values.subject.trim() || undefined,
    bodyTemplate: values.bodyTemplate.trim(),
  };
}

export function toPreferencePayload(values: NotificationPreferenceFormValues): NotificationPreferencePayload {
  return {
    category: values.category,
    channel: values.channel,
    enabled: values.enabled,
  };
}

export function toReminderPayload(values: ReminderFormValues): ReminderPayload {
  return {
    recipientUserId: values.recipientUserId.trim(),
    title: values.title.trim(),
    body: values.body.trim() || undefined,
    remindAt: new Date(values.remindAt).toISOString(),
    category: values.category,
    priority: values.priority,
    entityType: values.entityType === NONE ? undefined : values.entityType,
    entityId: values.entityId.trim() || undefined,
  };
}
