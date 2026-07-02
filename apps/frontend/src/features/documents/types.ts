import type { ApiMeta } from "@/types/api";

export type DocumentVisibility = "COMPANY" | "DEPARTMENT" | "PRIVATE";
export type DocumentStatus = "ACTIVE" | "ARCHIVED";
export type DocumentLinkedEntityType =
  | "EMPLOYEE"
  | "CLIENT"
  | "PROJECT"
  | "TASK"
  | "VENDOR"
  | "ASSET";

export type DocumentFolder = {
  id: string;
  parentFolderId?: string | null;
  departmentId?: string | null;
  ownerUserId?: string | null;
  name: string;
  path: string;
  description?: string | null;
  visibility: DocumentVisibility;
  createdAt?: string;
  updatedAt?: string;
  createdById?: string | null;
  updatedById?: string | null;
};

export type DocumentCategory = {
  id: string;
  name: string;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type DocumentTag = {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
};

export type DocumentRecordTag = {
  id?: string;
  tagId: string;
  documentId?: string;
};

export type DocumentLink = {
  id?: string;
  entityType: DocumentLinkedEntityType;
  entityId: string;
};

export type DocumentVersion = {
  id: string;
  documentId?: string;
  versionNumber: number;
  fileName: string;
  storageKey: string;
  mimeType: string;
  size: number | string;
  checksum?: string | null;
  notes?: string | null;
  createdAt?: string;
  createdById?: string | null;
};

export type DocumentRecord = {
  id: string;
  folderId?: string | null;
  categoryId?: string | null;
  departmentId?: string | null;
  ownerUserId?: string | null;
  title: string;
  description?: string | null;
  visibility: DocumentVisibility;
  status: DocumentStatus;
  expiresAt?: string | null;
  reminderAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  createdById?: string | null;
  updatedById?: string | null;
  tags?: DocumentRecordTag[];
  links?: DocumentLink[];
  versions?: DocumentVersion[];
};

export type DocumentListQuery = {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  status?: DocumentStatus;
  folderId?: string;
  categoryId?: string;
  tagId?: string;
  ownerUserId?: string;
  visibility?: DocumentVisibility;
  linkedEntityType?: DocumentLinkedEntityType;
  linkedEntityId?: string;
};

export type DocumentListResult<T> = {
  data: T[];
  meta: Required<ApiMeta>;
};

export type DocumentFolderPayload = {
  parentFolderId?: string;
  departmentId?: string;
  ownerUserId?: string;
  name: string;
  description?: string;
  visibility?: DocumentVisibility;
};

export type DocumentCategoryPayload = {
  name: string;
  description?: string;
};

export type DocumentTagPayload = {
  name: string;
};

export type DocumentRecordPayload = {
  folderId?: string;
  categoryId?: string;
  departmentId?: string;
  ownerUserId?: string;
  title: string;
  description?: string;
  visibility?: DocumentVisibility;
  linkedEntityType?: DocumentLinkedEntityType;
  linkedEntityId?: string;
  tagIds?: string[];
  expiresAt?: string;
  reminderAt?: string;
  fileName?: string;
  storageKey?: string;
  mimeType?: string;
  size?: number;
  checksum?: string;
};

export type DocumentVersionPayload = {
  fileName: string;
  storageKey: string;
  mimeType: string;
  size: number;
  checksum?: string;
  notes?: string;
};
