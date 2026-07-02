import { DocumentRecordFormPage } from "@/features/documents/document-record-form-page";

export default async function EditDocumentRecordRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DocumentRecordFormPage documentId={id} />;
}
