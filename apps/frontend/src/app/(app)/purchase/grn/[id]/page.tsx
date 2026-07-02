import { GrnDetailPage } from "@/features/purchase/grn-detail-page";

export default async function GrnDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <GrnDetailPage grnId={id} />;
}
