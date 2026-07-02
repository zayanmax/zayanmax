import type { ApiMeta } from "@/types/api";

export type RecordStatus = "ACTIVE" | "INACTIVE" | "ARCHIVED";

export type EmploymentType =
  | "FULL_TIME"
  | "PART_TIME"
  | "CONTRACT"
  | "INTERN";

export type Employee = {
  id: string;
  companyId: string;
  branchId?: string | null;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  departmentId?: string | null;
  designationId?: string | null;
  reportingManagerId?: string | null;
  joiningDate: string;
  employmentType: EmploymentType;
  status: RecordStatus;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  createdById?: string | null;
  updatedById?: string | null;
};

export type EmployeePayload = {
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  branchId?: string;
  departmentId?: string;
  designationId?: string;
  reportingManagerId?: string;
  joiningDate: string;
  employmentType?: EmploymentType;
};

export type EmployeeListQuery = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

export type EmployeeListResult = {
  data: Employee[];
  meta: Required<ApiMeta>;
};
