import type {
  InventoryCategoryFormValues,
  InventoryItemFormValues,
  StockAdjustmentFormValues,
} from "@/features/inventory/schemas";
import type {
  InventoryCategoryPayload,
  InventoryItemPayload,
  StockAdjustmentPayload,
} from "@/features/inventory/types";

export const ALL = "__all__";
export const NONE = "__none__";

export function formatInventoryDate(value?: string | null) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(parsed);
}

export function formatQuantity(value?: number | string | null, unit?: string | null) {
  const amount = Number(value ?? 0);
  const formatted = new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
  return unit ? `${formatted} ${unit}` : formatted;
}

export function isLowStock(item: {
  currentStock?: number | string | null;
  lowStockThreshold?: number | string | null;
}) {
  return Number(item.currentStock ?? 0) <= Number(item.lowStockThreshold ?? 0);
}

export function cleanOptionalId(value?: string) {
  if (!value || value === ALL || value === NONE) return undefined;
  return value;
}

export function toInventoryCategoryPayload(
  values: InventoryCategoryFormValues,
): InventoryCategoryPayload {
  return {
    name: values.name.trim(),
    description: values.description?.trim() || undefined,
  };
}

export function toInventoryItemPayload(values: InventoryItemFormValues): InventoryItemPayload {
  return {
    inventoryCategoryId: cleanOptionalId(values.inventoryCategoryId),
    name: values.name.trim(),
    itemCode: values.itemCode.trim(),
    sku: values.sku?.trim() || undefined,
    unit: values.unit.trim(),
    lowStockThreshold: values.lowStockThreshold,
  };
}

export function toStockAdjustmentPayload(
  values: StockAdjustmentFormValues,
): StockAdjustmentPayload {
  return {
    inventoryItemId: values.inventoryItemId,
    quantity: values.quantity,
    movementDate: values.movementDate,
    reason: values.reason.trim(),
  };
}
