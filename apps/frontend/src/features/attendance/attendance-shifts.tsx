"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Save } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { FormFieldWrapper } from "@/components/forms/form-field-wrapper";
import { DataCard } from "@/components/shared/data-card";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PermissionGuard } from "@/components/shared/permission-guard";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
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
import { useAttendanceShifts, useCreateAttendanceShift } from "@/features/attendance/hooks";
import { shiftSchema, type ShiftFormValues } from "@/features/attendance/schemas";
import type { Shift } from "@/features/attendance/types";
import { queryErrorMessage, toShiftPayload } from "@/features/attendance/utils";
import { ApiClientError } from "@/lib/api/client";

export function AttendanceShifts() {
  const shifts = useAttendanceShifts();
  const columns: DataTableColumn<Shift>[] = [
    { key: "name", header: "Shift", render: (shift) => <span className="font-medium text-foreground">{shift.name}</span> },
    { key: "start", header: "Starts", render: (shift) => shift.startTime },
    { key: "end", header: "Ends", render: (shift) => shift.endTime },
    { key: "grace", header: "Grace period", render: (shift) => `${shift.graceMinutes} min` },
    { key: "status", header: "Status", render: (shift) => <StatusBadge status={shift.status} /> },
  ];
  return (
    <DataCard
      title="Company shifts"
      description="Active schedules available to attendance records. The backend currently supports list and create only."
      action={<PermissionGuard permission="attendance.manage"><ShiftCreateDialog /></PermissionGuard>}
    >
      {shifts.isLoading ? <LoadingState rows={4} /> : null}
      {shifts.error ? <ErrorState title="Unable to load shifts" message={queryErrorMessage(shifts.error)} onRetry={() => void shifts.refetch()} /> : null}
      {!shifts.isLoading && !shifts.error ? <DataTable columns={columns} rows={shifts.data ?? []} getRowKey={(shift) => shift.id} emptyTitle="No shifts configured" /> : null}
    </DataCard>
  );
}

function ShiftCreateDialog() {
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const createShift = useCreateAttendanceShift();
  const form = useForm<ShiftFormValues>({
    resolver: zodResolver(shiftSchema),
    defaultValues: { name: "", startTime: "09:30", endTime: "18:30", graceMinutes: 10 },
  });
  async function onSubmit(values: ShiftFormValues) {
    setFormError(null);
    try {
      await createShift.mutateAsync(toShiftPayload(values));
      setOpen(false);
      form.reset();
    } catch (caught) {
      setFormError(caught instanceof ApiClientError ? caught.message : "Unable to create shift");
    }
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type="button" size="sm" />}><Plus className="size-4" />New shift</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>Create shift</DialogTitle><DialogDescription>Add a schedule that can be assigned during check-in or manual attendance.</DialogDescription></DialogHeader>
        <form id="shift-form" onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
          <FormFieldWrapper label="Shift name" error={form.formState.errors.name?.message}><Input {...form.register("name")} placeholder="General Shift" /></FormFieldWrapper>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormFieldWrapper label="Start time" error={form.formState.errors.startTime?.message}><Input type="time" {...form.register("startTime")} /></FormFieldWrapper>
            <FormFieldWrapper label="End time" error={form.formState.errors.endTime?.message}><Input type="time" {...form.register("endTime")} /></FormFieldWrapper>
          </div>
          <FormFieldWrapper label="Grace minutes" error={form.formState.errors.graceMinutes?.message}><Input type="number" min={0} max={240} {...form.register("graceMinutes", { valueAsNumber: true })} /></FormFieldWrapper>
          {formError ? <ErrorState title="Unable to create shift" message={formError} /> : null}
        </form>
        <DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" form="shift-form" disabled={createShift.isPending}><Save className="size-4" />{createShift.isPending ? "Saving…" : "Save shift"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
