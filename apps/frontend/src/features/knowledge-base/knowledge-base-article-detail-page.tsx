"use client";

import Link from "next/link";
import { Archive, Edit, FileText, RotateCcw, Send, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { DataCard } from "@/components/shared/data-card";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { PermissionGuard } from "@/components/shared/permission-guard";
import { StatusBadge } from "@/components/shared/status-badge";
import { useDocumentTags } from "@/features/documents/hooks";
import { useChangeKnowledgeBaseArticleStatus, useDeleteKnowledgeBaseArticle, useKnowledgeBaseArticle, useKnowledgeBaseCategories } from "@/features/knowledge-base/hooks";
import type { KnowledgeArticleStatus } from "@/features/knowledge-base/types";
import { articleTagIds, categoryName, formatKnowledgeBaseDate, tagLabels } from "@/features/knowledge-base/utils";
import { ApiClientError } from "@/lib/api/client";

export function KnowledgeBaseArticleDetailPage({ articleId }: { articleId: string }) {
  const router = useRouter();
  const article = useKnowledgeBaseArticle(articleId);
  const categories = useKnowledgeBaseCategories({ page: 1, limit: 100, sortBy: "name", sortOrder: "asc" });
  const tags = useDocumentTags({ page: 1, limit: 100, sortBy: "name", sortOrder: "asc" });
  const changeStatus = useChangeKnowledgeBaseArticleStatus(articleId);
  const deleteArticle = useDeleteKnowledgeBaseArticle();
  async function setStatus(status: KnowledgeArticleStatus) {
    await changeStatus.mutateAsync({ status });
  }
  async function removeArticle() {
    await deleteArticle.mutateAsync(articleId);
    router.replace("/knowledge-base/articles");
  }
  const errorMessage = article.error instanceof ApiClientError ? article.error.message : article.error instanceof Error ? article.error.message : undefined;
  return (
    <PermissionGuard permission="documents.view" fallback={<ErrorState title="Permission required" message="You do not have access to knowledge base articles." />}>
      {article.isLoading ? <LoadingState rows={6} /> : null}
      {article.error ? <ErrorState title="Unable to load article" message={errorMessage} /> : null}
      {!article.isLoading && !article.error && article.data ? (
        <div className="flex flex-col gap-6">
          <PageHeader
            title={article.data.title}
            description={article.data.summary ?? article.data.slug}
            actions={
              <PermissionGuard permission="documents.manage">
                <Link href={`/knowledge-base/articles/${articleId}/edit`} className={buttonVariants({ variant: "outline" })}><Edit className="size-4" />Edit</Link>
                <Button type="button" variant="outline" disabled={changeStatus.isPending} onClick={() => void setStatus("PUBLISHED")}><Send className="size-4" />Publish</Button>
                <Button type="button" variant="outline" disabled={changeStatus.isPending} onClick={() => void setStatus(article.data?.status === "ARCHIVED" ? "DRAFT" : "ARCHIVED")}>
                  {article.data.status === "ARCHIVED" ? <RotateCcw className="size-4" /> : <Archive className="size-4" />}
                  {article.data.status === "ARCHIVED" ? "Move to draft" : "Archive"}
                </Button>
                <ConfirmDialog title="Delete article" description="This soft-deletes the knowledge base article metadata and content." confirmLabel="Delete" destructive onConfirm={() => void removeArticle()} trigger={<Button type="button" variant="destructive"><Trash2 className="size-4" />Delete</Button>} />
              </PermissionGuard>
            }
          />
          <div className="grid gap-4 xl:grid-cols-3">
            <DataCard title="Article Metadata">
              <DetailRows rows={[
                ["Status", <StatusBadge key="status" status={article.data.status} />],
                ["Category", categoryName(categories.data?.data, article.data.categoryId)],
                ["Slug", article.data.slug],
                ["Tags", tagLabels(tags.data?.data, articleTagIds(article.data)).join(", ") || "-"],
              ]} />
            </DataCard>
            <DataCard title="Lifecycle">
              <DetailRows rows={[
                ["Author user", article.data.authorUserId?.slice(0, 8) ?? "-"],
                ["Published", formatKnowledgeBaseDate(article.data.publishedAt)],
                ["Archived", formatKnowledgeBaseDate(article.data.archivedAt)],
                ["Created", formatKnowledgeBaseDate(article.data.createdAt)],
                ["Updated", formatKnowledgeBaseDate(article.data.updatedAt)],
              ]} />
            </DataCard>
            <DataCard title="Summary">
              <p className="text-sm text-muted-foreground">{article.data.summary ?? "No summary recorded."}</p>
            </DataCard>
          </div>
          <DataCard title="Article Content" description="Simple text content. Rich editor, OCR, and file preview are not implemented yet.">
            <article className="prose prose-slate max-w-none">
              <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="size-4" />
                {article.data.slug}
              </div>
              <pre className="whitespace-pre-wrap rounded-md bg-muted p-4 font-sans text-sm leading-6 text-foreground">{article.data.content}</pre>
            </article>
          </DataCard>
        </div>
      ) : null}
    </PermissionGuard>
  );
}

function DetailRows({ rows }: { rows: Array<[string, ReactNode]> }) {
  return (
    <dl className="grid gap-3">
      {rows.map(([label, value]) => (
        <div key={label} className="grid gap-1 sm:grid-cols-3 sm:gap-3">
          <dt className="text-sm text-muted-foreground">{label}</dt>
          <dd className="text-sm font-medium text-foreground sm:col-span-2">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
