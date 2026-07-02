import type {
  Client,
  ClientActivityPayload,
  ClientContactPayload,
  ClientDocumentPayload,
  ClientPayload,
} from "@/features/clients/types";
import type {
  ClientActivityFormValues,
  ClientContactFormValues,
  ClientDocumentFormValues,
  ClientFormValues,
} from "@/features/clients/schemas";

export function formatClientDate(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function clientLocation(client: Pick<Client, "billingAddress">) {
  return client.billingAddress?.trim() || "-";
}

export function toClientPayload(values: ClientFormValues): ClientPayload {
  return {
    type: values.type,
    name: values.name.trim(),
    email: optional(values.email)?.toLowerCase(),
    phone: optional(values.phone),
    website: optional(values.website),
    industry: optional(values.industry),
    companySize: optional(values.companySize),
    taxNumber: optional(values.taxNumber),
    billingAddress: optional(values.billingAddress),
    status: values.status,
    ownerId: optional(values.ownerId),
  };
}

export function toContactPayload(
  values: ClientContactFormValues,
): ClientContactPayload {
  return {
    name: values.name.trim(),
    designation: optional(values.designation),
    email: optional(values.email)?.toLowerCase(),
    phone: optional(values.phone),
    isPrimary: Boolean(values.isPrimary),
  };
}

export function toActivityPayload(
  values: ClientActivityFormValues,
): ClientActivityPayload {
  return {
    type: values.type,
    title: values.title.trim(),
    description: optional(values.description),
    dueAt: optional(values.dueAt),
    completedAt: optional(values.completedAt),
  };
}

export function toDocumentPayload(
  values: ClientDocumentFormValues,
): ClientDocumentPayload {
  return {
    fileName: values.fileName.trim(),
    storageKey: values.storageKey.trim(),
    mimeType: values.mimeType.trim(),
    size: Number(values.size),
    category: values.category,
  };
}

function optional(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}
