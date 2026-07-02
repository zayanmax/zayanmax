import { DocumentFolderDetailPage } from "@/features/documents/document-folder-detail-page";

export default async function DocumentFolderDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DocumentFolderDetailPage folderId={id} />;
}
