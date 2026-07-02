import { VendorFormPage } from "@/features/finance/vendor-form-page";

export default async function EditVendorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <VendorFormPage vendorId={id} />;
}
