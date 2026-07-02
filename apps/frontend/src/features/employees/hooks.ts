import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { employeesApi } from "@/features/employees/api";
import type {
  EmployeeListQuery,
  EmployeePayload,
} from "@/features/employees/types";

export const employeeKeys = {
  all: ["employees"] as const,
  list: (query: EmployeeListQuery) => [...employeeKeys.all, "list", query] as const,
  detail: (id: string) => [...employeeKeys.all, "detail", id] as const,
};

export function useEmployees(query: EmployeeListQuery) {
  return useQuery({
    queryKey: employeeKeys.list(query),
    queryFn: () => employeesApi.list(query),
  });
}

export function useEmployee(id: string) {
  return useQuery({
    queryKey: employeeKeys.detail(id),
    queryFn: () => employeesApi.get(id),
    enabled: Boolean(id),
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: EmployeePayload) => employeesApi.create(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: employeeKeys.all });
    },
  });
}

export function useUpdateEmployee(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<EmployeePayload>) =>
      employeesApi.update(id, payload),
    onSuccess: async (employee) => {
      await queryClient.invalidateQueries({ queryKey: employeeKeys.all });
      queryClient.setQueryData(employeeKeys.detail(employee.id), employee);
    },
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => employeesApi.remove(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: employeeKeys.all });
    },
  });
}
