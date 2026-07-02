import { z } from "zod";

export const assetStatuses = [
  "AVAILABLE",
  "ASSIGNED",
  "UNDER_MAINTENANCE",
  "RETIRED",
  "LOST",
] as const;
export const assetAssignmentStatuses = ["ACTIVE", "RETURNED"] as const;

const optionalString = z.string().trim().optional();

export const assetCategorySchema = z.object({
  name: z.string().trim().min(2, "Category name must be at least 2 characters"),
  description: optionalString,
});

export const assetSchema = z.object({
  assetCategoryId: optionalString,
  name: z.string().trim().min(2, "Asset name must be at least 2 characters"),
  assetTag: z.string().trim().min(1, "Asset tag is required"),
  serialNumber: optionalString,
  purchaseDate: optionalString,
  warrantyExpiryDate: optionalString,
  status: z.enum(assetStatuses),
  notes: optionalString,
});

export const assetAssignmentSchema = z.object({
  assetId: z.string().trim().min(1, "Asset is required"),
  employeeId: z.string().trim().min(1, "Employee is required"),
  assignedAt: z.string().trim().min(1, "Assigned date is required"),
  notes: optionalString,
});

export const assetMaintenanceSchema = z.object({
  assetId: z.string().trim().min(1, "Asset is required"),
  vendorId: optionalString,
  maintenanceDate: z.string().trim().min(1, "Maintenance date is required"),
  description: z.string().trim().min(2, "Description is required"),
  cost: z.number().min(0).optional(),
  nextMaintenanceDate: optionalString,
});

export type AssetCategoryFormValues = z.infer<typeof assetCategorySchema>;
export type AssetFormValues = z.infer<typeof assetSchema>;
export type AssetAssignmentFormValues = z.infer<typeof assetAssignmentSchema>;
export type AssetMaintenanceFormValues = z.infer<typeof assetMaintenanceSchema>;
