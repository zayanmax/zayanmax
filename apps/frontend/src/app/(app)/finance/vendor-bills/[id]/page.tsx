import { VendorBillDetailPage } from "@/features/finance/vendor-bill-detail-page";

export default async function VendorBillDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <VendorBillDetailPage billId={id} />;
}
