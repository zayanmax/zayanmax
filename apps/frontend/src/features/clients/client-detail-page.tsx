"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Edit, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataCard } from "@/components/shared/data-card";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { PermissionGuard } from "@/components/shared/permission-guard";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  clientActivitySchema,
  clientContactSchema,
  clientDocumentSchema,
  clientNoteSchema,
  type ClientActivityFormValues,
  type ClientContactFormValues,
  type ClientDocumentFormValues,
  type ClientNoteFormValues,
} from "@/features/clients/schemas";
import {
  useAddClientActivity,
  useAddClientContact,
  useAddClientDocument,
  useAddClientNote,
  useChangeClientStatus,
  useClient,
  useClientActivities,
  useClientContacts,
  useClientDocuments,
  useClientNotes,
  useDeleteClient,
} from "@/features/clients/hooks";
import type {
  ClientActivity,
  ClientContact,
  ClientDocument,
  ClientNote,
  ClientStatus,
} from "@/features/clients/types";
import {
  clientLocation,
  formatClientDate,
  toActivityPayload,
  toContactPayload,
  toDocumentPayload,
} from "@/features/clients/utils";
import { ApiClientError } from "@/lib/api/client";

const statusOptions = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "PROSPECT", label: "Prospect" },
  { value: "ARCHIVED", label: "Archived" },
];

export function ClientDetailPage({ clientId }: { clientId: string }) {
  const router = useRouter();
  const client = useClient(clientId);
  const deleteMutation = useDeleteClient();
  const statusMutation = useChangeClientStatus(clientId);
  const [nextStatus, setNextStatus] = useState<ClientStatus | "">("");

  async function deleteClient() {
    await deleteMutation.mutateAsync(clientId);
    router.replace("/clients");
  }

  const errorMessage =
    client.error instanceof ApiClientError
      ? client.error.message
      : client.error instanceof Error
        ? client.error.message
        : undefined;

  return (
    <PermissionGuard
      permission="clients.view"
      fallback={
        <ErrorState
          title="Permission required"
          message="You do not have access to client records."
        />
      }
    >
      {client.isLoading ? <LoadingState rows={6} /> : null}
      {client.error ? (
        <ErrorState title="Unable to load client" message={errorMessage} />
      ) : null}
      {!client.isLoading && !client.error && client.data ? (
        <div className="flex flex-col gap-6">
          <PageHeader
            title={client.data.name}
            description={`${client.data.type} · ${client.data.email ?? "No email"}`}
            actions={
              <>
                <PermissionGuard permission="clients.update">
                  <Link
                    href={`/clients/${clientId}/edit`}
                    className={buttonVariants({ variant: "outline" })}
                  >
                    <Edit className="size-4" />
                    Edit
                  </Link>
                </PermissionGuard>
                <PermissionGuard permission="clients.delete">
                  <ConfirmDialog
                    title="Delete client"
                    description="This will remove the client from active CRM lists."
                    confirmLabel="Delete"
                    destructive
                    onConfirm={() => void deleteClient()}
                    trigger={
                      <Button type="button" variant="destructive">
                        <Trash2 className="size-4" />
                        Delete
                      </Button>
                    }
                  />
                </PermissionGuard>
              </>
            }
          />

          <div className="grid gap-4 xl:grid-cols-3">
            <DataCard title="Client Profile">
              <DetailRows
                rows={[
                  ["Name", client.data.name],
                  ["Type", client.data.type],
                  ["Status", <StatusBadge key="status" status={client.data.status} />],
                  ["Owner", client.data.owner?.email ?? "-"],
                  ["Industry", client.data.industry ?? "-"],
                ]}
              />
            </DataCard>
            <DataCard title="Contact Details">
              <DetailRows
                rows={[
                  ["Email", client.data.email ?? "-"],
                  ["Phone", client.data.phone ?? "-"],
                  ["Website", client.data.website ?? "-"],
                ]}
              />
            </DataCard>
            <DataCard title="Business Information">
              <DetailRows
                rows={[
                  ["Company size", client.data.companySize ?? "-"],
                  ["Tax number", client.data.taxNumber ?? "-"],
                  ["Location", clientLocation(client.data)],
                  ["Created", formatClientDate(client.data.createdAt)],
                  ["Updated", formatClientDate(client.data.updatedAt)],
                ]}
              />
            </DataCard>
          </div>

          <PermissionGuard permission="clients.update">
            <DataCard title="Change Status" description="Update the CRM lifecycle state.">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <SelectField
                  value={nextStatus || client.data.status}
                  onValueChange={(value) => setNextStatus(value as ClientStatus)}
                  className="w-full sm:w-52"
                  options={statusOptions}
                />
                <Button
                  type="button"
                  disabled={statusMutation.isPending}
                  onClick={() => void statusMutation.mutateAsync({ status: nextStatus || client.data.status })}
                >
                  Save status
                </Button>
              </div>
            </DataCard>
          </PermissionGuard>

          <ClientTabs clientId={clientId} />
        </div>
      ) : null}
    </PermissionGuard>
  );
}

function ClientTabs({ clientId }: { clientId: string }) {
  return (
    <Tabs defaultValue="contacts">
      <TabsList>
        <TabsTrigger value="contacts">Contacts</TabsTrigger>
        <TabsTrigger value="activities">Activities</TabsTrigger>
        <TabsTrigger value="notes">Notes</TabsTrigger>
        <TabsTrigger value="documents">Documents</TabsTrigger>
      </TabsList>
      <TabsContent value="contacts">
        <ContactsSection clientId={clientId} />
      </TabsContent>
      <TabsContent value="activities">
        <ActivitiesSection clientId={clientId} />
      </TabsContent>
      <TabsContent value="notes">
        <NotesSection clientId={clientId} />
      </TabsContent>
      <TabsContent value="documents">
        <DocumentsSection clientId={clientId} />
      </TabsContent>
    </Tabs>
  );
}

function ContactsSection({ clientId }: { clientId: string }) {
  const contacts = useClientContacts(clientId);
  const addContact = useAddClientContact(clientId);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<ClientContactFormValues>({
    resolver: zodResolver(clientContactSchema),
    defaultValues: {
      name: "",
      designation: "",
      email: "",
      phone: "",
      isPrimary: false,
    },
  });

  const columns: DataTableColumn<ClientContact>[] = [
    { key: "name", header: "Name", render: (contact) => contact.name },
    {
      key: "designation",
      header: "Designation",
      render: (contact) => contact.designation ?? "-",
    },
    { key: "email", header: "Email", render: (contact) => contact.email ?? "-" },
    { key: "phone", header: "Phone", render: (contact) => contact.phone ?? "-" },
    {
      key: "primary",
      header: "Primary",
      render: (contact) => (contact.isPrimary ? "Yes" : "No"),
    },
  ];

  async function onSubmit(values: ClientContactFormValues) {
    setError(null);
    try {
      await addContact.mutateAsync(toContactPayload(values));
      form.reset();
      setOpen(false);
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : "Unable to add contact");
    }
  }

  return (
    <ChildSection
      title="Contacts"
      description="Client contact people and primary contact marker."
      open={open}
      setOpen={setOpen}
      loading={contacts.isLoading}
      error={contacts.error}
      dialogTitle="Add contact"
      dialogDescription="Create a client contact record."
      formId="client-contact-form"
      form={
        <form id="client-contact-form" onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <FormFieldWrapper label="Name" htmlFor="contactName" error={form.formState.errors.name?.message}>
            <Input id="contactName" {...form.register("name")} />
          </FormFieldWrapper>
          <FormFieldWrapper label="Designation" htmlFor="contactDesignation">
            <Input id="contactDesignation" {...form.register("designation")} />
          </FormFieldWrapper>
          <FormFieldWrapper label="Email" htmlFor="contactEmail" error={form.formState.errors.email?.message}>
            <Input id="contactEmail" type="email" {...form.register("email")} />
          </FormFieldWrapper>
          <FormFieldWrapper label="Phone" htmlFor="contactPhone">
            <Input id="contactPhone" {...form.register("phone")} />
          </FormFieldWrapper>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="size-4" {...form.register("isPrimary")} />
            Primary contact
          </label>
          {error ? <ErrorState title="Unable to add contact" message={error} /> : null}
        </form>
      }
    >
      <DataTable
        columns={columns}
        rows={contacts.data ?? []}
        getRowKey={(contact) => contact.id}
        emptyTitle="No contacts found"
      />
    </ChildSection>
  );
}

function ActivitiesSection({ clientId }: { clientId: string }) {
  const activities = useClientActivities(clientId);
  const addActivity = useAddClientActivity(clientId);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<ClientActivityFormValues>({
    resolver: zodResolver(clientActivitySchema),
    defaultValues: {
      type: "CALL",
      title: "",
      description: "",
      dueAt: "",
      completedAt: "",
    },
  });

  const columns: DataTableColumn<ClientActivity>[] = [
    { key: "type", header: "Type", render: (activity) => activity.type },
    { key: "title", header: "Title", render: (activity) => activity.title },
    {
      key: "description",
      header: "Description",
      render: (activity) => activity.description ?? "-",
    },
    { key: "dueAt", header: "Due", render: (activity) => formatClientDate(activity.dueAt) },
    {
      key: "completedAt",
      header: "Completed",
      render: (activity) => formatClientDate(activity.completedAt),
    },
  ];

  async function onSubmit(values: ClientActivityFormValues) {
    setError(null);
    try {
      await addActivity.mutateAsync(toActivityPayload(values));
      form.reset({ type: "CALL", title: "", description: "", dueAt: "", completedAt: "" });
      setOpen(false);
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : "Unable to add activity");
    }
  }

  return (
    <ChildSection
      title="Activities"
      description="Calls, meetings, follow-ups, and CRM timeline events."
      open={open}
      setOpen={setOpen}
      loading={activities.isLoading}
      error={activities.error}
      dialogTitle="Add activity"
      dialogDescription="Create a CRM activity record."
      formId="client-activity-form"
      form={
        <form id="client-activity-form" onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <FormFieldWrapper label="Activity type">
            <Controller
              control={form.control}
              name="type"
              render={({ field }) => (
                <SelectField
                  value={field.value}
                  onValueChange={field.onChange}
                  options={[
                    "CALL",
                    "EMAIL",
                    "MEETING",
                    "FOLLOW_UP",
                    "NOTE",
                    "STATUS_CHANGE",
                    "DOCUMENT",
                    "OTHER",
                  ].map((value) => ({ value, label: value.replaceAll("_", " ") }))}
                />
              )}
            />
          </FormFieldWrapper>
          <FormFieldWrapper label="Title" htmlFor="activityTitle" error={form.formState.errors.title?.message}>
            <Input id="activityTitle" {...form.register("title")} />
          </FormFieldWrapper>
          <FormFieldWrapper label="Description" htmlFor="activityDescription">
            <Input id="activityDescription" {...form.register("description")} />
          </FormFieldWrapper>
          <FormFieldWrapper label="Due date" htmlFor="activityDueAt">
            <Input id="activityDueAt" type="datetime-local" {...form.register("dueAt")} />
          </FormFieldWrapper>
          <FormFieldWrapper label="Completed date" htmlFor="activityCompletedAt">
            <Input id="activityCompletedAt" type="datetime-local" {...form.register("completedAt")} />
          </FormFieldWrapper>
          {error ? <ErrorState title="Unable to add activity" message={error} /> : null}
        </form>
      }
    >
      <DataTable
        columns={columns}
        rows={activities.data ?? []}
        getRowKey={(activity) => activity.id}
        emptyTitle="No activities found"
      />
    </ChildSection>
  );
}

function NotesSection({ clientId }: { clientId: string }) {
  const notes = useClientNotes(clientId);
  const addNote = useAddClientNote(clientId);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<ClientNoteFormValues>({
    resolver: zodResolver(clientNoteSchema),
    defaultValues: { noteText: "" },
  });

  const columns: DataTableColumn<ClientNote>[] = [
    { key: "note", header: "Note", render: (note) => note.noteText },
    { key: "created", header: "Created", render: (note) => formatClientDate(note.createdAt) },
  ];

  async function onSubmit(values: ClientNoteFormValues) {
    setError(null);
    try {
      await addNote.mutateAsync({ noteText: values.noteText.trim() });
      form.reset();
      setOpen(false);
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : "Unable to add note");
    }
  }

  return (
    <ChildSection
      title="Notes"
      description="Internal client notes."
      open={open}
      setOpen={setOpen}
      loading={notes.isLoading}
      error={notes.error}
      dialogTitle="Add note"
      dialogDescription="Create an internal client note."
      formId="client-note-form"
      form={
        <form id="client-note-form" onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <FormFieldWrapper label="Note" htmlFor="noteText" error={form.formState.errors.noteText?.message}>
            <Input id="noteText" {...form.register("noteText")} />
          </FormFieldWrapper>
          {error ? <ErrorState title="Unable to add note" message={error} /> : null}
        </form>
      }
    >
      <DataTable
        columns={columns}
        rows={notes.data ?? []}
        getRowKey={(note) => note.id}
        emptyTitle="No notes found"
      />
    </ChildSection>
  );
}

function DocumentsSection({ clientId }: { clientId: string }) {
  const documents = useClientDocuments(clientId);
  const addDocument = useAddClientDocument(clientId);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<ClientDocumentFormValues>({
    resolver: zodResolver(clientDocumentSchema),
    defaultValues: {
      fileName: "",
      storageKey: "",
      mimeType: "",
      size: 1,
      category: "OTHER",
    },
  });

  const columns: DataTableColumn<ClientDocument>[] = [
    { key: "fileName", header: "File name", render: (document) => document.fileName },
    { key: "category", header: "Category", render: (document) => document.category },
    { key: "mimeType", header: "MIME type", render: (document) => document.mimeType },
    { key: "size", header: "Size", render: (document) => `${document.size} bytes` },
    { key: "created", header: "Created", render: (document) => formatClientDate(document.createdAt) },
  ];

  async function onSubmit(values: ClientDocumentFormValues) {
    setError(null);
    try {
      await addDocument.mutateAsync(toDocumentPayload(values));
      form.reset({ fileName: "", storageKey: "", mimeType: "", size: 1, category: "OTHER" });
      setOpen(false);
    } catch (caught) {
      setError(caught instanceof ApiClientError ? caught.message : "Unable to add document metadata");
    }
  }

  return (
    <ChildSection
      title="Document Metadata"
      description="Metadata only. File upload is intentionally not implemented yet."
      open={open}
      setOpen={setOpen}
      loading={documents.isLoading}
      error={documents.error}
      dialogTitle="Add document metadata"
      dialogDescription="Create a document metadata record without uploading a file."
      formId="client-document-form"
      form={
        <form id="client-document-form" onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <FormFieldWrapper label="File name" htmlFor="fileName" error={form.formState.errors.fileName?.message}>
            <Input id="fileName" {...form.register("fileName")} />
          </FormFieldWrapper>
          <FormFieldWrapper label="Storage key" htmlFor="storageKey" error={form.formState.errors.storageKey?.message}>
            <Input id="storageKey" {...form.register("storageKey")} />
          </FormFieldWrapper>
          <FormFieldWrapper label="MIME type" htmlFor="mimeType" error={form.formState.errors.mimeType?.message}>
            <Input id="mimeType" placeholder="application/pdf" {...form.register("mimeType")} />
          </FormFieldWrapper>
          <FormFieldWrapper label="Size" htmlFor="size" error={form.formState.errors.size?.message}>
            <Input id="size" type="number" min={1} {...form.register("size", { valueAsNumber: true })} />
          </FormFieldWrapper>
          <FormFieldWrapper label="Category">
            <Controller
              control={form.control}
              name="category"
              render={({ field }) => (
                <SelectField
                  value={field.value}
                  onValueChange={field.onChange}
                  options={["CONTRACT", "TAX", "PROPOSAL", "IDENTITY", "OTHER"].map((value) => ({ value, label: value }))}
                />
              )}
            />
          </FormFieldWrapper>
          {error ? <ErrorState title="Unable to add document metadata" message={error} /> : null}
        </form>
      }
    >
      <DataTable
        columns={columns}
        rows={documents.data ?? []}
        getRowKey={(document) => document.id}
        emptyTitle="No documents found"
      />
    </ChildSection>
  );
}

function ChildSection({
  title,
  description,
  children,
  loading,
  error,
  open,
  setOpen,
  dialogTitle,
  dialogDescription,
  formId,
  form,
}: {
  title: string;
  description: string;
  children: ReactNode;
  loading: boolean;
  error: unknown;
  open: boolean;
  setOpen: (open: boolean) => void;
  dialogTitle: string;
  dialogDescription: string;
  formId: string;
  form: ReactNode;
}) {
  const errorMessage =
    error instanceof ApiClientError
      ? error.message
      : error instanceof Error
        ? error.message
        : undefined;

  return (
    <DataCard
      title={title}
      description={description}
      action={
        <PermissionGuard permission="clients.update">
          <Button type="button" onClick={() => setOpen(true)}>
            <Plus className="size-4" />
            Add
          </Button>
        </PermissionGuard>
      }
    >
      <div className="flex flex-col gap-4">
        {loading ? <LoadingState rows={4} /> : null}
        {error ? <ErrorState title={`Unable to load ${title.toLowerCase()}`} message={errorMessage} /> : null}
        {!loading && !error ? children : null}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>{dialogDescription}</DialogDescription>
          </DialogHeader>
          {form}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form={formId}>
              Save
            </Button>
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
          <dd className="text-sm font-medium text-foreground sm:col-span-2">
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
