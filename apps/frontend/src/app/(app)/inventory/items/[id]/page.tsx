import { InventoryItemDetailPage } from "@/features/inventory/inventory-item-detail-page";

export default async function InventoryItemDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <InventoryItemDetailPage itemId={id} />;
}
