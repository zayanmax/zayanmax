import { z } from "zod";

export const expenseStatuses = [
  "DRAFT",
  "SUBMITTED",
  "APPROVED",
  "REJECTED",
  "PAID",
  "CANCELLED",
] as const;
export const vendorBillStatuses = [
  "DRAFT",
  "APPROVED",
  "PARTIALLY_PAID",
  "PAID",
  "CANCELLED",
] as const;
export const vendorPaymentStatuses = ["RECORDED", "CANCELLED"] as const;
export const paymentModes = [
  "CASH",
  "BANK_TRANSFER",
  "UPI",
  "CARD",
  "CHEQUE",
  "OTHER",
] as const;
export const pettyCashTransactionTypes = ["INFLOW", "OUTFLOW"] as const;

const optionalString = z.string().trim().optional();

export const expenseCategorySchema = z.object({
  name: z.string().trim().min(2, "Category name must be at least 2 characters"),
  description: optionalString,
});

export const expenseItemSchema = z.object({
  expenseCategoryId: optionalString,
  description: z.string().trim().min(1, "Description is required"),
  expenseDate: z.string().trim().min(1, "Expense date is required"),
  amount: z.number().min(0),
  taxAmount: z.number().min(0).optional(),
});

export const expenseAttachmentSchema = z.object({
  fileName: z.string().trim().min(1, "File name is required"),
  storageKey: z.string().trim().min(1, "Storage key is required"),
  mimeType: z.string().trim().min(1, "MIME type is required"),
  size: z.number().int().min(1, "Size must be greater than zero"),
});

export const expenseSchema = z.object({
  employeeId: optionalString,
  claimDate: z.string().trim().min(1, "Claim date is required"),
  title: z.string().trim().min(2, "Title must be at least 2 characters"),
  items: z.array(expenseItemSchema).min(1, "Add at least one expense item"),
  attachments: z.array(expenseAttachmentSchema).optional(),
});

export const vendorSchema = z.object({
  name: z.string().trim().min(2, "Vendor name must be at least 2 characters"),
  email: optionalString.refine(
    (value) => !value || z.string().email().safeParse(value).success,
    "Enter a valid email address",
  ),
  phone: optionalString,
  gstin: optionalString,
  address: optionalString,
});

export const vendorBillItemSchema = z.object({
  description: z.string().trim().min(1, "Description is required"),
  quantity: z.number().min(0),
  unitPrice: z.number().min(0),
  taxAmount: z.number().min(0).optional(),
});

export const vendorBillSchema = z.object({
  vendorId: z.string().trim().min(1, "Vendor is required"),
  billNumber: z.string().trim().min(1, "Bill number is required"),
  billDate: z.string().trim().min(1, "Bill date is required"),
  dueDate: optionalString,
  notes: optionalString,
  items: z.array(vendorBillItemSchema).min(1, "Add at least one bill item"),
});

export const vendorPaymentSchema = z.object({
  vendorId: z.string().trim().min(1, "Vendor is required"),
  vendorBillId: optionalString,
  paymentDate: z.string().trim().min(1, "Payment date is required"),
  amount: z.number().min(0.01, "Amount must be greater than zero"),
  mode: z.enum(paymentModes),
  referenceNumber: optionalString,
  notes: optionalString,
});

export const pettyCashAccountSchema = z.object({
  name: z.string().trim().min(2, "Account name must be at least 2 characters"),
  openingBalance: z.number().min(0).optional(),
});

export const pettyCashTransactionSchema = z.object({
  pettyCashAccountId: z.string().trim().min(1, "Petty cash account is required"),
  type: z.enum(pettyCashTransactionTypes),
  transactionDate: z.string().trim().min(1, "Transaction date is required"),
  amount: z.number().min(0.01, "Amount must be greater than zero"),
  description: z.string().trim().min(1, "Description is required"),
  referenceNumber: optionalString,
});

export type ExpenseCategoryFormValues = z.infer<typeof expenseCategorySchema>;
export type ExpenseFormValues = z.infer<typeof expenseSchema>;
export type VendorFormValues = z.infer<typeof vendorSchema>;
export type VendorBillFormValues = z.infer<typeof vendorBillSchema>;
export type VendorPaymentFormValues = z.infer<typeof vendorPaymentSchema>;
export type PettyCashAccountFormValues = z.infer<typeof pettyCashAccountSchema>;
export type PettyCashTransactionFormValues = z.infer<typeof pettyCashTransactionSchema>;
