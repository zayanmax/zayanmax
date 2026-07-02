import type {
  GoodsReceivedNote,
  GoodsReceivedNotePayload,
  PurchaseOrder,
  PurchaseOrderPayload,
  PurchaseRequest,
  PurchaseRequestPayload,
} from "@/features/purchase/types";
import type {
  GrnFormValues,
  PurchaseOrderFormValues,
  PurchaseRequestFormValues,
} from "@/features/purchase/schemas";

export const ALL = "__all__";
export const NONE = "__none__";

export function formatPurchaseDate(value?: string | null) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(parsed);
}

export function formatPurchaseMoney(value?: number | string | null) {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
}

export function formatQuantity(value?: number | string | null, unit?: string | null) {
  const amount = Number(value ?? 0);
  const formatted = new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
  return unit ? `${formatted} ${unit}` : formatted;
}

export function cleanOptionalId(value?: string) {
  if (!value || value === ALL || value === NONE) return undefined;
  return value;
}

export function toDateInput(value?: string | null) {
  if (!value) return "";
  return value.slice(0, 10);
}

export function employeeLabel(employee?: {
  firstName?: string;
  lastName?: string;
  employeeCode?: string;
  email?: string;
} | null) {
  if (!employee) return "-";
  const name = [employee.firstName, employee.lastName].filter(Boolean).join(" ");
  return name || employee.email || employee.employeeCode || "-";
}

export function purchaseRequestTotal(values: PurchaseRequestFormValues | PurchaseRequest) {
  if ("items" in values && values.items) {
    return values.items.reduce(
      (total, item) =>
        total + Number(item.quantity ?? 0) * Number(item.estimatedUnitPrice ?? 0),
      0,
    );
  }
  return 0;
}

export function purchaseOrderTotal(values: PurchaseOrderFormValues | PurchaseOrder) {
  if ("totalAmount" in values) return Number(values.totalAmount ?? 0);
  return values.items.reduce(
    (total, item) =>
      total + item.quantity * item.unitPrice + Number(item.taxAmount ?? 0),
    0,
  );
}

export function toPurchaseRequestPayload(
  values: PurchaseRequestFormValues,
): PurchaseRequestPayload {
  return {
    requesterEmployeeId: cleanOptionalId(values.requesterEmployeeId),
    title: values.title.trim(),
    neededByDate: values.neededByDate || undefined,
    notes: values.notes?.trim() || undefined,
    items: values.items.map((item) => ({
      inventoryItemId: cleanOptionalId(item.inventoryItemId),
      description: item.description.trim(),
      quantity: item.quantity,
      estimatedUnitPrice: item.estimatedUnitPrice,
    })),
  };
}

export function toPurchaseOrderPayload(
  values: PurchaseOrderFormValues,
): PurchaseOrderPayload {
  return {
    vendorId: cleanOptionalId(values.vendorId),
    purchaseRequestId: cleanOptionalId(values.purchaseRequestId),
    orderNumber: values.orderNumber?.trim() || undefined,
    orderDate: values.orderDate,
    expectedDeliveryDate: values.expectedDeliveryDate || undefined,
    notes: values.notes?.trim() || undefined,
    items: values.items.map((item) => ({
      inventoryItemId: cleanOptionalId(item.inventoryItemId),
      description: item.description.trim(),
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      taxAmount: item.taxAmount,
    })),
  };
}

export function toGrnPayload(values: GrnFormValues): GoodsReceivedNotePayload {
  return {
    purchaseOrderId: values.purchaseOrderId,
    grnNumber: values.grnNumber?.trim() || undefined,
    receivedDate: values.receivedDate,
    notes: values.notes?.trim() || undefined,
    items: values.items.map((item) => ({
      purchaseOrderItemId: cleanOptionalId(item.purchaseOrderItemId),
      inventoryItemId: cleanOptionalId(item.inventoryItemId),
      description: item.description.trim(),
      quantityReceived: item.quantityReceived,
    })),
  };
}

export function grnQuantityTotal(note?: GoodsReceivedNote) {
  return (
    note?.items?.reduce(
      (total, item) => total + Number(item.quantityReceived ?? 0),
      0,
    ) ?? 0
  );
}
