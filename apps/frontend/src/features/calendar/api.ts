import { apiRequest } from "@/lib/api/client";
import type {
  CalendarEvent,
  CalendarEventPayload,
  CalendarEventStatus,
  CalendarEventUpdatePayload,
  CalendarListQuery,
  CalendarListResult,
  CalendarResource,
  CalendarResourceBooking,
  CalendarResourceBookingPayload,
  CalendarResourcePayload,
  CalendarRsvpStatus,
} from "@/features/calendar/types";

export const calendarApi = {
  listEvents: (params: CalendarListQuery) =>
    apiRequest<CalendarListResult<CalendarEvent>>({
      url: "/calendar/events",
      method: "GET",
      params,
    }),
  getEvent: (id: string) =>
    apiRequest<CalendarEvent>({
      url: `/calendar/events/${id}`,
      method: "GET",
    }),
  listMyEvents: (params: CalendarListQuery) =>
    apiRequest<CalendarListResult<CalendarEvent>>({
      url: "/calendar/my",
      method: "GET",
      params,
    }),
  listCompanyEvents: (params: CalendarListQuery) =>
    apiRequest<CalendarListResult<CalendarEvent>>({
      url: "/calendar/company",
      method: "GET",
      params,
    }),
  createEvent: (payload: CalendarEventPayload) =>
    apiRequest<CalendarEvent>({
      url: "/calendar/events",
      method: "POST",
      data: payload,
    }),
  updateEvent: (id: string, payload: CalendarEventUpdatePayload) =>
    apiRequest<CalendarEvent>({
      url: `/calendar/events/${id}`,
      method: "PATCH",
      data: payload,
    }),
  changeEventStatus: (id: string, status: CalendarEventStatus) =>
    apiRequest<CalendarEvent>({
      url: `/calendar/events/${id}/status`,
      method: "PATCH",
      data: { status },
    }),
  deleteEvent: (id: string) =>
    apiRequest<CalendarEvent>({
      url: `/calendar/events/${id}`,
      method: "DELETE",
    }),
  respondToEvent: (id: string, rsvpStatus: CalendarRsvpStatus) =>
    apiRequest({
      url: `/calendar/events/${id}/rsvp`,
      method: "PATCH",
      data: { rsvpStatus },
    }),
  listResources: (params: CalendarListQuery) =>
    apiRequest<CalendarListResult<CalendarResource>>({
      url: "/calendar/resources",
      method: "GET",
      params,
    }),
  createResource: (payload: CalendarResourcePayload) =>
    apiRequest<CalendarResource>({
      url: "/calendar/resources",
      method: "POST",
      data: payload,
    }),
  listResourceBookings: (params: CalendarListQuery) =>
    apiRequest<CalendarListResult<CalendarResourceBooking>>({
      url: "/calendar/resource-bookings",
      method: "GET",
      params,
    }),
  createResourceBooking: (resourceId: string, payload: CalendarResourceBookingPayload) =>
    apiRequest<CalendarResourceBooking>({
      url: `/calendar/resources/${resourceId}/bookings`,
      method: "POST",
      data: payload,
    }),
};
