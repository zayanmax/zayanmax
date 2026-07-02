import type { ApiMeta } from "@/types/api";
import type { Employee } from "@/features/employees/types";
import type { InventoryItem } from "@/features/inventory/types";
import type { Vendor } from "@/features/finance/types";

export type PurchaseRequestStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "APPROVED"
  | "REJECTED"
  | "ORDERED"
  | "CANCELLED";

export type PurchaseOrderStatus =
  | "DRAFT"
  | "SENT"
  | "PARTIALLY_RECEIVED"
  | "RECEIVED"
  | "CANCELLED";

export type PurchaseEmployee = Pick<
  Employee,
  "id" | "employeeCode" | "firstName" | "lastName" | "email"
>;

export type PurchaseRequestItem = {
  id?: string;
  inventoryItemId?: string | null;
  description: string;
  quantity: number | string;
  estimatedUnitPrice?: number | string | null;
  estimatedTotal?: number | string | null;
  inventoryItem?: Pick<InventoryItem, "id" | "name" | "itemCode" | "unit"> | null;
};

export type PurchaseRequest = {
  id: string;
  requesterEmployeeId?: string | null;
  requestNumber: string;
  title: string;
  neededByDate?: string | null;
  status: PurchaseRequestStatus;
  notes?: string | null;
  reviewComment?: string | null;
  reviewedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  requesterEmployee?: PurchaseEmployee | null;
  items?: PurchaseRequestItem[];
  purchaseOrders?: PurchaseOrder[];
};

export type PurchaseRequestPayload = {
  requesterEmployeeId?: string;
  title: string;
  neededByDate?: string;
  notes?: string;
  items: Array<{
    inventoryItemId?: string;
    description: string;
    quantity: number;
    estimatedUnitPrice?: number;
  }>;
};

export type PurchaseOrderItem = {
  id?: string;
  inventoryItemId?: string | null;
  description: string;
  quantity: number | string;
  unitPrice: number | string;
  taxAmount?: number | string | null;
  lineTotal?: number | string | null;
  receivedQuantity?: number | string | null;
  inventoryItem?: Pick<InventoryItem, "id" | "name" | "itemCode" | "unit"> | null;
};

export type PurchaseOrder = {
  id: string;
  vendorId?: string | null;
  purchaseRequestId?: string | null;
  orderNumber: string;
  orderDate: string;
  expectedDeliveryDate?: string | null;
  status: PurchaseOrderStatus;
  subTotal: number | string;
  taxAmount: number | string;
  totalAmount: number | string;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
  vendor?: Pick<Vendor, "id" | "name" | "email" | "phone"> | null;
  purchaseRequest?: Pick<PurchaseRequest, "id" | "requestNumber" | "title"> | null;
  items?: PurchaseOrderItem[];
  goodsReceivedNotes?: GoodsReceivedNote[];
};

export type PurchaseOrderPayload = {
  vendorId?: string;
  purchaseRequestId?: string;
  orderNumber?: string;
  orderDate: string;
  expectedDeliveryDate?: string;
  notes?: string;
  items: Array<{
    inventoryItemId?: string;
    description: string;
    quantity: number;
    unitPrice: number;
    taxAmount?: number;
  }>;
};

export type GoodsReceivedNoteItem = {
  id?: string;
  purchaseOrderItemId?: string | null;
  inventoryItemId?: string | null;
  description: string;
  quantityReceived: number | string;
  purchaseOrderItem?: PurchaseOrderItem | null;
  inventoryItem?: Pick<InventoryItem, "id" | "name" | "itemCode" | "unit"> | null;
};

export type GoodsReceivedNote = {
  id: string;
  purchaseOrderId: string;
  grnNumber: string;
  receivedDate: string;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
  purchaseOrder?: PurchaseOrder | null;
  items?: GoodsReceivedNoteItem[];
};

export type GoodsReceivedNotePayload = {
  purchaseOrderId: string;
  grnNumber?: string;
  receivedDate: string;
  notes?: string;
  items: Array<{
    purchaseOrderItemId?: string;
    inventoryItemId?: string;
    description: string;
    quantityReceived: number;
  }>;
};

export type PurchaseListQuery = {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  status?: string;
  requesterEmployeeId?: string;
  vendorId?: string;
  purchaseRequestId?: string;
  purchaseOrderId?: string;
};

export type PurchaseListResult<T> = {
  data: T[];
  meta: Required<ApiMeta>;
};
