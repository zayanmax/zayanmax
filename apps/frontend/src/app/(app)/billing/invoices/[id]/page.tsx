import { InvoiceDetailPage } from "@/features/billing/invoice-detail-page";

export default function InvoiceDetailRoute({ params }: { params: { id: string } }) {
  return <InvoiceDetailPage invoiceId={params.id} />;
}
