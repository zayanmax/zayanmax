import { OpportunityFormPage } from "@/features/sales/opportunity-form-page";

export default async function EditSalesOpportunityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <OpportunityFormPage opportunityId={id} />;
}
