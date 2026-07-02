import type { DocumentTag } from "@/features/documents/types";
import { NONE } from "@/features/documents/utils";
import type { KnowledgeBaseArticle, KnowledgeBaseArticlePayload, KnowledgeBaseCategory, KnowledgeBaseCategoryPayload } from "@/features/knowledge-base/types";
import type { KnowledgeBaseArticleFormValues, KnowledgeBaseCategoryFormValues } from "@/features/knowledge-base/schemas";

export function formatKnowledgeBaseDate(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(new Date(value));
}

export function categoryName(categories: KnowledgeBaseCategory[] | undefined, id?: string | null) {
  if (!id) return "-";
  return categories?.find((category) => category.id === id)?.name ?? id.slice(0, 8);
}

export function articleTagIds(article?: KnowledgeBaseArticle) {
  return (article?.tags ?? []).map((tag) => tag.tagId).filter(Boolean);
}

export function tagLabels(tags: DocumentTag[] | undefined, tagIds: string[] | undefined) {
  return (tagIds ?? []).map((id) => tags?.find((tag) => tag.id === id)?.name ?? id.slice(0, 8));
}

export function toKnowledgeBaseCategoryPayload(values: KnowledgeBaseCategoryFormValues): KnowledgeBaseCategoryPayload {
  return {
    parentCategoryId: values.parentCategoryId === NONE ? undefined : values.parentCategoryId,
    name: values.name.trim(),
    description: values.description?.trim() || undefined,
  };
}

export function toKnowledgeBaseArticlePayload(values: KnowledgeBaseArticleFormValues): KnowledgeBaseArticlePayload {
  const tagIds = values.tagIds.filter(Boolean);
  return {
    categoryId: values.categoryId === NONE ? undefined : values.categoryId,
    authorUserId: values.authorUserId.trim() || undefined,
    title: values.title.trim(),
    summary: values.summary?.trim() || undefined,
    content: values.content.trim(),
    tagIds: tagIds.length ? tagIds : undefined,
  };
}

export function toKnowledgeBaseArticleUpdatePayload(values: KnowledgeBaseArticleFormValues) {
  return {
    categoryId: values.categoryId === NONE ? undefined : values.categoryId,
    title: values.title.trim(),
    summary: values.summary?.trim() || undefined,
    content: values.content.trim(),
  };
}
