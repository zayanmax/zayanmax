import type {
  AssetAssignmentFormValues,
  AssetCategoryFormValues,
  AssetFormValues,
  AssetMaintenanceFormValues,
} from "@/features/assets/schemas";
import type {
  AssetAssignmentPayload,
  AssetCategoryPayload,
  AssetMaintenancePayload,
  AssetPayload,
} from "@/features/assets/types";

export const ALL = "__all__";
export const NONE = "__none__";

export function formatAssetDate(value?: string | null) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(parsed);
}

export function formatAssetMoney(value?: number | string | null) {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
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

export function cleanOptionalId(value?: string) {
  if (!value || value === ALL || value === NONE) return undefined;
  return value;
}

export function toDateInput(value?: string | null) {
  if (!value) return "";
  return value.slice(0, 10);
}

export function toAssetCategoryPayload(
  values: AssetCategoryFormValues,
): AssetCategoryPayload {
  return {
    name: values.name.trim(),
    description: values.description?.trim() || undefined,
  };
}

export function toAssetPayload(values: AssetFormValues): AssetPayload {
  return {
    assetCategoryId: cleanOptionalId(values.assetCategoryId),
    name: values.name.trim(),
    assetTag: values.assetTag.trim(),
    serialNumber: values.serialNumber?.trim() || undefined,
    purchaseDate: values.purchaseDate || undefined,
    warrantyExpiryDate: values.warrantyExpiryDate || undefined,
    status: values.status,
    notes: values.notes?.trim() || undefined,
  };
}

export function toAssetAssignmentPayload(
  values: AssetAssignmentFormValues,
): AssetAssignmentPayload {
  return {
    employeeId: values.employeeId,
    assignedAt: values.assignedAt,
    notes: values.notes?.trim() || undefined,
  };
}

export function toAssetMaintenancePayload(
  values: AssetMaintenanceFormValues,
): AssetMaintenancePayload {
  return {
    vendorId: cleanOptionalId(values.vendorId),
    maintenanceDate: values.maintenanceDate,
    description: values.description.trim(),
    cost: values.cost,
    nextMaintenanceDate: values.nextMaintenanceDate || undefined,
  };
}
