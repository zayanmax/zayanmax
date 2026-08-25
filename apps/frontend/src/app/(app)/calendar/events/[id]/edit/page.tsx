import { CalendarEventFormPage } from "@/features/calendar/calendar-event-form-page";

export default async function EditCalendarEventRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CalendarEventFormPage eventId={id} />;
}
