import type {
  ExpenseClaim,
  ExpenseClaimPayload,
  PettyCashAccountPayload,
  PettyCashTransactionPayload,
  VendorBill,
  VendorBillPayload,
  VendorPaymentPayload,
  VendorPayload,
} from "@/features/finance/types";
import type {
  ExpenseFormValues,
  PettyCashAccountFormValues,
  PettyCashTransactionFormValues,
  VendorBillFormValues,
  VendorFormValues,
  VendorPaymentFormValues,
} from "@/features/finance/schemas";

export const ALL = "__all__";
export const NONE = "__none__";

export function formatFinanceDate(value?: string | null) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(parsed);
}

export function formatFinanceMoney(value?: number | string | null, currency = "INR") {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
}

export function cleanOptionalId(value?: string) {
  if (!value || value === ALL || value === NONE) return undefined;
  return value;
}

export function toDateInput(value?: string | null) {
  if (!value) return "";
  return value.slice(0, 10);
}

export function employeeLabel(employee?: {
  firstName?: string;
  lastName?: string;
  employeeCode?: string;
  email?: string;
} | null) {
  if (!employee) return "-";
  const name = [employee.firstName, employee.lastName].filter(Boolean).join(" ");
  return name || employee.email || employee.employeeCode || "-";
}

export function expenseTotal(values: ExpenseFormValues | ExpenseClaim) {
  if ("totalAmount" in values) return Number(values.totalAmount ?? 0);
  return values.items.reduce(
    (total, item) => total + item.amount + (item.taxAmount ?? 0),
    0,
  );
}

export function vendorBillTotal(values: VendorBillFormValues | VendorBill) {
  if ("totalAmount" in values) return Number(values.totalAmount ?? 0);
  return values.items.reduce(
    (total, item) => total + item.quantity * item.unitPrice + (item.taxAmount ?? 0),
    0,
  );
}

export function toExpensePayload(values: ExpenseFormValues): ExpenseClaimPayload {
  return {
    employeeId: cleanOptionalId(values.employeeId),
    claimDate: values.claimDate,
    title: values.title.trim(),
    items: values.items.map((item) => ({
      expenseCategoryId: cleanOptionalId(item.expenseCategoryId),
      description: item.description.trim(),
      expenseDate: item.expenseDate,
      amount: item.amount,
      taxAmount: item.taxAmount,
    })),
    attachments: values.attachments?.map((attachment) => ({
      fileName: attachment.fileName.trim(),
      storageKey: attachment.storageKey.trim(),
      mimeType: attachment.mimeType.trim(),
      size: attachment.size,
    })),
  };
}

export function toVendorPayload(values: VendorFormValues): VendorPayload {
  return {
    name: values.name.trim(),
    email: values.email?.trim() || undefined,
    phone: values.phone?.trim() || undefined,
    gstin: values.gstin?.trim() || undefined,
    address: values.address?.trim() || undefined,
  };
}

export function toVendorBillPayload(values: VendorBillFormValues): VendorBillPayload {
  return {
    vendorId: values.vendorId,
    billNumber: values.billNumber.trim(),
    billDate: values.billDate,
    dueDate: values.dueDate || undefined,
    notes: values.notes?.trim() || undefined,
    items: values.items.map((item) => ({
      description: item.description.trim(),
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      taxAmount: item.taxAmount,
    })),
  };
}

export function toVendorPaymentPayload(values: VendorPaymentFormValues): VendorPaymentPayload {
  return {
    vendorId: values.vendorId,
    vendorBillId: cleanOptionalId(values.vendorBillId),
    paymentDate: values.paymentDate,
    amount: values.amount,
    mode: values.mode,
    referenceNumber: values.referenceNumber?.trim() || undefined,
    notes: values.notes?.trim() || undefined,
  };
}

export function toPettyCashAccountPayload(
  values: PettyCashAccountFormValues,
): PettyCashAccountPayload {
  return {
    name: values.name.trim(),
    openingBalance: values.openingBalance,
  };
}

export function toPettyCashTransactionPayload(
  values: PettyCashTransactionFormValues,
): PettyCashTransactionPayload {
  return {
    pettyCashAccountId: values.pettyCashAccountId,
    type: values.type,
    transactionDate: values.transactionDate,
    amount: values.amount,
    description: values.description.trim(),
    referenceNumber: values.referenceNumber?.trim() || undefined,
  };
}
