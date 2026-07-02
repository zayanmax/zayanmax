import { AssetDetailPage } from "@/features/assets/asset-detail-page";

export default async function AssetDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AssetDetailPage assetId={id} />;
}
