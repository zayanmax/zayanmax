"use client";

import Link from "next/link";
import { Eye, Pencil } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { PermissionGuard } from "@/components/shared/permission-guard";
import type { CalendarEvent } from "@/features/calendar/types";
import { eventResourceLabel, formatCalendarDateTime, linkedEntityLabel, readableEnum } from "@/features/calendar/utils";

export function CalendarEventTable({ events }: { events: CalendarEvent[] }) {
  const columns: DataTableColumn<CalendarEvent>[] = [
    { key: "title", header: "Title", render: (event) => <Link className="font-medium text-primary hover:underline" href={`/calendar/events/${event.id}`}>{event.title}</Link> },
    { key: "type", header: "Type", render: (event) => readableEnum(event.eventType) },
    { key: "status", header: "Status", render: (event) => <StatusBadge status={event.status} /> },
    { key: "start", header: "Start", render: (event) => formatCalendarDateTime(event.startAt) },
    { key: "end", header: "End", render: (event) => formatCalendarDateTime(event.endAt) },
    { key: "resource", header: "Location / resource", render: (event) => eventResourceLabel(event) },
    { key: "attendees", header: "Attendees", render: (event) => event.attendees?.length ?? 0 },
    { key: "entity", header: "Linked entity", render: (event) => linkedEntityLabel(event) },
    {
      key: "actions",
      header: "Actions",
      render: (event) => (
        <div className="flex items-center justify-end gap-2">
          <Link href={`/calendar/events/${event.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
            <Eye className="size-4" />
            View
          </Link>
          <PermissionGuard permission="calendar.manage">
            <Link href={`/calendar/events/${event.id}/edit`} className={buttonVariants({ variant: "outline", size: "sm" })}>
              <Pencil className="size-4" />
              Edit
            </Link>
          </PermissionGuard>
        </div>
      ),
      className: "text-right",
    },
  ];
  return <DataTable columns={columns} rows={events} getRowKey={(event) => event.id} emptyTitle="No calendar events found" />;
}
