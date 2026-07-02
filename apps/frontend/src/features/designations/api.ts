import { apiRequest } from "@/lib/api/client";
import type {
  Designation,
  DesignationPayload,
} from "@/features/designations/types";

export const designationsApi = {
  list: () =>
    apiRequest<Designation[]>({
      url: "/designations",
      method: "GET",
    }),
  create: (payload: DesignationPayload) =>
    apiRequest<Designation>({
      url: "/designations",
      method: "POST",
      data: payload,
    }),
  update: (id: string, payload: Partial<DesignationPayload>) =>
    apiRequest<Designation>({
      url: `/designations/${id}`,
      method: "PATCH",
      data: payload,
    }),
};
