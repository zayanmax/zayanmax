"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { FormFieldWrapper } from "@/components/forms/form-field-wrapper";
import { SelectField } from "@/components/forms/select-field";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DataCard } from "@/components/shared/data-card";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { PermissionGuard } from "@/components/shared/permission-guard";
import { StatusBadge } from "@/components/shared/status-badge";
import { notificationCategoryOptions, notificationChannelOptions, notificationPreferenceSchema, type NotificationPreferenceFormValues } from "@/features/notifications/schemas";
import { useNotificationPreferences, useUpsertNotificationPreference } from "@/features/notifications/hooks";
import type { NotificationPreference } from "@/features/notifications/types";
import { formatNotificationDate, toPreferencePayload } from "@/features/notifications/utils";
import { ApiClientError } from "@/lib/api/client";

export function NotificationPreferencesPage() {
  const preferences = useNotificationPreferences({ page: 1, limit: 100, sortBy: "updatedAt", sortOrder: "desc" });
  const upsertPreference = useUpsertNotificationPreference();
  const form = useForm<NotificationPreferenceFormValues>({
    resolver: zodResolver(notificationPreferenceSchema),
    defaultValues: { category: "GENERAL", channel: "IN_APP", enabled: true },
  });
  const enabled = useWatch({ control: form.control, name: "enabled" }) ?? false;
  const columns: DataTableColumn<NotificationPreference>[] = [
    { key: "category", header: "Category", render: (preference) => preference.category },
    { key: "channel", header: "Channel", render: (preference) => preference.channel },
    { key: "enabled", header: "Enabled", render: (preference) => <StatusBadge status={preference.enabled ? "ENABLED" : "DISABLED"} /> },
    { key: "updated", header: "Updated", render: (preference) => formatNotificationDate(preference.updatedAt ?? preference.createdAt) },
  ];
  async function onSubmit(values: NotificationPreferenceFormValues) {
    await upsertPreference.mutateAsync(toPreferencePayload(values));
    form.reset(values);
  }
  const errorMessage = preferences.error instanceof ApiClientError ? preferences.error.message : preferences.error instanceof Error ? preferences.error.message : undefined;
  return (
    <PermissionGuard permission="notifications.view" fallback={<ErrorState title="Permission required" message="You do not have access to notification preferences." />}>
      <div className="flex flex-col gap-6">
        <PageHeader title="Notification Preferences" description="Current user notification channel preferences. External channels are metadata-only until providers are implemented." />
        <DataCard title="Set Preference" description="Upsert a channel preference for the current user.">
          <PermissionGuard permission="notifications.manage" fallback={<p className="text-sm text-muted-foreground">You can view preferences, but updating them requires notifications.manage.</p>}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 md:grid-cols-4">
              <FormFieldWrapper label="Category"><Controller control={form.control} name="category" render={({ field }) => <SelectField value={field.value} onValueChange={field.onChange} options={notificationCategoryOptions.map((value) => ({ value, label: value.replaceAll("_", " ") }))} />} /></FormFieldWrapper>
              <FormFieldWrapper label="Channel"><Controller control={form.control} name="channel" render={({ field }) => <SelectField value={field.value} onValueChange={field.onChange} options={notificationChannelOptions.map((value) => ({ value, label: value.replaceAll("_", " ") }))} />} /></FormFieldWrapper>
              <label className="flex items-end gap-2 pb-2 text-sm"><Checkbox checked={enabled} onCheckedChange={(checked) => form.setValue("enabled", Boolean(checked), { shouldDirty: true })} />Enabled</label>
              <div className="flex items-end"><Button type="submit" disabled={upsertPreference.isPending}><Save className="size-4" />Save preference</Button></div>
            </form>
          </PermissionGuard>
        </DataCard>
        <DataCard title="Current Preferences">
          {preferences.isLoading ? <LoadingState rows={5} /> : null}
          {preferences.error ? <ErrorState title="Unable to load preferences" message={errorMessage} /> : null}
          {!preferences.isLoading && !preferences.error ? <DataTable columns={columns} rows={preferences.data?.data ?? []} getRowKey={(preference) => preference.id} emptyTitle="No notification preferences found" /> : null}
        </DataCard>
      </div>
    </PermissionGuard>
  );
}
