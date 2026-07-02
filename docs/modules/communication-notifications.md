# Communication, Announcements & Notifications Module

Last updated: 2026-06-13

## Scope

Implemented backend-only Communication, Announcements & Notifications foundation.

Included:

- Company announcements.
- Announcement audience targeting for all company, branch, department, employee, and role.
- Announcement status flow: `DRAFT`, `PUBLISHED`, `ARCHIVED`.
- Announcement read receipts.
- Internal in-app notification records.
- Notification type/category metadata.
- Notification read/unread state.
- Notification priority.
- Notification entity linking metadata for employee, client, project, task, attendance, leave, payroll, finance, purchase, inventory, asset, document, and knowledge base records.
- Notification delivery channel metadata: `IN_APP`, `EMAIL`, `SMS`, `WHATSAPP`, `PUSH`.
- Notification delivery status metadata: `PENDING`, `SENT`, `FAILED`, `SKIPPED`.
- Notification preferences per user.
- Notification template metadata.
- Basic reminder records for future scheduled reminders.
- Search, filters, sorting, and pagination.
- Audit logs for announcement create/update/publish/archive and notification preference changes.

Excluded for now:

- Frontend screens.
- Real email, SMS, WhatsApp, push, or provider integrations.
- BullMQ workers.
- Actual scheduled sends.
- Real notification delivery processing.

## Prisma Models

Added in `apps/backend/prisma/schema.prisma`:

- `CompanyAnnouncement`
- `AnnouncementAudience`
- `AnnouncementReadReceipt`
- `NotificationType`
- `InternalNotification`
- `NotificationDelivery`
- `NotificationPreference`
- `NotificationTemplate`
- `ReminderRecord`

Added enums:

- `AnnouncementStatus`
- `AnnouncementAudienceType`
- `NotificationCategory`
- `NotificationPriority`
- `NotificationEntityType`
- `NotificationDeliveryChannel`
- `NotificationDeliveryStatus`
- `ReminderStatus`

Migration:

```text
apps/backend/prisma/migrations/20260613095226_communication_notifications
```

Seed updates:

- `communications.view`
- `communications.manage`
- `notifications.view`
- `notifications.manage`

## Permissions

Announcement routes use:

- `communications.view`
- `communications.manage`

Notification, preference, template, and reminder routes use:

- `notifications.view`
- `notifications.manage`

No role names are hardcoded for access checks.

## Endpoints

Announcement routes:

- `GET /api/v1/announcements`
- `POST /api/v1/announcements`
- `PATCH /api/v1/announcements/:id`
- `PATCH /api/v1/announcements/:id/status`
- `POST /api/v1/announcements/:id/read`
- `GET /api/v1/announcements/:id/read-receipts`

Notification type routes:

- `GET /api/v1/notification-types`
- `POST /api/v1/notification-types`

Internal notification routes:

- `GET /api/v1/notifications`
- `POST /api/v1/notifications`
- `PATCH /api/v1/notifications/:id/read`
- `PATCH /api/v1/notifications/:id/unread`

Preference routes:

- `GET /api/v1/notification-preferences`
- `POST /api/v1/notification-preferences`

Template routes:

- `GET /api/v1/notification-templates`
- `POST /api/v1/notification-templates`

Reminder routes:

- `GET /api/v1/reminders`
- `POST /api/v1/reminders`

## Filters

All list endpoints support:

- `page`
- `limit`
- `search`
- `sortBy`
- `sortOrder`

Announcements also support:

- `status`

Notification types also support:

- `category`

Notifications also support:

- `recipientUserId`
- `category`
- `priority`
- `entityType`
- `entityId`
- `isRead`

Preferences also support:

- `userId`
- `category`
- `channel`

Templates also support:

- `category`
- `channel`

Reminders also support:

- `recipientUserId`
- `status`
- `category`

## Metadata-Only Delivery Behavior

`POST /api/v1/notifications` creates:

- One `InternalNotification`.
- One `NotificationDelivery` row for each requested delivery channel.

Delivery rows default to `PENDING`. The API does not send messages, enqueue jobs, call providers, retry failures, or update delivery statuses from provider callbacks.

## Audit Logging

Audit actions:

- `communications.announcements.create`
- `communications.announcements.update`
- `communications.announcements.publish`
- `communications.announcements.archive`
- `notifications.preferences.upsert`

## Tests

Unit tests:

```text
apps/backend/src/modules/communication-notifications/communication-notifications.service.spec.ts
```

E2E coverage:

```text
apps/backend/test/app.e2e-spec.ts
```

Covered flows include announcement audience targeting, announcement update/publish/archive, read receipts, notification type and template metadata, in-app notification records with delivery channel metadata, read/unread state, notification preferences, reminders, and filtered list endpoints.
