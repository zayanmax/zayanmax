import { AnnouncementDetailPage } from "@/features/communication/announcement-detail-page";

export default async function AnnouncementDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AnnouncementDetailPage announcementId={id} />;
}
