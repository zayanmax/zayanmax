import type { ApiMeta } from "@/types/api";

export type KnowledgeArticleStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export type KnowledgeBaseCategory = {
  id: string;
  parentCategoryId?: string | null;
  name: string;
  path: string;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
  createdById?: string | null;
};

export type KnowledgeBaseArticleTag = {
  id?: string;
  tagId: string;
  articleId?: string;
};

export type KnowledgeBaseArticle = {
  id: string;
  categoryId?: string | null;
  authorUserId?: string | null;
  title: string;
  slug: string;
  summary?: string | null;
  content: string;
  status: KnowledgeArticleStatus;
  publishedAt?: string | null;
  archivedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  createdById?: string | null;
  updatedById?: string | null;
  tags?: KnowledgeBaseArticleTag[];
};

export type KnowledgeBaseListQuery = {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  parentCategoryId?: string;
  categoryId?: string;
  status?: KnowledgeArticleStatus;
};

export type KnowledgeBaseListResult<T> = {
  data: T[];
  meta: Required<ApiMeta>;
};

export type KnowledgeBaseCategoryPayload = {
  parentCategoryId?: string;
  name: string;
  description?: string;
};

export type KnowledgeBaseArticlePayload = {
  categoryId?: string;
  authorUserId?: string;
  title: string;
  summary?: string;
  content: string;
  tagIds?: string[];
};
