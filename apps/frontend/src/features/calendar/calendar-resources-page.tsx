"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Save } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { calendarResourceSchema, recordStatusOptions, type CalendarResourceFormValues } from "@/features/calendar/schemas";
import { useCalendarResources, useCreateCalendarResource } from "@/features/calendar/hooks";
import type { CalendarResource, RecordStatus } from "@/features/calendar/types";
import { ALL, formatCalendarDateTime, readableEnum, toCalendarResourcePayload } from "@/features/calendar/utils";
import { ApiClientError } from "@/lib/api/client";

export function CalendarResourcesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(ALL);
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const resources = useCalendarResources({
    page,
    limit: 20,
    search: search || undefined,
    status: status === ALL ? undefined : (status as RecordStatus),
    sortBy: "name",
    sortOrder: "asc",
  });
  const createResource = useCreateCalendarResource();
  const form = useForm<CalendarResourceFormValues>({
    resolver: zodResolver(calendarResourceSchema),
    defaultValues: { name: "", type: "", location: "", capacity: "", description: "" },
  });
  async function onSubmit(values: CalendarResourceFormValues) {
    setFormError(null);
    try {
      await createResource.mutateAsync(toCalendarResourcePayload(values));
      form.reset({ name: "", type: "", location: "", capacity: "", description: "" });
      setOpen(false);
    } catch (caught) {
      setFormError(caught instanceof ApiClientError ? caught.message : "Unable to create calendar resource");
    }
  }
  const columns: DataTableColumn<CalendarResource>[] = [
    { key: "name", header: "Resource name", render: (resource) => <span className="font-medium">{resource.name}</span> },
    { key: "type", header: "Type", render: (resource) => resource.type ?? "-" },
    { key: "location", header: "Location", render: (resource) => resource.location ?? "-" },
    { key: "capacity", header: "Capacity", render: (resource) => resource.capacity ?? "-" },
    { key: "status", header: "Active status", render: (resource) => <StatusBadge status={resource.status} /> },
    { key: "created", header: "Created", render: (resource) => formatCalendarDateTime(resource.createdAt) },
  ];
  const errorMessage = resources.error instanceof ApiClientError ? resources.error.message : resources.error instanceof Error ? resources.error.message : undefined;
  return (
    <PermissionGuard permission="calendar.manage" fallback={<ErrorState title="Permission required" message="You need calendar.manage to manage meeting rooms and resources." />}>
      <div className="flex flex-col gap-6">
        <PageHeader title="Meeting Rooms & Resources" description="Meeting rooms and resource metadata used for calendar bookings." actions={<Button type="button" onClick={() => setOpen(true)}><Plus className="size-4" />New resource</Button>} />
        <SearchFilterBar value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Search resources" filters={<SelectField value={status} onValueChange={(value) => { setStatus(value); setPage(1); }} className="w-full sm:w-44" options={[{ value: ALL, label: "All statuses" }, ...recordStatusOptions.map((value) => ({ value, label: readableEnum(value) }))]} />} onReset={() => { setSearch(""); setStatus(ALL); setPage(1); }} />
        {resources.isLoading ? <LoadingState rows={6} /> : null}
        {resources.error ? <ErrorState title="Unable to load resources" message={errorMessage} /> : null}
        {!resources.isLoading && !resources.error ? <><DataTable columns={columns} rows={resources.data?.data ?? []} getRowKey={(resource) => resource.id} emptyTitle="No resources found" /><PaginationControls page={resources.data?.meta.page ?? page} totalPages={resources.data?.meta.totalPages ?? 1} onPageChange={setPage} /></> : null}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader><DialogTitle>Create calendar resource</DialogTitle><DialogDescription>Create a meeting room or shared resource record. Edit/delete routes are not exposed by the backend yet.</DialogDescription></DialogHeader>
          <form id="resource-form" onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 md:grid-cols-2">
            <FormFieldWrapper label="Name" error={form.formState.errors.name?.message}><Input {...form.register("name")} /></FormFieldWrapper>
            <FormFieldWrapper label="Type"><Input placeholder="Meeting room" {...form.register("type")} /></FormFieldWrapper>
            <FormFieldWrapper label="Location"><Input {...form.register("location")} /></FormFieldWrapper>
            <FormFieldWrapper label="Capacity"><Input type="number" min={0} {...form.register("capacity")} /></FormFieldWrapper>
            <div className="md:col-span-2"><FormFieldWrapper label="Description"><Textarea rows={3} {...form.register("description")} /></FormFieldWrapper></div>
            {formError ? <div className="md:col-span-2"><ErrorState title="Unable to create resource" message={formError} /></div> : null}
          </form>
          <DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" form="resource-form" disabled={createResource.isPending}><Save className="size-4" />Save resource</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </PermissionGuard>
  );
}
