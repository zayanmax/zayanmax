import type {
  DocumentCategory,
  DocumentFolder,
  DocumentRecord,
  DocumentRecordPayload,
  DocumentTag,
  DocumentVersion,
  DocumentVersionPayload,
} from "@/features/documents/types";
import type {
  DocumentFolderFormValues,
  DocumentRecordFormValues,
  DocumentVersionFormValues,
} from "@/features/documents/schemas";

export const ALL = "__all__";
export const NONE = "__none__";

export function formatDocumentDate(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(new Date(value));
}

export function formatFileSize(value?: number | string | null) {
  const size = Number(value ?? 0);
  if (!size) return "-";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

export function toDateInput(value?: string | null) {
  return value ? value.slice(0, 10) : "";
}

export function latestVersion(document: DocumentRecord) {
  return [...(document.versions ?? [])].sort(
    (left, right) => Number(right.versionNumber) - Number(left.versionNumber),
  )[0];
}

export function folderName(folders: DocumentFolder[] | undefined, id?: string | null) {
  if (!id) return "-";
  return folders?.find((folder) => folder.id === id)?.name ?? id.slice(0, 8);
}

export function categoryName(
  categories: DocumentCategory[] | undefined,
  id?: string | null,
) {
  if (!id) return "-";
  return categories?.find((category) => category.id === id)?.name ?? id.slice(0, 8);
}

export function tagLabels(tags: DocumentTag[] | undefined, tagIds: string[] | undefined) {
  return (tagIds ?? []).map(
    (id) => tags?.find((tag) => tag.id === id)?.name ?? id.slice(0, 8),
  );
}

export function documentTagIds(document?: DocumentRecord) {
  return (document?.tags ?? []).map((tag) => tag.tagId).filter(Boolean);
}

export function toFolderPayload(values: DocumentFolderFormValues) {
  return {
    parentFolderId: values.parentFolderId === NONE ? undefined : values.parentFolderId,
    name: values.name.trim(),
    description: values.description?.trim() || undefined,
    visibility: values.visibility,
  };
}

export function toDocumentPayload(values: DocumentRecordFormValues): DocumentRecordPayload {
  const tagIds = values.tagIds.filter(Boolean);
  const size = Number(values.size ?? 0);
  return {
    folderId: values.folderId === NONE ? undefined : values.folderId,
    categoryId: values.categoryId === NONE ? undefined : values.categoryId,
    ownerUserId: values.ownerUserId.trim() || undefined,
    title: values.title.trim(),
    description: values.description?.trim() || undefined,
    visibility: values.visibility,
    linkedEntityType:
      values.linkedEntityType === NONE ? undefined : values.linkedEntityType,
    linkedEntityId: values.linkedEntityId.trim() || undefined,
    tagIds: tagIds.length ? tagIds : undefined,
    expiresAt: values.expiresAt || undefined,
    reminderAt: values.reminderAt || undefined,
    fileName: values.fileName?.trim() || undefined,
    storageKey: values.storageKey?.trim() || undefined,
    mimeType: values.mimeType?.trim() || undefined,
    size: size > 0 ? size : undefined,
    checksum: values.checksum?.trim() || undefined,
  };
}

export function toDocumentUpdatePayload(values: DocumentRecordFormValues) {
  return {
    categoryId: values.categoryId === NONE ? undefined : values.categoryId,
    ownerUserId: values.ownerUserId.trim() || undefined,
    title: values.title.trim(),
    description: values.description?.trim() || undefined,
    visibility: values.visibility,
    expiresAt: values.expiresAt || undefined,
    reminderAt: values.reminderAt || undefined,
  };
}

export function toVersionPayload(values: DocumentVersionFormValues): DocumentVersionPayload {
  return {
    fileName: values.fileName.trim(),
    storageKey: values.storageKey.trim(),
    mimeType: values.mimeType.trim(),
    size: Number(values.size),
    checksum: values.checksum?.trim() || undefined,
    notes: values.notes?.trim() || undefined,
  };
}

export function fileMeta(version?: DocumentVersion) {
  if (!version) return "No version metadata";
  return `${version.fileName} - ${version.mimeType} - ${formatFileSize(version.size)}`;
}
