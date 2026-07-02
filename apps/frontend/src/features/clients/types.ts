import type { ApiMeta } from "@/types/api";

export type ClientType = "COMPANY" | "INDIVIDUAL";
export type ClientStatus = "ACTIVE" | "INACTIVE" | "PROSPECT" | "ARCHIVED";
export type ClientActivityType =
  | "CALL"
  | "EMAIL"
  | "MEETING"
  | "FOLLOW_UP"
  | "NOTE"
  | "STATUS_CHANGE"
  | "DOCUMENT"
  | "OTHER";
export type ClientDocumentCategory =
  | "CONTRACT"
  | "TAX"
  | "PROPOSAL"
  | "IDENTITY"
  | "OTHER";

export type ClientOwner = {
  id: string;
  email: string;
};

export type ClientCounts = {
  contacts?: number;
  notes?: number;
  activities?: number;
  documents?: number;
};

export type Client = {
  id: string;
  companyId: string;
  type: ClientType;
  name: string;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  industry?: string | null;
  companySize?: string | null;
  taxNumber?: string | null;
  billingAddress?: string | null;
  status: ClientStatus;
  ownerId?: string | null;
  owner?: ClientOwner | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  createdById?: string | null;
  updatedById?: string | null;
  _count?: ClientCounts;
  contacts?: ClientContact[];
  activities?: ClientActivity[];
  notes?: ClientNote[];
  documents?: ClientDocument[];
};

export type ClientPayload = {
  type: ClientType;
  name: string;
  email?: string;
  phone?: string;
  website?: string;
  industry?: string;
  companySize?: string;
  taxNumber?: string;
  billingAddress?: string;
  status?: ClientStatus;
  ownerId?: string;
};

export type ChangeClientStatusPayload = {
  status: ClientStatus;
};

export type ClientListQuery = {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  status?: ClientStatus;
  type?: ClientType;
  ownerId?: string;
};

export type ClientListResult = {
  data: Client[];
  meta: Required<ApiMeta>;
};

export type ClientContact = {
  id: string;
  clientId: string;
  name: string;
  designation?: string | null;
  email?: string | null;
  phone?: string | null;
  isPrimary: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type ClientContactPayload = {
  name: string;
  designation?: string;
  email?: string;
  phone?: string;
  isPrimary?: boolean;
};

export type ClientActivity = {
  id: string;
  clientId: string;
  type: ClientActivityType;
  title: string;
  description?: string | null;
  dueAt?: string | null;
  completedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type ClientActivityPayload = {
  type: ClientActivityType;
  title: string;
  description?: string;
  dueAt?: string;
  completedAt?: string;
};

export type ClientNote = {
  id: string;
  clientId: string;
  noteText: string;
  createdAt?: string;
  updatedAt?: string;
};

export type ClientNotePayload = {
  noteText: string;
};

export type ClientDocument = {
  id: string;
  clientId: string;
  fileName: string;
  storageKey: string;
  mimeType: string;
  size: number;
  category: ClientDocumentCategory;
  createdAt?: string;
  updatedAt?: string;
};

export type ClientDocumentPayload = {
  fileName: string;
  storageKey: string;
  mimeType: string;
  size: number;
  category?: ClientDocumentCategory;
};
