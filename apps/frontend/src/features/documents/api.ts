import { apiRequest } from "@/lib/api/client";
import type {
  DocumentCategory,
  DocumentCategoryPayload,
  DocumentFolder,
  DocumentFolderPayload,
  DocumentListQuery,
  DocumentListResult,
  DocumentRecord,
  DocumentRecordPayload,
  DocumentTag,
  DocumentTagPayload,
  DocumentVersion,
  DocumentVersionPayload,
} from "@/features/documents/types";

export const documentsApi = {
  listFolders: (params: DocumentListQuery) =>
    apiRequest<DocumentListResult<DocumentFolder>>({
      url: "/document-folders",
      method: "GET",
      params,
    }),
  getFolder: (id: string) =>
    apiRequest<DocumentFolder>({ url: `/document-folders/${id}`, method: "GET" }),
  createFolder: (payload: DocumentFolderPayload) =>
    apiRequest<DocumentFolder>({
      url: "/document-folders",
      method: "POST",
      data: payload,
    }),
  updateFolder: (id: string, payload: Partial<DocumentFolderPayload>) =>
    apiRequest<DocumentFolder>({
      url: `/document-folders/${id}`,
      method: "PATCH",
      data: payload,
    }),
  deleteFolder: (id: string) =>
    apiRequest<DocumentFolder>({ url: `/document-folders/${id}`, method: "DELETE" }),

  listCategories: (params: DocumentListQuery) =>
    apiRequest<DocumentListResult<DocumentCategory>>({
      url: "/document-categories",
      method: "GET",
      params,
    }),
  createCategory: (payload: DocumentCategoryPayload) =>
    apiRequest<DocumentCategory>({
      url: "/document-categories",
      method: "POST",
      data: payload,
    }),

  listTags: (params: DocumentListQuery) =>
    apiRequest<DocumentListResult<DocumentTag>>({
      url: "/document-tags",
      method: "GET",
      params,
    }),
  createTag: (payload: DocumentTagPayload) =>
    apiRequest<DocumentTag>({
      url: "/document-tags",
      method: "POST",
      data: payload,
    }),

  listDocuments: (params: DocumentListQuery) =>
    apiRequest<DocumentListResult<DocumentRecord>>({
      url: "/documents",
      method: "GET",
      params,
    }),
  getDocument: (id: string) =>
    apiRequest<DocumentRecord>({ url: `/documents/${id}`, method: "GET" }),
  createDocument: (payload: DocumentRecordPayload) =>
    apiRequest<DocumentRecord>({ url: "/documents", method: "POST", data: payload }),
  updateDocument: (id: string, payload: Partial<DocumentRecordPayload>) =>
    apiRequest<DocumentRecord>({
      url: `/documents/${id}`,
      method: "PATCH",
      data: payload,
    }),
  changeDocumentStatus: (id: string, payload: { status: string }) =>
    apiRequest<DocumentRecord>({
      url: `/documents/${id}/status`,
      method: "PATCH",
      data: payload,
    }),
  deleteDocument: (id: string) =>
    apiRequest<DocumentRecord>({ url: `/documents/${id}`, method: "DELETE" }),
  createDocumentVersion: (id: string, payload: DocumentVersionPayload) =>
    apiRequest<DocumentVersion>({
      url: `/documents/${id}/versions`,
      method: "POST",
      data: payload,
    }),
};
