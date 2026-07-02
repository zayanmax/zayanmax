"use client";

import Link from "next/link";
import { Edit, Eye, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { PaginationControls } from "@/components/data/pagination-controls";
import { SearchFilterBar } from "@/components/data/search-filter-bar";
import { SelectField } from "@/components/forms/select-field";
import { buttonVariants } from "@/components/ui/button";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { PermissionGuard } from "@/components/shared/permission-guard";
import { StatusBadge } from "@/components/shared/status-badge";
import { knowledgeArticleStatusOptions } from "@/features/knowledge-base/schemas";
import { useKnowledgeBaseArticles, useKnowledgeBaseCategories } from "@/features/knowledge-base/hooks";
import type { KnowledgeBaseArticle, KnowledgeArticleStatus } from "@/features/knowledge-base/types";
import { categoryName, formatKnowledgeBaseDate } from "@/features/knowledge-base/utils";
import { ALL } from "@/features/documents/utils";
import { ApiClientError } from "@/lib/api/client";

export function KnowledgeBaseArticlesListPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(ALL);
  const [categoryId, setCategoryId] = useState(ALL);
  const articles = useKnowledgeBaseArticles({
    page,
    limit: 20,
    search: search || undefined,
    status: status === ALL ? undefined : (status as KnowledgeArticleStatus),
    categoryId: categoryId === ALL ? undefined : categoryId,
    sortBy: "updatedAt",
    sortOrder: "desc",
  });
  const categories = useKnowledgeBaseCategories({ page: 1, limit: 100, sortBy: "name", sortOrder: "asc" });
  const categoryOptions = useMemo(
    () => [{ value: ALL, label: "All categories" }, ...(categories.data?.data ?? []).map((category) => ({ value: category.id, label: category.name }))],
    [categories.data?.data],
  );
  const columns: DataTableColumn<KnowledgeBaseArticle>[] = [
    {
      key: "title",
      header: "Article",
      render: (article) => (
        <Link href={`/knowledge-base/articles/${article.id}`} className="font-medium text-primary hover:underline">
          {article.title}
          <span className="block text-xs font-normal text-muted-foreground">{article.summary ?? article.slug}</span>
        </Link>
      ),
    },
    { key: "category", header: "Category", render: (article) => categoryName(categories.data?.data, article.categoryId) },
    { key: "status", header: "Status", render: (article) => <StatusBadge status={article.status} /> },
    { key: "published", header: "Published", render: (article) => formatKnowledgeBaseDate(article.publishedAt) },
    { key: "updated", header: "Updated", render: (article) => formatKnowledgeBaseDate(article.updatedAt) },
    {
      key: "actions",
      header: "Actions",
      render: (article) => (
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/knowledge-base/articles/${article.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}><Eye className="size-4" />View</Link>
          <PermissionGuard permission="documents.manage">
            <Link href={`/knowledge-base/articles/${article.id}/edit`} className={buttonVariants({ variant: "outline", size: "sm" })}><Edit className="size-4" />Edit</Link>
          </PermissionGuard>
        </div>
      ),
    },
  ];
  const errorMessage = articles.error instanceof ApiClientError ? articles.error.message : articles.error instanceof Error ? articles.error.message : undefined;
  return (
    <PermissionGuard permission="documents.view" fallback={<ErrorState title="Permission required" message="You do not have access to knowledge base articles." />}>
      <div className="flex flex-col gap-6">
        <PageHeader title="Knowledge Base Articles" description="Internal articles, drafts, published knowledge, and archived content." actions={<PermissionGuard permission="documents.manage"><Link href="/knowledge-base/articles/new" className={buttonVariants({ variant: "default" })}><Plus className="size-4" />New article</Link></PermissionGuard>} />
        <SearchFilterBar
          value={search}
          onChange={(value) => { setSearch(value); setPage(1); }}
          placeholder="Search articles"
          filters={
            <>
              <SelectField value={status} onValueChange={(value) => { setStatus(value); setPage(1); }} className="w-full sm:w-44" options={[{ value: ALL, label: "All statuses" }, ...knowledgeArticleStatusOptions.map((value) => ({ value, label: value }))]} />
              <SelectField value={categoryId} onValueChange={(value) => { setCategoryId(value); setPage(1); }} className="w-full sm:w-56" options={categoryOptions} />
            </>
          }
          onReset={() => { setSearch(""); setStatus(ALL); setCategoryId(ALL); setPage(1); }}
        />
        {articles.isLoading ? <LoadingState rows={6} /> : null}
        {articles.error ? <ErrorState title="Unable to load articles" message={errorMessage} /> : null}
        {!articles.isLoading && !articles.error ? (
          <>
            <DataTable columns={columns} rows={articles.data?.data ?? []} getRowKey={(article) => article.id} emptyTitle="No knowledge base articles found" />
            <PaginationControls page={articles.data?.meta.page ?? page} totalPages={articles.data?.meta.totalPages ?? 1} onPageChange={setPage} />
          </>
        ) : null}
      </div>
    </PermissionGuard>
  );
}
