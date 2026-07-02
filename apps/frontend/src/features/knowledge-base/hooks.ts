import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { knowledgeBaseApi } from "@/features/knowledge-base/api";
import type {
  KnowledgeBaseArticlePayload,
  KnowledgeBaseCategoryPayload,
  KnowledgeBaseListQuery,
  KnowledgeArticleStatus,
} from "@/features/knowledge-base/types";

export const knowledgeBaseKeys = {
  all: ["knowledge-base"] as const,
  categories: (query: KnowledgeBaseListQuery) => [...knowledgeBaseKeys.all, "categories", query] as const,
  articles: (query: KnowledgeBaseListQuery) => [...knowledgeBaseKeys.all, "articles", query] as const,
  article: (id: string) => [...knowledgeBaseKeys.all, "article", id] as const,
};

function useInvalidateKnowledgeBase() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: knowledgeBaseKeys.all });
}

export function useKnowledgeBaseCategories(query: KnowledgeBaseListQuery) {
  return useQuery({
    queryKey: knowledgeBaseKeys.categories(query),
    queryFn: () => knowledgeBaseApi.listCategories(query),
  });
}

export function useCreateKnowledgeBaseCategory() {
  const invalidate = useInvalidateKnowledgeBase();
  return useMutation({
    mutationFn: (payload: KnowledgeBaseCategoryPayload) => knowledgeBaseApi.createCategory(payload),
    onSuccess: async () => invalidate(),
  });
}

export function useKnowledgeBaseArticles(query: KnowledgeBaseListQuery) {
  return useQuery({
    queryKey: knowledgeBaseKeys.articles(query),
    queryFn: () => knowledgeBaseApi.listArticles(query),
  });
}

export function useKnowledgeBaseArticle(id: string) {
  return useQuery({
    queryKey: knowledgeBaseKeys.article(id),
    queryFn: () => knowledgeBaseApi.getArticle(id),
    enabled: Boolean(id),
  });
}

export function useCreateKnowledgeBaseArticle() {
  const invalidate = useInvalidateKnowledgeBase();
  return useMutation({
    mutationFn: (payload: KnowledgeBaseArticlePayload) => knowledgeBaseApi.createArticle(payload),
    onSuccess: async () => invalidate(),
  });
}

export function useUpdateKnowledgeBaseArticle(id: string) {
  const invalidate = useInvalidateKnowledgeBase();
  return useMutation({
    mutationFn: (payload: Partial<KnowledgeBaseArticlePayload>) => knowledgeBaseApi.updateArticle(id, payload),
    onSuccess: async () => invalidate(),
  });
}

export function useChangeKnowledgeBaseArticleStatus(id: string) {
  const invalidate = useInvalidateKnowledgeBase();
  return useMutation({
    mutationFn: (payload: { status: KnowledgeArticleStatus }) => knowledgeBaseApi.changeArticleStatus(id, payload),
    onSuccess: async () => invalidate(),
  });
}

export function useDeleteKnowledgeBaseArticle() {
  const invalidate = useInvalidateKnowledgeBase();
  return useMutation({
    mutationFn: (id: string) => knowledgeBaseApi.deleteArticle(id),
    onSuccess: async () => invalidate(),
  });
}
