import { z } from "zod";

export const invoiceStatuses = [
  "DRAFT",
  "ISSUED",
  "PARTIALLY_PAID",
  "PAID",
  "OVERDUE",
  "CANCELLED",
  "WRITTEN_OFF",
] as const;

export const paymentModes = [
  "CASH",
  "BANK_TRANSFER",
  "UPI",
  "CARD",
  "CHEQUE",
  "OTHER",
] as const;

const optionalString = z.string().trim().optional();

export const invoiceItemSchema = z.object({
  description: z.string().trim().min(1, "Description is required"),
  quantity: z.number().min(0),
  unitPrice: z.number().min(0),
  discountAmount: z.number().min(0).optional(),
  taxAmount: z.number().min(0).optional(),
});

export const invoiceSchema = z.object({
  clientId: z.string().trim().min(1, "Client is required"),
  projectId: optionalString,
  opportunityId: optionalString,
  quotationId: optionalString,
  seriesId: optionalString,
  invoiceNumber: z.string().trim().min(1, "Invoice number is required"),
  title: z.string().trim().min(2, "Title must be at least 2 characters"),
  currency: z.string().trim().min(1, "Currency is required"),
  issueDate: z.string().trim().min(1, "Issue date is required"),
  dueDate: optionalString,
  adjustmentTotal: z.number().optional(),
  terms: optionalString,
  notes: optionalString,
  items: z.array(invoiceItemSchema).min(1, "Add at least one line item"),
});

export const invoiceUpdateSchema = invoiceSchema.pick({
  title: true,
  dueDate: true,
  terms: true,
  notes: true,
});

export const receiptSchema = z.object({
  clientId: z.string().trim().min(1, "Client is required"),
  invoiceId: optionalString,
  receiptNumber: z.string().trim().min(1, "Receipt number is required"),
  receiptDate: z.string().trim().min(1, "Receipt date is required"),
  amount: z.number().min(0.01, "Amount must be greater than zero"),
  paymentMode: z.enum(paymentModes),
  referenceNumber: optionalString,
  notes: optionalString,
});

export const creditNoteSchema = z.object({
  clientId: optionalString,
  invoiceId: optionalString,
  creditNoteNumber: z.string().trim().min(1, "Credit note number is required"),
  amount: z.number().min(0.01, "Amount must be greater than zero"),
  reason: optionalString,
});

export const debitNoteSchema = z.object({
  clientId: optionalString,
  invoiceId: optionalString,
  debitNoteNumber: z.string().trim().min(1, "Debit note number is required"),
  amount: z.number().min(0.01, "Amount must be greater than zero"),
  reason: optionalString,
});

export const convertQuotationSchema = z.object({
  quotationId: z.string().trim().min(1, "Quotation is required"),
  invoiceNumber: z.string().trim().min(1, "Invoice number is required"),
  issueDate: z.string().trim().min(1, "Issue date is required"),
  dueDate: optionalString,
  seriesId: optionalString,
});

export type InvoiceFormValues = z.infer<typeof invoiceSchema>;
export type InvoiceUpdateFormValues = z.infer<typeof invoiceUpdateSchema>;
export type ReceiptFormValues = z.infer<typeof receiptSchema>;
export type CreditNoteFormValues = z.infer<typeof creditNoteSchema>;
export type DebitNoteFormValues = z.infer<typeof debitNoteSchema>;
export type ConvertQuotationFormValues = z.infer<typeof convertQuotationSchema>;
