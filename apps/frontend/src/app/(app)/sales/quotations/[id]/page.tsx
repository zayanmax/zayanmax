import { QuotationDetailPage } from "@/features/sales/quotation-detail-page";

export default async function SalesQuotationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <QuotationDetailPage quotationId={id} />;
}
