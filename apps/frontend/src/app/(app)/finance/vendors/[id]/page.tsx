import { VendorDetailPage } from "@/features/finance/vendor-detail-page";

export default async function VendorDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <VendorDetailPage vendorId={id} />;
}
