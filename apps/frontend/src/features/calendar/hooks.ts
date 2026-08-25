import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { calendarApi } from "@/features/calendar/api";
import type {
  CalendarEventPayload,
  CalendarEventStatus,
  CalendarEventUpdatePayload,
  CalendarListQuery,
  CalendarResourceBookingPayload,
  CalendarResourcePayload,
  CalendarRsvpStatus,
} from "@/features/calendar/types";

export const calendarKeys = {
  all: ["calendar"] as const,
  events: (query: CalendarListQuery) => [...calendarKeys.all, "events", query] as const,
  event: (id: string) => [...calendarKeys.all, "event", id] as const,
  myEvents: (query: CalendarListQuery) => [...calendarKeys.all, "my", query] as const,
  companyEvents: (query: CalendarListQuery) => [...calendarKeys.all, "company", query] as const,
  resources: (query: CalendarListQuery) => [...calendarKeys.all, "resources", query] as const,
  bookings: (query: CalendarListQuery) => [...calendarKeys.all, "bookings", query] as const,
};

function useInvalidateCalendar() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: calendarKeys.all });
}

export function useCalendarEvents(query: CalendarListQuery) {
  return useQuery({
    queryKey: calendarKeys.events(query),
    queryFn: () => calendarApi.listEvents(query),
  });
}

export function useCalendarEvent(id: string) {
  return useQuery({
    queryKey: calendarKeys.event(id),
    queryFn: () => calendarApi.getEvent(id),
    enabled: Boolean(id),
  });
}

export function useMyCalendarEvents(query: CalendarListQuery) {
  return useQuery({
    queryKey: calendarKeys.myEvents(query),
    queryFn: () => calendarApi.listMyEvents(query),
  });
}

export function useCompanyCalendarEvents(query: CalendarListQuery) {
  return useQuery({
    queryKey: calendarKeys.companyEvents(query),
    queryFn: () => calendarApi.listCompanyEvents(query),
  });
}

export function useCreateCalendarEvent() {
  const invalidate = useInvalidateCalendar();
  return useMutation({
    mutationFn: (payload: CalendarEventPayload) => calendarApi.createEvent(payload),
    onSuccess: async () => invalidate(),
  });
}

export function useUpdateCalendarEvent(id: string) {
  const invalidate = useInvalidateCalendar();
  return useMutation({
    mutationFn: (payload: CalendarEventUpdatePayload) => calendarApi.updateEvent(id, payload),
    onSuccess: async () => invalidate(),
  });
}

export function useChangeCalendarEventStatus(id: string) {
  const invalidate = useInvalidateCalendar();
  return useMutation({
    mutationFn: (status: CalendarEventStatus) => calendarApi.changeEventStatus(id, status),
    onSuccess: async () => invalidate(),
  });
}

export function useDeleteCalendarEvent(id: string) {
  const invalidate = useInvalidateCalendar();
  return useMutation({
    mutationFn: () => calendarApi.deleteEvent(id),
    onSuccess: async () => invalidate(),
  });
}

export function useRespondToCalendarEvent(id: string) {
  const invalidate = useInvalidateCalendar();
  return useMutation({
    mutationFn: (status: CalendarRsvpStatus) => calendarApi.respondToEvent(id, status),
    onSuccess: async () => invalidate(),
  });
}

export function useCalendarResources(query: CalendarListQuery) {
  return useQuery({
    queryKey: calendarKeys.resources(query),
    queryFn: () => calendarApi.listResources(query),
  });
}

export function useCreateCalendarResource() {
  const invalidate = useInvalidateCalendar();
  return useMutation({
    mutationFn: (payload: CalendarResourcePayload) => calendarApi.createResource(payload),
    onSuccess: async () => invalidate(),
  });
}

export function useCalendarResourceBookings(query: CalendarListQuery) {
  return useQuery({
    queryKey: calendarKeys.bookings(query),
    queryFn: () => calendarApi.listResourceBookings(query),
  });
}

export function useCreateCalendarResourceBooking(resourceId: string) {
  const invalidate = useInvalidateCalendar();
  return useMutation({
    mutationFn: (payload: CalendarResourceBookingPayload) => calendarApi.createResourceBooking(resourceId, payload),
    onSuccess: async () => invalidate(),
  });
}
