import { InvoiceFormPage } from "@/features/billing/invoice-form-page";

export default function EditInvoicePage({ params }: { params: { id: string } }) {
  return <InvoiceFormPage invoiceId={params.id} />;
}
