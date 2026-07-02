import type {
  ConvertQuotationPayload,
  CreditNotePayload,
  DebitNotePayload,
  Invoice,
  InvoicePayload,
  InvoiceUpdatePayload,
  PaymentReceiptPayload,
} from "@/features/billing/types";
import type {
  ConvertQuotationFormValues,
  CreditNoteFormValues,
  DebitNoteFormValues,
  InvoiceFormValues,
  InvoiceUpdateFormValues,
  ReceiptFormValues,
} from "@/features/billing/schemas";

export const ALL = "__all__";
export const NONE = "__none__";

export function formatBillingDate(value?: string | null) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(parsed);
}

export function formatBillingMoney(value?: number | string | null, currency = "INR") {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
}

export function toDateInput(value?: string | null) {
  if (!value) return "";
  return value.slice(0, 10);
}

export function cleanOptionalId(value?: string) {
  if (!value || value === NONE || value === ALL) return undefined;
  return value;
}

export function invoiceDisplayTotal(values: InvoiceFormValues | Invoice) {
  if ("grandTotal" in values) return Number(values.grandTotal ?? 0);
  return values.items.reduce((total, item) => {
    return (
      total +
      item.quantity * item.unitPrice -
      (item.discountAmount ?? 0) +
      (item.taxAmount ?? 0)
    );
  }, values.adjustmentTotal ?? 0);
}

export function toInvoicePayload(values: InvoiceFormValues): InvoicePayload {
  return {
    clientId: cleanOptionalId(values.clientId) ?? values.clientId,
    projectId: cleanOptionalId(values.projectId),
    opportunityId: cleanOptionalId(values.opportunityId),
    quotationId: cleanOptionalId(values.quotationId),
    seriesId: cleanOptionalId(values.seriesId),
    invoiceNumber: values.invoiceNumber.trim(),
    title: values.title.trim(),
    currency: values.currency.trim() || "INR",
    issueDate: values.issueDate,
    dueDate: values.dueDate || undefined,
    adjustmentTotal: values.adjustmentTotal,
    terms: values.terms?.trim() || undefined,
    notes: values.notes?.trim() || undefined,
    items: values.items.map((item, index) => ({
      description: item.description.trim(),
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discountAmount: item.discountAmount,
      taxAmount: item.taxAmount,
      sortOrder: index,
    })),
  };
}

export function toInvoiceUpdatePayload(
  values: InvoiceUpdateFormValues,
): InvoiceUpdatePayload {
  return {
    title: values.title.trim(),
    dueDate: values.dueDate || undefined,
    terms: values.terms?.trim() || undefined,
    notes: values.notes?.trim() || undefined,
  };
}

export function toReceiptPayload(values: ReceiptFormValues): PaymentReceiptPayload {
  const invoiceId = cleanOptionalId(values.invoiceId);
  return {
    clientId: values.clientId,
    receiptNumber: values.receiptNumber.trim(),
    receiptDate: values.receiptDate,
    amount: values.amount,
    paymentMode: values.paymentMode,
    referenceNumber: values.referenceNumber?.trim() || undefined,
    notes: values.notes?.trim() || undefined,
    allocations: invoiceId ? [{ invoiceId, amount: values.amount }] : undefined,
  };
}

export function toCreditNotePayload(values: CreditNoteFormValues): CreditNotePayload {
  return {
    clientId: cleanOptionalId(values.clientId),
    invoiceId: cleanOptionalId(values.invoiceId),
    creditNoteNumber: values.creditNoteNumber.trim(),
    amount: values.amount,
    reason: values.reason?.trim() || undefined,
  };
}

export function toDebitNotePayload(values: DebitNoteFormValues): DebitNotePayload {
  return {
    clientId: cleanOptionalId(values.clientId),
    invoiceId: cleanOptionalId(values.invoiceId),
    debitNoteNumber: values.debitNoteNumber.trim(),
    amount: values.amount,
    reason: values.reason?.trim() || undefined,
  };
}

export function toConvertQuotationPayload(
  values: ConvertQuotationFormValues,
): ConvertQuotationPayload {
  return {
    invoiceNumber: values.invoiceNumber.trim(),
    issueDate: values.issueDate,
    dueDate: values.dueDate || undefined,
    seriesId: cleanOptionalId(values.seriesId),
  };
}
