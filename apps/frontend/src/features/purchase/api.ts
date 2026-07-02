import { apiRequest } from "@/lib/api/client";
import type {
  GoodsReceivedNote,
  GoodsReceivedNotePayload,
  PurchaseListQuery,
  PurchaseListResult,
  PurchaseOrder,
  PurchaseOrderPayload,
  PurchaseRequest,
  PurchaseRequestPayload,
} from "@/features/purchase/types";

export const purchaseApi = {
  listRequests: (params: PurchaseListQuery) =>
    apiRequest<PurchaseListResult<PurchaseRequest>>({
      url: "/purchases/requests",
      method: "GET",
      params,
    }),
  getRequest: (id: string) =>
    apiRequest<PurchaseRequest>({
      url: `/purchases/requests/${id}`,
      method: "GET",
    }),
  createRequest: (payload: PurchaseRequestPayload) =>
    apiRequest<PurchaseRequest>({
      url: "/purchases/requests",
      method: "POST",
      data: payload,
    }),
  updateRequest: (id: string, payload: Partial<PurchaseRequestPayload>) =>
    apiRequest<PurchaseRequest>({
      url: `/purchases/requests/${id}`,
      method: "PATCH",
      data: payload,
    }),
  changeRequestStatus: (id: string, payload: { status: string; reviewComment?: string }) =>
    apiRequest<PurchaseRequest>({
      url: `/purchases/requests/${id}/status`,
      method: "PATCH",
      data: payload,
    }),
  listOrders: (params: PurchaseListQuery) =>
    apiRequest<PurchaseListResult<PurchaseOrder>>({
      url: "/purchases/orders",
      method: "GET",
      params,
    }),
  getOrder: (id: string) =>
    apiRequest<PurchaseOrder>({ url: `/purchases/orders/${id}`, method: "GET" }),
  createOrder: (payload: PurchaseOrderPayload) =>
    apiRequest<PurchaseOrder>({
      url: "/purchases/orders",
      method: "POST",
      data: payload,
    }),
  updateOrder: (id: string, payload: Partial<PurchaseOrderPayload>) =>
    apiRequest<PurchaseOrder>({
      url: `/purchases/orders/${id}`,
      method: "PATCH",
      data: payload,
    }),
  changeOrderStatus: (id: string, payload: { status: string }) =>
    apiRequest<PurchaseOrder>({
      url: `/purchases/orders/${id}/status`,
      method: "PATCH",
      data: payload,
    }),
  listGoodsReceivedNotes: (params: PurchaseListQuery) =>
    apiRequest<PurchaseListResult<GoodsReceivedNote>>({
      url: "/purchases/goods-received-notes",
      method: "GET",
      params,
    }),
  getGoodsReceivedNote: (id: string) =>
    apiRequest<GoodsReceivedNote>({
      url: `/purchases/goods-received-notes/${id}`,
      method: "GET",
    }),
  createGoodsReceivedNote: (payload: GoodsReceivedNotePayload) =>
    apiRequest<GoodsReceivedNote>({
      url: "/purchases/goods-received-notes",
      method: "POST",
      data: payload,
    }),
};
