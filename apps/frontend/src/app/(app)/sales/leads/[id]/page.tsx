import { LeadDetailPage } from "@/features/sales/lead-detail-page";

export default async function SalesLeadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <LeadDetailPage leadId={id} />;
}
