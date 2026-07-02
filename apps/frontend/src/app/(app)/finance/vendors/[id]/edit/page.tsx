import { VendorFormPage } from "@/features/finance/vendor-form-page";

export default function EditVendorPage({ params }: { params: { id: string } }) {
  return <VendorFormPage vendorId={params.id} />;
}
