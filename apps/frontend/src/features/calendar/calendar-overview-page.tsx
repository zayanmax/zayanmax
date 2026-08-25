"use client";

import Link from "next/link";
import { CalendarClock, CalendarDays, CheckCircle2, DoorOpen, Users } from "lucide-react";
import { useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { DateRangeFilter } from "@/components/data/date-range-filter";
import { DataCard } from "@/components/shared/data-card";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { PermissionGuard } from "@/components/shared/permission-guard";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { useCalendarEvents, useCalendarResourceBookings, useCompanyCalendarEvents, useMyCalendarEvents } from "@/features/calendar/hooks";
import { dateRangeToQuery, eventResourceLabel, formatCalendarDateTime } from "@/features/calendar/utils";

function todayRange() {
  const today = new Date().toISOString().slice(0, 10);
  return { fromDate: today, toDate: today };
}

function upcomingRange() {
  const start = new Date();
  const end = new Date();
  end.setDate(end.getDate() + 14);
  return { fromDate: start.toISOString().slice(0, 10), toDate: end.toISOString().slice(0, 10) };
}

export function CalendarOverviewPage() {
  const [dateRange, setDateRange] = useState<{ fromDate?: string; toDate?: string }>(todayRange());
  const todayEvents = useCalendarEvents({ page: 1, limit: 50, sortBy: "startAt", sortOrder: "asc", ...dateRangeToQuery(dateRange.fromDate, dateRange.toDate) });
  const upcomingMeetings = useCalendarEvents({ page: 1, limit: 5, eventType: "MEETING", status: "SCHEDULED", sortBy: "startAt", sortOrder: "asc", ...dateRangeToQuery(upcomingRange().fromDate, upcomingRange().toDate) });
  const myEvents = useMyCalendarEvents({ page: 1, limit: 5, sortBy: "startAt", sortOrder: "asc", ...dateRangeToQuery(dateRange.fromDate, dateRange.toDate) });
  const companyEvents = useCompanyCalendarEvents({ page: 1, limit: 20, sortBy: "startAt", sortOrder: "asc", ...dateRangeToQuery(dateRange.fromDate, dateRange.toDate) });
  const bookings = useCalendarResourceBookings({ page: 1, limit: 5, sortBy: "startAt", sortOrder: "asc", ...dateRangeToQuery(dateRange.fromDate, dateRange.toDate) });
  const queries = [todayEvents, upcomingMeetings, myEvents, companyEvents, bookings];
  const isLoading = queries.some((query) => query.isLoading);
  const hasError = queries.some((query) => query.error);
  const companyRows = companyEvents.data?.data ?? [];
  return (
    <PermissionGuard permission="calendar.view" fallback={<ErrorState title="Permission required" message="You do not have access to the calendar." />}>
      <div className="flex flex-col gap-6">
        <PageHeader title="Calendar" description="Events, meetings, attendees, resource bookings, and reminder metadata." actions={<PermissionGuard permission="calendar.manage"><Link href="/calendar/events/new" className={buttonVariants({ variant: "default" })}>New event</Link></PermissionGuard>} />
        <DateRangeFilter value={dateRange} onChange={setDateRange} />
        {isLoading ? <LoadingState rows={4} /> : null}
        {hasError ? <ErrorState title="Unable to load calendar overview" message="One or more calendar overview queries failed." /> : null}
        {!isLoading ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <StatCard title="Today Events" value={todayEvents.data?.meta.total ?? 0} icon={CalendarDays} />
              <StatCard title="Upcoming Meetings" value={upcomingMeetings.data?.meta.total ?? 0} icon={CalendarClock} />
              <StatCard title="My Events" value={myEvents.data?.meta.total ?? 0} icon={Users} />
              <StatCard title="Resource Bookings" value={bookings.data?.meta.total ?? 0} icon={DoorOpen} />
              <StatCard title="Cancelled / Postponed" value={companyRows.filter((event) => ["CANCELLED", "POSTPONED"].includes(event.status)).length} icon={CheckCircle2} tone="warning" />
            </div>
            <div className="grid gap-4 xl:grid-cols-3">
              <DataCard title="Today Events">
                <div className="flex flex-col gap-3">
                  {(todayEvents.data?.data ?? []).slice(0, 5).map((event) => <Link key={event.id} href={`/calendar/events/${event.id}`} className="rounded-md border p-3 text-sm hover:bg-muted"><span className="font-medium">{event.title}</span><br /><span className="text-muted-foreground">{formatCalendarDateTime(event.startAt)} · {eventResourceLabel(event)}</span></Link>)}
                  {!todayEvents.data?.data.length ? <p className="text-sm text-muted-foreground">No events in the selected range.</p> : null}
                </div>
              </DataCard>
              <DataCard title="Upcoming Meetings">
                <div className="flex flex-col gap-3">
                  {(upcomingMeetings.data?.data ?? []).map((event) => <Link key={event.id} href={`/calendar/events/${event.id}`} className="rounded-md border p-3 text-sm hover:bg-muted"><span className="font-medium">{event.title}</span><br /><span className="text-muted-foreground">{formatCalendarDateTime(event.startAt)}</span></Link>)}
                  {!upcomingMeetings.data?.data.length ? <p className="text-sm text-muted-foreground">No upcoming meetings found.</p> : null}
                </div>
              </DataCard>
              <DataCard title="Resource Bookings">
                <div className="flex flex-col gap-3">
                  {(bookings.data?.data ?? []).map((booking) => <Link key={booking.id} href="/calendar/resource-bookings" className="rounded-md border p-3 text-sm hover:bg-muted"><span className="font-medium">{booking.resource?.name ?? "Resource"}</span><br /><span className="text-muted-foreground">{booking.event?.title ?? "Event"} · {formatCalendarDateTime(booking.startAt)}</span></Link>)}
                  {!bookings.data?.data.length ? <p className="text-sm text-muted-foreground">No resource bookings in the selected range.</p> : null}
                </div>
              </DataCard>
            </div>
            <DataCard title="Company Status Snapshot">
              <div className="grid gap-3 md:grid-cols-4">
                {["SCHEDULED", "COMPLETED", "CANCELLED", "POSTPONED"].map((status) => <div key={status} className="rounded-md border p-3"><StatusBadge status={status} /><p className="mt-2 text-2xl font-semibold">{companyRows.filter((event) => event.status === status).length}</p></div>)}
              </div>
            </DataCard>
          </>
        ) : null}
      </div>
    </PermissionGuard>
  );
}
