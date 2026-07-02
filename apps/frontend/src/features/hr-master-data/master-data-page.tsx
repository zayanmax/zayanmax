"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Edit, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { SearchFilterBar } from "@/components/data/search-filter-bar";
import { FormFieldWrapper } from "@/components/forms/form-field-wrapper";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { PermissionGuard } from "@/components/shared/permission-guard";
import { StatusBadge } from "@/components/shared/status-badge";
import { ApiClientError } from "@/lib/api/client";
import { formatDate } from "@/features/employees/utils";

type MasterRecord = {
  id: string;
  name: string;
  status?: string;
  description?: string | null;
  address?: string | null;
  phone?: string | null;
  updatedAt?: string;
};

type MasterPayload = Record<string, string | undefined>;

type FieldConfig = {
  name: string;
  label: string;
  placeholder?: string;
};

export function MasterDataPage<TRecord extends MasterRecord>({
  title,
  description,
  records,
  isLoading,
  error,
  fields,
  schema,
  permission,
  createRecord,
  updateRecord,
}: {
  title: string;
  description: string;
  records?: TRecord[];
  isLoading: boolean;
  error: unknown;
  fields: FieldConfig[];
  schema: Parameters<typeof zodResolver>[0];
  permission: string;
  createRecord: (payload: MasterPayload) => Promise<unknown>;
  updateRecord: (id: string, payload: MasterPayload) => Promise<unknown>;
}) {
  const [search, setSearch] = useState("");
  const [editingRecord, setEditingRecord] = useState<TRecord | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<MasterPayload>({
    resolver: zodResolver(schema) as Resolver<MasterPayload>,
    defaultValues: Object.fromEntries(fields.map((field) => [field.name, ""])),
  });

  const filteredRecords = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return records ?? [];
    return (records ?? []).filter((record) =>
      [
        record.name,
        record.description,
        record.address,
        record.phone,
        record.status,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term)),
    );
  }, [records, search]);

  const columns: DataTableColumn<TRecord>[] = [
    {
      key: "name",
      header: "Name",
      render: (record) => (
        <div>
          <p className="font-medium text-foreground">{record.name}</p>
          <p className="text-xs text-muted-foreground">
            {record.description ?? record.address ?? "-"}
          </p>
        </div>
      ),
    },
    {
      key: "phone",
      header: "Contact",
      render: (record) => record.phone ?? "-",
    },
    {
      key: "status",
      header: "Status",
      render: (record) => <StatusBadge status={record.status ?? "ACTIVE"} />,
    },
    {
      key: "updatedAt",
      header: "Updated",
      render: (record) => formatDate(record.updatedAt),
    },
    {
      key: "actions",
      header: "Actions",
      render: (record) => (
        <PermissionGuard permission={permission}>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => openEdit(record)}
          >
            <Edit className="size-4" />
            Edit
          </Button>
        </PermissionGuard>
      ),
    },
  ];

  function openCreate() {
    setEditingRecord(null);
    setFormError(null);
    form.reset(Object.fromEntries(fields.map((field) => [field.name, ""])));
    setDialogOpen(true);
  }

  function openEdit(record: TRecord) {
    setEditingRecord(record);
    setFormError(null);
    form.reset(
      Object.fromEntries(
        fields.map((field) => [field.name, String(record[field.name as keyof TRecord] ?? "")]),
      ),
    );
    setDialogOpen(true);
  }

  async function onSubmit(values: MasterPayload) {
    setFormError(null);
    const payload = Object.fromEntries(
      Object.entries(values).map(([key, value]) => [
        key,
        value?.trim() ? value.trim() : undefined,
      ]),
    );

    try {
      if (editingRecord) {
        await updateRecord(editingRecord.id, payload);
      } else {
        await createRecord(payload);
      }
      setDialogOpen(false);
    } catch (caught) {
      setFormError(
        caught instanceof ApiClientError
          ? caught.message
          : "Unable to save record",
      );
    }
  }

  const errorMessage =
    error instanceof ApiClientError
      ? error.message
      : error instanceof Error
        ? error.message
        : undefined;

  return (
    <PermissionGuard
      permission="settings.view"
      fallback={
        <ErrorState
          title="Permission required"
          message="You do not have access to this settings page."
        />
      }
    >
      <div className="flex flex-col gap-6">
        <PageHeader
          title={title}
          description={description}
          actions={
            <PermissionGuard permission={permission}>
              <Button type="button" onClick={openCreate}>
                <Plus className="size-4" />
                New
              </Button>
            </PermissionGuard>
          }
        />

        <SearchFilterBar
          value={search}
          onChange={setSearch}
          placeholder={`Search ${title.toLowerCase()}`}
          onReset={() => setSearch("")}
        />

        {isLoading ? <LoadingState rows={5} /> : null}
        {error ? (
          <ErrorState title={`Unable to load ${title.toLowerCase()}`} message={errorMessage} />
        ) : null}
        {!isLoading && !error ? (
          <DataTable
            columns={columns}
            rows={filteredRecords}
            getRowKey={(record) => record.id}
            emptyTitle={`No ${title.toLowerCase()} found`}
          />
        ) : null}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingRecord ? `Edit ${title}` : `New ${title}`}
              </DialogTitle>
              <DialogDescription>{description}</DialogDescription>
            </DialogHeader>

            <form
              id="master-data-form"
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col gap-4"
            >
              {fields.map((field) => (
                <FormFieldWrapper
                  key={field.name}
                  label={field.label}
                  htmlFor={field.name}
                  error={form.formState.errors[field.name]?.message?.toString()}
                >
                  <Input
                    id={field.name}
                    placeholder={field.placeholder}
                    {...form.register(field.name)}
                  />
                </FormFieldWrapper>
              ))}

              {formError ? (
                <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  {formError}
                </div>
              ) : null}
            </form>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="master-data-form"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PermissionGuard>
  );
}
