import { VendorBillFormPage } from "@/features/finance/vendor-bill-form-page";

export default async function EditVendorBillPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <VendorBillFormPage billId={id} />;
}
