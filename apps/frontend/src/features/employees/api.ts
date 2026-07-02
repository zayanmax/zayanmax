import { apiRequest } from "@/lib/api/client";
import type {
  Employee,
  EmployeeListQuery,
  EmployeeListResult,
  EmployeePayload,
} from "@/features/employees/types";

export const employeesApi = {
  list: (params: EmployeeListQuery) =>
    apiRequest<EmployeeListResult>({
      url: "/employees",
      method: "GET",
      params,
    }),
  get: (id: string) =>
    apiRequest<Employee>({
      url: `/employees/${id}`,
      method: "GET",
    }),
  create: (payload: EmployeePayload) =>
    apiRequest<Employee>({
      url: "/employees",
      method: "POST",
      data: payload,
    }),
  update: (id: string, payload: Partial<EmployeePayload>) =>
    apiRequest<Employee>({
      url: `/employees/${id}`,
      method: "PATCH",
      data: payload,
    }),
  remove: (id: string) =>
    apiRequest<{ deleted: boolean }>({
      url: `/employees/${id}`,
      method: "DELETE",
    }),
};
