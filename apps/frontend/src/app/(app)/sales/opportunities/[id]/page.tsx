import { OpportunityDetailPage } from "@/features/sales/opportunity-detail-page";

export default async function SalesOpportunityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <OpportunityDetailPage opportunityId={id} />;
}
