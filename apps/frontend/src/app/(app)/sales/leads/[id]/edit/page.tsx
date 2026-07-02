import { LeadFormPage } from "@/features/sales/lead-form-page";

export default async function EditSalesLeadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <LeadFormPage leadId={id} />;
}
