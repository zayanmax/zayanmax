"use client";

import Link from "next/link";
import { Edit, Eye, Plus } from "lucide-react";
import { useState } from "react";
import { DataTable, type DataTableColumn } from "@/components/data/data-table";
import { PaginationControls } from "@/components/data/pagination-controls";
import { SearchFilterBar } from "@/components/data/search-filter-bar";
import { SelectField } from "@/components/forms/select-field";
import { buttonVariants } from "@/components/ui/button";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { PermissionGuard } from "@/components/shared/permission-guard";
import { StatusBadge } from "@/components/shared/status-badge";
import { announcementStatusOptions } from "@/features/communication/schemas";
import { useAnnouncementReadReceipts, useAnnouncements } from "@/features/communication/hooks";
import type { Announcement, AnnouncementStatus } from "@/features/communication/types";
import { ALL, audienceLabel, formatCommunicationDate } from "@/features/communication/utils";
import { ApiClientError } from "@/lib/api/client";

export function AnnouncementsListPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(ALL);
  const announcements = useAnnouncements({
    page,
    limit: 20,
    search: search || undefined,
    status: status === ALL ? undefined : (status as AnnouncementStatus),
    sortBy: "createdAt",
    sortOrder: "desc",
  });
  const columns: DataTableColumn<Announcement>[] = [
    {
      key: "title",
      header: "Title",
      render: (announcement) => (
        <Link href={`/communication/announcements/${announcement.id}`} className="font-medium text-primary hover:underline">
          {announcement.title}
          <span className="block text-xs font-normal text-muted-foreground">{audienceLabel(announcement.audiences)}</span>
        </Link>
      ),
    },
    { key: "status", header: "Status", render: (announcement) => <StatusBadge status={announcement.status} /> },
    { key: "audience", header: "Audience", render: (announcement) => audienceLabel(announcement.audiences) },
    { key: "published", header: "Published", render: (announcement) => formatCommunicationDate(announcement.publishedAt) },
    { key: "createdBy", header: "Created by", render: (announcement) => announcement.createdById?.slice(0, 8) ?? "-" },
    { key: "reads", header: "Reads", render: (announcement) => <ReadCount announcementId={announcement.id} /> },
    {
      key: "actions",
      header: "Actions",
      render: (announcement) => (
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/communication/announcements/${announcement.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}><Eye className="size-4" />View</Link>
          <PermissionGuard permission="communications.manage">
            <Link href={`/communication/announcements/${announcement.id}/edit`} className={buttonVariants({ variant: "outline", size: "sm" })}><Edit className="size-4" />Edit</Link>
          </PermissionGuard>
        </div>
      ),
    },
  ];
  const errorMessage = announcements.error instanceof ApiClientError ? announcements.error.message : announcements.error instanceof Error ? announcements.error.message : undefined;
  return (
    <PermissionGuard permission="communications.view" fallback={<ErrorState title="Permission required" message="You do not have access to announcements." />}>
      <div className="flex flex-col gap-6">
        <PageHeader title="Announcements" description="Company announcements and audience-targeted communication metadata." actions={<PermissionGuard permission="communications.manage"><Link href="/communication/announcements/new" className={buttonVariants({ variant: "default" })}><Plus className="size-4" />New announcement</Link></PermissionGuard>} />
        <SearchFilterBar
          value={search}
          onChange={(value) => { setSearch(value); setPage(1); }}
          placeholder="Search announcements"
          filters={<SelectField value={status} onValueChange={(value) => { setStatus(value); setPage(1); }} className="w-full sm:w-48" options={[{ value: ALL, label: "All statuses" }, ...announcementStatusOptions.map((value) => ({ value, label: value }))]} />}
          onReset={() => { setSearch(""); setStatus(ALL); setPage(1); }}
        />
        {announcements.isLoading ? <LoadingState rows={6} /> : null}
        {announcements.error ? <ErrorState title="Unable to load announcements" message={errorMessage} /> : null}
        {!announcements.isLoading && !announcements.error ? (
          <>
            <DataTable columns={columns} rows={announcements.data?.data ?? []} getRowKey={(announcement) => announcement.id} emptyTitle="No announcements found" />
            <PaginationControls page={announcements.data?.meta.page ?? page} totalPages={announcements.data?.meta.totalPages ?? 1} onPageChange={setPage} />
          </>
        ) : null}
      </div>
    </PermissionGuard>
  );
}

function ReadCount({ announcementId }: { announcementId: string }) {
  const receipts = useAnnouncementReadReceipts(announcementId, { page: 1, limit: 1 });
  if (receipts.isLoading) return "-";
  return receipts.data?.meta.total ?? 0;
}
