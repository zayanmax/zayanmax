import type { ApiMeta } from "@/types/api";
import type { Client } from "@/features/clients/types";

export type InvoiceStatus =
  | "DRAFT"
  | "ISSUED"
  | "PARTIALLY_PAID"
  | "PAID"
  | "OVERDUE"
  | "CANCELLED"
  | "WRITTEN_OFF";

export type BillingPaymentMode =
  | "CASH"
  | "BANK_TRANSFER"
  | "UPI"
  | "CARD"
  | "CHEQUE"
  | "OTHER";

export type BillingRelation = {
  id: string;
  name?: string | null;
  quotationNumber?: string | null;
  title?: string | null;
};

export type InvoiceSeries = {
  id: string;
  name: string;
  prefix?: string | null;
  suffix?: string | null;
  nextNumber?: number;
  padding?: number;
  financialYear?: string | null;
  isDefault?: boolean;
};

export type InvoiceItem = {
  id?: string;
  description: string;
  quantity: number | string;
  unitPrice: number | string;
  discountAmount?: number | string | null;
  taxAmount?: number | string | null;
  lineTotal?: number | string | null;
  sortOrder?: number;
};

export type ReceiptAllocation = {
  id: string;
  receiptId: string;
  invoiceId: string;
  amount: number | string;
  allocatedAt?: string;
  receipt?: PaymentReceipt;
  invoice?: Invoice;
};

export type PaymentReceipt = {
  id: string;
  clientId: string;
  receiptNumber: string;
  receiptDate: string;
  amount: number | string;
  paymentMode: BillingPaymentMode;
  referenceNumber?: string | null;
  notes?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt?: string;
  client?: Pick<Client, "id" | "name"> | null;
  allocations?: ReceiptAllocation[];
};

export type CreditNote = {
  id: string;
  clientId?: string | null;
  invoiceId?: string | null;
  creditNoteNumber: string;
  amount: number | string;
  reason?: string | null;
  noteDate?: string;
  metadata?: Record<string, unknown> | null;
};

export type DebitNote = {
  id: string;
  clientId?: string | null;
  invoiceId?: string | null;
  debitNoteNumber: string;
  amount: number | string;
  reason?: string | null;
  noteDate?: string;
  metadata?: Record<string, unknown> | null;
};

export type Invoice = {
  id: string;
  companyId: string;
  clientId: string;
  projectId?: string | null;
  opportunityId?: string | null;
  quotationId?: string | null;
  seriesId?: string | null;
  invoiceNumber: string;
  title: string;
  status: InvoiceStatus;
  currency: string;
  issueDate?: string | null;
  dueDate?: string | null;
  subTotal: number | string;
  discountTotal: number | string;
  taxTotal: number | string;
  adjustmentTotal?: number | string | null;
  grandTotal: number | string;
  paidAmount: number | string;
  balanceAmount: number | string;
  terms?: string | null;
  notes?: string | null;
  issuedAt?: string | null;
  paidAt?: string | null;
  cancelledAt?: string | null;
  writtenOffAt?: string | null;
  cancelReason?: string | null;
  writeOffReason?: string | null;
  createdAt?: string;
  updatedAt?: string;
  client?: Pick<Client, "id" | "name" | "email" | "phone" | "status"> | null;
  project?: BillingRelation | null;
  opportunity?: BillingRelation | null;
  quotation?: BillingRelation | null;
  series?: InvoiceSeries | null;
  items?: InvoiceItem[];
  allocations?: ReceiptAllocation[];
  creditNotes?: CreditNote[];
  debitNotes?: DebitNote[];
};

export type InvoicePayload = {
  clientId: string;
  projectId?: string;
  opportunityId?: string;
  quotationId?: string;
  seriesId?: string;
  invoiceNumber: string;
  title: string;
  currency?: string;
  issueDate: string;
  dueDate?: string;
  adjustmentTotal?: number;
  terms?: string;
  notes?: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    discountAmount?: number;
    taxAmount?: number;
    sortOrder?: number;
  }>;
};

export type InvoiceUpdatePayload = Pick<
  InvoicePayload,
  "title" | "dueDate" | "terms" | "notes"
>;

export type PaymentReceiptPayload = {
  clientId: string;
  receiptNumber: string;
  receiptDate: string;
  amount: number;
  paymentMode: BillingPaymentMode;
  referenceNumber?: string;
  notes?: string;
  allocations?: Array<{ invoiceId: string; amount: number }>;
};

export type CreditNotePayload = {
  clientId?: string;
  invoiceId?: string;
  creditNoteNumber: string;
  amount: number;
  reason?: string;
};

export type DebitNotePayload = {
  clientId?: string;
  invoiceId?: string;
  debitNoteNumber: string;
  amount: number;
  reason?: string;
};

export type ConvertQuotationPayload = {
  invoiceNumber: string;
  issueDate: string;
  dueDate?: string;
  seriesId?: string;
};

export type BillingListQuery = {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  status?: InvoiceStatus;
  clientId?: string;
  projectId?: string;
  opportunityId?: string;
};

export type InvoiceListResult = {
  data: Invoice[];
  meta: Required<ApiMeta>;
};

export type PaymentReceiptListResult = {
  data: PaymentReceipt[];
  meta: Required<ApiMeta>;
};

export type ReceivablesSummary = {
  invoiceAmount: number;
  paidAmount: number;
  outstandingAmount: number;
};

export type InvoiceAgingSummary = {
  buckets: {
    current: number;
    days1To30: number;
    days31To60: number;
    days61To90: number;
    over90: number;
  };
  totalOutstanding: number;
};

export type ClientStatement = {
  clientId: string;
  invoices: Invoice[];
  receipts: PaymentReceipt[];
  creditNotes: CreditNote[];
  debitNotes: DebitNote[];
};
