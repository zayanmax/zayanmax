import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationsApi } from "@/features/notifications/api";
import type {
  NotificationListQuery,
  NotificationPreferencePayload,
  NotificationTemplatePayload,
  NotificationTypePayload,
  ReminderPayload,
} from "@/features/notifications/types";

export const notificationKeys = {
  all: ["notifications"] as const,
  types: (query: NotificationListQuery) => [...notificationKeys.all, "types", query] as const,
  notifications: (query: NotificationListQuery) => [...notificationKeys.all, "notifications", query] as const,
  preferences: (query: NotificationListQuery) => [...notificationKeys.all, "preferences", query] as const,
  templates: (query: NotificationListQuery) => [...notificationKeys.all, "templates", query] as const,
  reminders: (query: NotificationListQuery) => [...notificationKeys.all, "reminders", query] as const,
};

function useInvalidateNotifications() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: notificationKeys.all });
}

export function useNotificationTypes(query: NotificationListQuery) {
  return useQuery({
    queryKey: notificationKeys.types(query),
    queryFn: () => notificationsApi.listNotificationTypes(query),
  });
}

export function useCreateNotificationType() {
  const invalidate = useInvalidateNotifications();
  return useMutation({
    mutationFn: (payload: NotificationTypePayload) => notificationsApi.createNotificationType(payload),
    onSuccess: async () => invalidate(),
  });
}

export function useNotifications(query: NotificationListQuery) {
  return useQuery({
    queryKey: notificationKeys.notifications(query),
    queryFn: () => notificationsApi.listNotifications(query),
  });
}

export function useMarkNotificationRead() {
  const invalidate = useInvalidateNotifications();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: async () => invalidate(),
  });
}

export function useMarkNotificationUnread() {
  const invalidate = useInvalidateNotifications();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markUnread(id),
    onSuccess: async () => invalidate(),
  });
}

export function useNotificationPreferences(query: NotificationListQuery) {
  return useQuery({
    queryKey: notificationKeys.preferences(query),
    queryFn: () => notificationsApi.listPreferences(query),
  });
}

export function useUpsertNotificationPreference() {
  const invalidate = useInvalidateNotifications();
  return useMutation({
    mutationFn: (payload: NotificationPreferencePayload) => notificationsApi.upsertPreference(payload),
    onSuccess: async () => invalidate(),
  });
}

export function useNotificationTemplates(query: NotificationListQuery) {
  return useQuery({
    queryKey: notificationKeys.templates(query),
    queryFn: () => notificationsApi.listTemplates(query),
  });
}

export function useCreateNotificationTemplate() {
  const invalidate = useInvalidateNotifications();
  return useMutation({
    mutationFn: (payload: NotificationTemplatePayload) => notificationsApi.createTemplate(payload),
    onSuccess: async () => invalidate(),
  });
}

export function useReminders(query: NotificationListQuery) {
  return useQuery({
    queryKey: notificationKeys.reminders(query),
    queryFn: () => notificationsApi.listReminders(query),
  });
}

export function useCreateReminder() {
  const invalidate = useInvalidateNotifications();
  return useMutation({
    mutationFn: (payload: ReminderPayload) => notificationsApi.createReminder(payload),
    onSuccess: async () => invalidate(),
  });
}
