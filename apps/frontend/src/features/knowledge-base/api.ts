import { apiRequest } from "@/lib/api/client";
import type {
  KnowledgeBaseArticle,
  KnowledgeBaseArticlePayload,
  KnowledgeBaseCategory,
  KnowledgeBaseCategoryPayload,
  KnowledgeBaseListQuery,
  KnowledgeBaseListResult,
  KnowledgeArticleStatus,
} from "@/features/knowledge-base/types";

export const knowledgeBaseApi = {
  listCategories: (params: KnowledgeBaseListQuery) =>
    apiRequest<KnowledgeBaseListResult<KnowledgeBaseCategory>>({
      url: "/knowledge-base/categories",
      method: "GET",
      params,
    }),
  createCategory: (payload: KnowledgeBaseCategoryPayload) =>
    apiRequest<KnowledgeBaseCategory>({
      url: "/knowledge-base/categories",
      method: "POST",
      data: payload,
    }),
  listArticles: (params: KnowledgeBaseListQuery) =>
    apiRequest<KnowledgeBaseListResult<KnowledgeBaseArticle>>({
      url: "/knowledge-base/articles",
      method: "GET",
      params,
    }),
  getArticle: (id: string) =>
    apiRequest<KnowledgeBaseArticle>({
      url: `/knowledge-base/articles/${id}`,
      method: "GET",
    }),
  createArticle: (payload: KnowledgeBaseArticlePayload) =>
    apiRequest<KnowledgeBaseArticle>({
      url: "/knowledge-base/articles",
      method: "POST",
      data: payload,
    }),
  updateArticle: (id: string, payload: Partial<KnowledgeBaseArticlePayload>) =>
    apiRequest<KnowledgeBaseArticle>({
      url: `/knowledge-base/articles/${id}`,
      method: "PATCH",
      data: payload,
    }),
  changeArticleStatus: (id: string, payload: { status: KnowledgeArticleStatus }) =>
    apiRequest<KnowledgeBaseArticle>({
      url: `/knowledge-base/articles/${id}/status`,
      method: "PATCH",
      data: payload,
    }),
  deleteArticle: (id: string) =>
    apiRequest<KnowledgeBaseArticle>({
      url: `/knowledge-base/articles/${id}`,
      method: "DELETE",
    }),
};
