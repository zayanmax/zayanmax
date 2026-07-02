import { apiRequest } from "@/lib/api/client";
import type {
  Asset,
  AssetAssignment,
  AssetAssignmentPayload,
  AssetCategory,
  AssetCategoryPayload,
  AssetListQuery,
  AssetListResult,
  AssetMaintenancePayload,
  AssetMaintenanceRecord,
  AssetPayload,
} from "@/features/assets/types";

export const assetsApi = {
  listCategories: (params: AssetListQuery) =>
    apiRequest<AssetListResult<AssetCategory>>({
      url: "/assets/categories",
      method: "GET",
      params,
    }),
  getCategory: (id: string) =>
    apiRequest<AssetCategory>({ url: `/assets/categories/${id}`, method: "GET" }),
  createCategory: (payload: AssetCategoryPayload) =>
    apiRequest<AssetCategory>({
      url: "/assets/categories",
      method: "POST",
      data: payload,
    }),
  updateCategory: (id: string, payload: Partial<AssetCategoryPayload>) =>
    apiRequest<AssetCategory>({
      url: `/assets/categories/${id}`,
      method: "PATCH",
      data: payload,
    }),
  listAssets: (params: AssetListQuery) =>
    apiRequest<AssetListResult<Asset>>({ url: "/assets", method: "GET", params }),
  getAsset: (id: string) =>
    apiRequest<Asset>({ url: `/assets/${id}`, method: "GET" }),
  createAsset: (payload: AssetPayload) =>
    apiRequest<Asset>({ url: "/assets", method: "POST", data: payload }),
  updateAsset: (id: string, payload: Partial<AssetPayload>) =>
    apiRequest<Asset>({ url: `/assets/${id}`, method: "PATCH", data: payload }),
  assignAsset: (assetId: string, payload: AssetAssignmentPayload) =>
    apiRequest<AssetAssignment>({
      url: `/assets/${assetId}/assign`,
      method: "POST",
      data: payload,
    }),
  createMaintenance: (assetId: string, payload: AssetMaintenancePayload) =>
    apiRequest<AssetMaintenanceRecord>({
      url: `/assets/${assetId}/maintenance`,
      method: "POST",
      data: payload,
    }),
  listAssignments: (params: AssetListQuery) =>
    apiRequest<AssetListResult<AssetAssignment>>({
      url: "/assets/assignments",
      method: "GET",
      params,
    }),
  listMaintenance: (params: AssetListQuery) =>
    apiRequest<AssetListResult<AssetMaintenanceRecord>>({
      url: "/assets/maintenance",
      method: "GET",
      params,
    }),
};
