import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { clientsApi } from "@/features/clients/api";
import type {
  ChangeClientStatusPayload,
  ClientActivityPayload,
  ClientContactPayload,
  ClientDocumentPayload,
  ClientListQuery,
  ClientNotePayload,
  ClientPayload,
} from "@/features/clients/types";

export const clientKeys = {
  all: ["clients"] as const,
  list: (query: ClientListQuery) => [...clientKeys.all, "list", query] as const,
  detail: (id: string) => [...clientKeys.all, "detail", id] as const,
  contacts: (id: string) => [...clientKeys.detail(id), "contacts"] as const,
  activities: (id: string) => [...clientKeys.detail(id), "activities"] as const,
  notes: (id: string) => [...clientKeys.detail(id), "notes"] as const,
  documents: (id: string) => [...clientKeys.detail(id), "documents"] as const,
};

export function useClients(query: ClientListQuery) {
  return useQuery({
    queryKey: clientKeys.list(query),
    queryFn: () => clientsApi.list(query),
  });
}

export function useClient(id: string) {
  return useQuery({
    queryKey: clientKeys.detail(id),
    queryFn: () => clientsApi.get(id),
    enabled: Boolean(id),
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ClientPayload) => clientsApi.create(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: clientKeys.all });
    },
  });
}

export function useUpdateClient(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<ClientPayload>) => clientsApi.update(id, payload),
    onSuccess: async (client) => {
      await queryClient.invalidateQueries({ queryKey: clientKeys.all });
      queryClient.setQueryData(clientKeys.detail(client.id), client);
    },
  });
}

export function useChangeClientStatus(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ChangeClientStatusPayload) =>
      clientsApi.changeStatus(id, payload),
    onSuccess: async (client) => {
      await queryClient.invalidateQueries({ queryKey: clientKeys.all });
      queryClient.setQueryData(clientKeys.detail(client.id), client);
    },
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => clientsApi.remove(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: clientKeys.all });
    },
  });
}

export function useClientContacts(id: string) {
  return useQuery({
    queryKey: clientKeys.contacts(id),
    queryFn: () => clientsApi.listContacts(id),
    enabled: Boolean(id),
  });
}

export function useAddClientContact(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ClientContactPayload) => clientsApi.addContact(id, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: clientKeys.contacts(id) }),
        queryClient.invalidateQueries({ queryKey: clientKeys.detail(id) }),
      ]);
    },
  });
}

export function useClientActivities(id: string) {
  return useQuery({
    queryKey: clientKeys.activities(id),
    queryFn: () => clientsApi.listActivities(id),
    enabled: Boolean(id),
  });
}

export function useAddClientActivity(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ClientActivityPayload) =>
      clientsApi.addActivity(id, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: clientKeys.activities(id) }),
        queryClient.invalidateQueries({ queryKey: clientKeys.detail(id) }),
      ]);
    },
  });
}

export function useClientNotes(id: string) {
  return useQuery({
    queryKey: clientKeys.notes(id),
    queryFn: () => clientsApi.listNotes(id),
    enabled: Boolean(id),
  });
}

export function useAddClientNote(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ClientNotePayload) => clientsApi.addNote(id, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: clientKeys.notes(id) }),
        queryClient.invalidateQueries({ queryKey: clientKeys.detail(id) }),
      ]);
    },
  });
}

export function useClientDocuments(id: string) {
  return useQuery({
    queryKey: clientKeys.documents(id),
    queryFn: () => clientsApi.listDocuments(id),
    enabled: Boolean(id),
  });
}

export function useAddClientDocument(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ClientDocumentPayload) =>
      clientsApi.addDocument(id, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: clientKeys.documents(id) }),
        queryClient.invalidateQueries({ queryKey: clientKeys.detail(id) }),
      ]);
    },
  });
}
