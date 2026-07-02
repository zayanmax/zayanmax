import { VendorBillDetailPage } from "@/features/finance/vendor-bill-detail-page";

export default function VendorBillDetailRoute({ params }: { params: { id: string } }) {
  return <VendorBillDetailPage billId={params.id} />;
}
