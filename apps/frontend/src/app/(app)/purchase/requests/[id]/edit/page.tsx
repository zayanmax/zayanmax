import { PurchaseRequestFormPage } from "@/features/purchase/purchase-request-form-page";

export default async function EditPurchaseRequestRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PurchaseRequestFormPage requestId={id} />;
}
