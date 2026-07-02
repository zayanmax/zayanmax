import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { purchaseApi } from "@/features/purchase/api";
import type {
  GoodsReceivedNotePayload,
  PurchaseListQuery,
  PurchaseOrderPayload,
  PurchaseRequestPayload,
} from "@/features/purchase/types";

export const purchaseKeys = {
  all: ["purchase"] as const,
  requests: (query: PurchaseListQuery) => [...purchaseKeys.all, "requests", query] as const,
  request: (id: string) => [...purchaseKeys.all, "request", id] as const,
  orders: (query: PurchaseListQuery) => [...purchaseKeys.all, "orders", query] as const,
  order: (id: string) => [...purchaseKeys.all, "order", id] as const,
  grns: (query: PurchaseListQuery) => [...purchaseKeys.all, "grns", query] as const,
  grn: (id: string) => [...purchaseKeys.all, "grn", id] as const,
};

function useInvalidatePurchase() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: purchaseKeys.all });
}

export function usePurchaseRequests(query: PurchaseListQuery) {
  return useQuery({
    queryKey: purchaseKeys.requests(query),
    queryFn: () => purchaseApi.listRequests(query),
  });
}

export function usePurchaseRequest(id: string) {
  return useQuery({
    queryKey: purchaseKeys.request(id),
    queryFn: () => purchaseApi.getRequest(id),
    enabled: Boolean(id),
  });
}

export function useCreatePurchaseRequest() {
  const invalidate = useInvalidatePurchase();
  return useMutation({
    mutationFn: (payload: PurchaseRequestPayload) => purchaseApi.createRequest(payload),
    onSuccess: async () => invalidate(),
  });
}

export function useUpdatePurchaseRequest(id: string) {
  const invalidate = useInvalidatePurchase();
  return useMutation({
    mutationFn: (payload: Partial<PurchaseRequestPayload>) =>
      purchaseApi.updateRequest(id, payload),
    onSuccess: async () => invalidate(),
  });
}

export function useChangePurchaseRequestStatus(id: string) {
  const invalidate = useInvalidatePurchase();
  return useMutation({
    mutationFn: (payload: { status: string; reviewComment?: string }) =>
      purchaseApi.changeRequestStatus(id, payload),
    onSuccess: async () => invalidate(),
  });
}

export function usePurchaseOrders(query: PurchaseListQuery) {
  return useQuery({
    queryKey: purchaseKeys.orders(query),
    queryFn: () => purchaseApi.listOrders(query),
  });
}

export function usePurchaseOrder(id: string) {
  return useQuery({
    queryKey: purchaseKeys.order(id),
    queryFn: () => purchaseApi.getOrder(id),
    enabled: Boolean(id),
  });
}

export function useCreatePurchaseOrder() {
  const invalidate = useInvalidatePurchase();
  return useMutation({
    mutationFn: (payload: PurchaseOrderPayload) => purchaseApi.createOrder(payload),
    onSuccess: async () => invalidate(),
  });
}

export function useUpdatePurchaseOrder(id: string) {
  const invalidate = useInvalidatePurchase();
  return useMutation({
    mutationFn: (payload: Partial<PurchaseOrderPayload>) =>
      purchaseApi.updateOrder(id, payload),
    onSuccess: async () => invalidate(),
  });
}

export function useChangePurchaseOrderStatus(id: string) {
  const invalidate = useInvalidatePurchase();
  return useMutation({
    mutationFn: (payload: { status: string }) => purchaseApi.changeOrderStatus(id, payload),
    onSuccess: async () => invalidate(),
  });
}

export function useGoodsReceivedNotes(query: PurchaseListQuery) {
  return useQuery({
    queryKey: purchaseKeys.grns(query),
    queryFn: () => purchaseApi.listGoodsReceivedNotes(query),
  });
}

export function useGoodsReceivedNote(id: string) {
  return useQuery({
    queryKey: purchaseKeys.grn(id),
    queryFn: () => purchaseApi.getGoodsReceivedNote(id),
    enabled: Boolean(id),
  });
}

export function useCreateGoodsReceivedNote() {
  const invalidate = useInvalidatePurchase();
  return useMutation({
    mutationFn: (payload: GoodsReceivedNotePayload) =>
      purchaseApi.createGoodsReceivedNote(payload),
    onSuccess: async () => invalidate(),
  });
}
