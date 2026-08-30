"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarPlus, Save, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { DateRangeFilter } from "@/components/data/date-range-filter";
import { PaginationControls } from "@/components/data/pagination-controls";
import { SearchFilterBar } from "@/components/data/search-filter-bar";
import { FormFieldWrapper } from "@/components/forms/form-field-wrapper";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataCard } from "@/components/shared/data-card";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PermissionGuard } from "@/components/shared/permission-guard";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  useAttendanceHolidays,
  useCreateAttendanceHoliday,
  useDeleteAttendanceHoliday,
} from "@/features/attendance/hooks";
import { holidaySchema, type HolidayFormValues } from "@/features/attendance/schemas";
import type { Holiday } from "@/features/attendance/types";
import { formatAttendanceDate, queryErrorMessage, toHolidayPayload } from "@/features/attendance/utils";
import { ApiClientError } from "@/lib/api/client";
import type { DateRangeQuery } from "@/types/api";

export function AttendanceHolidays() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState<DateRangeQuery>({});
  const [actionError, setActionError] = useState<string | null>(null);
  const holidays = useAttendanceHolidays({
    page,
    limit: 10,
    search: search || undefined,
    fromDate: dateRange.fromDate,
    toDate: dateRange.toDate,
    sortBy: "date",
    sortOrder: "asc",
  });
  const removeHoliday = useDeleteAttendanceHoliday();
  const columns: DataTableColumn<Holiday>[] = [
    { key: "name", header: "Holiday", render: (holiday) => <span className="font-medium text-foreground">{holiday.name}</span> },
    { key: "date", header: "Date", render: (holiday) => formatAttendanceDate(holiday.date) },
    { key: "description", header: "Description", render: (holiday) => holiday.description ?? "—" },
    { key: "recurring", header: "Recurring", render: (holiday) => holiday.recurring ? "Yes" : "No" },
    {
      key: "actions",
      header: "Actions",
      render: (holiday) => (
        <PermissionGuard permission="attendance.manage">
          <ConfirmDialog
            trigger={<Button type="button" size="sm" variant="destructive"><Trash2 className="size-4" />Delete</Button>}
            title={`Delete ${holiday.name}?`}
            description="This soft-deletes the holiday. Existing audit history is retained."
            confirmLabel="Delete holiday"
            destructive
            onConfirm={async () => {
              setActionError(null);
              try { await removeHoliday.mutateAsync(holiday.id); }
              catch (caught) { setActionError(caught instanceof ApiClientError ? caught.message : "Unable to delete holiday"); }
            }}
          />
        </PermissionGuard>
      ),
    },
  ];
  return (
    <DataCard title="Company holidays" description="Company-scoped holidays available to attendance and calendar workflows." action={<PermissionGuard permission="attendance.manage"><HolidayCreateDialog /></PermissionGuard>}>
      <div className="grid gap-4">
        <SearchFilterBar value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Search holidays" onReset={() => { setSearch(""); setDateRange({}); setPage(1); }} />
        <DateRangeFilter value={dateRange} onChange={(value) => { setDateRange(value); setPage(1); }} />
        {actionError ? <ErrorState title="Holiday action failed" message={actionError} /> : null}
        {holidays.isLoading ? <LoadingState rows={4} /> : null}
        {holidays.error ? <ErrorState title="Unable to load holidays" message={queryErrorMessage(holidays.error)} onRetry={() => void holidays.refetch()} /> : null}
        {!holidays.isLoading && !holidays.error ? <><DataTable columns={columns} rows={holidays.data?.data ?? []} getRowKey={(holiday) => holiday.id} emptyTitle="No holidays match these filters" /><PaginationControls page={holidays.data?.meta.page ?? page} totalPages={holidays.data?.meta.totalPages ?? 1} onPageChange={setPage} /></> : null}
      </div>
    </DataCard>
  );
}

function HolidayCreateDialog() {
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const createHoliday = useCreateAttendanceHoliday();
  const form = useForm<HolidayFormValues>({
    resolver: zodResolver(holidaySchema),
    defaultValues: { name: "", date: "", description: "", recurring: false },
  });
  const recurring = useWatch({ control: form.control, name: "recurring" });
  async function onSubmit(values: HolidayFormValues) {
    setFormError(null);
    try {
      await createHoliday.mutateAsync(toHolidayPayload(values));
      setOpen(false);
      form.reset();
    } catch (caught) {
      setFormError(caught instanceof ApiClientError ? caught.message : "Unable to create holiday");
    }
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type="button" size="sm" />}><CalendarPlus className="size-4" />New holiday</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>Create holiday</DialogTitle><DialogDescription>Add a company holiday. Duplicate active holidays with the same name and date are rejected.</DialogDescription></DialogHeader>
        <form id="holiday-form" onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
          <FormFieldWrapper label="Holiday name" error={form.formState.errors.name?.message}><Input {...form.register("name")} /></FormFieldWrapper>
          <FormFieldWrapper label="Date" error={form.formState.errors.date?.message}><Input type="date" {...form.register("date")} /></FormFieldWrapper>
          <FormFieldWrapper label="Description"><Textarea {...form.register("description")} /></FormFieldWrapper>
          <label className="flex items-center gap-2 text-sm"><Checkbox checked={recurring} onCheckedChange={(checked) => form.setValue("recurring", checked === true)} />Recurring annually</label>
          {formError ? <ErrorState title="Unable to create holiday" message={formError} /> : null}
        </form>
        <DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" form="holiday-form" disabled={createHoliday.isPending}><Save className="size-4" />{createHoliday.isPending ? "Saving…" : "Save holiday"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
