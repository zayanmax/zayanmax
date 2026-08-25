"use client";

import Link from "next/link";
import { ArchiveX, CheckCircle2, Clock3, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataCard } from "@/components/shared/data-card";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { PermissionGuard } from "@/components/shared/permission-guard";
import { StatusBadge } from "@/components/shared/status-badge";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { useAuthStore } from "@/lib/auth/auth-store";
import { useCalendarEvent, useChangeCalendarEventStatus, useDeleteCalendarEvent, useRespondToCalendarEvent } from "@/features/calendar/hooks";
import type { CalendarEventAttendee, CalendarEventReminder, CalendarEventStatus, CalendarResourceBooking, CalendarRsvpStatus } from "@/features/calendar/types";
import { eventResourceLabel, formatCalendarDateTime, linkedEntityLabel, readableEnum, resourceLabel } from "@/features/calendar/utils";
import { ApiClientError } from "@/lib/api/client";

export function CalendarEventDetailPage({ eventId }: { eventId: string }) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const event = useCalendarEvent(eventId);
  const changeStatus = useChangeCalendarEventStatus(eventId);
  const deleteEvent = useDeleteCalendarEvent(eventId);
  const respond = useRespondToCalendarEvent(eventId);
  const myAttendee = event.data?.attendees?.find((attendee) => attendee.userId === user?.id);
  async function setStatus(status: CalendarEventStatus) {
    await changeStatus.mutateAsync(status);
  }
  async function respondWith(status: CalendarRsvpStatus) {
    await respond.mutateAsync(status);
  }
  async function removeEvent() {
    await deleteEvent.mutateAsync();
    router.replace("/calendar/events");
  }
  const attendeeColumns: DataTableColumn<CalendarEventAttendee>[] = [
    { key: "user", header: "User", render: (attendee) => attendee.userId.slice(0, 8) },
    { key: "employee", header: "Employee", render: (attendee) => attendee.employeeId?.slice(0, 8) ?? "-" },
    { key: "rsvp", header: "RSVP", render: (attendee) => <StatusBadge status={attendee.rsvpStatus} /> },
    { key: "responded", header: "Responded", render: (attendee) => formatCalendarDateTime(attendee.respondedAt) },
  ];
  const bookingColumns: DataTableColumn<CalendarResourceBooking>[] = [
    { key: "resource", header: "Resource", render: (booking) => resourceLabel(booking.resource) },
    { key: "start", header: "Start", render: (booking) => formatCalendarDateTime(booking.startAt) },
    { key: "end", header: "End", render: (booking) => formatCalendarDateTime(booking.endAt) },
    { key: "status", header: "Status", render: (booking) => <StatusBadge status={booking.status} /> },
  ];
  const reminderColumns: DataTableColumn<CalendarEventReminder>[] = [
    { key: "method", header: "Method", render: (reminder) => readableEnum(reminder.method) },
    { key: "at", header: "Remind at", render: (reminder) => formatCalendarDateTime(reminder.remindAt) },
    { key: "minutes", header: "Minutes before", render: (reminder) => reminder.minutesBefore ?? "-" },
    { key: "message", header: "Message", render: (reminder) => reminder.message ?? "-" },
  ];
  const errorMessage = event.error instanceof ApiClientError ? event.error.message : event.error instanceof Error ? event.error.message : undefined;
  return (
    <PermissionGuard permission="calendar.view" fallback={<ErrorState title="Permission required" message="You do not have access to calendar events." />}>
      {event.isLoading ? <LoadingState rows={6} /> : null}
      {event.error ? <ErrorState title="Unable to load calendar event" message={errorMessage} /> : null}
      {!event.isLoading && !event.error && event.data ? (
        <div className="flex flex-col gap-6">
          <PageHeader
            title={event.data.title}
            description={`${readableEnum(event.data.eventType)} · ${formatCalendarDateTime(event.data.startAt)} · ${eventResourceLabel(event.data)}`}
            actions={
              <div className="flex flex-wrap gap-2">
                <PermissionGuard permission="calendar.manage">
                  <Link href={`/calendar/events/${event.data.id}/edit`} className={buttonVariants({ variant: "outline" })}><Pencil className="size-4" />Edit</Link>
                  <Button type="button" variant="outline" disabled={changeStatus.isPending} onClick={() => setStatus("COMPLETED")}><CheckCircle2 className="size-4" />Complete</Button>
                  <Button type="button" variant="outline" disabled={changeStatus.isPending} onClick={() => setStatus("POSTPONED")}><Clock3 className="size-4" />Postpone</Button>
                  <Button type="button" variant="outline" disabled={changeStatus.isPending} onClick={() => setStatus("CANCELLED")}><ArchiveX className="size-4" />Cancel</Button>
                  <ConfirmDialog trigger={<Button type="button" variant="destructive"><Trash2 className="size-4" />Delete</Button>} title="Delete calendar event?" description="This soft-deletes the event metadata." confirmLabel="Delete" destructive onConfirm={removeEvent} />
                </PermissionGuard>
              </div>
            }
          />
          <div className="grid gap-4 lg:grid-cols-3">
            <DataCard title="Event Summary">
              <div className="flex flex-col gap-3 text-sm">
                <StatusBadge status={event.data.status} />
                <p><span className="text-muted-foreground">Start:</span> {formatCalendarDateTime(event.data.startAt)}</p>
                <p><span className="text-muted-foreground">End:</span> {formatCalendarDateTime(event.data.endAt)}</p>
                <p><span className="text-muted-foreground">Timezone:</span> {event.data.timezone ?? "-"}</p>
                <p><span className="text-muted-foreground">All day:</span> {event.data.isAllDay ? "Yes" : "No"}</p>
              </div>
            </DataCard>
            <DataCard title="Location And Entity">
              <div className="flex flex-col gap-3 text-sm">
                <p><span className="text-muted-foreground">Location/resource:</span> {eventResourceLabel(event.data)}</p>
                <p><span className="text-muted-foreground">Linked entity:</span> {linkedEntityLabel(event.data)}</p>
                <p><span className="text-muted-foreground">Recurrence:</span> {event.data.recurrenceRule ?? "-"}</p>
                <p><span className="text-muted-foreground">Recurrence ends:</span> {formatCalendarDateTime(event.data.recurrenceEndsAt)}</p>
              </div>
            </DataCard>
            <DataCard title="Metadata">
              <div className="flex flex-col gap-3 text-sm">
                <p><span className="text-muted-foreground">Created:</span> {formatCalendarDateTime(event.data.createdAt)}</p>
                <p><span className="text-muted-foreground">Updated:</span> {formatCalendarDateTime(event.data.updatedAt)}</p>
                <p><span className="text-muted-foreground">Created by:</span> {event.data.createdByUserId?.slice(0, 8) ?? event.data.createdById?.slice(0, 8) ?? "-"}</p>
              </div>
            </DataCard>
          </div>
          <DataCard title="Description"><p className="whitespace-pre-wrap text-sm text-muted-foreground">{event.data.description || "No description provided."}</p></DataCard>
          <DataCard title="Attendees And RSVP" description={myAttendee ? `Your RSVP: ${readableEnum(myAttendee.rsvpStatus)}` : "You are not listed as an attendee on this event."} action={myAttendee ? <div className="flex flex-wrap gap-2"><Button type="button" variant="outline" size="sm" onClick={() => respondWith("ACCEPTED")} disabled={respond.isPending}>Accept</Button><Button type="button" variant="outline" size="sm" onClick={() => respondWith("TENTATIVE")} disabled={respond.isPending}>Tentative</Button><Button type="button" variant="outline" size="sm" onClick={() => respondWith("DECLINED")} disabled={respond.isPending}>Decline</Button></div> : null}>
            <DataTable columns={attendeeColumns} rows={event.data.attendees ?? []} getRowKey={(attendee) => attendee.id} emptyTitle="No attendees added" />
          </DataCard>
          <DataCard title="Resource Bookings"><DataTable columns={bookingColumns} rows={event.data.resourceBookings ?? []} getRowKey={(booking) => booking.id} emptyTitle="No resource bookings" /></DataCard>
          <DataCard title="Reminder Metadata"><DataTable columns={reminderColumns} rows={event.data.reminders ?? []} getRowKey={(reminder) => reminder.id} emptyTitle="No reminders configured" /></DataCard>
        </div>
      ) : null}
    </PermissionGuard>
  );
}
