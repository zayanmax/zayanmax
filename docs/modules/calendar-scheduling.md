# Calendar, Meetings & Scheduling Module

Last updated: 2026-06-13

## Scope

Implemented backend-only Calendar, Meetings & Scheduling foundation.

Included:

- Calendar events.
- Event types: `MEETING`, `TASK_DEADLINE`, `PROJECT_MILESTONE`, `HOLIDAY`, `INTERVIEW`, `CLIENT_MEETING`, `REMINDER`, `BIRTHDAY`, `WORK_ANNIVERSARY`, `CUSTOM`.
- Event status flow: `SCHEDULED`, `COMPLETED`, `CANCELLED`, `POSTPONED`.
- Event attendees with RSVP statuses: `PENDING`, `ACCEPTED`, `DECLINED`, `TENTATIVE`.
- Meeting room/resource metadata.
- Resource bookings.
- Recurring event metadata through `recurrenceRule` and `recurrenceEndsAt`.
- Event reminder metadata using existing delivery channel and reminder status enums.
- Entity linking support for employee, client, project, task, leave, holiday, and document records.
- Conflict checks for active room/resource bookings.
- My calendar and company calendar endpoints.
- Search, filters, sorting, and pagination.
- Audit logs for event create/update/delete/cancel, attendee RSVP responses, resource creation, and resource booking creation.

Excluded for now:

- Frontend screens.
- Google Calendar integration.
- Real reminders.
- BullMQ workers.
- External provider calls or scheduled execution.

## Prisma Models

Added in `apps/backend/prisma/schema.prisma`:

- `CalendarEvent`
- `CalendarEventAttendee`
- `CalendarResource`
- `CalendarResourceBooking`
- `CalendarEventReminder`

Added enums:

- `CalendarEventType`
- `CalendarEventStatus`
- `CalendarRsvpStatus`
- `CalendarEntityType`

Reused enums:

- `NotificationDeliveryChannel`
- `ReminderStatus`
- `RecordStatus`

Migration:

```text
apps/backend/prisma/migrations/20260613134617_calendar_scheduling
```

Seed updates:

- `calendar.view`
- `calendar.manage`

## Permissions

Calendar routes use:

- `calendar.view`
- `calendar.manage`

No role names are hardcoded for access checks.

## Endpoints

Calendar event routes:

- `GET /api/v1/calendar/events`
- `GET /api/v1/calendar/my`
- `GET /api/v1/calendar/company`
- `POST /api/v1/calendar/events`
- `PATCH /api/v1/calendar/events/:id`
- `PATCH /api/v1/calendar/events/:id/status`
- `PATCH /api/v1/calendar/events/:id/rsvp`
- `DELETE /api/v1/calendar/events/:id`

Resource routes:

- `GET /api/v1/calendar/resources`
- `POST /api/v1/calendar/resources`

Resource booking routes:

- `GET /api/v1/calendar/resource-bookings`
- `POST /api/v1/calendar/resources/:id/bookings`

## Filters

Event list endpoints support:

- `page`
- `limit`
- `search`
- `sortBy`
- `sortOrder`
- `eventType`
- `status`
- `fromDate`
- `toDate`
- `attendeeUserId`
- `entityType`
- `entityId`

Resource list endpoints support:

- `page`
- `limit`
- `search`
- `sortBy`
- `sortOrder`
- `status`

Resource booking list endpoints support:

- `page`
- `limit`
- `sortBy`
- `sortOrder`
- `status`
- `resourceId`
- `eventId`
- `fromDate`
- `toDate`

## Conflict Behavior

Resource booking conflict checks reject overlapping active bookings for the same resource.

Conflict condition:

```text
existing.startAt < requested.endAt
existing.endAt > requested.startAt
existing.status = ACTIVE
existing.deletedAt = null
```

The check runs for both nested event resource bookings and standalone resource booking creation.

## Audit Logging

Audit actions:

- `calendar.resources.create`
- `calendar.events.create`
- `calendar.events.update`
- `calendar.events.cancel`
- `calendar.events.delete`
- `calendar.attendees.respond`
- `calendar.resource_bookings.create`

## Tests

Unit tests:

```text
apps/backend/src/modules/calendar-scheduling/calendar-scheduling.service.spec.ts
```

E2E coverage:

```text
apps/backend/test/app.e2e-spec.ts
```

Covered flows include resource creation, duplicate resource protection, event creation with attendee/resource/reminder metadata, resource conflict rejection, RSVP response, standalone booking creation, event cancellation, my calendar, and company calendar listings.
