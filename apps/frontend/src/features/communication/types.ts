import type { ApiMeta } from "@/types/api";

export type AnnouncementStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type AnnouncementAudienceType =
  | "ALL_COMPANY"
  | "BRANCH"
  | "DEPARTMENT"
  | "EMPLOYEE"
  | "ROLE";

export type AnnouncementAudience = {
  id?: string;
  audienceType: AnnouncementAudienceType;
  branchId?: string | null;
  departmentId?: string | null;
  employeeId?: string | null;
  roleId?: string | null;
};

export type Announcement = {
  id: string;
  title: string;
  body: string;
  status: AnnouncementStatus;
  authorUserId?: string | null;
  publishedAt?: string | null;
  archivedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  createdById?: string | null;
  updatedById?: string | null;
  audiences?: AnnouncementAudience[];
};

export type AnnouncementReadReceipt = {
  id: string;
  announcementId: string;
  userId: string;
  readAt?: string;
};

export type CommunicationListQuery = {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  status?: AnnouncementStatus;
};

export type CommunicationListResult<T> = {
  data: T[];
  meta: Required<ApiMeta>;
};

export type AnnouncementPayload = {
  title: string;
  body: string;
  audiences?: Array<{
    audienceType: AnnouncementAudienceType;
    branchId?: string;
    departmentId?: string;
    employeeId?: string;
    roleId?: string;
  }>;
};
