# Calendar, Meetings & Resource Booking Frontend

Last updated: 2026-07-03

## Scope

Implemented frontend screens for calendar events, personal calendar views, company calendar views, meeting rooms/resources, resource bookings, attendees, RSVP, recurrence metadata, and reminder metadata.

No Google Calendar integration, real reminders, BullMQ workers, push notifications, WebSocket/live updates, helpdesk, approvals, reports, or deep dashboard integrations were added.

## Routes

- `/calendar`
- `/calendar/events`
- `/calendar/events/new`
- `/calendar/events/[id]`
- `/calendar/events/[id]/edit`
- `/calendar/my`
- `/calendar/company`
- `/calendar/resources`
- `/calendar/resource-bookings`

## Permissions

- `calendar.view`: overview, events list/detail, my calendar, company calendar, resource bookings, RSVP.
- `calendar.manage`: event create/update/status/delete, resource create, resource booking create.

## Frontend Feature Folder

Implemented under `apps/frontend/src/features/calendar`:

- `api.ts`
- `hooks.ts`
- `schemas.ts`
- `types.ts`
- `utils.ts`
- `event-table.tsx`
- `calendar-overview-page.tsx`
- `calendar-events-page.tsx`
- `calendar-event-form-page.tsx`
- `calendar-event-detail-page.tsx`
- `my-calendar-page.tsx`
- `company-calendar-page.tsx`
- `calendar-resources-page.tsx`
- `calendar-resource-bookings-page.tsx`

## Backend Fit Notes

- Event detail/edit required `GET /api/v1/calendar/events/:id`; this read-only route was added to the backend.
- Event list, my calendar, and company calendar use backend search, event type, status, date range, sorting, and pagination.
- Event resource filtering is client-side on the current page of event results because event list DTOs do not expose `resourceId`.
- Event attendees, resource bookings, linked entity, and reminders are created with the event only. Backend event update does not update child rows or linked entity metadata.
- RSVP is available on event detail for the current user only when they are an attendee.
- Resources support list/create only because backend update/delete/detail routes are not exposed.
- Resource bookings support list/create only because backend update/delete/detail routes are not exposed.
- Resource booking conflict feedback is shown from backend validation/error responses.
- Reminder records are metadata only and are not scheduled or delivered.

## Verification

Run from `apps/frontend`:

```bash
npm run typecheck
npm run lint
npm run build
```

Because the backend calendar event detail endpoint was added, also run from `apps/backend`:

```bash
npm run prisma:validate
npm run typecheck
npm run lint
npm test -- --runInBand
npm run test:e2e -- --runInBand
npm run build
```
