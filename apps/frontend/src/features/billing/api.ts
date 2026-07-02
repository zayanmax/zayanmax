import { apiRequest } from "@/lib/api/client";
import type { PaginatedResult } from "@/types/api";
import type {
  BillingListQuery,
  ClientStatement,
  ConvertQuotationPayload,
  CreditNote,
  CreditNotePayload,
  DebitNote,
  DebitNotePayload,
  Invoice,
  InvoiceAgingSummary,
  InvoiceListResult,
  InvoicePayload,
  InvoiceSeries,
  InvoiceUpdatePayload,
  PaymentReceipt,
  PaymentReceiptListResult,
  PaymentReceiptPayload,
  ReceivablesSummary,
} from "@/features/billing/types";

export const billingApi = {
  listInvoiceSeries: () =>
    apiRequest<PaginatedResult<InvoiceSeries>>({
      url: "/billing/invoice-series",
      method: "GET",
      params: { page: 1, limit: 100, sortBy: "name", sortOrder: "asc" },
    }),
  listInvoices: (params: BillingListQuery) =>
    apiRequest<InvoiceListResult>({
      url: "/billing/invoices",
      method: "GET",
      params,
    }),
  getInvoice: (id: string) =>
    apiRequest<Invoice>({
      url: `/billing/invoices/${id}`,
      method: "GET",
    }),
  createInvoice: (payload: InvoicePayload) =>
    apiRequest<Invoice>({
      url: "/billing/invoices",
      method: "POST",
      data: payload,
    }),
  updateInvoice: (id: string, payload: InvoiceUpdatePayload) =>
    apiRequest<Invoice>({
      url: `/billing/invoices/${id}`,
      method: "PATCH",
      data: payload,
    }),
  issueInvoice: (id: string) =>
    apiRequest<Invoice>({
      url: `/billing/invoices/${id}/issue`,
      method: "PATCH",
    }),
  cancelInvoice: (id: string, reason?: string) =>
    apiRequest<Invoice>({
      url: `/billing/invoices/${id}/cancel`,
      method: "PATCH",
      data: { reason },
    }),
  writeOffInvoice: (id: string, reason?: string) =>
    apiRequest<Invoice>({
      url: `/billing/invoices/${id}/write-off`,
      method: "PATCH",
      data: { reason },
    }),
  convertQuotationToInvoice: (quotationId: string, payload: ConvertQuotationPayload) =>
    apiRequest<Invoice>({
      url: `/billing/quotations/${quotationId}/convert-to-invoice`,
      method: "POST",
      data: payload,
    }),
  listPaymentReceipts: (params: Omit<BillingListQuery, "status" | "projectId" | "opportunityId">) =>
    apiRequest<PaymentReceiptListResult>({
      url: "/billing/payment-receipts",
      method: "GET",
      params,
    }),
  createPaymentReceipt: (payload: PaymentReceiptPayload) =>
    apiRequest<PaymentReceipt>({
      url: "/billing/payment-receipts",
      method: "POST",
      data: payload,
    }),
  createCreditNote: (payload: CreditNotePayload) =>
    apiRequest<CreditNote>({
      url: "/billing/credit-notes",
      method: "POST",
      data: payload,
    }),
  createDebitNote: (payload: DebitNotePayload) =>
    apiRequest<DebitNote>({
      url: "/billing/debit-notes",
      method: "POST",
      data: payload,
    }),
  receivablesSummary: () =>
    apiRequest<ReceivablesSummary>({
      url: "/billing/receivables/summary",
      method: "GET",
    }),
  invoiceAgingSummary: () =>
    apiRequest<InvoiceAgingSummary>({
      url: "/billing/receivables/aging",
      method: "GET",
    }),
  clientStatement: (clientId: string) =>
    apiRequest<ClientStatement>({
      url: `/billing/clients/${clientId}/statement`,
      method: "GET",
    }),
};
