export enum AnnouncementStatusDto {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export enum AnnouncementAudienceTypeDto {
  ALL_COMPANY = 'ALL_COMPANY',
  BRANCH = 'BRANCH',
  DEPARTMENT = 'DEPARTMENT',
  EMPLOYEE = 'EMPLOYEE',
  ROLE = 'ROLE',
}

export enum NotificationCategoryDto {
  GENERAL = 'GENERAL',
  SYSTEM = 'SYSTEM',
  HR = 'HR',
  ATTENDANCE = 'ATTENDANCE',
  LEAVE = 'LEAVE',
  PAYROLL = 'PAYROLL',
  FINANCE = 'FINANCE',
  PURCHASE = 'PURCHASE',
  INVENTORY = 'INVENTORY',
  ASSET = 'ASSET',
  CLIENT = 'CLIENT',
  PROJECT = 'PROJECT',
  TASK = 'TASK',
  DOCUMENT = 'DOCUMENT',
  KNOWLEDGE_BASE = 'KNOWLEDGE_BASE',
}

export enum NotificationPriorityDto {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum NotificationEntityTypeDto {
  EMPLOYEE = 'EMPLOYEE',
  CLIENT = 'CLIENT',
  PROJECT = 'PROJECT',
  TASK = 'TASK',
  ATTENDANCE = 'ATTENDANCE',
  LEAVE = 'LEAVE',
  PAYROLL = 'PAYROLL',
  FINANCE = 'FINANCE',
  PURCHASE = 'PURCHASE',
  INVENTORY = 'INVENTORY',
  ASSET = 'ASSET',
  DOCUMENT = 'DOCUMENT',
  KNOWLEDGE_BASE = 'KNOWLEDGE_BASE',
}

export enum NotificationDeliveryChannelDto {
  IN_APP = 'IN_APP',
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  WHATSAPP = 'WHATSAPP',
  PUSH = 'PUSH',
}

export enum NotificationDeliveryStatusDto {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
  SKIPPED = 'SKIPPED',
}

export enum ReminderStatusDto {
  PENDING = 'PENDING',
  SENT = 'SENT',
  CANCELLED = 'CANCELLED',
}
