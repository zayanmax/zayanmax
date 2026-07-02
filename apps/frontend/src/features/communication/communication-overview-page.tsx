"use client";

import Link from "next/link";
import { Archive, Bell, FileText, Megaphone, Plus, Send, Timer } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { DataCard } from "@/components/shared/data-card";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { PermissionGuard } from "@/components/shared/permission-guard";
import { StatCard } from "@/components/shared/stat-card";
import { useAuthStore } from "@/lib/auth/auth-store";
import { useAnnouncements } from "@/features/communication/hooks";
import { useNotifications, useNotificationTemplates, useReminders } from "@/features/notifications/hooks";

export function CommunicationOverviewPage() {
  const user = useAuthStore((state) => state.user);
  const published = useAnnouncements({ page: 1, limit: 1, status: "PUBLISHED" });
  const drafts = useAnnouncements({ page: 1, limit: 1, status: "DRAFT" });
  const archived = useAnnouncements({ page: 1, limit: 1, status: "ARCHIVED" });
  const unread = useNotifications({ page: 1, limit: 1, recipientUserId: user?.id, isRead: false });
  const pendingReminders = useReminders({ page: 1, limit: 1, recipientUserId: user?.id, status: "PENDING" });
  const templates = useNotificationTemplates({ page: 1, limit: 1 });
  const loading = published.isLoading || drafts.isLoading || archived.isLoading || unread.isLoading || pendingReminders.isLoading || templates.isLoading;
  const hasError = published.error || drafts.error || archived.error || unread.error || pendingReminders.error || templates.error;

  return (
    <PermissionGuard permission="communications.view" fallback={<ErrorState title="Permission required" message="You do not have access to communication screens." />}>
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Communication"
          description="Announcements, notification metadata, templates, reminders, and user delivery preferences."
          actions={
            <PermissionGuard permission="communications.manage">
              <Link href="/communication/announcements/new" className={buttonVariants({ variant: "default" })}>
                <Plus className="size-4" />
                New announcement
              </Link>
            </PermissionGuard>
          }
        />
        {loading ? <LoadingState rows={4} /> : null}
        {hasError ? <ErrorState title="Unable to load communication overview" /> : null}
        {!loading && !hasError ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
              <StatCard title="Published" value={published.data?.meta.total ?? 0} icon={Megaphone} tone="success" />
              <StatCard title="Drafts" value={drafts.data?.meta.total ?? 0} icon={FileText} tone="warning" />
              <StatCard title="Archived" value={archived.data?.meta.total ?? 0} icon={Archive} tone="info" />
              <StatCard title="Unread" value={unread.data?.meta.total ?? 0} icon={Bell} tone="primary" />
              <StatCard title="Pending Reminders" value={pendingReminders.data?.meta.total ?? 0} icon={Timer} tone="info" />
              <StatCard title="Templates" value={templates.data?.meta.total ?? 0} icon={Send} tone="primary" />
            </div>
            <DataCard title="Delivery Scope" description="External delivery is metadata only in this pass.">
              <p className="text-sm text-muted-foreground">
                Email, SMS, WhatsApp, push, scheduled execution, BullMQ workers, and live WebSocket updates are intentionally not implemented yet.
              </p>
            </DataCard>
          </>
        ) : null}
      </div>
    </PermissionGuard>
  );
}
