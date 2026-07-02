import { AnnouncementFormPage } from "@/features/communication/announcement-form-page";

export default async function EditAnnouncementRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AnnouncementFormPage announcementId={id} />;
}
