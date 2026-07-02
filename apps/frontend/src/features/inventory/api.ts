import { apiRequest } from "@/lib/api/client";
import type {
  InventoryCategory,
  InventoryCategoryPayload,
  InventoryItem,
  InventoryItemPayload,
  InventoryListQuery,
  InventoryListResult,
  StockAdjustmentPayload,
  StockMovement,
} from "@/features/inventory/types";

export const inventoryApi = {
  listCategories: (params: InventoryListQuery) =>
    apiRequest<InventoryListResult<InventoryCategory>>({
      url: "/inventory/categories",
      method: "GET",
      params,
    }),
  getCategory: (id: string) =>
    apiRequest<InventoryCategory>({
      url: `/inventory/categories/${id}`,
      method: "GET",
    }),
  createCategory: (payload: InventoryCategoryPayload) =>
    apiRequest<InventoryCategory>({
      url: "/inventory/categories",
      method: "POST",
      data: payload,
    }),
  updateCategory: (id: string, payload: Partial<InventoryCategoryPayload>) =>
    apiRequest<InventoryCategory>({
      url: `/inventory/categories/${id}`,
      method: "PATCH",
      data: payload,
    }),
  listItems: (params: InventoryListQuery) =>
    apiRequest<InventoryListResult<InventoryItem>>({
      url: "/inventory/items",
      method: "GET",
      params,
    }),
  getItem: (id: string) =>
    apiRequest<InventoryItem>({ url: `/inventory/items/${id}`, method: "GET" }),
  createItem: (payload: InventoryItemPayload) =>
    apiRequest<InventoryItem>({
      url: "/inventory/items",
      method: "POST",
      data: payload,
    }),
  updateItem: (id: string, payload: Partial<InventoryItemPayload>) =>
    apiRequest<InventoryItem>({
      url: `/inventory/items/${id}`,
      method: "PATCH",
      data: payload,
    }),
  listMovements: (params: InventoryListQuery) =>
    apiRequest<InventoryListResult<StockMovement>>({
      url: "/inventory/movements",
      method: "GET",
      params,
    }),
  createStockAdjustment: (payload: StockAdjustmentPayload) =>
    apiRequest<StockMovement>({
      url: "/inventory/stock-adjustments",
      method: "POST",
      data: payload,
    }),
};
