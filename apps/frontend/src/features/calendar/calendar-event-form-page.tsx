"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { FormFieldWrapper } from "@/components/forms/form-field-wrapper";
import { SelectField } from "@/components/forms/select-field";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DataCard } from "@/components/shared/data-card";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { PermissionGuard } from "@/components/shared/permission-guard";
import {
  calendarEntityTypeOptions,
  calendarEventSchema,
  calendarEventTypeOptions,
  notificationChannelOptions,
  type CalendarEventFormValues,
} from "@/features/calendar/schemas";
import { useCalendarEvent, useCalendarResources, useCreateCalendarEvent, useUpdateCalendarEvent } from "@/features/calendar/hooks";
import { calendarEventDefaultValues, NONE, readableEnum, toCalendarEventPayload, toCalendarEventUpdatePayload } from "@/features/calendar/utils";
import { ApiClientError } from "@/lib/api/client";

export function CalendarEventFormPage({ eventId }: { eventId?: string }) {
  const router = useRouter();
  const isEdit = Boolean(eventId);
  const event = useCalendarEvent(eventId ?? "");
  const resources = useCalendarResources({ page: 1, limit: 100, sortBy: "name", sortOrder: "asc", status: "ACTIVE" });
  const createEvent = useCreateCalendarEvent();
  const updateEvent = useUpdateCalendarEvent(eventId ?? "");
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<CalendarEventFormValues>({
    resolver: zodResolver(calendarEventSchema),
    defaultValues: calendarEventDefaultValues(),
  });
  const isAllDay = useWatch({ control: form.control, name: "isAllDay" }) ?? false;

  useEffect(() => {
    if (event.data) form.reset(calendarEventDefaultValues(event.data));
  }, [event.data, form]);

  async function onSubmit(values: CalendarEventFormValues) {
    setFormError(null);
    try {
      const saved = isEdit
        ? await updateEvent.mutateAsync(toCalendarEventUpdatePayload(values))
        : await createEvent.mutateAsync(toCalendarEventPayload(values));
      router.replace(`/calendar/events/${saved.id}`);
    } catch (caught) {
      setFormError(caught instanceof ApiClientError ? caught.message : "Unable to save calendar event");
    }
  }

  const errorMessage = event.error instanceof ApiClientError ? event.error.message : event.error instanceof Error ? event.error.message : undefined;
  return (
    <PermissionGuard permission="calendar.manage" fallback={<ErrorState title="Permission required" message="You do not have permission to manage calendar events." />}>
      <div className="flex flex-col gap-6">
        <PageHeader title={isEdit ? "Edit Calendar Event" : "New Calendar Event"} description="Create scheduling metadata for meetings, milestones, reminders, and resource bookings." />
        {isEdit && event.isLoading ? <LoadingState rows={6} /> : null}
        {event.error ? <ErrorState title="Unable to load event" message={errorMessage} /> : null}
        {(!isEdit || event.data) && !event.error ? (
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <DataCard title="Event Details">
              <div className="grid gap-4 lg:grid-cols-2">
                <FormFieldWrapper label="Title" htmlFor="title" error={form.formState.errors.title?.message}><Input id="title" {...form.register("title")} /></FormFieldWrapper>
                <FormFieldWrapper label="Event type"><Controller control={form.control} name="eventType" render={({ field }) => <SelectField value={field.value} onValueChange={field.onChange} options={calendarEventTypeOptions.map((value) => ({ value, label: readableEnum(value) }))} />} /></FormFieldWrapper>
                <FormFieldWrapper label="Start date/time" htmlFor="startAt" error={form.formState.errors.startAt?.message}><Input id="startAt" type="datetime-local" {...form.register("startAt")} /></FormFieldWrapper>
                <FormFieldWrapper label="End date/time" htmlFor="endAt" error={form.formState.errors.endAt?.message}><Input id="endAt" type="datetime-local" {...form.register("endAt")} /></FormFieldWrapper>
                <FormFieldWrapper label="Timezone" htmlFor="timezone"><Input id="timezone" {...form.register("timezone")} /></FormFieldWrapper>
                <FormFieldWrapper label="Location" htmlFor="location"><Input id="location" {...form.register("location")} /></FormFieldWrapper>
                <label className="flex items-center gap-2 text-sm"><Checkbox checked={isAllDay} onCheckedChange={(checked) => form.setValue("isAllDay", Boolean(checked), { shouldDirty: true })} />All day</label>
                <div className="lg:col-span-2">
                  <FormFieldWrapper label="Description" htmlFor="description"><Textarea id="description" rows={4} {...form.register("description")} /></FormFieldWrapper>
                </div>
              </div>
            </DataCard>
            <DataCard title="Recurrence And Linked Entity" description="Recurrence is stored as metadata only; expansion is not executed yet.">
              <div className="grid gap-4 lg:grid-cols-2">
                <FormFieldWrapper label="Recurrence rule" htmlFor="recurrenceRule"><Input id="recurrenceRule" placeholder="RRULE:FREQ=WEEKLY;COUNT=4" {...form.register("recurrenceRule")} /></FormFieldWrapper>
                <FormFieldWrapper label="Recurrence ends at" htmlFor="recurrenceEndsAt"><Input id="recurrenceEndsAt" type="datetime-local" {...form.register("recurrenceEndsAt")} /></FormFieldWrapper>
                <FormFieldWrapper label="Linked entity type"><Controller control={form.control} name="entityType" render={({ field }) => <SelectField value={field.value} onValueChange={field.onChange} options={[{ value: NONE, label: "No linked entity" }, ...calendarEntityTypeOptions.map((value) => ({ value, label: readableEnum(value) }))]} disabled={isEdit} />} /></FormFieldWrapper>
                <FormFieldWrapper label="Linked entity ID" htmlFor="entityId" error={form.formState.errors.entityId?.message}><Input id="entityId" placeholder="Optional UUID" disabled={isEdit} {...form.register("entityId")} /></FormFieldWrapper>
              </div>
            </DataCard>
            {!isEdit ? (
              <DataCard title="Attendees, Resource, And Reminder" description="These child records are created with the event. Backend child update routes are not exposed yet.">
                <div className="grid gap-4 lg:grid-cols-2">
                  <FormFieldWrapper label="Attendee user IDs" htmlFor="attendeeUserIds"><Textarea id="attendeeUserIds" rows={3} placeholder="Comma or newline separated user UUIDs" {...form.register("attendeeUserIds")} /></FormFieldWrapper>
                  <FormFieldWrapper label="Meeting room / resource"><Controller control={form.control} name="resourceId" render={({ field }) => <SelectField value={field.value || NONE} onValueChange={(value) => field.onChange(value === NONE ? "" : value)} options={[{ value: NONE, label: "No resource" }, ...(resources.data?.data ?? []).map((resource) => ({ value: resource.id, label: resource.name }))]} />} /></FormFieldWrapper>
                  <FormFieldWrapper label="Reminder method"><Controller control={form.control} name="reminderMethod" render={({ field }) => <SelectField value={field.value} onValueChange={field.onChange} options={[{ value: NONE, label: "No reminder" }, ...notificationChannelOptions.map((value) => ({ value, label: readableEnum(value) }))]} />} /></FormFieldWrapper>
                  <FormFieldWrapper label="Reminder at" htmlFor="reminderAt"><Input id="reminderAt" type="datetime-local" {...form.register("reminderAt")} /></FormFieldWrapper>
                  <FormFieldWrapper label="Minutes before" htmlFor="reminderMinutesBefore"><Input id="reminderMinutesBefore" type="number" min={0} {...form.register("reminderMinutesBefore")} /></FormFieldWrapper>
                  <FormFieldWrapper label="Reminder message" htmlFor="reminderMessage"><Input id="reminderMessage" {...form.register("reminderMessage")} /></FormFieldWrapper>
                </div>
              </DataCard>
            ) : null}
            {formError ? <ErrorState title="Unable to save event" message={formError} /> : null}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
              <Button type="submit" disabled={form.formState.isSubmitting || createEvent.isPending || updateEvent.isPending}><Save className="size-4" />Save event</Button>
            </div>
          </form>
        ) : null}
      </div>
    </PermissionGuard>
  );
}
