import { apiRequest } from "@/lib/api/client";
import type {
  Announcement,
  AnnouncementPayload,
  AnnouncementReadReceipt,
  AnnouncementStatus,
  CommunicationListQuery,
  CommunicationListResult,
} from "@/features/communication/types";

export const communicationApi = {
  listAnnouncements: (params: CommunicationListQuery) =>
    apiRequest<CommunicationListResult<Announcement>>({
      url: "/announcements",
      method: "GET",
      params,
    }),
  getAnnouncement: (id: string) =>
    apiRequest<Announcement>({
      url: `/announcements/${id}`,
      method: "GET",
    }),
  createAnnouncement: (payload: AnnouncementPayload) =>
    apiRequest<Announcement>({
      url: "/announcements",
      method: "POST",
      data: payload,
    }),
  updateAnnouncement: (id: string, payload: Partial<AnnouncementPayload>) =>
    apiRequest<Announcement>({
      url: `/announcements/${id}`,
      method: "PATCH",
      data: payload,
    }),
  changeAnnouncementStatus: (id: string, payload: { status: AnnouncementStatus }) =>
    apiRequest<Announcement>({
      url: `/announcements/${id}/status`,
      method: "PATCH",
      data: payload,
    }),
  markAnnouncementRead: (id: string) =>
    apiRequest<AnnouncementReadReceipt>({
      url: `/announcements/${id}/read`,
      method: "POST",
    }),
  listReadReceipts: (id: string, params: CommunicationListQuery) =>
    apiRequest<CommunicationListResult<AnnouncementReadReceipt>>({
      url: `/announcements/${id}/read-receipts`,
      method: "GET",
      params,
    }),
};
