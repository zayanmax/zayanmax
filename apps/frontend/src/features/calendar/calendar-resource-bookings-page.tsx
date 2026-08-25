"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Save } from "lucide-react";
import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { DateRangeFilter } from "@/components/data/date-range-filter";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { PaginationControls } from "@/components/data/pagination-controls";
import { SearchFilterBar } from "@/components/data/search-filter-bar";
import { FormFieldWrapper } from "@/components/forms/form-field-wrapper";
import { SelectField } from "@/components/forms/select-field";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { PermissionGuard } from "@/components/shared/permission-guard";
import { StatusBadge } from "@/components/shared/status-badge";
import { calendarResourceBookingSchema, recordStatusOptions, type CalendarResourceBookingFormValues } from "@/features/calendar/schemas";
import { useCalendarResourceBookings, useCalendarResources, useCreateCalendarResourceBooking } from "@/features/calendar/hooks";
import type { CalendarResourceBooking, RecordStatus } from "@/features/calendar/types";
import { ALL, dateRangeToQuery, formatCalendarDateTime, readableEnum, resourceLabel, toCalendarBookingPayload } from "@/features/calendar/utils";
import { ApiClientError } from "@/lib/api/client";

export function CalendarResourceBookingsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(ALL);
  const [resourceId, setResourceId] = useState(ALL);
  const [dateRange, setDateRange] = useState<{ fromDate?: string; toDate?: string }>({});
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const resources = useCalendarResources({ page: 1, limit: 100, sortBy: "name", sortOrder: "asc", status: "ACTIVE" });
  const bookings = useCalendarResourceBookings({
    page,
    limit: 20,
    search: search || undefined,
    status: status === ALL ? undefined : (status as RecordStatus),
    resourceId: resourceId === ALL ? undefined : resourceId,
    sortBy: "startAt",
    sortOrder: "asc",
    ...dateRangeToQuery(dateRange.fromDate, dateRange.toDate),
  });
  const form = useForm<CalendarResourceBookingFormValues>({
    resolver: zodResolver(calendarResourceBookingSchema),
    defaultValues: { resourceId: "", eventId: "", startAt: "", endAt: "" },
  });
  const selectedResourceId = useWatch({ control: form.control, name: "resourceId" }) ?? "";
  const createBooking = useCreateCalendarResourceBooking(selectedResourceId);
  async function onSubmit(values: CalendarResourceBookingFormValues) {
    setFormError(null);
    try {
      await createBooking.mutateAsync(toCalendarBookingPayload(values));
      form.reset({ resourceId: "", eventId: "", startAt: "", endAt: "" });
      setOpen(false);
    } catch (caught) {
      setFormError(caught instanceof ApiClientError ? caught.message : "Unable to create resource booking");
    }
  }
  const columns: DataTableColumn<CalendarResourceBooking>[] = [
    { key: "resource", header: "Resource", render: (booking) => resourceLabel(booking.resource) },
    { key: "event", header: "Event", render: (booking) => booking.event ? <Link className="font-medium text-primary hover:underline" href={`/calendar/events/${booking.event.id}`}>{booking.event.title}</Link> : booking.eventId.slice(0, 8) },
    { key: "start", header: "Start", render: (booking) => formatCalendarDateTime(booking.startAt) },
    { key: "end", header: "End", render: (booking) => formatCalendarDateTime(booking.endAt) },
    { key: "bookedBy", header: "Booked by", render: (booking) => booking.createdById?.slice(0, 8) ?? "-" },
    { key: "status", header: "Status", render: (booking) => <StatusBadge status={booking.status} /> },
  ];
  const errorMessage = bookings.error instanceof ApiClientError ? bookings.error.message : bookings.error instanceof Error ? bookings.error.message : undefined;
  return (
    <PermissionGuard permission="calendar.view" fallback={<ErrorState title="Permission required" message="You do not have access to resource bookings." />}>
      <div className="flex flex-col gap-6">
        <PageHeader title="Resource Bookings" description="Meeting room and resource booking metadata with backend conflict checks." actions={<PermissionGuard permission="calendar.manage"><Button type="button" onClick={() => setOpen(true)}><Plus className="size-4" />New booking</Button></PermissionGuard>} />
        <DateRangeFilter value={dateRange} onChange={(value) => { setDateRange(value); setPage(1); }} />
        <SearchFilterBar value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Search booking event/resource" filters={<><SelectField value={resourceId} onValueChange={(value) => { setResourceId(value); setPage(1); }} className="w-full sm:w-56" options={[{ value: ALL, label: "All resources" }, ...(resources.data?.data ?? []).map((resource) => ({ value: resource.id, label: resource.name }))]} /><SelectField value={status} onValueChange={(value) => { setStatus(value); setPage(1); }} className="w-full sm:w-44" options={[{ value: ALL, label: "All statuses" }, ...recordStatusOptions.map((value) => ({ value, label: readableEnum(value) }))]} /></>} onReset={() => { setSearch(""); setStatus(ALL); setResourceId(ALL); setDateRange({}); setPage(1); }} />
        {bookings.isLoading ? <LoadingState rows={6} /> : null}
        {bookings.error ? <ErrorState title="Unable to load resource bookings" message={errorMessage} /> : null}
        {!bookings.isLoading && !bookings.error ? <><DataTable columns={columns} rows={bookings.data?.data ?? []} getRowKey={(booking) => booking.id} emptyTitle="No resource bookings found" /><PaginationControls page={bookings.data?.meta.page ?? page} totalPages={bookings.data?.meta.totalPages ?? 1} onPageChange={setPage} /></> : null}
      </div>
      <PermissionGuard permission="calendar.manage">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader><DialogTitle>Create resource booking</DialogTitle><DialogDescription>Creates a booking record for an existing event. Overlapping active bookings are rejected by the backend.</DialogDescription></DialogHeader>
            <form id="resource-booking-form" onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 md:grid-cols-2">
              <FormFieldWrapper label="Resource"><Controller control={form.control} name="resourceId" render={({ field }) => <SelectField value={field.value} onValueChange={field.onChange} options={(resources.data?.data ?? []).map((resource) => ({ value: resource.id, label: resource.name }))} />} /></FormFieldWrapper>
              <FormFieldWrapper label="Event ID" error={form.formState.errors.eventId?.message}><Input placeholder="Calendar event UUID" {...form.register("eventId")} /></FormFieldWrapper>
              <FormFieldWrapper label="Start date/time" error={form.formState.errors.startAt?.message}><Input type="datetime-local" {...form.register("startAt")} /></FormFieldWrapper>
              <FormFieldWrapper label="End date/time" error={form.formState.errors.endAt?.message}><Input type="datetime-local" {...form.register("endAt")} /></FormFieldWrapper>
              {formError ? <div className="md:col-span-2"><ErrorState title="Unable to create booking" message={formError} /></div> : null}
            </form>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" form="resource-booking-form" disabled={createBooking.isPending || !selectedResourceId}><Save className="size-4" />Save booking</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </PermissionGuard>
    </PermissionGuard>
  );
}
