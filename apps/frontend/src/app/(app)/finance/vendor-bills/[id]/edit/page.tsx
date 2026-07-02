import { VendorBillFormPage } from "@/features/finance/vendor-bill-form-page";

export default function EditVendorBillPage({ params }: { params: { id: string } }) {
  return <VendorBillFormPage billId={params.id} />;
}
