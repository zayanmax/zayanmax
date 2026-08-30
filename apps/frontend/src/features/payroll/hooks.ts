import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { payrollApi } from "@/features/payroll/api";
import type {
  ChangePayrollRunStatusPayload,
  CreatePayrollPeriodPayload,
  CreatePayrollRunPayload,
  CreateSalaryAdvancePayload,
  CreateSalaryAssignmentPayload,
  CreateSalaryStructurePayload,
  ListQuery,
  PayrollRunQuery,
  PayslipQuery,
  SalaryAdvanceQuery,
  SalaryAssignmentQuery,
  UpdatePayrollRunPayload,
} from "@/features/payroll/types";

export const payrollKeys = {
  all: ["payroll"] as const,
  structuresRoot: ["payroll", "structures"] as const,
  structures: (query: ListQuery) => [...payrollKeys.structuresRoot, query] as const,
  assignmentsRoot: ["payroll", "assignments"] as const,
  assignments: (query: SalaryAssignmentQuery) => [...payrollKeys.assignmentsRoot, query] as const,
  advancesRoot: ["payroll", "advances"] as const,
  advances: (query: SalaryAdvanceQuery) => [...payrollKeys.advancesRoot, query] as const,
  periodsRoot: ["payroll", "periods"] as const,
  periods: (query: ListQuery) => [...payrollKeys.periodsRoot, query] as const,
  runsRoot: ["payroll", "runs"] as const,
  runs: (query: PayrollRunQuery) => [...payrollKeys.runsRoot, query] as const,
  run: (id: string) => ["payroll", "runs", "detail", id] as const,
  payslipsRoot: ["payroll", "payslips"] as const,
  payslips: (employeeId: string, query: PayslipQuery) => [...payrollKeys.payslipsRoot, employeeId, query] as const,
};

export const useSalaryStructures = (query: ListQuery) => useQuery({ queryKey: payrollKeys.structures(query), queryFn: () => payrollApi.structures(query) });
export const useSalaryAssignments = (query: SalaryAssignmentQuery) => useQuery({ queryKey: payrollKeys.assignments(query), queryFn: () => payrollApi.assignments(query) });
export const useSalaryAdvances = (query: SalaryAdvanceQuery) => useQuery({ queryKey: payrollKeys.advances(query), queryFn: () => payrollApi.advances(query) });
export const usePayrollPeriods = (query: ListQuery) => useQuery({ queryKey: payrollKeys.periods(query), queryFn: () => payrollApi.periods(query) });
export const usePayrollRuns = (query: PayrollRunQuery) => useQuery({ queryKey: payrollKeys.runs(query), queryFn: () => payrollApi.runs(query) });
export const usePayrollRun = (id: string, enabled = true) => useQuery({ queryKey: payrollKeys.run(id), queryFn: () => payrollApi.run(id), enabled: enabled && Boolean(id) });
export const usePayslips = (employeeId: string, query: PayslipQuery) => useQuery({ queryKey: payrollKeys.payslips(employeeId, query), queryFn: () => payrollApi.payslips(employeeId, query), enabled: Boolean(employeeId) });

function createMutation<TPayload>(mutationFn: (payload: TPayload) => Promise<unknown>, keys: readonly (readonly unknown[])[]) {
  return function usePayrollMutation() {
    const queryClient = useQueryClient();
    return useMutation({ mutationFn, onSuccess: async () => Promise.all(keys.map((queryKey) => queryClient.invalidateQueries({ queryKey }))) });
  };
}

export const useCreateSalaryStructure = createMutation<CreateSalaryStructurePayload>(payrollApi.createStructure, [payrollKeys.structuresRoot]);
export const useCreateSalaryAssignment = createMutation<CreateSalaryAssignmentPayload>(payrollApi.createAssignment, [payrollKeys.assignmentsRoot]);
export const useCreateSalaryAdvance = createMutation<CreateSalaryAdvancePayload>(payrollApi.createAdvance, [payrollKeys.advancesRoot]);
export const useCreatePayrollPeriod = createMutation<CreatePayrollPeriodPayload>(payrollApi.createPeriod, [payrollKeys.periodsRoot]);
export const useCreatePayrollRun = createMutation<CreatePayrollRunPayload>(payrollApi.createRun, [payrollKeys.runsRoot, payrollKeys.periodsRoot, payrollKeys.payslipsRoot]);

export function useUpdatePayrollRun() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePayrollRunPayload }) => payrollApi.updateRun(id, data),
    onSuccess: async (run) => {
      queryClient.setQueryData(payrollKeys.run(run.id), run);
      await queryClient.invalidateQueries({ queryKey: payrollKeys.runsRoot });
    },
  });
}

export function useChangePayrollRunStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ChangePayrollRunStatusPayload }) => payrollApi.changeRunStatus(id, data),
    onSuccess: async (run) => {
      queryClient.setQueryData(payrollKeys.run(run.id), run);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: payrollKeys.runsRoot }),
        queryClient.invalidateQueries({ queryKey: payrollKeys.advancesRoot }),
        queryClient.invalidateQueries({ queryKey: payrollKeys.payslipsRoot }),
      ]);
    },
  });
}
