export type CalendarEventType =
  | "MEETING"
  | "TASK_DEADLINE"
  | "PROJECT_MILESTONE"
  | "HOLIDAY"
  | "INTERVIEW"
  | "CLIENT_MEETING"
  | "REMINDER"
  | "BIRTHDAY"
  | "WORK_ANNIVERSARY"
  | "CUSTOM";

export type CalendarEventStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED" | "POSTPONED";
export type CalendarRsvpStatus = "PENDING" | "ACCEPTED" | "DECLINED" | "TENTATIVE";
export type CalendarEntityType = "EMPLOYEE" | "CLIENT" | "PROJECT" | "TASK" | "LEAVE" | "HOLIDAY" | "DOCUMENT";
export type NotificationDeliveryChannel = "IN_APP" | "EMAIL" | "SMS" | "WHATSAPP" | "PUSH";
export type RecordStatus = "ACTIVE" | "INACTIVE";

export type CalendarListQuery = {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  eventType?: CalendarEventType;
  status?: CalendarEventStatus | RecordStatus;
  fromDate?: string;
  toDate?: string;
  attendeeUserId?: string;
  entityType?: CalendarEntityType;
  entityId?: string;
  resourceId?: string;
  eventId?: string;
};

export type CalendarListResult<T> = {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type CalendarEventAttendee = {
  id: string;
  userId: string;
  employeeId?: string | null;
  rsvpStatus: CalendarRsvpStatus;
  respondedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type CalendarResource = {
  id: string;
  name: string;
  type?: string | null;
  location?: string | null;
  capacity?: number | null;
  description?: string | null;
  status: RecordStatus;
  createdAt?: string;
  updatedAt?: string;
  createdById?: string | null;
};

export type CalendarResourceBooking = {
  id: string;
  eventId: string;
  resourceId: string;
  startAt: string;
  endAt: string;
  status: RecordStatus;
  createdAt?: string;
  updatedAt?: string;
  createdById?: string | null;
  event?: Pick<CalendarEvent, "id" | "title" | "startAt" | "endAt" | "status">;
  resource?: CalendarResource;
};

export type CalendarEventReminder = {
  id: string;
  method: NotificationDeliveryChannel;
  remindAt: string;
  minutesBefore?: number | null;
  message?: string | null;
  status?: string;
  createdAt?: string;
};

export type CalendarEvent = {
  id: string;
  title: string;
  description?: string | null;
  eventType: CalendarEventType;
  status: CalendarEventStatus;
  startAt: string;
  endAt: string;
  timezone?: string | null;
  location?: string | null;
  isAllDay?: boolean;
  recurrenceRule?: string | null;
  recurrenceEndsAt?: string | null;
  entityType?: CalendarEntityType | null;
  entityId?: string | null;
  createdByUserId?: string | null;
  createdById?: string | null;
  updatedById?: string | null;
  createdAt?: string;
  updatedAt?: string;
  attendees?: CalendarEventAttendee[];
  resourceBookings?: CalendarResourceBooking[];
  reminders?: CalendarEventReminder[];
};

export type CalendarEventPayload = {
  title: string;
  description?: string;
  eventType: CalendarEventType;
  startAt: string;
  endAt: string;
  timezone?: string;
  location?: string;
  isAllDay?: boolean;
  recurrenceRule?: string;
  recurrenceEndsAt?: string;
  entityType?: CalendarEntityType;
  entityId?: string;
  attendees?: Array<{ userId: string; employeeId?: string }>;
  resourceBookings?: Array<{ resourceId: string; startAt?: string; endAt?: string }>;
  reminders?: Array<{
    method?: NotificationDeliveryChannel;
    remindAt: string;
    minutesBefore?: number;
    message?: string;
  }>;
};

export type CalendarEventUpdatePayload = Partial<
  Pick<
    CalendarEventPayload,
    | "title"
    | "description"
    | "eventType"
    | "startAt"
    | "endAt"
    | "timezone"
    | "location"
    | "isAllDay"
    | "recurrenceRule"
    | "recurrenceEndsAt"
  >
>;

export type CalendarResourcePayload = {
  name: string;
  type?: string;
  location?: string;
  capacity?: number;
  description?: string;
};

export type CalendarResourceBookingPayload = {
  eventId: string;
  startAt: string;
  endAt: string;
};
