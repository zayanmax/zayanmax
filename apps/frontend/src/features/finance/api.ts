import { apiRequest } from "@/lib/api/client";
import type { PaginatedResult } from "@/types/api";
import type {
  ExpenseCategory,
  ExpenseClaim,
  ExpenseClaimPayload,
  FinanceListQuery,
  FinanceListResult,
  FinanceSummary,
  PettyCashAccount,
  PettyCashAccountPayload,
  PettyCashTransaction,
  PettyCashTransactionPayload,
  Vendor,
  VendorBill,
  VendorBillPayload,
  VendorPayment,
  VendorPaymentPayload,
  VendorPayload,
} from "@/features/finance/types";

export const financeApi = {
  dashboardSummary: () =>
    apiRequest<FinanceSummary>({ url: "/finance/dashboard-summary", method: "GET" }),
  paymentModes: () =>
    apiRequest<string[]>({ url: "/finance/payment-modes", method: "GET" }),
  listExpenseCategories: (params: FinanceListQuery) =>
    apiRequest<PaginatedResult<ExpenseCategory>>({
      url: "/finance/expense-categories",
      method: "GET",
      params,
    }),
  createExpenseCategory: (payload: { name: string; description?: string }) =>
    apiRequest<ExpenseCategory>({
      url: "/finance/expense-categories",
      method: "POST",
      data: payload,
    }),
  listExpenses: (params: FinanceListQuery) =>
    apiRequest<FinanceListResult<ExpenseClaim>>({
      url: "/finance/expenses",
      method: "GET",
      params,
    }),
  getExpense: (id: string) =>
    apiRequest<ExpenseClaim>({ url: `/finance/expenses/${id}`, method: "GET" }),
  createExpense: (payload: ExpenseClaimPayload) =>
    apiRequest<ExpenseClaim>({ url: "/finance/expenses", method: "POST", data: payload }),
  updateExpense: (id: string, payload: Partial<ExpenseClaimPayload>) =>
    apiRequest<ExpenseClaim>({
      url: `/finance/expenses/${id}`,
      method: "PATCH",
      data: payload,
    }),
  changeExpenseStatus: (id: string, payload: { status: string; reviewComment?: string }) =>
    apiRequest<ExpenseClaim>({
      url: `/finance/expenses/${id}/status`,
      method: "PATCH",
      data: payload,
    }),
  listVendors: (params: FinanceListQuery) =>
    apiRequest<FinanceListResult<Vendor>>({ url: "/vendors", method: "GET", params }),
  getVendor: (id: string) =>
    apiRequest<Vendor>({ url: `/vendors/${id}`, method: "GET" }),
  createVendor: (payload: VendorPayload) =>
    apiRequest<Vendor>({ url: "/vendors", method: "POST", data: payload }),
  updateVendor: (id: string, payload: Partial<VendorPayload>) =>
    apiRequest<Vendor>({ url: `/vendors/${id}`, method: "PATCH", data: payload }),
  listVendorBills: (params: FinanceListQuery) =>
    apiRequest<FinanceListResult<VendorBill>>({
      url: "/finance/vendor-bills",
      method: "GET",
      params,
    }),
  getVendorBill: (id: string) =>
    apiRequest<VendorBill>({ url: `/finance/vendor-bills/${id}`, method: "GET" }),
  createVendorBill: (payload: VendorBillPayload) =>
    apiRequest<VendorBill>({
      url: "/finance/vendor-bills",
      method: "POST",
      data: payload,
    }),
  updateVendorBill: (id: string, payload: Partial<VendorBillPayload>) =>
    apiRequest<VendorBill>({
      url: `/finance/vendor-bills/${id}`,
      method: "PATCH",
      data: payload,
    }),
  listVendorPayments: (params: FinanceListQuery) =>
    apiRequest<FinanceListResult<VendorPayment>>({
      url: "/finance/vendor-payments",
      method: "GET",
      params,
    }),
  createVendorPayment: (payload: VendorPaymentPayload) =>
    apiRequest<VendorPayment>({
      url: "/finance/vendor-payments",
      method: "POST",
      data: payload,
    }),
  listPettyCashAccounts: (params: FinanceListQuery) =>
    apiRequest<FinanceListResult<PettyCashAccount>>({
      url: "/finance/petty-cash-accounts",
      method: "GET",
      params,
    }),
  createPettyCashAccount: (payload: PettyCashAccountPayload) =>
    apiRequest<PettyCashAccount>({
      url: "/finance/petty-cash-accounts",
      method: "POST",
      data: payload,
    }),
  listPettyCashTransactions: (params: FinanceListQuery) =>
    apiRequest<FinanceListResult<PettyCashTransaction>>({
      url: "/finance/petty-cash-transactions",
      method: "GET",
      params,
    }),
  createPettyCashTransaction: (payload: PettyCashTransactionPayload) =>
    apiRequest<PettyCashTransaction>({
      url: "/finance/petty-cash-transactions",
      method: "POST",
      data: payload,
    }),
};
