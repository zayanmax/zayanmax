import { PurchaseOrderDetailPage } from "@/features/purchase/purchase-order-detail-page";

export default async function PurchaseOrderDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PurchaseOrderDetailPage orderId={id} />;
}
