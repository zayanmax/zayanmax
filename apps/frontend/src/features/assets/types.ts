import type { ApiMeta } from "@/types/api";
import type { Employee } from "@/features/employees/types";
import type { Vendor } from "@/features/finance/types";

export type RecordStatus = "ACTIVE" | "INACTIVE" | "ARCHIVED";
export type AssetStatus =
  | "AVAILABLE"
  | "ASSIGNED"
  | "UNDER_MAINTENANCE"
  | "RETIRED"
  | "LOST";
export type AssetAssignmentStatus = "ACTIVE" | "RETURNED";

export type AssetEmployee = Pick<
  Employee,
  "id" | "employeeCode" | "firstName" | "lastName" | "email"
>;

export type AssetCategory = {
  id: string;
  name: string;
  description?: string | null;
  status?: RecordStatus;
  createdAt?: string;
  updatedAt?: string;
  assets?: Asset[];
};

export type Asset = {
  id: string;
  assetCategoryId?: string | null;
  assignedEmployeeId?: string | null;
  name: string;
  assetTag: string;
  serialNumber?: string | null;
  purchaseDate?: string | null;
  warrantyExpiryDate?: string | null;
  status: AssetStatus;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
  assetCategory?: Pick<AssetCategory, "id" | "name"> | null;
  assignedEmployee?: AssetEmployee | null;
  assignments?: AssetAssignment[];
  maintenanceRecords?: AssetMaintenanceRecord[];
};

export type AssetAssignment = {
  id: string;
  assetId: string;
  employeeId: string;
  assignedAt: string;
  returnedAt?: string | null;
  status: AssetAssignmentStatus;
  notes?: string | null;
  createdAt?: string;
  asset?: Pick<Asset, "id" | "assetTag" | "name" | "status"> | null;
  employee?: AssetEmployee | null;
};

export type AssetMaintenanceRecord = {
  id: string;
  assetId: string;
  vendorId?: string | null;
  maintenanceDate: string;
  description: string;
  cost?: number | string | null;
  nextMaintenanceDate?: string | null;
  createdAt?: string;
  asset?: Pick<Asset, "id" | "assetTag" | "name" | "status"> | null;
  vendor?: Pick<Vendor, "id" | "name"> | null;
};

export type AssetCategoryPayload = {
  name: string;
  description?: string;
};

export type AssetPayload = {
  assetCategoryId?: string;
  name: string;
  assetTag: string;
  serialNumber?: string;
  purchaseDate?: string;
  warrantyExpiryDate?: string;
  status?: AssetStatus;
  notes?: string;
};

export type AssetAssignmentPayload = {
  employeeId: string;
  assignedAt: string;
  notes?: string;
};

export type AssetMaintenancePayload = {
  vendorId?: string;
  maintenanceDate: string;
  description: string;
  cost?: number;
  nextMaintenanceDate?: string;
};

export type AssetListQuery = {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  status?: string;
  assetCategoryId?: string;
  assignedEmployeeId?: string;
  assetId?: string;
  employeeId?: string;
  vendorId?: string;
};

export type AssetListResult<T> = {
  data: T[];
  meta: Required<ApiMeta>;
};
