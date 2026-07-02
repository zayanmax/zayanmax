import { PurchaseRequestDetailPage } from "@/features/purchase/purchase-request-detail-page";

export default async function PurchaseRequestDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PurchaseRequestDetailPage requestId={id} />;
}
