import { apiRequest } from "@/lib/api/client";
import type {
  InternalNotification,
  NotificationListQuery,
  NotificationListResult,
  NotificationPayload,
  NotificationPreference,
  NotificationPreferencePayload,
  NotificationTemplate,
  NotificationTemplatePayload,
  NotificationType,
  NotificationTypePayload,
  ReminderPayload,
  ReminderRecord,
} from "@/features/notifications/types";

export const notificationsApi = {
  listNotificationTypes: (params: NotificationListQuery) =>
    apiRequest<NotificationListResult<NotificationType>>({
      url: "/notification-types",
      method: "GET",
      params,
    }),
  createNotificationType: (payload: NotificationTypePayload) =>
    apiRequest<NotificationType>({
      url: "/notification-types",
      method: "POST",
      data: payload,
    }),
  listNotifications: (params: NotificationListQuery) =>
    apiRequest<NotificationListResult<InternalNotification>>({
      url: "/notifications",
      method: "GET",
      params,
    }),
  createNotification: (payload: NotificationPayload) =>
    apiRequest<InternalNotification>({
      url: "/notifications",
      method: "POST",
      data: payload,
    }),
  markRead: (id: string) =>
    apiRequest<InternalNotification>({
      url: `/notifications/${id}/read`,
      method: "PATCH",
    }),
  markUnread: (id: string) =>
    apiRequest<InternalNotification>({
      url: `/notifications/${id}/unread`,
      method: "PATCH",
    }),
  listPreferences: (params: NotificationListQuery) =>
    apiRequest<NotificationListResult<NotificationPreference>>({
      url: "/notification-preferences",
      method: "GET",
      params,
    }),
  upsertPreference: (payload: NotificationPreferencePayload) =>
    apiRequest<NotificationPreference>({
      url: "/notification-preferences",
      method: "POST",
      data: payload,
    }),
  listTemplates: (params: NotificationListQuery) =>
    apiRequest<NotificationListResult<NotificationTemplate>>({
      url: "/notification-templates",
      method: "GET",
      params,
    }),
  createTemplate: (payload: NotificationTemplatePayload) =>
    apiRequest<NotificationTemplate>({
      url: "/notification-templates",
      method: "POST",
      data: payload,
    }),
  listReminders: (params: NotificationListQuery) =>
    apiRequest<NotificationListResult<ReminderRecord>>({
      url: "/reminders",
      method: "GET",
      params,
    }),
  createReminder: (payload: ReminderPayload) =>
    apiRequest<ReminderRecord>({
      url: "/reminders",
      method: "POST",
      data: payload,
    }),
};
