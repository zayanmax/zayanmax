import { VendorDetailPage } from "@/features/finance/vendor-detail-page";

export default function VendorDetailRoute({ params }: { params: { id: string } }) {
  return <VendorDetailPage vendorId={params.id} />;
}
