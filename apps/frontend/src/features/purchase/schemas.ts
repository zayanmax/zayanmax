import { z } from "zod";

export const purchaseRequestStatuses = [
  "DRAFT",
  "SUBMITTED",
  "APPROVED",
  "REJECTED",
  "ORDERED",
  "CANCELLED",
] as const;

export const purchaseOrderStatuses = [
  "DRAFT",
  "SENT",
  "PARTIALLY_RECEIVED",
  "RECEIVED",
  "CANCELLED",
] as const;

const optionalString = z.string().trim().optional();

export const purchaseRequestItemSchema = z.object({
  inventoryItemId: optionalString,
  description: z.string().trim().min(1, "Description is required"),
  quantity: z.number().min(0.01, "Quantity must be greater than zero"),
  estimatedUnitPrice: z.number().min(0).optional(),
});

export const purchaseRequestSchema = z.object({
  requesterEmployeeId: optionalString,
  title: z.string().trim().min(2, "Title must be at least 2 characters"),
  neededByDate: optionalString,
  notes: optionalString,
  items: z.array(purchaseRequestItemSchema).min(1, "Add at least one item"),
});

export const purchaseOrderItemSchema = z.object({
  inventoryItemId: optionalString,
  description: z.string().trim().min(1, "Description is required"),
  quantity: z.number().min(0.01, "Quantity must be greater than zero"),
  unitPrice: z.number().min(0),
  taxAmount: z.number().min(0).optional(),
});

export const purchaseOrderSchema = z.object({
  vendorId: optionalString,
  purchaseRequestId: optionalString,
  orderNumber: optionalString,
  orderDate: z.string().trim().min(1, "Order date is required"),
  expectedDeliveryDate: optionalString,
  notes: optionalString,
  items: z.array(purchaseOrderItemSchema).min(1, "Add at least one item"),
});

export const grnItemSchema = z.object({
  purchaseOrderItemId: optionalString,
  inventoryItemId: optionalString,
  description: z.string().trim().min(1, "Description is required"),
  quantityReceived: z.number().min(0.01, "Quantity must be greater than zero"),
});

export const grnSchema = z.object({
  purchaseOrderId: z.string().trim().min(1, "Purchase order is required"),
  grnNumber: optionalString,
  receivedDate: z.string().trim().min(1, "Received date is required"),
  notes: optionalString,
  items: z.array(grnItemSchema).min(1, "Add at least one received item"),
});

export type PurchaseRequestFormValues = z.infer<typeof purchaseRequestSchema>;
export type PurchaseOrderFormValues = z.infer<typeof purchaseOrderSchema>;
export type GrnFormValues = z.infer<typeof grnSchema>;
