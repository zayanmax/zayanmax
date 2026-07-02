"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { FormFieldWrapper } from "@/components/forms/form-field-wrapper";
import { SelectField } from "@/components/forms/select-field";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DataCard } from "@/components/shared/data-card";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { PermissionGuard } from "@/components/shared/permission-guard";
import { useDocumentTags } from "@/features/documents/hooks";
import { NONE } from "@/features/documents/utils";
import { knowledgeBaseArticleSchema, type KnowledgeBaseArticleFormValues } from "@/features/knowledge-base/schemas";
import { useCreateKnowledgeBaseArticle, useKnowledgeBaseArticle, useKnowledgeBaseCategories, useUpdateKnowledgeBaseArticle } from "@/features/knowledge-base/hooks";
import type { KnowledgeBaseArticle } from "@/features/knowledge-base/types";
import { articleTagIds, toKnowledgeBaseArticlePayload, toKnowledgeBaseArticleUpdatePayload } from "@/features/knowledge-base/utils";
import { ApiClientError } from "@/lib/api/client";

export function KnowledgeBaseArticleFormPage({ articleId }: { articleId?: string }) {
  const router = useRouter();
  const isEdit = Boolean(articleId);
  const article = useKnowledgeBaseArticle(articleId ?? "");
  const categories = useKnowledgeBaseCategories({ page: 1, limit: 100, sortBy: "name", sortOrder: "asc" });
  const tags = useDocumentTags({ page: 1, limit: 100, sortBy: "name", sortOrder: "asc" });
  const createArticle = useCreateKnowledgeBaseArticle();
  const updateArticle = useUpdateKnowledgeBaseArticle(articleId ?? "");
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm<KnowledgeBaseArticleFormValues>({
    resolver: zodResolver(knowledgeBaseArticleSchema),
    defaultValues: defaultValues(),
  });
  useEffect(() => {
    if (article.data) form.reset(defaultValues(article.data));
  }, [article.data, form]);
  const categoryOptions = useMemo(
    () => [{ value: NONE, label: "No category" }, ...(categories.data?.data ?? []).map((category) => ({ value: category.id, label: category.name }))],
    [categories.data?.data],
  );
  const currentTagIds = useWatch({ control: form.control, name: "tagIds" }) ?? [];
  async function onSubmit(values: KnowledgeBaseArticleFormValues) {
    setFormError(null);
    try {
      const saved = isEdit
        ? await updateArticle.mutateAsync(toKnowledgeBaseArticleUpdatePayload(values))
        : await createArticle.mutateAsync(toKnowledgeBaseArticlePayload(values));
      router.replace(`/knowledge-base/articles/${saved.id}`);
    } catch (caught) {
      setFormError(caught instanceof ApiClientError ? caught.message : "Unable to save article");
    }
  }
  const errorMessage = article.error instanceof ApiClientError ? article.error.message : article.error instanceof Error ? article.error.message : undefined;
  return (
    <PermissionGuard permission="documents.manage" fallback={<ErrorState title="Permission required" message="You do not have permission to manage knowledge base articles." />}>
      <div className="flex flex-col gap-6">
        <PageHeader title={isEdit ? "Edit Knowledge Base Article" : "New Knowledge Base Article"} description="Write internal knowledge base content. This pass uses a simple textarea editor only." />
        {isEdit && article.isLoading ? <LoadingState rows={6} /> : null}
        {article.error ? <ErrorState title="Unable to load article" message={errorMessage} /> : null}
        {(!isEdit || article.data) && !article.error ? (
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <DataCard title="Article Content">
              <div className="grid gap-4 md:grid-cols-2">
                <FormFieldWrapper label="Title" htmlFor="articleTitle" error={form.formState.errors.title?.message}><Input id="articleTitle" {...form.register("title")} /></FormFieldWrapper>
                <FormFieldWrapper label="Category">
                  <Controller control={form.control} name="categoryId" render={({ field }) => <SelectField value={field.value || NONE} onValueChange={field.onChange} options={categoryOptions} />} />
                </FormFieldWrapper>
                <FormFieldWrapper label="Author user ID" htmlFor="authorUserId"><Input id="authorUserId" placeholder="Optional UUID" disabled={isEdit} {...form.register("authorUserId")} /></FormFieldWrapper>
                <div className="md:col-span-2">
                  <FormFieldWrapper label="Summary" htmlFor="articleSummary"><Textarea id="articleSummary" rows={3} {...form.register("summary")} /></FormFieldWrapper>
                </div>
                <div className="md:col-span-2">
                  <FormFieldWrapper label="Content" htmlFor="articleContent" error={form.formState.errors.content?.message}><Textarea id="articleContent" rows={14} {...form.register("content")} /></FormFieldWrapper>
                </div>
              </div>
            </DataCard>
            {!isEdit ? (
              <DataCard title="Article Tags" description="Tags are attached when creating an article. Backend tag updates are pending.">
                <div className="flex flex-wrap gap-3">
                  {(tags.data?.data ?? []).map((tag) => (
                    <label key={tag.id} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                      <Checkbox
                        checked={currentTagIds.includes(tag.id)}
                        onCheckedChange={(checked) => {
                          const next = checked ? [...currentTagIds, tag.id] : currentTagIds.filter((id) => id !== tag.id);
                          form.setValue("tagIds", next, { shouldDirty: true });
                        }}
                      />
                      {tag.name}
                    </label>
                  ))}
                  {!tags.data?.data.length ? <p className="text-sm text-muted-foreground">Create document tags before assigning article tags.</p> : null}
                </div>
              </DataCard>
            ) : null}
            {formError ? <ErrorState title="Unable to save article" message={formError} /> : null}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
              <Button type="submit" disabled={form.formState.isSubmitting || createArticle.isPending || updateArticle.isPending}><Save className="size-4" />Save article</Button>
            </div>
          </form>
        ) : null}
      </div>
    </PermissionGuard>
  );
}

function defaultValues(article?: KnowledgeBaseArticle): KnowledgeBaseArticleFormValues {
  return {
    categoryId: article?.categoryId ?? NONE,
    authorUserId: article?.authorUserId ?? "",
    title: article?.title ?? "",
    summary: article?.summary ?? "",
    content: article?.content ?? "",
    tagIds: articleTagIds(article),
  };
}
