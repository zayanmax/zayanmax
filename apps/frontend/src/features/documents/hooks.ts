import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { documentsApi } from "@/features/documents/api";
import type {
  DocumentCategoryPayload,
  DocumentFolderPayload,
  DocumentListQuery,
  DocumentRecordPayload,
  DocumentTagPayload,
  DocumentVersionPayload,
} from "@/features/documents/types";

export const documentKeys = {
  all: ["documents"] as const,
  folders: (query: DocumentListQuery) => [...documentKeys.all, "folders", query] as const,
  folder: (id: string) => [...documentKeys.all, "folder", id] as const,
  categories: (query: DocumentListQuery) =>
    [...documentKeys.all, "categories", query] as const,
  tags: (query: DocumentListQuery) => [...documentKeys.all, "tags", query] as const,
  records: (query: DocumentListQuery) => [...documentKeys.all, "records", query] as const,
  record: (id: string) => [...documentKeys.all, "record", id] as const,
};

function useInvalidateDocuments() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: documentKeys.all });
}

export function useDocumentFolders(query: DocumentListQuery) {
  return useQuery({
    queryKey: documentKeys.folders(query),
    queryFn: () => documentsApi.listFolders(query),
  });
}

export function useDocumentFolder(id: string) {
  return useQuery({
    queryKey: documentKeys.folder(id),
    queryFn: () => documentsApi.getFolder(id),
    enabled: Boolean(id),
  });
}

export function useCreateDocumentFolder() {
  const invalidate = useInvalidateDocuments();
  return useMutation({
    mutationFn: (payload: DocumentFolderPayload) => documentsApi.createFolder(payload),
    onSuccess: async () => invalidate(),
  });
}

export function useUpdateDocumentFolder(id: string) {
  const invalidate = useInvalidateDocuments();
  return useMutation({
    mutationFn: (payload: Partial<DocumentFolderPayload>) =>
      documentsApi.updateFolder(id, payload),
    onSuccess: async () => invalidate(),
  });
}

export function useDeleteDocumentFolder() {
  const invalidate = useInvalidateDocuments();
  return useMutation({
    mutationFn: (id: string) => documentsApi.deleteFolder(id),
    onSuccess: async () => invalidate(),
  });
}

export function useDocumentCategories(query: DocumentListQuery) {
  return useQuery({
    queryKey: documentKeys.categories(query),
    queryFn: () => documentsApi.listCategories(query),
  });
}

export function useCreateDocumentCategory() {
  const invalidate = useInvalidateDocuments();
  return useMutation({
    mutationFn: (payload: DocumentCategoryPayload) => documentsApi.createCategory(payload),
    onSuccess: async () => invalidate(),
  });
}

export function useDocumentTags(query: DocumentListQuery) {
  return useQuery({
    queryKey: documentKeys.tags(query),
    queryFn: () => documentsApi.listTags(query),
  });
}

export function useCreateDocumentTag() {
  const invalidate = useInvalidateDocuments();
  return useMutation({
    mutationFn: (payload: DocumentTagPayload) => documentsApi.createTag(payload),
    onSuccess: async () => invalidate(),
  });
}

export function useDocuments(query: DocumentListQuery) {
  return useQuery({
    queryKey: documentKeys.records(query),
    queryFn: () => documentsApi.listDocuments(query),
  });
}

export function useDocument(id: string) {
  return useQuery({
    queryKey: documentKeys.record(id),
    queryFn: () => documentsApi.getDocument(id),
    enabled: Boolean(id),
  });
}

export function useCreateDocument() {
  const invalidate = useInvalidateDocuments();
  return useMutation({
    mutationFn: (payload: DocumentRecordPayload) => documentsApi.createDocument(payload),
    onSuccess: async () => invalidate(),
  });
}

export function useUpdateDocument(id: string) {
  const invalidate = useInvalidateDocuments();
  return useMutation({
    mutationFn: (payload: Partial<DocumentRecordPayload>) =>
      documentsApi.updateDocument(id, payload),
    onSuccess: async () => invalidate(),
  });
}

export function useChangeDocumentStatus(id: string) {
  const invalidate = useInvalidateDocuments();
  return useMutation({
    mutationFn: (payload: { status: string }) =>
      documentsApi.changeDocumentStatus(id, payload),
    onSuccess: async () => invalidate(),
  });
}

export function useDeleteDocument() {
  const invalidate = useInvalidateDocuments();
  return useMutation({
    mutationFn: (id: string) => documentsApi.deleteDocument(id),
    onSuccess: async () => invalidate(),
  });
}

export function useCreateDocumentVersion(id: string) {
  const invalidate = useInvalidateDocuments();
  return useMutation({
    mutationFn: (payload: DocumentVersionPayload) =>
      documentsApi.createDocumentVersion(id, payload),
    onSuccess: async () => invalidate(),
  });
}
