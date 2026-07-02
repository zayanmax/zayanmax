import { apiRequest } from "@/lib/api/client";
import type {
  Department,
  DepartmentPayload,
} from "@/features/departments/types";

export const departmentsApi = {
  list: () =>
    apiRequest<Department[]>({
      url: "/departments",
      method: "GET",
    }),
  create: (payload: DepartmentPayload) =>
    apiRequest<Department>({
      url: "/departments",
      method: "POST",
      data: payload,
    }),
  update: (id: string, payload: Partial<DepartmentPayload>) =>
    apiRequest<Department>({
      url: `/departments/${id}`,
      method: "PATCH",
      data: payload,
    }),
};
