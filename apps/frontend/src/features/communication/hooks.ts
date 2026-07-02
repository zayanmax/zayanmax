import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { communicationApi } from "@/features/communication/api";
import type { AnnouncementPayload, AnnouncementStatus, CommunicationListQuery } from "@/features/communication/types";

export const communicationKeys = {
  all: ["communication"] as const,
  announcements: (query: CommunicationListQuery) => [...communicationKeys.all, "announcements", query] as const,
  announcement: (id: string) => [...communicationKeys.all, "announcement", id] as const,
  readReceipts: (id: string, query: CommunicationListQuery) => [...communicationKeys.all, "announcement-read-receipts", id, query] as const,
};

function useInvalidateCommunication() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: communicationKeys.all });
}

export function useAnnouncements(query: CommunicationListQuery) {
  return useQuery({
    queryKey: communicationKeys.announcements(query),
    queryFn: () => communicationApi.listAnnouncements(query),
  });
}

export function useAnnouncement(id: string) {
  return useQuery({
    queryKey: communicationKeys.announcement(id),
    queryFn: () => communicationApi.getAnnouncement(id),
    enabled: Boolean(id),
  });
}

export function useCreateAnnouncement() {
  const invalidate = useInvalidateCommunication();
  return useMutation({
    mutationFn: (payload: AnnouncementPayload) => communicationApi.createAnnouncement(payload),
    onSuccess: async () => invalidate(),
  });
}

export function useUpdateAnnouncement(id: string) {
  const invalidate = useInvalidateCommunication();
  return useMutation({
    mutationFn: (payload: Partial<AnnouncementPayload>) => communicationApi.updateAnnouncement(id, payload),
    onSuccess: async () => invalidate(),
  });
}

export function useChangeAnnouncementStatus(id: string) {
  const invalidate = useInvalidateCommunication();
  return useMutation({
    mutationFn: (payload: { status: AnnouncementStatus }) => communicationApi.changeAnnouncementStatus(id, payload),
    onSuccess: async () => invalidate(),
  });
}

export function useMarkAnnouncementRead(id: string) {
  const invalidate = useInvalidateCommunication();
  return useMutation({
    mutationFn: () => communicationApi.markAnnouncementRead(id),
    onSuccess: async () => invalidate(),
  });
}

export function useAnnouncementReadReceipts(id: string, query: CommunicationListQuery) {
  return useQuery({
    queryKey: communicationKeys.readReceipts(id, query),
    queryFn: () => communicationApi.listReadReceipts(id, query),
    enabled: Boolean(id),
  });
}
