import type { RecordStatus } from "@/features/employees/types";

export type Branch = {
  id: string;
  companyId: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  status: RecordStatus;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
};

export type BranchPayload = {
  name: string;
  address?: string;
  phone?: string;
};
