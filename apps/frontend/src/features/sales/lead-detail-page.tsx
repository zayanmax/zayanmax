"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Edit, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { FormFieldWrapper } from "@/components/forms/form-field-wrapper";
import { SelectField } from "@/components/forms/select-field";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataCard } from "@/components/shared/data-card";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { PermissionGuard } from "@/components/shared/permission-guard";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  leadActivitySchema,
  leadNoteSchema,
  type LeadActivityFormValues,
  type LeadNoteFormValues,
} from "@/features/sales/schemas";
import {
  useAddLeadActivity,
  useAddLeadNote,
  useChangeLeadStatus,
  useConvertLeadToClient,
  useDeleteSalesLead,
  useSalesLead,
} from "@/features/sales/hooks";
import type { LeadActivity, LeadNote, LeadStatus, Quotation, SalesOpportunity } from "@/features/sales/types";
import { formatSalesDate, formatSalesMoney } from "@/features/sales/utils";
import { ApiClientError } from "@/lib/api/client";

const leadStatusOptions = ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "NEGOTIATION", "WON", "LOST", "ARCHIVED"].map((value) => ({
  value,
  label: value.replaceAll("_", " "),
}));

export function LeadDetailPage({ leadId }: { leadId: string }) {
  const router = useRouter();
  const lead = useSalesLead(leadId);
  const deleteLead = useDeleteSalesLead();
  const statusMutation = useChangeLeadStatus(leadId);
  const convertMutation = useConvertLeadToClient(leadId);
  const [nextStatus, setNextStatus] = useState<LeadStatus | "">("");

  async function onDelete() {
    await deleteLead.mutateAsync(leadId);
    router.replace("/sales/leads");
  }

  const errorMessage = lead.error instanceof ApiClientError ? lead.error.message : lead.error instanceof Error ? lead.error.message : undefined;

  return (
    <PermissionGuard permission="sales.view" fallback={<ErrorState title="Permission required" message="You do not have access to sales leads." />}>
      {lead.isLoading ? <LoadingState rows={6} /> : null}
      {lead.error ? <ErrorState title="Unable to load lead" message={errorMessage} /> : null}
      {!lead.isLoading && !lead.error && lead.data ? (
        <div className="flex flex-col gap-6">
          <PageHeader
            title={lead.data.name}
            description={`${lead.data.companyName ?? "No company"} - ${lead.data.status}`}
            actions={
              <>
                <PermissionGuard permission="sales.manage">
                  <Link href={`/sales/leads/${leadId}/edit`} className={buttonVariants({ variant: "outline" })}>
                    <Edit className="size-4" />
                    Edit
                  </Link>
                </PermissionGuard>
                <PermissionGuard permission="sales.manage">
                  <ConfirmDialog
                    title="Delete lead"
                    description="This will remove the lead from active sales lists."
                    confirmLabel="Delete"
                    destructive
                    onConfirm={() => void onDelete()}
                    trigger={<Button type="button" variant="destructive"><Trash2 className="size-4" />Delete</Button>}
                  />
                </PermissionGuard>
              </>
            }
          />

          <div className="grid gap-4 xl:grid-cols-3">
            <DataCard title="Profile Summary">
              <DetailRows rows={[
                ["Name", lead.data.name],
                ["Company", lead.data.companyName ?? "-"],
                ["Status", <StatusBadge key="status" status={lead.data.status} />],
                ["Value", formatSalesMoney(lead.data.estimatedValue)],
              ]} />
            </DataCard>
            <DataCard title="Contact & Company">
              <DetailRows rows={[
                ["Email", lead.data.email ?? "-"],
                ["Phone", lead.data.phone ?? "-"],
                ["Website", lead.data.website ?? "-"],
                ["Industry", lead.data.industry ?? "-"],
              ]} />
            </DataCard>
            <DataCard title="Source & Owner">
              <DetailRows rows={[
                ["Source", lead.data.source?.name ?? "-"],
                ["Stage", lead.data.stage?.name ?? "-"],
                ["Owner", lead.data.assignedEmployee ? `${lead.data.assignedEmployee.firstName ?? ""} ${lead.data.assignedEmployee.lastName ?? ""}`.trim() : lead.data.assignedUser?.email ?? "-"],
                ["Created", formatSalesDate(lead.data.createdAt)],
              ]} />
            </DataCard>
          </div>

          <PermissionGuard permission="sales.manage">
            <DataCard title="Sales Actions" description="Update status or convert this lead to a client.">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <SelectField value={nextStatus || lead.data.status} onValueChange={(value) => setNextStatus(value as LeadStatus)} className="w-full sm:w-52" options={leadStatusOptions} />
                <Button type="button" disabled={statusMutation.isPending} onClick={() => void statusMutation.mutateAsync({ status: nextStatus || lead.data.status })}>
                  Save status
                </Button>
                <Button type="button" variant="outline" disabled={convertMutation.isPending || Boolean(lead.data.convertedClientId)} onClick={() => void convertMutation.mutateAsync()}>
                  Convert to client
                </Button>
              </div>
            </DataCard>
          </PermissionGuard>

          <DataCard title="Notes">
            <p className="text-sm text-muted-foreground">{lead.data.notes ?? "No lead notes recorded."}</p>
          </DataCard>

          <Tabs defaultValue="activities">
            <TabsList>
              <TabsTrigger value="activities">Activities</TabsTrigger>
              <TabsTrigger value="notes">Lead Notes</TabsTrigger>
              <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
              <TabsTrigger value="quotations">Quotations</TabsTrigger>
            </TabsList>
            <TabsContent value="activities"><ActivitiesSection leadId={leadId} rows={lead.data.activities ?? []} /></TabsContent>
            <TabsContent value="notes"><NotesSection leadId={leadId} rows={lead.data.leadNotes ?? []} /></TabsContent>
            <TabsContent value="opportunities"><RelatedOpportunities rows={lead.data.opportunities ?? []} /></TabsContent>
            <TabsContent value="quotations"><RelatedQuotations rows={lead.data.quotations ?? []} /></TabsContent>
          </Tabs>
        </div>
      ) : null}
    </PermissionGuard>
  );
}

function ActivitiesSection({ leadId, rows }: { leadId: string; rows: LeadActivity[] }) {
  const addActivity = useAddLeadActivity(leadId);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<LeadActivityFormValues>({
    resolver: zodResolver(leadActivitySchema),
    defaultValues: { activityType: "CALL", title: "", description: "", activityAt: "" },
  });
  const columns: DataTableColumn<LeadActivity>[] = [
    { key: "type", header: "Type", render: (row) => row.activityType },
    { key: "title", header: "Title", render: (row) => row.title },
    { key: "description", header: "Description", render: (row) => row.description ?? "-" },
    { key: "activityAt", header: "Activity date", render: (row) => formatSalesDate(row.activityAt) },
  ];
  async function onSubmit(values: LeadActivityFormValues) {
    setError(null);
    try {
      await addActivity.mutateAsync({ ...values, activityAt: values.activityAt || undefined });
      form.reset({ activityType: "CALL", title: "", description: "", activityAt: "" });
      setOpen(false);
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : "Unable to add activity");
    }
  }
  return (
    <ChildSection title="Activities" description="Lead timeline activity." open={open} setOpen={setOpen} dialogTitle="Add activity" dialogDescription="Create a lead activity." formId="lead-activity-form" form={
      <form id="lead-activity-form" onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <FormFieldWrapper label="Activity type" htmlFor="activityType"><Input id="activityType" {...form.register("activityType")} /></FormFieldWrapper>
        <FormFieldWrapper label="Title" htmlFor="activityTitle" error={form.formState.errors.title?.message}><Input id="activityTitle" {...form.register("title")} /></FormFieldWrapper>
        <FormFieldWrapper label="Description" htmlFor="activityDescription"><Input id="activityDescription" {...form.register("description")} /></FormFieldWrapper>
        <FormFieldWrapper label="Activity date" htmlFor="activityAt"><Input id="activityAt" type="datetime-local" {...form.register("activityAt")} /></FormFieldWrapper>
        {error ? <ErrorState title="Unable to add activity" message={error} /> : null}
      </form>
    }>
      <DataTable columns={columns} rows={rows} getRowKey={(row) => row.id} emptyTitle="No activities found" />
    </ChildSection>
  );
}

function NotesSection({ leadId, rows }: { leadId: string; rows: LeadNote[] }) {
  const addNote = useAddLeadNote(leadId);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<LeadNoteFormValues>({ resolver: zodResolver(leadNoteSchema), defaultValues: { note: "" } });
  const columns: DataTableColumn<LeadNote>[] = [
    { key: "note", header: "Note", render: (row) => row.note },
    { key: "created", header: "Created", render: (row) => formatSalesDate(row.createdAt) },
  ];
  async function onSubmit(values: LeadNoteFormValues) {
    setError(null);
    try {
      await addNote.mutateAsync({ note: values.note.trim() });
      form.reset();
      setOpen(false);
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : "Unable to add note");
    }
  }
  return (
    <ChildSection title="Lead Notes" description="Internal lead notes." open={open} setOpen={setOpen} dialogTitle="Add note" dialogDescription="Create an internal lead note." formId="lead-note-form" form={
      <form id="lead-note-form" onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <FormFieldWrapper label="Note" htmlFor="leadNote" error={form.formState.errors.note?.message}><Input id="leadNote" {...form.register("note")} /></FormFieldWrapper>
        {error ? <ErrorState title="Unable to add note" message={error} /> : null}
      </form>
    }>
      <DataTable columns={columns} rows={rows} getRowKey={(row) => row.id} emptyTitle="No notes found" />
    </ChildSection>
  );
}

function RelatedOpportunities({ rows }: { rows: SalesOpportunity[] }) {
  return (
    <DataCard title="Related Opportunities">
      <DataTable columns={[
        { key: "name", header: "Opportunity", render: (row) => <Link href={`/sales/opportunities/${row.id}`} className="font-medium text-primary hover:underline">{row.name}</Link> },
        { key: "status", header: "Status", render: (row) => <StatusBadge status={row.status} /> },
        { key: "value", header: "Value", render: (row) => formatSalesMoney(row.expectedValue) },
      ] satisfies DataTableColumn<SalesOpportunity>[]} rows={rows} getRowKey={(row) => row.id} emptyTitle="No opportunities found" />
    </DataCard>
  );
}

function RelatedQuotations({ rows }: { rows: Quotation[] }) {
  return (
    <DataCard title="Related Quotations">
      <DataTable columns={[
        { key: "number", header: "Quotation", render: (row) => <Link href={`/sales/quotations/${row.id}`} className="font-medium text-primary hover:underline">{row.quotationNumber}</Link> },
        { key: "status", header: "Status", render: (row) => <StatusBadge status={row.status} /> },
        { key: "total", header: "Total", render: (row) => formatSalesMoney(row.grandTotal, row.currency) },
      ] satisfies DataTableColumn<Quotation>[]} rows={rows} getRowKey={(row) => row.id} emptyTitle="No quotations found" />
    </DataCard>
  );
}

function ChildSection({ title, description, children, open, setOpen, dialogTitle, dialogDescription, formId, form }: {
  title: string;
  description: string;
  children: ReactNode;
  open: boolean;
  setOpen: (open: boolean) => void;
  dialogTitle: string;
  dialogDescription: string;
  formId: string;
  form: ReactNode;
}) {
  return (
    <DataCard title={title} description={description} action={<PermissionGuard permission="sales.manage"><Button type="button" onClick={() => setOpen(true)}><Plus className="size-4" />Add</Button></PermissionGuard>}>
      {children}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{dialogTitle}</DialogTitle><DialogDescription>{dialogDescription}</DialogDescription></DialogHeader>
          {form}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" form={formId}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DataCard>
  );
}

function DetailRows({ rows }: { rows: Array<[string, ReactNode]> }) {
  return (
    <dl className="grid gap-3">
      {rows.map(([label, value]) => (
        <div key={label} className="grid gap-1 sm:grid-cols-3 sm:gap-3">
          <dt className="text-sm text-muted-foreground">{label}</dt>
          <dd className="text-sm font-medium text-foreground sm:col-span-2">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
