"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { DateRangeFilter } from "@/components/data/date-range-filter";
import { PaginationControls } from "@/components/data/pagination-controls";
import { SearchFilterBar } from "@/components/data/search-filter-bar";
import { SelectField } from "@/components/forms/select-field";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { PermissionGuard } from "@/components/shared/permission-guard";
import { CalendarEventTable } from "@/features/calendar/event-table";
import { calendarEventStatusOptions, calendarEventTypeOptions } from "@/features/calendar/schemas";
import { useCalendarEvents, useCalendarResources } from "@/features/calendar/hooks";
import type { CalendarEventStatus, CalendarEventType } from "@/features/calendar/types";
import { ALL, dateRangeToQuery, readableEnum } from "@/features/calendar/utils";
import { ApiClientError } from "@/lib/api/client";

export function CalendarEventsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [eventType, setEventType] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [resourceId, setResourceId] = useState(ALL);
  const [dateRange, setDateRange] = useState<{ fromDate?: string; toDate?: string }>({});
  const resources = useCalendarResources({ page: 1, limit: 100, sortBy: "name", sortOrder: "asc" });
  const events = useCalendarEvents({
    page,
    limit: 20,
    search: search || undefined,
    eventType: eventType === ALL ? undefined : (eventType as CalendarEventType),
    status: status === ALL ? undefined : (status as CalendarEventStatus),
    sortBy: "startAt",
    sortOrder: "asc",
    ...dateRangeToQuery(dateRange.fromDate, dateRange.toDate),
  });
  const rows = resourceId === ALL
    ? events.data?.data ?? []
    : (events.data?.data ?? []).filter((event) => event.resourceBookings?.some((booking) => booking.resourceId === resourceId));
  const errorMessage = events.error instanceof ApiClientError ? events.error.message : events.error instanceof Error ? events.error.message : undefined;
  return (
    <PermissionGuard permission="calendar.view" fallback={<ErrorState title="Permission required" message="You do not have access to calendar events." />}>
      <div className="flex flex-col gap-6">
        <PageHeader title="Calendar Events" description="Company events, meetings, milestones, and reminder metadata." actions={<PermissionGuard permission="calendar.manage"><Link href="/calendar/events/new" className={buttonVariants({ variant: "default" })}><Plus className="size-4" />New event</Link></PermissionGuard>} />
        <DateRangeFilter value={dateRange} onChange={(value) => { setDateRange(value); setPage(1); }} />
        <SearchFilterBar
          value={search}
          onChange={(value) => { setSearch(value); setPage(1); }}
          placeholder="Search events"
          filters={
            <>
              <SelectField value={eventType} onValueChange={(value) => { setEventType(value); setPage(1); }} className="w-full sm:w-52" options={[{ value: ALL, label: "All event types" }, ...calendarEventTypeOptions.map((value) => ({ value, label: readableEnum(value) }))]} />
              <SelectField value={status} onValueChange={(value) => { setStatus(value); setPage(1); }} className="w-full sm:w-44" options={[{ value: ALL, label: "All statuses" }, ...calendarEventStatusOptions.map((value) => ({ value, label: readableEnum(value) }))]} />
              <SelectField value={resourceId} onValueChange={(value) => { setResourceId(value); setPage(1); }} className="w-full sm:w-56" options={[{ value: ALL, label: "All resources" }, ...(resources.data?.data ?? []).map((resource) => ({ value: resource.id, label: resource.name }))]} />
            </>
          }
          onReset={() => { setSearch(""); setEventType(ALL); setStatus(ALL); setResourceId(ALL); setDateRange({}); setPage(1); }}
        />
        {events.isLoading ? <LoadingState rows={6} /> : null}
        {events.error ? <ErrorState title="Unable to load events" message={errorMessage} /> : null}
        {!events.isLoading && !events.error ? (
          <>
            <CalendarEventTable events={rows} />
            <PaginationControls page={events.data?.meta.page ?? page} totalPages={events.data?.meta.totalPages ?? 1} onPageChange={setPage} />
          </>
        ) : null}
      </div>
    </PermissionGuard>
  );
}
