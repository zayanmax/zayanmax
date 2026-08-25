import { CalendarEventDetailPage } from "@/features/calendar/calendar-event-detail-page";

export default async function CalendarEventDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CalendarEventDetailPage eventId={id} />;
}
