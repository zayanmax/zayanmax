import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { designationsApi } from "@/features/designations/api";
import type { DesignationPayload } from "@/features/designations/types";

export const designationKeys = {
  all: ["designations"] as const,
  list: () => [...designationKeys.all, "list"] as const,
};

export function useDesignations() {
  return useQuery({
    queryKey: designationKeys.list(),
    queryFn: designationsApi.list,
  });
}

export function useCreateDesignation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: DesignationPayload) => designationsApi.create(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: designationKeys.all });
    },
  });
}

export function useUpdateDesignation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<DesignationPayload>;
    }) => designationsApi.update(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: designationKeys.all });
    },
  });
}
