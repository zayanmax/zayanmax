import type { ApiMeta } from "@/types/api";
import type { Employee } from "@/features/employees/types";

export type RecordStatus = "ACTIVE" | "INACTIVE" | "ARCHIVED";
export type ExpenseClaimStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "APPROVED"
  | "REJECTED"
  | "PAID"
  | "CANCELLED";
export type VendorBillStatus =
  | "DRAFT"
  | "APPROVED"
  | "PARTIALLY_PAID"
  | "PAID"
  | "CANCELLED";
export type VendorPaymentStatus = "RECORDED" | "CANCELLED";
export type PaymentMode =
  | "CASH"
  | "BANK_TRANSFER"
  | "UPI"
  | "CARD"
  | "CHEQUE"
  | "OTHER";
export type PettyCashTransactionType = "INFLOW" | "OUTFLOW";

export type ExpenseCategory = {
  id: string;
  name: string;
  description?: string | null;
  status?: RecordStatus;
  createdAt?: string;
};

export type ExpenseClaimItem = {
  id?: string;
  expenseCategoryId?: string | null;
  description: string;
  expenseDate: string;
  amount: number | string;
  taxAmount?: number | string | null;
  expenseCategory?: ExpenseCategory | null;
};

export type ExpenseAttachment = {
  id?: string;
  fileName: string;
  storageKey: string;
  mimeType: string;
  size: number;
  createdAt?: string;
};

export type FinanceEmployee = Pick<
  Employee,
  "id" | "firstName" | "lastName" | "employeeCode" | "email"
>;

export type ExpenseClaim = {
  id: string;
  employeeId?: string | null;
  claimNumber: string;
  title: string;
  claimDate: string;
  status: ExpenseClaimStatus;
  totalAmount: number | string;
  submittedAt?: string | null;
  reviewedAt?: string | null;
  reviewComment?: string | null;
  paidAt?: string | null;
  cancelledAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  employee?: FinanceEmployee | null;
  items?: ExpenseClaimItem[];
  attachments?: ExpenseAttachment[];
};

export type ExpenseClaimPayload = {
  employeeId?: string;
  claimDate: string;
  title: string;
  items: Array<{
    expenseCategoryId?: string;
    description: string;
    expenseDate: string;
    amount: number;
    taxAmount?: number;
  }>;
  attachments?: Array<{
    fileName: string;
    storageKey: string;
    mimeType: string;
    size: number;
  }>;
};

export type Vendor = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  gstin?: string | null;
  address?: string | null;
  status?: RecordStatus;
  createdAt?: string;
  updatedAt?: string;
  bills?: VendorBill[];
  payments?: VendorPayment[];
};

export type VendorPayload = {
  name: string;
  email?: string;
  phone?: string;
  gstin?: string;
  address?: string;
};

export type VendorBillItem = {
  id?: string;
  description: string;
  quantity: number | string;
  unitPrice: number | string;
  taxAmount?: number | string | null;
  lineTotal?: number | string | null;
};

export type VendorBill = {
  id: string;
  vendorId: string;
  billNumber: string;
  billDate: string;
  dueDate?: string | null;
  status: VendorBillStatus;
  subTotal: number | string;
  taxAmount: number | string;
  totalAmount: number | string;
  paidAmount: number | string;
  balanceAmount: number | string;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
  vendor?: Pick<Vendor, "id" | "name" | "email" | "phone"> | null;
  items?: VendorBillItem[];
  payments?: VendorPayment[];
};

export type VendorBillPayload = {
  vendorId: string;
  billNumber: string;
  billDate: string;
  dueDate?: string;
  notes?: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    taxAmount?: number;
  }>;
};

export type VendorPayment = {
  id: string;
  vendorId: string;
  vendorBillId?: string | null;
  paymentDate: string;
  amount: number | string;
  mode: PaymentMode;
  referenceNumber?: string | null;
  status: VendorPaymentStatus;
  notes?: string | null;
  createdAt?: string;
  vendor?: Pick<Vendor, "id" | "name"> | null;
  vendorBill?: Pick<VendorBill, "id" | "billNumber"> | null;
};

export type VendorPaymentPayload = {
  vendorId: string;
  vendorBillId?: string;
  paymentDate: string;
  amount: number;
  mode: PaymentMode;
  referenceNumber?: string;
  notes?: string;
};

export type PettyCashAccount = {
  id: string;
  name: string;
  currentBalance: number | string;
  status?: RecordStatus;
  createdAt?: string;
};

export type PettyCashTransaction = {
  id: string;
  pettyCashAccountId: string;
  type: PettyCashTransactionType;
  transactionDate: string;
  amount: number | string;
  description: string;
  referenceNumber?: string | null;
  createdAt?: string;
  pettyCashAccount?: Pick<PettyCashAccount, "id" | "name"> | null;
};

export type PettyCashAccountPayload = {
  name: string;
  openingBalance?: number;
};

export type PettyCashTransactionPayload = {
  pettyCashAccountId: string;
  type: PettyCashTransactionType;
  transactionDate: string;
  amount: number;
  description: string;
  referenceNumber?: string;
};

export type FinanceSummary = {
  expenseClaims: {
    total: number;
    approvedAmount: number;
    paidAmount: number;
  };
  vendorBills: {
    outstandingAmount: number;
  };
  vendorPayments: {
    paidAmount: number;
  };
  pettyCash: {
    balanceAmount?: number;
    transactionAmount?: number;
  };
};

export type FinanceListQuery = {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  status?: string;
  employeeId?: string;
  vendorId?: string;
  vendorBillId?: string;
  pettyCashAccountId?: string;
  type?: PettyCashTransactionType;
  fromDate?: string;
  toDate?: string;
};

export type FinanceListResult<T> = {
  data: T[];
  meta: Required<ApiMeta>;
};
