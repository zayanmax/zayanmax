# Communication, Announcements & Notifications Frontend

Last updated: 2026-07-02

## Scope

Implemented metadata-only frontend screens for communication, announcements, notifications, notification templates, preferences, and reminders.

No real email, SMS, WhatsApp, push, BullMQ worker, scheduled execution, WebSocket notification, calendar, approval, reports, or dashboard integration behavior was added.

## Routes

- `/communication`
- `/communication/announcements`
- `/communication/announcements/new`
- `/communication/announcements/[id]`
- `/communication/announcements/[id]/edit`
- `/notifications`
- `/communication/notification-templates`
- `/settings/notification-preferences`
- `/communication/reminders`

## Permissions

- `communications.view`: communication overview, announcement list, announcement detail.
- `communications.manage`: announcement create, update, publish/archive/draft status actions.
- `notifications.view`: notification center, reminders, notification preferences view.
- `notifications.manage`: notification template create, reminder create, notification preference update.

## Frontend Feature Folders

Communication:

- `apps/frontend/src/features/communication/api.ts`
- `apps/frontend/src/features/communication/hooks.ts`
- `apps/frontend/src/features/communication/schemas.ts`
- `apps/frontend/src/features/communication/types.ts`
- `apps/frontend/src/features/communication/utils.ts`
- announcement overview/list/form/detail page components

Notifications:

- `apps/frontend/src/features/notifications/api.ts`
- `apps/frontend/src/features/notifications/hooks.ts`
- `apps/frontend/src/features/notifications/schemas.ts`
- `apps/frontend/src/features/notifications/types.ts`
- `apps/frontend/src/features/notifications/utils.ts`
- notification center, templates, preferences, and reminders page components

## Backend Fit Notes

- Announcement detail/edit required `GET /api/v1/announcements/:id`; this route was added to the backend.
- Announcement audience targeting is only sent on create because the backend update DTO does not update audience rows.
- Announcement list filtering uses backend `status`, search, sorting, and pagination. Audience/date filters are not exposed by the backend.
- Notification center supports individual read/unread actions. There is no backend mark-all-read endpoint.
- Notification template and reminder screens support create/list only because the backend does not expose update/delete routes.
- Notification preferences can be viewed with `notifications.view`; updating requires `notifications.manage`.
- Reminder date input is converted to ISO before posting.

## Verification

Run from `apps/frontend`:

```bash
npm run typecheck
npm run lint
npm run build
```

Because the backend announcement detail endpoint was added, also run from `apps/backend`:

```bash
npm run prisma:validate
npm run typecheck
npm run lint
npm test -- --runInBand
npm run test:e2e -- --runInBand
npm run build
```
