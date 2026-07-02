import { KnowledgeBaseArticleDetailPage } from "@/features/knowledge-base/knowledge-base-article-detail-page";

export default async function KnowledgeBaseArticleDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <KnowledgeBaseArticleDetailPage articleId={id} />;
}
