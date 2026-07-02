import { z } from "zod";

export const recordStatuses = ["ACTIVE", "INACTIVE", "ARCHIVED"] as const;
export const stockMovementTypes = ["IN", "OUT", "ADJUSTMENT"] as const;

const optionalString = z.string().trim().optional();

export const inventoryCategorySchema = z.object({
  name: z.string().trim().min(2, "Category name must be at least 2 characters"),
  description: optionalString,
});

export const inventoryItemSchema = z.object({
  inventoryCategoryId: optionalString,
  name: z.string().trim().min(2, "Item name must be at least 2 characters"),
  itemCode: z.string().trim().min(1, "Item code is required"),
  sku: optionalString,
  unit: z.string().trim().min(1, "Unit is required"),
  lowStockThreshold: z.number().min(0).optional(),
});

export const stockAdjustmentSchema = z.object({
  inventoryItemId: z.string().trim().min(1, "Inventory item is required"),
  quantity: z.number().refine((value) => value !== 0, "Quantity cannot be zero"),
  movementDate: z.string().trim().min(1, "Movement date is required"),
  reason: z.string().trim().min(2, "Reason is required"),
});

export type InventoryCategoryFormValues = z.infer<typeof inventoryCategorySchema>;
export type InventoryItemFormValues = z.infer<typeof inventoryItemSchema>;
export type StockAdjustmentFormValues = z.infer<typeof stockAdjustmentSchema>;
