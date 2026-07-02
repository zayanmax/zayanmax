import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { assetsApi } from "@/features/assets/api";
import type {
  AssetAssignmentPayload,
  AssetCategoryPayload,
  AssetListQuery,
  AssetMaintenancePayload,
  AssetPayload,
} from "@/features/assets/types";

export const assetKeys = {
  all: ["assets"] as const,
  categories: (query: AssetListQuery) => [...assetKeys.all, "categories", query] as const,
  category: (id: string) => [...assetKeys.all, "category", id] as const,
  assets: (query: AssetListQuery) => [...assetKeys.all, "assets", query] as const,
  asset: (id: string) => [...assetKeys.all, "asset", id] as const,
  assignments: (query: AssetListQuery) => [...assetKeys.all, "assignments", query] as const,
  maintenance: (query: AssetListQuery) => [...assetKeys.all, "maintenance", query] as const,
};

function useInvalidateAssets() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: assetKeys.all });
}

export function useAssetCategories(query: AssetListQuery) {
  return useQuery({
    queryKey: assetKeys.categories(query),
    queryFn: () => assetsApi.listCategories(query),
  });
}

export function useCreateAssetCategory() {
  const invalidate = useInvalidateAssets();
  return useMutation({
    mutationFn: (payload: AssetCategoryPayload) => assetsApi.createCategory(payload),
    onSuccess: async () => invalidate(),
  });
}

export function useUpdateAssetCategory(id: string) {
  const invalidate = useInvalidateAssets();
  return useMutation({
    mutationFn: (payload: Partial<AssetCategoryPayload>) =>
      assetsApi.updateCategory(id, payload),
    onSuccess: async () => invalidate(),
  });
}

export function useAssets(query: AssetListQuery) {
  return useQuery({
    queryKey: assetKeys.assets(query),
    queryFn: () => assetsApi.listAssets(query),
  });
}

export function useAsset(id: string) {
  return useQuery({
    queryKey: assetKeys.asset(id),
    queryFn: () => assetsApi.getAsset(id),
    enabled: Boolean(id),
  });
}

export function useCreateAsset() {
  const invalidate = useInvalidateAssets();
  return useMutation({
    mutationFn: (payload: AssetPayload) => assetsApi.createAsset(payload),
    onSuccess: async () => invalidate(),
  });
}

export function useUpdateAsset(id: string) {
  const invalidate = useInvalidateAssets();
  return useMutation({
    mutationFn: (payload: Partial<AssetPayload>) => assetsApi.updateAsset(id, payload),
    onSuccess: async () => invalidate(),
  });
}

export function useAssignAsset(assetId: string) {
  const invalidate = useInvalidateAssets();
  return useMutation({
    mutationFn: (payload: AssetAssignmentPayload) => assetsApi.assignAsset(assetId, payload),
    onSuccess: async () => invalidate(),
  });
}

export function useCreateAssetMaintenance(assetId: string) {
  const invalidate = useInvalidateAssets();
  return useMutation({
    mutationFn: (payload: AssetMaintenancePayload) =>
      assetsApi.createMaintenance(assetId, payload),
    onSuccess: async () => invalidate(),
  });
}

export function useAssetAssignments(query: AssetListQuery) {
  return useQuery({
    queryKey: assetKeys.assignments(query),
    queryFn: () => assetsApi.listAssignments(query),
  });
}

export function useAssetMaintenanceRecords(query: AssetListQuery) {
  return useQuery({
    queryKey: assetKeys.maintenance(query),
    queryFn: () => assetsApi.listMaintenance(query),
  });
}
