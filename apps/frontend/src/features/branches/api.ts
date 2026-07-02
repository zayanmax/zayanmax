import { apiRequest } from "@/lib/api/client";
import type { Branch, BranchPayload } from "@/features/branches/types";

export const branchesApi = {
  list: () =>
    apiRequest<Branch[]>({
      url: "/branches",
      method: "GET",
    }),
  create: (payload: BranchPayload) =>
    apiRequest<Branch>({
      url: "/branches",
      method: "POST",
      data: payload,
    }),
  update: (id: string, payload: Partial<BranchPayload>) =>
    apiRequest<Branch>({
      url: `/branches/${id}`,
      method: "PATCH",
      data: payload,
    }),
};
