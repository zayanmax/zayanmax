import { KnowledgeBaseArticleFormPage } from "@/features/knowledge-base/knowledge-base-article-form-page";

export default async function EditKnowledgeBaseArticleRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <KnowledgeBaseArticleFormPage articleId={id} />;
}
