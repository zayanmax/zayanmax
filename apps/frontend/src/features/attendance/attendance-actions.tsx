"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ClockArrowDown, ClockArrowUp, FilePenLine, Plus, Save } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { FormFieldWrapper } from "@/components/forms/form-field-wrapper";
import { SelectField } from "@/components/forms/select-field";
import { ErrorState } from "@/components/shared/error-state";
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
import { Textarea } from "@/components/ui/textarea";
import {
  attendanceActionSchema,
  attendanceCorrectionSchema,
  attendanceStatuses,
  manualAttendanceSchema,
  type AttendanceActionFormValues,
  type AttendanceCorrectionFormValues,
  type ManualAttendanceFormValues,
} from "@/features/attendance/schemas";
import {
  useAttendanceRecords,
  useCheckIn,
  useCheckOut,
  useCreateAttendanceCorrection,
  useCreateManualAttendance,
} from "@/features/attendance/hooks";
import type { Shift } from "@/features/attendance/types";
import {
  employeeName,
  formatAttendanceDate,
  NONE,
  toCorrectionPayload,
  toIsoDateTime,
  toManualAttendancePayload,
} from "@/features/attendance/utils";
import type { Employee } from "@/features/employees/types";
import { ApiClientError } from "@/lib/api/client";

const today = () => new Date().toISOString().slice(0, 10);

export function AttendanceActions({ employees, shifts }: { employees: Employee[]; shifts: Shift[] }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <AttendanceClockDialog mode="check-in" employees={employees} shifts={shifts} />
      <AttendanceClockDialog mode="check-out" employees={employees} shifts={shifts} />
      <CorrectionRequestDialog employees={employees} />
      <ManualAttendanceDialog employees={employees} shifts={shifts} />
    </div>
  );
}

function employeeOptions(employees: Employee[]) {
  return [
    { value: NONE, label: "Select employee" },
    ...employees.map((employee) => ({
      value: employee.id,
      label: `${employeeName(employee)} · ${employee.employeeCode}`,
    })),
  ];
}

function shiftOptions(shifts: Shift[]) {
  return [
    { value: NONE, label: "No shift" },
    ...shifts.map((shift) => ({ value: shift.id, label: `${shift.name} · ${shift.startTime}–${shift.endTime}` })),
  ];
}

function ManualAttendanceDialog({ employees, shifts }: { employees: Employee[]; shifts: Shift[] }) {
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const createManual = useCreateManualAttendance();
  const form = useForm<ManualAttendanceFormValues>({
    resolver: zodResolver(manualAttendanceSchema),
    defaultValues: {
      employeeId: NONE,
      shiftId: NONE,
      date: today(),
      status: "PRESENT",
      checkInAt: "",
      checkOutAt: "",
      location: "",
      notes: "",
    },
  });
  const selectedEmployee = useWatch({ control: form.control, name: "employeeId" });
  const selectedShift = useWatch({ control: form.control, name: "shiftId" });
  const selectedStatus = useWatch({ control: form.control, name: "status" });

  async function onSubmit(values: ManualAttendanceFormValues) {
    setFormError(null);
    try {
      await createManual.mutateAsync(toManualAttendancePayload(values));
      setOpen(false);
      form.reset({
        employeeId: NONE,
        shiftId: NONE,
        date: today(),
        status: "PRESENT",
        checkInAt: "",
        checkOutAt: "",
        location: "",
        notes: "",
      });
    } catch (caught) {
      setFormError(caught instanceof ApiClientError ? caught.message : "Unable to create attendance");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type="button" />}>
        <Plus className="size-4" />Manual attendance
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Record manual attendance</DialogTitle>
          <DialogDescription>Create one authoritative attendance record for an employee and date.</DialogDescription>
        </DialogHeader>
        <form id="manual-attendance-form" onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormFieldWrapper label="Employee" error={form.formState.errors.employeeId?.message}>
              <SelectField value={selectedEmployee} onValueChange={(value) => form.setValue("employeeId", value, { shouldValidate: true })} options={employeeOptions(employees)} />
            </FormFieldWrapper>
            <FormFieldWrapper label="Date" error={form.formState.errors.date?.message}>
              <Input type="date" {...form.register("date")} />
            </FormFieldWrapper>
            <FormFieldWrapper label="Status" error={form.formState.errors.status?.message}>
              <SelectField value={selectedStatus} onValueChange={(value) => form.setValue("status", value as ManualAttendanceFormValues["status"])} options={attendanceStatuses.map((status) => ({ value: status, label: status.replaceAll("_", " ") }))} />
            </FormFieldWrapper>
            <FormFieldWrapper label="Shift">
              <SelectField value={selectedShift || NONE} onValueChange={(value) => form.setValue("shiftId", value)} options={shiftOptions(shifts)} />
            </FormFieldWrapper>
            <FormFieldWrapper label="Check in" error={form.formState.errors.checkInAt?.message}>
              <Input type="datetime-local" {...form.register("checkInAt")} />
            </FormFieldWrapper>
            <FormFieldWrapper label="Check out" error={form.formState.errors.checkOutAt?.message}>
              <Input type="datetime-local" {...form.register("checkOutAt")} />
            </FormFieldWrapper>
          </div>
          <FormFieldWrapper label="Location"><Input {...form.register("location")} placeholder="Office, client site, or remote" /></FormFieldWrapper>
          <FormFieldWrapper label="Notes"><Textarea {...form.register("notes")} placeholder="Optional attendance note" /></FormFieldWrapper>
          {formError ? <ErrorState title="Unable to create attendance" message={formError} /> : null}
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button type="submit" form="manual-attendance-form" disabled={createManual.isPending}>
            <Save className="size-4" />{createManual.isPending ? "Saving…" : "Save attendance"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AttendanceClockDialog({
  mode,
  employees,
  shifts,
}: {
  mode: "check-in" | "check-out";
  employees: Employee[];
  shifts: Shift[];
}) {
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const checkIn = useCheckIn();
  const checkOut = useCheckOut();
  const mutation = mode === "check-in" ? checkIn : checkOut;
  const form = useForm<AttendanceActionFormValues>({
    resolver: zodResolver(attendanceActionSchema),
    defaultValues: { employeeId: NONE, shiftId: NONE, date: today(), at: "", location: "", notes: "" },
  });
  const selectedEmployee = useWatch({ control: form.control, name: "employeeId" });
  const selectedShift = useWatch({ control: form.control, name: "shiftId" });
  const isCheckIn = mode === "check-in";
  const Icon = isCheckIn ? ClockArrowDown : ClockArrowUp;

  async function onSubmit(values: AttendanceActionFormValues) {
    setFormError(null);
    try {
      if (isCheckIn) {
        await checkIn.mutateAsync({
          employeeId: values.employeeId,
          shiftId: values.shiftId && values.shiftId !== NONE ? values.shiftId : undefined,
          date: values.date,
          checkInAt: toIsoDateTime(values.at),
          location: values.location || undefined,
          notes: values.notes || undefined,
        });
      } else {
        await checkOut.mutateAsync({
          employeeId: values.employeeId,
          date: values.date,
          checkOutAt: toIsoDateTime(values.at),
          notes: values.notes || undefined,
        });
      }
      setOpen(false);
      form.reset({ employeeId: NONE, shiftId: NONE, date: today(), at: "", location: "", notes: "" });
    } catch (caught) {
      setFormError(caught instanceof ApiClientError ? caught.message : `Unable to ${mode}`);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type="button" variant="outline" />}>
        <Icon className="size-4" />{isCheckIn ? "Check in" : "Check out"}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isCheckIn ? "Employee check-in" : "Employee check-out"}</DialogTitle>
          <DialogDescription>{isCheckIn ? "Start an employee's attendance record for the selected date." : "Close an existing attendance record. Check-out must follow check-in."}</DialogDescription>
        </DialogHeader>
        <form id={`${mode}-form`} onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
          <FormFieldWrapper label="Employee" error={form.formState.errors.employeeId?.message}>
            <SelectField value={selectedEmployee} onValueChange={(value) => form.setValue("employeeId", value, { shouldValidate: true })} options={employeeOptions(employees)} />
          </FormFieldWrapper>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormFieldWrapper label="Attendance date"><Input type="date" {...form.register("date")} /></FormFieldWrapper>
            <FormFieldWrapper label={isCheckIn ? "Check-in time" : "Check-out time"}><Input type="datetime-local" {...form.register("at")} /></FormFieldWrapper>
          </div>
          {isCheckIn ? <FormFieldWrapper label="Shift"><SelectField value={selectedShift || NONE} onValueChange={(value) => form.setValue("shiftId", value)} options={shiftOptions(shifts)} /></FormFieldWrapper> : null}
          {isCheckIn ? <FormFieldWrapper label="Location"><Input {...form.register("location")} /></FormFieldWrapper> : null}
          <FormFieldWrapper label="Notes"><Textarea {...form.register("notes")} /></FormFieldWrapper>
          {formError ? <ErrorState title={`Unable to ${mode}`} message={formError} /> : null}
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button type="submit" form={`${mode}-form`} disabled={mutation.isPending}>
            <Icon className="size-4" />{mutation.isPending ? "Saving…" : isCheckIn ? "Confirm check-in" : "Confirm check-out"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CorrectionRequestDialog({ employees }: { employees: Employee[] }) {
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const createCorrection = useCreateAttendanceCorrection();
  const form = useForm<AttendanceCorrectionFormValues>({
    resolver: zodResolver(attendanceCorrectionSchema),
    defaultValues: {
      employeeId: NONE,
      attendanceRecordId: NONE,
      date: today(),
      requestedCheckInAt: "",
      requestedCheckOutAt: "",
      requestedStatus: NONE,
      reason: "",
    },
  });
  const selectedEmployee = useWatch({ control: form.control, name: "employeeId" });
  const selectedRecord = useWatch({ control: form.control, name: "attendanceRecordId" });
  const selectedStatus = useWatch({ control: form.control, name: "requestedStatus" });
  const records = useAttendanceRecords({
    page: 1,
    limit: 100,
    employeeId: selectedEmployee !== NONE ? selectedEmployee : undefined,
    sortBy: "date",
    sortOrder: "desc",
  });
  const recordOptions = useMemo(
    () => [
      { value: NONE, label: "No linked record" },
      ...(records.data?.data ?? []).map((record) => ({
        value: record.id,
        label: `${formatAttendanceDate(record.date)} · ${record.status}`,
      })),
    ],
    [records.data?.data],
  );

  async function onSubmit(values: AttendanceCorrectionFormValues) {
    setFormError(null);
    try {
      await createCorrection.mutateAsync(toCorrectionPayload(values));
      setOpen(false);
      form.reset({ employeeId: NONE, attendanceRecordId: NONE, date: today(), requestedCheckInAt: "", requestedCheckOutAt: "", requestedStatus: NONE, reason: "" });
    } catch (caught) {
      setFormError(caught instanceof ApiClientError ? caught.message : "Unable to submit correction");
    }
  }

  function onRecordChange(value: string) {
    form.setValue("attendanceRecordId", value);
    const record = records.data?.data.find((item) => item.id === value);
    if (record) form.setValue("date", record.date.slice(0, 10));
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type="button" variant="outline" />}>
        <FilePenLine className="size-4" />Request correction
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Request attendance correction</DialogTitle>
          <DialogDescription>Link a record when available and submit only the fields that need correction.</DialogDescription>
        </DialogHeader>
        <form id="correction-request-form" onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormFieldWrapper label="Employee" error={form.formState.errors.employeeId?.message}>
              <SelectField value={selectedEmployee} onValueChange={(value) => { form.setValue("employeeId", value, { shouldValidate: true }); form.setValue("attendanceRecordId", NONE); }} options={employeeOptions(employees)} />
            </FormFieldWrapper>
            <FormFieldWrapper label="Linked record">
              <SelectField value={selectedRecord || NONE} onValueChange={onRecordChange} options={recordOptions} disabled={records.isLoading} />
            </FormFieldWrapper>
            <FormFieldWrapper label="Attendance date" error={form.formState.errors.date?.message}><Input type="date" {...form.register("date")} /></FormFieldWrapper>
            <FormFieldWrapper label="Requested status"><SelectField value={selectedStatus || NONE} onValueChange={(value) => form.setValue("requestedStatus", value)} options={[{ value: NONE, label: "Keep current status" }, ...attendanceStatuses.map((status) => ({ value: status, label: status.replaceAll("_", " ") }))]} /></FormFieldWrapper>
            <FormFieldWrapper label="Requested check in"><Input type="datetime-local" {...form.register("requestedCheckInAt")} /></FormFieldWrapper>
            <FormFieldWrapper label="Requested check out" error={form.formState.errors.requestedCheckOutAt?.message}><Input type="datetime-local" {...form.register("requestedCheckOutAt")} /></FormFieldWrapper>
          </div>
          <FormFieldWrapper label="Reason" error={form.formState.errors.reason?.message}><Textarea {...form.register("reason")} placeholder="Explain the discrepancy and requested change" /></FormFieldWrapper>
          {formError ? <ErrorState title="Unable to submit correction" message={formError} /> : null}
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button type="submit" form="correction-request-form" disabled={createCorrection.isPending}>
            <Save className="size-4" />{createCorrection.isPending ? "Submitting…" : "Submit request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
