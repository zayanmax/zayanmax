import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { branchesApi } from "@/features/branches/api";
import type { BranchPayload } from "@/features/branches/types";

export const branchKeys = {
  all: ["branches"] as const,
  list: () => [...branchKeys.all, "list"] as const,
};

export function useBranches() {
  return useQuery({
    queryKey: branchKeys.list(),
    queryFn: branchesApi.list,
  });
}

export function useCreateBranch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: BranchPayload) => branchesApi.create(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: branchKeys.all });
    },
  });
}

export function useUpdateBranch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<BranchPayload> }) =>
      branchesApi.update(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: branchKeys.all });
    },
  });
}
