"use client";

import { useMemo, useState } from "react";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { SelectField } from "@/components/forms/select-field";
import { DataCard } from "@/components/shared/data-card";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { PermissionGuard } from "@/components/shared/permission-guard";
import { useClientStatement } from "@/features/billing/hooks";
import { formatBillingDate, formatBillingMoney, NONE } from "@/features/billing/utils";
import { useClients } from "@/features/clients/hooks";
import { ApiClientError } from "@/lib/api/client";

type StatementRow = {
  id: string;
  date?: string | null;
  type: string;
  reference: string;
  debit: number;
  credit: number;
  balance: number;
};

export function ClientStatementsPage() {
  const [clientId, setClientId] = useState(NONE);
  const clients = useClients({ page: 1, limit: 100, sortBy: "name", sortOrder: "asc" });
  const statement = useClientStatement(clientId === NONE ? "" : clientId);
  const clientOptions = useMemo(
    () => [{ value: NONE, label: "Select client" }, ...(clients.data?.data ?? []).map((client) => ({ value: client.id, label: client.name }))],
    [clients.data?.data],
  );
  const rows = useMemo(() => {
    const raw = [
      ...(statement.data?.invoices ?? []).map((invoice) => ({ id: invoice.id, date: invoice.issueDate, type: "Invoice", reference: invoice.invoiceNumber, debit: Number(invoice.grandTotal ?? 0), credit: 0 })),
      ...(statement.data?.receipts ?? []).map((receipt) => ({ id: receipt.id, date: receipt.receiptDate, type: "Receipt", reference: receipt.receiptNumber, debit: 0, credit: Number(receipt.amount ?? 0) })),
      ...(statement.data?.creditNotes ?? []).map((note) => ({ id: note.id, date: note.noteDate, type: "Credit note", reference: note.creditNoteNumber, debit: 0, credit: Number(note.amount ?? 0) })),
      ...(statement.data?.debitNotes ?? []).map((note) => ({ id: note.id, date: note.noteDate, type: "Debit note", reference: note.debitNoteNumber, debit: Number(note.amount ?? 0), credit: 0 })),
    ].sort((first, second) => new Date(first.date ?? 0).getTime() - new Date(second.date ?? 0).getTime());
    return raw.reduce<StatementRow[]>((accumulator, row) => {
      const previousBalance = accumulator.at(-1)?.balance ?? 0;
      accumulator.push({ ...row, balance: previousBalance + row.debit - row.credit });
      return accumulator;
    }, []);
  }, [statement.data]);
  const columns: DataTableColumn<StatementRow>[] = [
    { key: "date", header: "Date", render: (row) => formatBillingDate(row.date) },
    { key: "type", header: "Type", render: (row) => row.type },
    { key: "reference", header: "Reference", render: (row) => row.reference },
    { key: "debit", header: "Debit", render: (row) => row.debit ? formatBillingMoney(row.debit) : "-" },
    { key: "credit", header: "Credit", render: (row) => row.credit ? formatBillingMoney(row.credit) : "-" },
    { key: "balance", header: "Balance", render: (row) => formatBillingMoney(row.balance) },
  ];
  const errorMessage = statement.error instanceof ApiClientError ? statement.error.message : statement.error instanceof Error ? statement.error.message : undefined;
  return (
    <PermissionGuard permission="billing.view" fallback={<ErrorState title="Permission required" message="You do not have access to client statements." />}>
      <div className="flex flex-col gap-6">
        <PageHeader title="Client Statements" description="Invoice, receipt, credit note, and debit note metadata by client." />
        <DataCard title="Statement Filter">
          <SelectField value={clientId} onValueChange={setClientId} options={clientOptions} className="w-full sm:w-80" />
        </DataCard>
        {statement.isLoading ? <LoadingState rows={6} /> : null}
        {statement.error ? <ErrorState title="Unable to load statement" message={errorMessage} /> : null}
        {clientId !== NONE && !statement.isLoading && !statement.error ? (
          <DataCard title="Statement Rows">
            <DataTable columns={columns} rows={rows} getRowKey={(row) => `${row.type}-${row.id}`} emptyTitle="No statement rows found" />
          </DataCard>
        ) : null}
      </div>
    </PermissionGuard>
  );
}
