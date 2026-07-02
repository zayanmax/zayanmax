import { ClientFormPage } from "@/features/clients/client-form-page";

export default async function EditClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ClientFormPage clientId={id} />;
}
