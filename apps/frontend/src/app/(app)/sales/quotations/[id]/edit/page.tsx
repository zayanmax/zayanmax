import { QuotationFormPage } from "@/features/sales/quotation-form-page";

export default async function EditSalesQuotationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <QuotationFormPage quotationId={id} />;
}
