import type { RecordStatus } from "@/features/employees/types";

export type Department = {
  id: string;
  companyId: string;
  name: string;
  description?: string | null;
  status: RecordStatus;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
};

export type DepartmentPayload = {
  name: string;
  description?: string;
};
