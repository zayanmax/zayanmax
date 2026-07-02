import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { financeApi } from "@/features/finance/api";
import type {
  ExpenseClaimPayload,
  FinanceListQuery,
  PettyCashAccountPayload,
  PettyCashTransactionPayload,
  VendorBillPayload,
  VendorPaymentPayload,
  VendorPayload,
} from "@/features/finance/types";

export const financeKeys = {
  all: ["finance"] as const,
  summary: () => [...financeKeys.all, "summary"] as const,
  paymentModes: () => [...financeKeys.all, "payment-modes"] as const,
  categories: (query: FinanceListQuery) => [...financeKeys.all, "categories", query] as const,
  expenses: (query: FinanceListQuery) => [...financeKeys.all, "expenses", query] as const,
  expense: (id: string) => [...financeKeys.all, "expense", id] as const,
  vendors: (query: FinanceListQuery) => [...financeKeys.all, "vendors", query] as const,
  vendor: (id: string) => [...financeKeys.all, "vendor", id] as const,
  bills: (query: FinanceListQuery) => [...financeKeys.all, "bills", query] as const,
  bill: (id: string) => [...financeKeys.all, "bill", id] as const,
  payments: (query: FinanceListQuery) => [...financeKeys.all, "payments", query] as const,
  pettyAccounts: (query: FinanceListQuery) =>
    [...financeKeys.all, "petty-accounts", query] as const,
  pettyTransactions: (query: FinanceListQuery) =>
    [...financeKeys.all, "petty-transactions", query] as const,
};

function useInvalidateFinance() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: financeKeys.all });
}

export function useFinanceSummary() {
  return useQuery({ queryKey: financeKeys.summary(), queryFn: financeApi.dashboardSummary });
}

export function usePaymentModes() {
  return useQuery({ queryKey: financeKeys.paymentModes(), queryFn: financeApi.paymentModes });
}

export function useExpenseCategories(query: FinanceListQuery) {
  return useQuery({
    queryKey: financeKeys.categories(query),
    queryFn: () => financeApi.listExpenseCategories(query),
  });
}

export function useCreateExpenseCategory() {
  const invalidate = useInvalidateFinance();
  return useMutation({
    mutationFn: financeApi.createExpenseCategory,
    onSuccess: async () => invalidate(),
  });
}

export function useExpenses(query: FinanceListQuery) {
  return useQuery({ queryKey: financeKeys.expenses(query), queryFn: () => financeApi.listExpenses(query) });
}

export function useExpense(id: string) {
  return useQuery({
    queryKey: financeKeys.expense(id),
    queryFn: () => financeApi.getExpense(id),
    enabled: Boolean(id),
  });
}

export function useCreateExpense() {
  const invalidate = useInvalidateFinance();
  return useMutation({
    mutationFn: (payload: ExpenseClaimPayload) => financeApi.createExpense(payload),
    onSuccess: async () => invalidate(),
  });
}

export function useUpdateExpense(id: string) {
  const invalidate = useInvalidateFinance();
  return useMutation({
    mutationFn: (payload: Partial<ExpenseClaimPayload>) => financeApi.updateExpense(id, payload),
    onSuccess: async () => invalidate(),
  });
}

export function useChangeExpenseStatus(id: string) {
  const invalidate = useInvalidateFinance();
  return useMutation({
    mutationFn: (payload: { status: string; reviewComment?: string }) =>
      financeApi.changeExpenseStatus(id, payload),
    onSuccess: async () => invalidate(),
  });
}

export function useVendors(query: FinanceListQuery) {
  return useQuery({ queryKey: financeKeys.vendors(query), queryFn: () => financeApi.listVendors(query) });
}

export function useVendor(id: string) {
  return useQuery({
    queryKey: financeKeys.vendor(id),
    queryFn: () => financeApi.getVendor(id),
    enabled: Boolean(id),
  });
}

export function useCreateVendor() {
  const invalidate = useInvalidateFinance();
  return useMutation({
    mutationFn: (payload: VendorPayload) => financeApi.createVendor(payload),
    onSuccess: async () => invalidate(),
  });
}

export function useUpdateVendor(id: string) {
  const invalidate = useInvalidateFinance();
  return useMutation({
    mutationFn: (payload: Partial<VendorPayload>) => financeApi.updateVendor(id, payload),
    onSuccess: async () => invalidate(),
  });
}

export function useVendorBills(query: FinanceListQuery) {
  return useQuery({ queryKey: financeKeys.bills(query), queryFn: () => financeApi.listVendorBills(query) });
}

export function useVendorBill(id: string) {
  return useQuery({
    queryKey: financeKeys.bill(id),
    queryFn: () => financeApi.getVendorBill(id),
    enabled: Boolean(id),
  });
}

export function useCreateVendorBill() {
  const invalidate = useInvalidateFinance();
  return useMutation({
    mutationFn: (payload: VendorBillPayload) => financeApi.createVendorBill(payload),
    onSuccess: async () => invalidate(),
  });
}

export function useUpdateVendorBill(id: string) {
  const invalidate = useInvalidateFinance();
  return useMutation({
    mutationFn: (payload: Partial<VendorBillPayload>) => financeApi.updateVendorBill(id, payload),
    onSuccess: async () => invalidate(),
  });
}

export function useVendorPayments(query: FinanceListQuery) {
  return useQuery({
    queryKey: financeKeys.payments(query),
    queryFn: () => financeApi.listVendorPayments(query),
  });
}

export function useCreateVendorPayment() {
  const invalidate = useInvalidateFinance();
  return useMutation({
    mutationFn: (payload: VendorPaymentPayload) => financeApi.createVendorPayment(payload),
    onSuccess: async () => invalidate(),
  });
}

export function usePettyCashAccounts(query: FinanceListQuery) {
  return useQuery({
    queryKey: financeKeys.pettyAccounts(query),
    queryFn: () => financeApi.listPettyCashAccounts(query),
  });
}

export function useCreatePettyCashAccount() {
  const invalidate = useInvalidateFinance();
  return useMutation({
    mutationFn: (payload: PettyCashAccountPayload) => financeApi.createPettyCashAccount(payload),
    onSuccess: async () => invalidate(),
  });
}

export function usePettyCashTransactions(query: FinanceListQuery) {
  return useQuery({
    queryKey: financeKeys.pettyTransactions(query),
    queryFn: () => financeApi.listPettyCashTransactions(query),
  });
}

export function useCreatePettyCashTransaction() {
  const invalidate = useInvalidateFinance();
  return useMutation({
    mutationFn: (payload: PettyCashTransactionPayload) =>
      financeApi.createPettyCashTransaction(payload),
    onSuccess: async () => invalidate(),
  });
}
