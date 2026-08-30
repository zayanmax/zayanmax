import type { PaginatedResult } from "@/types/api";

export type MoneyValue = number | string;
export type SalaryComponentType = "EARNING" | "DEDUCTION";
export type SalaryCalculationType = "FIXED" | "PERCENTAGE";
export type SalaryAssignmentStatus = "ACTIVE" | "INACTIVE";
export type SalaryAdvanceStatus = "ACTIVE" | "SETTLED" | "CANCELLED";
export type PayrollRunStatus = "DRAFT" | "PROCESSING" | "APPROVED" | "PAID" | "CANCELLED";

export type PayrollEmployee = {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
};

export type SalaryStructureComponent = {
  id: string;
  name: string;
  code: string;
  type: SalaryComponentType;
  calculationType: SalaryCalculationType;
  amount: MoneyValue;
  taxable: boolean;
};

export type SalaryStructure = {
  id: string;
  companyId: string;
  name: string;
  description?: string | null;
  status: string;
  createdAt: string;
  components: SalaryStructureComponent[];
};

export type SalaryAssignment = {
  id: string;
  companyId: string;
  employeeId: string;
  salaryStructureId: string;
  effectiveFrom: string;
  effectiveTo?: string | null;
  monthlyGross: MoneyValue;
  status: SalaryAssignmentStatus;
  createdAt: string;
  employee?: PayrollEmployee;
  salaryStructure?: Pick<SalaryStructure, "id" | "name">;
};

export type SalaryAdvance = {
  id: string;
  companyId: string;
  employeeId: string;
  amount: MoneyValue;
  installmentAmount: MoneyValue;
  paidAmount: MoneyValue;
  balanceAmount: MoneyValue;
  status: SalaryAdvanceStatus;
  requestedAt: string;
  approvedAt?: string | null;
  notes?: string | null;
  createdAt: string;
  employee?: PayrollEmployee;
};

export type PayrollPeriod = {
  id: string;
  companyId: string;
  name: string;
  startDate: string;
  endDate: string;
  payDate?: string | null;
  status: string;
  createdAt: string;
};

export type PayrollComponentLine = {
  kind: "STRUCTURE" | "ADVANCE";
  name: string;
  code: string;
  calculationType?: SalaryCalculationType;
  configuredValue?: number;
  advanceId?: string;
  amount: number;
};

export type PayslipSummary = {
  id: string;
  payslipNumber: string;
  status: "GENERATED" | "PUBLISHED";
  generatedAt: string;
  fileName?: string | null;
  storageKey?: string | null;
};

export type PayrollLineItem = {
  id: string;
  employeeId: string;
  salaryAssignmentId?: string | null;
  workingDays: MoneyValue;
  payableDays: MoneyValue;
  leaveDays: MoneyValue;
  absentDays: MoneyValue;
  grossEarnings: MoneyValue;
  totalDeductions: MoneyValue;
  advanceDeduction: MoneyValue;
  netPay: MoneyValue;
  earnings?: PayrollComponentLine[] | null;
  deductions?: PayrollComponentLine[] | null;
  employee?: PayrollEmployee;
  payslip?: PayslipSummary | null;
  salaryAssignment?: (Pick<SalaryAssignment, "id" | "monthlyGross"> & {
    salaryStructure?: Pick<SalaryStructure, "id" | "name">;
  }) | null;
};

export type PayrollRun = {
  id: string;
  companyId: string;
  payrollPeriodId: string;
  status: PayrollRunStatus;
  totalGross: MoneyValue;
  totalDeductions: MoneyValue;
  totalNet: MoneyValue;
  notes?: string | null;
  processedAt?: string | null;
  approvedAt?: string | null;
  paidAt?: string | null;
  cancelledAt?: string | null;
  createdAt: string;
  payrollPeriod?: PayrollPeriod;
  lineItems?: PayrollLineItem[];
  _count?: { lineItems: number };
};

export type Payslip = PayslipSummary & {
  companyId: string;
  payrollRunId: string;
  payrollLineItemId: string;
  employeeId: string;
  payrollRun?: PayrollRun;
  payrollLineItem?: PayrollLineItem;
};

export type ListQuery = { page?: number; limit?: number; search?: string; sortBy?: string; sortOrder?: "asc" | "desc" };
export type SalaryAssignmentQuery = ListQuery & { employeeId?: string; salaryStructureId?: string; status?: SalaryAssignmentStatus };
export type SalaryAdvanceQuery = ListQuery & { employeeId?: string; status?: SalaryAdvanceStatus };
export type PayrollRunQuery = ListQuery & { payrollPeriodId?: string; status?: PayrollRunStatus };
export type PayslipQuery = ListQuery & { payrollRunId?: string };

export type CreateSalaryStructurePayload = {
  name: string;
  description?: string;
  components: Array<{ name: string; code: string; type: SalaryComponentType; calculationType: SalaryCalculationType; amount: number; taxable?: boolean }>;
};
export type CreateSalaryAssignmentPayload = { employeeId: string; salaryStructureId: string; effectiveFrom: string; effectiveTo?: string; monthlyGross: number };
export type CreateSalaryAdvancePayload = { employeeId: string; amount: number; installmentAmount: number; notes?: string };
export type CreatePayrollPeriodPayload = { name: string; startDate: string; endDate: string; payDate?: string };
export type CreatePayrollRunPayload = { payrollPeriodId: string; notes?: string };
export type UpdatePayrollRunPayload = { notes?: string };
export type ChangePayrollRunStatusPayload = { status: PayrollRunStatus };

export type SalaryStructureResult = PaginatedResult<SalaryStructure>;
export type SalaryAssignmentResult = PaginatedResult<SalaryAssignment>;
export type SalaryAdvanceResult = PaginatedResult<SalaryAdvance>;
export type PayrollPeriodResult = PaginatedResult<PayrollPeriod>;
export type PayrollRunResult = PaginatedResult<PayrollRun>;
export type PayslipResult = PaginatedResult<Payslip>;
