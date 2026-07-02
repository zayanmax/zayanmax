import { PurchaseOrderFormPage } from "@/features/purchase/purchase-order-form-page";

export default async function EditPurchaseOrderRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PurchaseOrderFormPage orderId={id} />;
}
