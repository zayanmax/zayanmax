import { AssetFormPage } from "@/features/assets/asset-form-page";

export default async function EditAssetRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AssetFormPage assetId={id} />;
}
