import { z } from "zod";
export const knowledgeArticleStatusOptions = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;

export const knowledgeBaseCategorySchema = z.object({
  parentCategoryId: z.string(),
  name: z.string().min(1, "Name is required"),
  description: z.string(),
});

export type KnowledgeBaseCategoryFormValues = z.infer<typeof knowledgeBaseCategorySchema>;

export const knowledgeBaseArticleSchema = z.object({
  categoryId: z.string(),
  authorUserId: z.string(),
  title: z.string().min(1, "Title is required"),
  summary: z.string(),
  content: z.string().min(1, "Content is required"),
  tagIds: z.array(z.string()),
});

export type KnowledgeBaseArticleFormValues = z.infer<typeof knowledgeBaseArticleSchema>;
