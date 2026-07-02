"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Save } from "lucide-react";
import { useMemo, useState } from "react";
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
import { notificationCategoryOptions, notificationChannelOptions, notificationTemplateSchema, type NotificationTemplateFormValues } from "@/features/notifications/schemas";
import { useCreateNotificationTemplate, useNotificationTemplates, useNotificationTypes } from "@/features/notifications/hooks";
import type { NotificationCategory, NotificationDeliveryChannel, NotificationTemplate } from "@/features/notifications/types";
import { ALL, NONE, formatNotificationDate, toTemplatePayload } from "@/features/notifications/utils";
import { ApiClientError } from "@/lib/api/client";

export function NotificationTemplatesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(ALL);
  const [channel, setChannel] = useState(ALL);
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const templates = useNotificationTemplates({ page, limit: 20, search: search || undefined, category: category === ALL ? undefined : (category as NotificationCategory), channel: channel === ALL ? undefined : (channel as NotificationDeliveryChannel), sortBy: "createdAt", sortOrder: "desc" });
  const types = useNotificationTypes({ page: 1, limit: 100, sortBy: "name", sortOrder: "asc" });
  const createTemplate = useCreateNotificationTemplate();
  const form = useForm<NotificationTemplateFormValues>({
    resolver: zodResolver(notificationTemplateSchema),
    defaultValues: { notificationTypeId: NONE, code: "", name: "", channel: "IN_APP", category: "GENERAL", subject: "", bodyTemplate: "" },
  });
  const typeOptions = useMemo(
    () => [{ value: NONE, label: "No notification type" }, ...(types.data?.data ?? []).map((type) => ({ value: type.id, label: `${type.name} (${type.code})` }))],
    [types.data?.data],
  );
  const columns: DataTableColumn<NotificationTemplate>[] = [
    { key: "name", header: "Name", render: (template) => template.name },
    { key: "code", header: "Code", render: (template) => template.code },
    { key: "category", header: "Category", render: (template) => template.category },
    { key: "channel", header: "Channel", render: (template) => template.channel },
    { key: "subject", header: "Subject", render: (template) => template.subject ?? "-" },
    { key: "updated", header: "Updated", render: (template) => formatNotificationDate(template.updatedAt ?? template.createdAt) },
  ];
  async function onSubmit(values: NotificationTemplateFormValues) {
    setFormError(null);
    try {
      await createTemplate.mutateAsync(toTemplatePayload(values));
      form.reset({ notificationTypeId: NONE, code: "", name: "", channel: "IN_APP", category: "GENERAL", subject: "", bodyTemplate: "" });
      setOpen(false);
    } catch (caught) {
      setFormError(caught instanceof ApiClientError ? caught.message : "Unable to create template");
    }
  }
  const errorMessage = templates.error instanceof ApiClientError ? templates.error.message : templates.error instanceof Error ? templates.error.message : undefined;
  return (
    <PermissionGuard permission="notifications.manage" fallback={<ErrorState title="Permission required" message="You do not have permission to manage notification templates." />}>
      <div className="flex flex-col gap-6">
        <PageHeader title="Notification Templates" description="Provider template metadata only. No real delivery is sent." actions={<Button type="button" onClick={() => setOpen(true)}><Plus className="size-4" />New template</Button>} />
        <SearchFilterBar value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Search templates" filters={<><SelectField value={category} onValueChange={(value) => { setCategory(value); setPage(1); }} className="w-full sm:w-52" options={[{ value: ALL, label: "All categories" }, ...notificationCategoryOptions.map((value) => ({ value, label: value.replaceAll("_", " ") }))]} /><SelectField value={channel} onValueChange={(value) => { setChannel(value); setPage(1); }} className="w-full sm:w-44" options={[{ value: ALL, label: "All channels" }, ...notificationChannelOptions.map((value) => ({ value, label: value.replaceAll("_", " ") }))]} /></>} onReset={() => { setSearch(""); setCategory(ALL); setChannel(ALL); setPage(1); }} />
        {templates.isLoading ? <LoadingState rows={6} /> : null}
        {templates.error ? <ErrorState title="Unable to load templates" message={errorMessage} /> : null}
        {!templates.isLoading && !templates.error ? <><DataTable columns={columns} rows={templates.data?.data ?? []} getRowKey={(template) => template.id} emptyTitle="No notification templates found" /><PaginationControls page={templates.data?.meta.page ?? page} totalPages={templates.data?.meta.totalPages ?? 1} onPageChange={setPage} /></> : null}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader><DialogTitle>Create notification template</DialogTitle><DialogDescription>Template metadata only. No provider sync or send action is performed.</DialogDescription></DialogHeader>
          <form id="notification-template-form" onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormFieldWrapper label="Notification type"><Controller control={form.control} name="notificationTypeId" render={({ field }) => <SelectField value={field.value || NONE} onValueChange={field.onChange} options={typeOptions} />} /></FormFieldWrapper>
              <FormFieldWrapper label="Channel"><Controller control={form.control} name="channel" render={({ field }) => <SelectField value={field.value} onValueChange={field.onChange} options={notificationChannelOptions.map((value) => ({ value, label: value.replaceAll("_", " ") }))} />} /></FormFieldWrapper>
              <FormFieldWrapper label="Code" error={form.formState.errors.code?.message}><Input {...form.register("code")} /></FormFieldWrapper>
              <FormFieldWrapper label="Name" error={form.formState.errors.name?.message}><Input {...form.register("name")} /></FormFieldWrapper>
              <FormFieldWrapper label="Category"><Controller control={form.control} name="category" render={({ field }) => <SelectField value={field.value} onValueChange={field.onChange} options={notificationCategoryOptions.map((value) => ({ value, label: value.replaceAll("_", " ") }))} />} /></FormFieldWrapper>
              <FormFieldWrapper label="Subject"><Input {...form.register("subject")} /></FormFieldWrapper>
            </div>
            <FormFieldWrapper label="Body template" error={form.formState.errors.bodyTemplate?.message}><Textarea rows={8} {...form.register("bodyTemplate")} /></FormFieldWrapper>
            {formError ? <ErrorState title="Unable to create template" message={formError} /> : null}
          </form>
          <DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" form="notification-template-form" disabled={createTemplate.isPending}><Save className="size-4" />Save template</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </PermissionGuard>
  );
}
