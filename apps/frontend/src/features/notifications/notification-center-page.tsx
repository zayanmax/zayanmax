"use client";

import { Check, RotateCcw } from "lucide-react";
import { useState } from "react";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { PaginationControls } from "@/components/data/pagination-controls";
import { SearchFilterBar } from "@/components/data/search-filter-bar";
import { SelectField } from "@/components/forms/select-field";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { PermissionGuard } from "@/components/shared/permission-guard";
import { StatusBadge } from "@/components/shared/status-badge";
import { useAuthStore } from "@/lib/auth/auth-store";
import { notificationCategoryOptions, notificationPriorityOptions } from "@/features/notifications/schemas";
import { useMarkNotificationRead, useMarkNotificationUnread, useNotifications } from "@/features/notifications/hooks";
import type { InternalNotification, NotificationCategory, NotificationPriority } from "@/features/notifications/types";
import { ALL, deliveryChannels, entityLabel, formatNotificationDate } from "@/features/notifications/utils";
import { ApiClientError } from "@/lib/api/client";

const readOptions = [
  { value: ALL, label: "All" },
  { value: "false", label: "Unread" },
  { value: "true", label: "Read" },
];

export function NotificationCenterPage() {
  const user = useAuthStore((state) => state.user);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [readState, setReadState] = useState(ALL);
  const [priority, setPriority] = useState(ALL);
  const [category, setCategory] = useState(ALL);
  const notifications = useNotifications({
    page,
    limit: 20,
    recipientUserId: user?.id,
    search: search || undefined,
    isRead: readState === ALL ? undefined : readState === "true",
    priority: priority === ALL ? undefined : (priority as NotificationPriority),
    category: category === ALL ? undefined : (category as NotificationCategory),
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const markRead = useMarkNotificationRead();
  const markUnread = useMarkNotificationUnread();
  const columns: DataTableColumn<InternalNotification>[] = [
    {
      key: "title",
      header: "Notification",
      render: (notification) => (
        <div className="min-w-0">
          <p className="font-medium text-foreground">{notification.title}</p>
          <p className="mt-1 max-w-xl truncate text-xs text-muted-foreground">{notification.body}</p>
        </div>
      ),
    },
    { key: "category", header: "Category", render: (notification) => notification.category },
    { key: "priority", header: "Priority", render: (notification) => <StatusBadge status={notification.priority} /> },
    { key: "read", header: "State", render: (notification) => <Badge variant={notification.isRead ? "secondary" : "default"}>{notification.isRead ? "Read" : "Unread"}</Badge> },
    { key: "entity", header: "Linked entity", render: (notification) => entityLabel(notification.entityType, notification.entityId) },
    { key: "channels", header: "Channels", render: (notification) => deliveryChannels(notification.deliveries) },
    { key: "created", header: "Created", render: (notification) => formatNotificationDate(notification.createdAt) },
    {
      key: "actions",
      header: "Actions",
      render: (notification) => notification.isRead ? (
        <Button type="button" variant="outline" size="sm" disabled={markUnread.isPending} onClick={() => void markUnread.mutateAsync(notification.id)}><RotateCcw className="size-4" />Unread</Button>
      ) : (
        <Button type="button" variant="outline" size="sm" disabled={markRead.isPending} onClick={() => void markRead.mutateAsync(notification.id)}><Check className="size-4" />Read</Button>
      ),
    },
  ];
  const errorMessage = notifications.error instanceof ApiClientError ? notifications.error.message : notifications.error instanceof Error ? notifications.error.message : undefined;
  return (
    <PermissionGuard permission="notifications.view" fallback={<ErrorState title="Permission required" message="You do not have access to notifications." />}>
      <div className="flex flex-col gap-6">
        <PageHeader title="Notification Center" description="In-app notification records. This pass does not implement live updates or external delivery." />
        <SearchFilterBar
          value={search}
          onChange={(value) => { setSearch(value); setPage(1); }}
          placeholder="Search notifications"
          filters={
            <>
              <SelectField value={readState} onValueChange={(value) => { setReadState(value); setPage(1); }} className="w-full sm:w-40" options={readOptions} />
              <SelectField value={priority} onValueChange={(value) => { setPriority(value); setPage(1); }} className="w-full sm:w-44" options={[{ value: ALL, label: "All priorities" }, ...notificationPriorityOptions.map((value) => ({ value, label: value }))]} />
              <SelectField value={category} onValueChange={(value) => { setCategory(value); setPage(1); }} className="w-full sm:w-52" options={[{ value: ALL, label: "All categories" }, ...notificationCategoryOptions.map((value) => ({ value, label: value.replaceAll("_", " ") }))]} />
            </>
          }
          onReset={() => { setSearch(""); setReadState(ALL); setPriority(ALL); setCategory(ALL); setPage(1); }}
        />
        {notifications.isLoading ? <LoadingState rows={6} /> : null}
        {notifications.error ? <ErrorState title="Unable to load notifications" message={errorMessage} /> : null}
        {!notifications.isLoading && !notifications.error ? (
          <>
            <DataTable columns={columns} rows={notifications.data?.data ?? []} getRowKey={(notification) => notification.id} emptyTitle="No notifications found" />
            <PaginationControls page={notifications.data?.meta.page ?? page} totalPages={notifications.data?.meta.totalPages ?? 1} onPageChange={setPage} />
          </>
        ) : null}
      </div>
    </PermissionGuard>
  );
}
