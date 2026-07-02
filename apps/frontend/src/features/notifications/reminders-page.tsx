"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Save } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { PaginationControls } from "@/components/data/pagination-controls";
import { SearchFilterBar } from "@/components/data/search-filter-bar";
import { FormFieldWrapper } from "@/components/forms/form-field-wrapper";
import { SelectField } from "@/components/forms/select-field";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { PermissionGuard } from "@/components/shared/permission-guard";
import { StatusBadge } from "@/components/shared/status-badge";
import { useAuthStore } from "@/lib/auth/auth-store";
import { notificationCategoryOptions, notificationEntityTypeOptions, notificationPriorityOptions, reminderSchema, reminderStatusOptions, type ReminderFormValues } from "@/features/notifications/schemas";
import { useCreateReminder, useReminders } from "@/features/notifications/hooks";
import type { NotificationCategory, ReminderRecord, ReminderStatus } from "@/features/notifications/types";
import { ALL, NONE, entityLabel, formatNotificationDate, toReminderPayload } from "@/features/notifications/utils";
import { ApiClientError } from "@/lib/api/client";

export function RemindersPage() {
  const user = useAuthStore((state) => state.user);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(ALL);
  const [category, setCategory] = useState(ALL);
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const reminders = useReminders({ page, limit: 20, recipientUserId: user?.id, search: search || undefined, status: status === ALL ? undefined : (status as ReminderStatus), category: category === ALL ? undefined : (category as NotificationCategory), sortBy: "remindAt", sortOrder: "asc" });
  const createReminder = useCreateReminder();
  const form = useForm<ReminderFormValues>({
    resolver: zodResolver(reminderSchema),
    defaultValues: { recipientUserId: user?.id ?? "", title: "", body: "", remindAt: "", category: "GENERAL", priority: "NORMAL", entityType: NONE, entityId: "" },
  });
  const columns: DataTableColumn<ReminderRecord>[] = [
    { key: "title", header: "Title", render: (reminder) => reminder.title },
    { key: "entity", header: "Linked entity", render: (reminder) => entityLabel(reminder.entityType, reminder.entityId) },
    { key: "due", header: "Due", render: (reminder) => formatNotificationDate(reminder.remindAt) },
    { key: "category", header: "Category", render: (reminder) => reminder.category },
    { key: "status", header: "Status", render: (reminder) => <StatusBadge status={reminder.status} /> },
    { key: "created", header: "Created", render: (reminder) => formatNotificationDate(reminder.createdAt) },
  ];
  async function onSubmit(values: ReminderFormValues) {
    setFormError(null);
    try {
      await createReminder.mutateAsync(toReminderPayload(values));
      form.reset({ recipientUserId: user?.id ?? "", title: "", body: "", remindAt: "", category: "GENERAL", priority: "NORMAL", entityType: NONE, entityId: "" });
      setOpen(false);
    } catch (caught) {
      setFormError(caught instanceof ApiClientError ? caught.message : "Unable to create reminder");
    }
  }
  const errorMessage = reminders.error instanceof ApiClientError ? reminders.error.message : reminders.error instanceof Error ? reminders.error.message : undefined;
  return (
    <PermissionGuard permission="notifications.view" fallback={<ErrorState title="Permission required" message="You do not have access to reminders." />}>
      <div className="flex flex-col gap-6">
        <PageHeader title="Reminders" description="Reminder records for future scheduled work. No scheduler or BullMQ execution is implemented yet." actions={<PermissionGuard permission="notifications.manage"><Button type="button" onClick={() => { form.setValue("recipientUserId", user?.id ?? ""); setOpen(true); }}><Plus className="size-4" />New reminder</Button></PermissionGuard>} />
        <SearchFilterBar value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Search reminders" filters={<><SelectField value={status} onValueChange={(value) => { setStatus(value); setPage(1); }} className="w-full sm:w-44" options={[{ value: ALL, label: "All statuses" }, ...reminderStatusOptions.map((value) => ({ value, label: value }))]} /><SelectField value={category} onValueChange={(value) => { setCategory(value); setPage(1); }} className="w-full sm:w-52" options={[{ value: ALL, label: "All categories" }, ...notificationCategoryOptions.map((value) => ({ value, label: value.replaceAll("_", " ") }))]} /></>} onReset={() => { setSearch(""); setStatus(ALL); setCategory(ALL); setPage(1); }} />
        {reminders.isLoading ? <LoadingState rows={6} /> : null}
        {reminders.error ? <ErrorState title="Unable to load reminders" message={errorMessage} /> : null}
        {!reminders.isLoading && !reminders.error ? <><DataTable columns={columns} rows={reminders.data?.data ?? []} getRowKey={(reminder) => reminder.id} emptyTitle="No reminders found" /><PaginationControls page={reminders.data?.meta.page ?? page} totalPages={reminders.data?.meta.totalPages ?? 1} onPageChange={setPage} /></> : null}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader><DialogTitle>Create reminder metadata</DialogTitle><DialogDescription>Creates a reminder record only. Scheduled execution is not implemented.</DialogDescription></DialogHeader>
          <form id="reminder-form" onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormFieldWrapper label="Recipient user ID" error={form.formState.errors.recipientUserId?.message}><Input {...form.register("recipientUserId")} /></FormFieldWrapper>
              <FormFieldWrapper label="Remind at" error={form.formState.errors.remindAt?.message}><Input type="datetime-local" {...form.register("remindAt")} /></FormFieldWrapper>
              <FormFieldWrapper label="Title" error={form.formState.errors.title?.message}><Input {...form.register("title")} /></FormFieldWrapper>
              <FormFieldWrapper label="Category"><Controller control={form.control} name="category" render={({ field }) => <SelectField value={field.value} onValueChange={field.onChange} options={notificationCategoryOptions.map((value) => ({ value, label: value.replaceAll("_", " ") }))} />} /></FormFieldWrapper>
              <FormFieldWrapper label="Priority"><Controller control={form.control} name="priority" render={({ field }) => <SelectField value={field.value} onValueChange={field.onChange} options={notificationPriorityOptions.map((value) => ({ value, label: value }))} />} /></FormFieldWrapper>
              <FormFieldWrapper label="Entity type"><Controller control={form.control} name="entityType" render={({ field }) => <SelectField value={field.value} onValueChange={field.onChange} options={[{ value: NONE, label: "No entity" }, ...notificationEntityTypeOptions.map((value) => ({ value, label: value.replaceAll("_", " ") }))]} />} /></FormFieldWrapper>
              <FormFieldWrapper label="Entity ID"><Input {...form.register("entityId")} placeholder="Optional UUID" /></FormFieldWrapper>
            </div>
            <FormFieldWrapper label="Body"><Textarea rows={4} {...form.register("body")} /></FormFieldWrapper>
            {formError ? <ErrorState title="Unable to create reminder" message={formError} /> : null}
          </form>
          <DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" form="reminder-form" disabled={createReminder.isPending}><Save className="size-4" />Save reminder</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </PermissionGuard>
  );
}
