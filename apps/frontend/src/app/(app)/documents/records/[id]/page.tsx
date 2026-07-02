import { DocumentRecordDetailPage } from "@/features/documents/document-record-detail-page";

export default async function DocumentRecordDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DocumentRecordDetailPage documentId={id} />;
}
