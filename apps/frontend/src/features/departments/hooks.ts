import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { departmentsApi } from "@/features/departments/api";
import type { DepartmentPayload } from "@/features/departments/types";

export const departmentKeys = {
  all: ["departments"] as const,
  list: () => [...departmentKeys.all, "list"] as const,
};

export function useDepartments() {
  return useQuery({
    queryKey: departmentKeys.list(),
    queryFn: departmentsApi.list,
  });
}

export function useCreateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: DepartmentPayload) => departmentsApi.create(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: departmentKeys.all });
    },
  });
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<DepartmentPayload>;
    }) => departmentsApi.update(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: departmentKeys.all });
    },
  });
}
