import type { ApiMeta } from "@/types/api";

export type NotificationCategory =
  | "GENERAL"
  | "SYSTEM"
  | "HR"
  | "ATTENDANCE"
  | "LEAVE"
  | "PAYROLL"
  | "FINANCE"
  | "PURCHASE"
  | "INVENTORY"
  | "ASSET"
  | "CLIENT"
  | "PROJECT"
  | "TASK"
  | "DOCUMENT"
  | "KNOWLEDGE_BASE";
export type NotificationPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";
export type NotificationEntityType =
  | "EMPLOYEE"
  | "CLIENT"
  | "PROJECT"
  | "TASK"
  | "ATTENDANCE"
  | "LEAVE"
  | "PAYROLL"
  | "FINANCE"
  | "PURCHASE"
  | "INVENTORY"
  | "ASSET"
  | "DOCUMENT"
  | "KNOWLEDGE_BASE";
export type NotificationDeliveryChannel = "IN_APP" | "EMAIL" | "SMS" | "WHATSAPP" | "PUSH";
export type NotificationDeliveryStatus = "PENDING" | "SENT" | "FAILED" | "SKIPPED";
export type ReminderStatus = "PENDING" | "SENT" | "CANCELLED";

export type NotificationDelivery = {
  id?: string;
  channel: NotificationDeliveryChannel;
  status: NotificationDeliveryStatus;
  createdAt?: string;
  updatedAt?: string;
};

export type NotificationType = {
  id: string;
  code: string;
  name: string;
  category: NotificationCategory;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type InternalNotification = {
  id: string;
  recipientUserId: string;
  notificationTypeId?: string | null;
  title: string;
  body: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  entityType?: NotificationEntityType | null;
  entityId?: string | null;
  isRead: boolean;
  readAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  deliveries?: NotificationDelivery[];
};

export type NotificationPreference = {
  id: string;
  userId: string;
  category: NotificationCategory;
  channel: NotificationDeliveryChannel;
  enabled: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type NotificationTemplate = {
  id: string;
  notificationTypeId?: string | null;
  code: string;
  name: string;
  channel: NotificationDeliveryChannel;
  category: NotificationCategory;
  subject?: string | null;
  bodyTemplate: string;
  createdAt?: string;
  updatedAt?: string;
};

export type ReminderRecord = {
  id: string;
  recipientUserId: string;
  title: string;
  body?: string | null;
  remindAt: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  entityType?: NotificationEntityType | null;
  entityId?: string | null;
  status: ReminderStatus;
  createdAt?: string;
  updatedAt?: string;
};

export type NotificationListQuery = {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  recipientUserId?: string;
  category?: NotificationCategory;
  priority?: NotificationPriority;
  entityType?: NotificationEntityType;
  entityId?: string;
  isRead?: boolean;
  channel?: NotificationDeliveryChannel;
  status?: ReminderStatus;
};

export type NotificationListResult<T> = {
  data: T[];
  meta: Required<ApiMeta>;
};

export type NotificationPayload = {
  recipientUserId: string;
  notificationTypeId?: string;
  title: string;
  body: string;
  category?: NotificationCategory;
  priority?: NotificationPriority;
  entityType?: NotificationEntityType;
  entityId?: string;
  channels?: NotificationDeliveryChannel[];
};

export type NotificationTypePayload = {
  code: string;
  name: string;
  category: NotificationCategory;
  description?: string;
};

export type NotificationTemplatePayload = {
  notificationTypeId?: string;
  code: string;
  name: string;
  channel: NotificationDeliveryChannel;
  category?: NotificationCategory;
  subject?: string;
  bodyTemplate: string;
};

export type NotificationPreferencePayload = {
  channel: NotificationDeliveryChannel;
  category?: NotificationCategory;
  enabled: boolean;
};

export type ReminderPayload = {
  recipientUserId: string;
  title: string;
  body?: string;
  remindAt: string;
  category?: NotificationCategory;
  priority?: NotificationPriority;
  entityType?: NotificationEntityType;
  entityId?: string;
};
