import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { inventoryApi } from "@/features/inventory/api";
import type {
  InventoryCategoryPayload,
  InventoryItemPayload,
  InventoryListQuery,
  StockAdjustmentPayload,
} from "@/features/inventory/types";

export const inventoryKeys = {
  all: ["inventory"] as const,
  categories: (query: InventoryListQuery) => [...inventoryKeys.all, "categories", query] as const,
  category: (id: string) => [...inventoryKeys.all, "category", id] as const,
  items: (query: InventoryListQuery) => [...inventoryKeys.all, "items", query] as const,
  item: (id: string) => [...inventoryKeys.all, "item", id] as const,
  movements: (query: InventoryListQuery) => [...inventoryKeys.all, "movements", query] as const,
};

function useInvalidateInventory() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
}

export function useInventoryCategories(query: InventoryListQuery) {
  return useQuery({
    queryKey: inventoryKeys.categories(query),
    queryFn: () => inventoryApi.listCategories(query),
  });
}

export function useInventoryCategory(id: string) {
  return useQuery({
    queryKey: inventoryKeys.category(id),
    queryFn: () => inventoryApi.getCategory(id),
    enabled: Boolean(id),
  });
}

export function useCreateInventoryCategory() {
  const invalidate = useInvalidateInventory();
  return useMutation({
    mutationFn: (payload: InventoryCategoryPayload) => inventoryApi.createCategory(payload),
    onSuccess: async () => invalidate(),
  });
}

export function useUpdateInventoryCategory(id: string) {
  const invalidate = useInvalidateInventory();
  return useMutation({
    mutationFn: (payload: Partial<InventoryCategoryPayload>) =>
      inventoryApi.updateCategory(id, payload),
    onSuccess: async () => invalidate(),
  });
}

export function useInventoryItems(query: InventoryListQuery) {
  return useQuery({
    queryKey: inventoryKeys.items(query),
    queryFn: () => inventoryApi.listItems(query),
  });
}

export function useInventoryItem(id: string) {
  return useQuery({
    queryKey: inventoryKeys.item(id),
    queryFn: () => inventoryApi.getItem(id),
    enabled: Boolean(id),
  });
}

export function useCreateInventoryItem() {
  const invalidate = useInvalidateInventory();
  return useMutation({
    mutationFn: (payload: InventoryItemPayload) => inventoryApi.createItem(payload),
    onSuccess: async () => invalidate(),
  });
}

export function useUpdateInventoryItem(id: string) {
  const invalidate = useInvalidateInventory();
  return useMutation({
    mutationFn: (payload: Partial<InventoryItemPayload>) =>
      inventoryApi.updateItem(id, payload),
    onSuccess: async () => invalidate(),
  });
}

export function useStockMovements(query: InventoryListQuery) {
  return useQuery({
    queryKey: inventoryKeys.movements(query),
    queryFn: () => inventoryApi.listMovements(query),
  });
}

export function useCreateStockAdjustment() {
  const invalidate = useInvalidateInventory();
  return useMutation({
    mutationFn: (payload: StockAdjustmentPayload) =>
      inventoryApi.createStockAdjustment(payload),
    onSuccess: async () => invalidate(),
  });
}
