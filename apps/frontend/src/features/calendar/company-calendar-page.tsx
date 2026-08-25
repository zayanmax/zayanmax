"use client";

import Link from "next/link";
import { useState } from "react";
import { DateRangeFilter } from "@/components/data/date-range-filter";
import { PaginationControls } from "@/components/data/pagination-controls";
import { SearchFilterBar } from "@/components/data/search-filter-bar";
import { SelectField } from "@/components/forms/select-field";
import { DataCard } from "@/components/shared/data-card";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { PermissionGuard } from "@/components/shared/permission-guard";
import { StatusBadge } from "@/components/shared/status-badge";
import { CalendarEventTable } from "@/features/calendar/event-table";
import { calendarEventStatusOptions, calendarEventTypeOptions } from "@/features/calendar/schemas";
import { useCompanyCalendarEvents } from "@/features/calendar/hooks";
import type { CalendarEventStatus, CalendarEventType } from "@/features/calendar/types";
import { ALL, dateRangeToQuery, eventResourceLabel, formatCalendarDateTime, readableEnum } from "@/features/calendar/utils";
import { ApiClientError } from "@/lib/api/client";

export function CompanyCalendarPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [eventType, setEventType] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [dateRange, setDateRange] = useState<{ fromDate?: string; toDate?: string }>({});
  const events = useCompanyCalendarEvents({
    page,
    limit: 20,
    search: search || undefined,
    eventType: eventType === ALL ? undefined : (eventType as CalendarEventType),
    status: status === ALL ? undefined : (status as CalendarEventStatus),
    sortBy: "startAt",
    sortOrder: "asc",
    ...dateRangeToQuery(dateRange.fromDate, dateRange.toDate),
  });
  const errorMessage = events.error instanceof ApiClientError ? events.error.message : events.error instanceof Error ? events.error.message : undefined;
  return (
    <PermissionGuard permission="calendar.view" fallback={<ErrorState title="Permission required" message="You do not have access to the company calendar." />}>
      <div className="flex flex-col gap-6">
        <PageHeader title="Company Calendar" description="Company-wide events and scheduling metadata." />
        <DateRangeFilter value={dateRange} onChange={(value) => { setDateRange(value); setPage(1); }} />
        <SearchFilterBar value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Search company events" filters={<><SelectField value={eventType} onValueChange={(value) => { setEventType(value); setPage(1); }} className="w-full sm:w-52" options={[{ value: ALL, label: "All event types" }, ...calendarEventTypeOptions.map((value) => ({ value, label: readableEnum(value) }))]} /><SelectField value={status} onValueChange={(value) => { setStatus(value); setPage(1); }} className="w-full sm:w-44" options={[{ value: ALL, label: "All statuses" }, ...calendarEventStatusOptions.map((value) => ({ value, label: readableEnum(value) }))]} /></>} onReset={() => { setSearch(""); setEventType(ALL); setStatus(ALL); setDateRange({}); setPage(1); }} />
        {events.isLoading ? <LoadingState rows={6} /> : null}
        {events.error ? <ErrorState title="Unable to load company calendar" message={errorMessage} /> : null}
        {!events.isLoading && !events.error ? (
          <>
            <div className="grid gap-3 lg:grid-cols-2">
              {(events.data?.data ?? []).slice(0, 6).map((event) => (
                <Link key={event.id} href={`/calendar/events/${event.id}`} className="rounded-lg border bg-card p-4 hover:bg-muted">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{event.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{formatCalendarDateTime(event.startAt)} · {eventResourceLabel(event)}</p>
                    </div>
                    <StatusBadge status={event.status} />
                  </div>
                </Link>
              ))}
            </div>
            <DataCard title="Company Event List"><CalendarEventTable events={events.data?.data ?? []} /></DataCard>
            <PaginationControls page={events.data?.meta.page ?? page} totalPages={events.data?.meta.totalPages ?? 1} onPageChange={setPage} />
          </>
        ) : null}
      </div>
    </PermissionGuard>
  );
}
