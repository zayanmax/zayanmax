import type {
  OpportunityPayload,
  Quotation,
  QuotationPayload,
  QuotationUpdatePayload,
  SalesLeadPayload,
} from "@/features/sales/types";
import type {
  LeadFormValues,
  OpportunityFormValues,
  QuotationFormValues,
  QuotationUpdateFormValues,
} from "@/features/sales/schemas";

export const NONE = "__none__";

export function formatSalesDate(value?: string | null) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(parsed);
}

export function formatSalesMoney(value?: number | string | null, currency = "INR") {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
}

export function toLeadPayload(values: LeadFormValues): SalesLeadPayload {
  return {
    sourceId: cleanOptionalId(values.sourceId),
    stageId: cleanOptionalId(values.stageId),
    name: values.name.trim(),
    companyName: values.companyName?.trim() || undefined,
    email: values.email?.trim() || undefined,
    phone: values.phone?.trim() || undefined,
    website: values.website?.trim() || undefined,
    industry: values.industry?.trim() || undefined,
    estimatedValue: values.estimatedValue,
    assignedEmployeeId: cleanOptionalId(values.assignedEmployeeId),
    notes: values.notes?.trim() || undefined,
  };
}

export function toOpportunityPayload(values: OpportunityFormValues): OpportunityPayload {
  return {
    leadId: cleanOptionalId(values.leadId),
    clientId: cleanOptionalId(values.clientId),
    stageId: cleanOptionalId(values.stageId),
    name: values.name.trim(),
    description: values.description?.trim() || undefined,
    expectedValue: values.expectedValue,
    probability: values.probability,
    expectedCloseDate: values.expectedCloseDate || undefined,
    assignedEmployeeId: cleanOptionalId(values.assignedEmployeeId),
  };
}

export function toQuotationPayload(values: QuotationFormValues): QuotationPayload {
  return {
    opportunityId: cleanOptionalId(values.opportunityId),
    leadId: cleanOptionalId(values.leadId),
    clientId: cleanOptionalId(values.clientId),
    quotationNumber: values.quotationNumber.trim(),
    title: values.title.trim(),
    currency: values.currency.trim() || "INR",
    validUntil: values.validUntil || undefined,
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

export function toQuotationUpdatePayload(
  values: QuotationUpdateFormValues,
): QuotationUpdatePayload {
  return {
    title: values.title.trim(),
    currency: values.currency.trim() || "INR",
    validUntil: values.validUntil || undefined,
    terms: values.terms?.trim() || undefined,
    notes: values.notes?.trim() || undefined,
  };
}

export function quotationDisplayTotal(values: QuotationFormValues | Quotation) {
  if ("grandTotal" in values) return Number(values.grandTotal ?? 0);
  return values.items.reduce((total, item) => {
    return (
      total +
      item.quantity * item.unitPrice -
      (item.discountAmount ?? 0) +
      (item.taxAmount ?? 0)
    );
  }, 0);
}

export function cleanOptionalId(value?: string) {
  if (!value || value === NONE) return undefined;
  return value;
}

export function toDateInput(value?: string | null) {
  if (!value) return "";
  return value.slice(0, 10);
}

export function ownerLabel(email?: string | null, employeeName?: string | null) {
  return employeeName || email || "-";
}
