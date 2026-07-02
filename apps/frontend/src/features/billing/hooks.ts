import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { billingApi } from "@/features/billing/api";
import type {
  BillingListQuery,
  ConvertQuotationPayload,
  CreditNotePayload,
  DebitNotePayload,
  InvoicePayload,
  InvoiceUpdatePayload,
  PaymentReceiptPayload,
} from "@/features/billing/types";

export const billingKeys = {
  all: ["billing"] as const,
  invoiceSeries: () => [...billingKeys.all, "invoice-series"] as const,
  invoices: (query: BillingListQuery) => [...billingKeys.all, "invoices", query] as const,
  invoice: (id: string) => [...billingKeys.all, "invoice", id] as const,
  receipts: (query: Omit<BillingListQuery, "status" | "projectId" | "opportunityId">) =>
    [...billingKeys.all, "receipts", query] as const,
  summary: () => [...billingKeys.all, "summary"] as const,
  aging: () => [...billingKeys.all, "aging"] as const,
  statement: (clientId: string) => [...billingKeys.all, "statement", clientId] as const,
};

export function useInvoiceSeries() {
  return useQuery({
    queryKey: billingKeys.invoiceSeries(),
    queryFn: billingApi.listInvoiceSeries,
  });
}

export function useBillingInvoices(query: BillingListQuery) {
  return useQuery({
    queryKey: billingKeys.invoices(query),
    queryFn: () => billingApi.listInvoices(query),
  });
}

export function useBillingInvoice(id: string) {
  return useQuery({
    queryKey: billingKeys.invoice(id),
    queryFn: () => billingApi.getInvoice(id),
    enabled: Boolean(id),
  });
}

export function useCreateBillingInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: InvoicePayload) => billingApi.createInvoice(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: billingKeys.all });
    },
  });
}

export function useUpdateBillingInvoice(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: InvoiceUpdatePayload) => billingApi.updateInvoice(id, payload),
    onSuccess: async (invoice) => {
      await queryClient.invalidateQueries({ queryKey: billingKeys.all });
      queryClient.setQueryData(billingKeys.invoice(invoice.id), invoice);
    },
  });
}

export function useIssueBillingInvoice(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => billingApi.issueInvoice(id),
    onSuccess: async (invoice) => {
      await queryClient.invalidateQueries({ queryKey: billingKeys.all });
      queryClient.setQueryData(billingKeys.invoice(invoice.id), invoice);
    },
  });
}

export function useCancelBillingInvoice(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reason?: string) => billingApi.cancelInvoice(id, reason),
    onSuccess: async (invoice) => {
      await queryClient.invalidateQueries({ queryKey: billingKeys.all });
      queryClient.setQueryData(billingKeys.invoice(invoice.id), invoice);
    },
  });
}

export function useWriteOffBillingInvoice(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reason?: string) => billingApi.writeOffInvoice(id, reason),
    onSuccess: async (invoice) => {
      await queryClient.invalidateQueries({ queryKey: billingKeys.all });
      queryClient.setQueryData(billingKeys.invoice(invoice.id), invoice);
    },
  });
}

export function useConvertQuotationToInvoice(quotationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ConvertQuotationPayload) =>
      billingApi.convertQuotationToInvoice(quotationId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: billingKeys.all });
    },
  });
}

export function usePaymentReceipts(
  query: Omit<BillingListQuery, "status" | "projectId" | "opportunityId">,
) {
  return useQuery({
    queryKey: billingKeys.receipts(query),
    queryFn: () => billingApi.listPaymentReceipts(query),
  });
}

export function useCreatePaymentReceipt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: PaymentReceiptPayload) => billingApi.createPaymentReceipt(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: billingKeys.all });
    },
  });
}

export function useCreateCreditNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreditNotePayload) => billingApi.createCreditNote(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: billingKeys.all });
    },
  });
}

export function useCreateDebitNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: DebitNotePayload) => billingApi.createDebitNote(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: billingKeys.all });
    },
  });
}

export function useReceivablesSummary() {
  return useQuery({
    queryKey: billingKeys.summary(),
    queryFn: billingApi.receivablesSummary,
  });
}

export function useInvoiceAgingSummary() {
  return useQuery({
    queryKey: billingKeys.aging(),
    queryFn: billingApi.invoiceAgingSummary,
  });
}

export function useClientStatement(clientId: string) {
  return useQuery({
    queryKey: billingKeys.statement(clientId),
    queryFn: () => billingApi.clientStatement(clientId),
    enabled: Boolean(clientId),
  });
}
