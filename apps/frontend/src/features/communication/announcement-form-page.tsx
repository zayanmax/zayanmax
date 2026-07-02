"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { FormFieldWrapper } from "@/components/forms/form-field-wrapper";
import { SelectField } from "@/components/forms/select-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DataCard } from "@/components/shared/data-card";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { PermissionGuard } from "@/components/shared/permission-guard";
import { announcementAudienceTypeOptions, announcementSchema, type AnnouncementFormValues } from "@/features/communication/schemas";
import { useAnnouncement, useCreateAnnouncement, useUpdateAnnouncement } from "@/features/communication/hooks";
import { announcementDefaultValues, toAnnouncementPayload, toAnnouncementUpdatePayload } from "@/features/communication/utils";
import { ApiClientError } from "@/lib/api/client";

export function AnnouncementFormPage({ announcementId }: { announcementId?: string }) {
  const router = useRouter();
  const isEdit = Boolean(announcementId);
  const announcement = useAnnouncement(announcementId ?? "");
  const createAnnouncement = useCreateAnnouncement();
  const updateAnnouncement = useUpdateAnnouncement(announcementId ?? "");
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<AnnouncementFormValues>({
    resolver: zodResolver(announcementSchema),
    defaultValues: announcementDefaultValues(),
  });
  const audienceType = useWatch({ control: form.control, name: "audienceType" });
  useEffect(() => {
    if (announcement.data) form.reset(announcementDefaultValues(announcement.data));
  }, [announcement.data, form]);
  async function onSubmit(values: AnnouncementFormValues) {
    setFormError(null);
    try {
      const saved = isEdit
        ? await updateAnnouncement.mutateAsync(toAnnouncementUpdatePayload(values))
        : await createAnnouncement.mutateAsync(toAnnouncementPayload(values));
      router.replace(`/communication/announcements/${saved.id}`);
    } catch (caught) {
      setFormError(caught instanceof ApiClientError ? caught.message : "Unable to save announcement");
    }
  }
  const errorMessage = announcement.error instanceof ApiClientError ? announcement.error.message : announcement.error instanceof Error ? announcement.error.message : undefined;
  return (
    <PermissionGuard permission="communications.manage" fallback={<ErrorState title="Permission required" message="You do not have permission to manage announcements." />}>
      <div className="flex flex-col gap-6">
        <PageHeader title={isEdit ? "Edit Announcement" : "New Announcement"} description="Create simple audience-targeted company announcement content." />
        {isEdit && announcement.isLoading ? <LoadingState rows={6} /> : null}
        {announcement.error ? <ErrorState title="Unable to load announcement" message={errorMessage} /> : null}
        {(!isEdit || announcement.data) && !announcement.error ? (
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <DataCard title="Announcement Content">
              <div className="grid gap-4">
                <FormFieldWrapper label="Title" htmlFor="announcementTitle" error={form.formState.errors.title?.message}><Input id="announcementTitle" {...form.register("title")} /></FormFieldWrapper>
                <FormFieldWrapper label="Body" htmlFor="announcementBody" error={form.formState.errors.body?.message}><Textarea id="announcementBody" rows={10} {...form.register("body")} /></FormFieldWrapper>
              </div>
            </DataCard>
            {!isEdit ? (
              <DataCard title="Audience Targeting" description="Audience targeting is set during create. Backend audience update is not exposed yet.">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormFieldWrapper label="Audience type">
                    <Controller control={form.control} name="audienceType" render={({ field }) => <SelectField value={field.value} onValueChange={field.onChange} options={announcementAudienceTypeOptions.map((value) => ({ value, label: value.replaceAll("_", " ") }))} />} />
                  </FormFieldWrapper>
                  {audienceType === "BRANCH" ? <FormFieldWrapper label="Branch ID"><Input {...form.register("branchId")} placeholder="Branch UUID" /></FormFieldWrapper> : null}
                  {audienceType === "DEPARTMENT" ? <FormFieldWrapper label="Department ID"><Input {...form.register("departmentId")} placeholder="Department UUID" /></FormFieldWrapper> : null}
                  {audienceType === "EMPLOYEE" ? <FormFieldWrapper label="Employee ID"><Input {...form.register("employeeId")} placeholder="Employee UUID" /></FormFieldWrapper> : null}
                  {audienceType === "ROLE" ? <FormFieldWrapper label="Role ID"><Input {...form.register("roleId")} placeholder="Role UUID" /></FormFieldWrapper> : null}
                </div>
              </DataCard>
            ) : null}
            {formError ? <ErrorState title="Unable to save announcement" message={formError} /> : null}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
              <Button type="submit" disabled={form.formState.isSubmitting || createAnnouncement.isPending || updateAnnouncement.isPending}><Save className="size-4" />Save announcement</Button>
            </div>
          </form>
        ) : null}
      </div>
    </PermissionGuard>
  );
}
