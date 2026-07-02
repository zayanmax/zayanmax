import type { ApiMeta } from "@/types/api";

export type RecordStatus = "ACTIVE" | "INACTIVE" | "ARCHIVED";
export type StockMovementType = "IN" | "OUT" | "ADJUSTMENT";

export type InventoryCategory = {
  id: string;
  name: string;
  description?: string | null;
  status?: RecordStatus;
  createdAt?: string;
  updatedAt?: string;
  items?: InventoryItem[];
};

export type InventoryItem = {
  id: string;
  inventoryCategoryId?: string | null;
  name: string;
  itemCode: string;
  sku?: string | null;
  unit: string;
  currentStock: number | string;
  lowStockThreshold: number | string;
  status?: RecordStatus;
  createdAt?: string;
  updatedAt?: string;
  inventoryCategory?: Pick<InventoryCategory, "id" | "name"> | null;
  stockMovements?: StockMovement[];
};

export type StockMovement = {
  id: string;
  inventoryItemId: string;
  type: StockMovementType;
  quantity: number | string;
  previousStock: number | string;
  newStock: number | string;
  movementDate: string;
  referenceType?: string | null;
  referenceId?: string | null;
  reason?: string | null;
  createdAt?: string;
  inventoryItem?: Pick<InventoryItem, "id" | "name" | "itemCode" | "unit"> | null;
};

export type InventoryCategoryPayload = {
  name: string;
  description?: string;
};

export type InventoryItemPayload = {
  inventoryCategoryId?: string;
  name: string;
  itemCode: string;
  sku?: string;
  unit: string;
  lowStockThreshold?: number;
};

export type StockAdjustmentPayload = {
  inventoryItemId: string;
  quantity: number;
  movementDate: string;
  reason: string;
};

export type InventoryListQuery = {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  status?: string;
  inventoryCategoryId?: string;
  inventoryItemId?: string;
  type?: StockMovementType;
  lowStockOnly?: boolean;
};

export type InventoryListResult<T> = {
  data: T[];
  meta: Required<ApiMeta>;
};
