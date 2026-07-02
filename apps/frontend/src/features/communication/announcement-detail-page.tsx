"use client";

import Link from "next/link";
import { Archive, Edit, Eye, RotateCcw, Send } from "lucide-react";
import type { ReactNode } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { DataCard } from "@/components/shared/data-card";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { PermissionGuard } from "@/components/shared/permission-guard";
import { StatusBadge } from "@/components/shared/status-badge";
import { useAnnouncement, useAnnouncementReadReceipts, useChangeAnnouncementStatus, useMarkAnnouncementRead } from "@/features/communication/hooks";
import type { AnnouncementReadReceipt, AnnouncementStatus } from "@/features/communication/types";
import { audienceLabel, formatCommunicationDate } from "@/features/communication/utils";
import { ApiClientError } from "@/lib/api/client";

export function AnnouncementDetailPage({ announcementId }: { announcementId: string }) {
  const announcement = useAnnouncement(announcementId);
  const receipts = useAnnouncementReadReceipts(announcementId, { page: 1, limit: 20 });
  const changeStatus = useChangeAnnouncementStatus(announcementId);
  const markRead = useMarkAnnouncementRead(announcementId);
  async function setStatus(status: AnnouncementStatus) {
    await changeStatus.mutateAsync({ status });
  }
  const columns: DataTableColumn<AnnouncementReadReceipt>[] = [
    { key: "user", header: "User", render: (receipt) => receipt.userId.slice(0, 8) },
    { key: "readAt", header: "Read at", render: (receipt) => formatCommunicationDate(receipt.readAt) },
  ];
  const errorMessage = announcement.error instanceof ApiClientError ? announcement.error.message : announcement.error instanceof Error ? announcement.error.message : undefined;
  return (
    <PermissionGuard permission="communications.view" fallback={<ErrorState title="Permission required" message="You do not have access to announcements." />}>
      {announcement.isLoading ? <LoadingState rows={6} /> : null}
      {announcement.error ? <ErrorState title="Unable to load announcement" message={errorMessage} /> : null}
      {!announcement.isLoading && !announcement.error && announcement.data ? (
        <div className="flex flex-col gap-6">
          <PageHeader
            title={announcement.data.title}
            description={audienceLabel(announcement.data.audiences)}
            actions={
              <>
                <Button type="button" variant="outline" disabled={markRead.isPending} onClick={() => void markRead.mutateAsync()}><Eye className="size-4" />Mark read</Button>
                <PermissionGuard permission="communications.manage">
                  <Link href={`/communication/announcements/${announcementId}/edit`} className={buttonVariants({ variant: "outline" })}><Edit className="size-4" />Edit</Link>
                  <Button type="button" variant="outline" disabled={changeStatus.isPending} onClick={() => void setStatus("PUBLISHED")}><Send className="size-4" />Publish</Button>
                  <Button type="button" variant="outline" disabled={changeStatus.isPending} onClick={() => void setStatus(announcement.data?.status === "ARCHIVED" ? "DRAFT" : "ARCHIVED")}>
                    {announcement.data.status === "ARCHIVED" ? <RotateCcw className="size-4" /> : <Archive className="size-4" />}
                    {announcement.data.status === "ARCHIVED" ? "Move to draft" : "Archive"}
                  </Button>
                </PermissionGuard>
              </>
            }
          />
          <div className="grid gap-4 xl:grid-cols-3">
            <DataCard title="Status"><DetailRows rows={[["Status", <StatusBadge key="status" status={announcement.data.status} />], ["Audience", audienceLabel(announcement.data.audiences)], ["Reads", receipts.data?.meta.total ?? 0]]} /></DataCard>
            <DataCard title="Timeline"><DetailRows rows={[["Published", formatCommunicationDate(announcement.data.publishedAt)], ["Archived", formatCommunicationDate(announcement.data.archivedAt)], ["Created", formatCommunicationDate(announcement.data.createdAt)], ["Updated", formatCommunicationDate(announcement.data.updatedAt)]]} /></DataCard>
            <DataCard title="Metadata"><DetailRows rows={[["Author user", announcement.data.authorUserId?.slice(0, 8) ?? "-"], ["Created by", announcement.data.createdById?.slice(0, 8) ?? "-"], ["Updated by", announcement.data.updatedById?.slice(0, 8) ?? "-"]]} /></DataCard>
          </div>
          <DataCard title="Announcement Body"><pre className="whitespace-pre-wrap rounded-md bg-muted p-4 font-sans text-sm leading-6 text-foreground">{announcement.data.body}</pre></DataCard>
          <DataCard title="Read Receipts">
            {receipts.isLoading ? <LoadingState rows={4} /> : null}
            {!receipts.isLoading ? <DataTable columns={columns} rows={receipts.data?.data ?? []} getRowKey={(receipt) => receipt.id} emptyTitle="No read receipts found" /> : null}
          </DataCard>
        </div>
      ) : null}
    </PermissionGuard>
  );
}

function DetailRows({ rows }: { rows: Array<[string, ReactNode]> }) {
  return (
    <dl className="grid gap-3">
      {rows.map(([label, value]) => (
        <div key={label} className="grid gap-1 sm:grid-cols-3 sm:gap-3">
          <dt className="text-sm text-muted-foreground">{label}</dt>
          <dd className="text-sm font-medium text-foreground sm:col-span-2">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
