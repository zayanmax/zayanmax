import { apiRequest } from "@/lib/api/client";
import type {
  ChangeClientStatusPayload,
  Client,
  ClientActivity,
  ClientActivityPayload,
  ClientContact,
  ClientContactPayload,
  ClientDocument,
  ClientDocumentPayload,
  ClientListQuery,
  ClientListResult,
  ClientNote,
  ClientNotePayload,
  ClientPayload,
} from "@/features/clients/types";

export const clientsApi = {
  list: (params: ClientListQuery) =>
    apiRequest<ClientListResult>({
      url: "/clients",
      method: "GET",
      params,
    }),
  get: (id: string) =>
    apiRequest<Client>({
      url: `/clients/${id}`,
      method: "GET",
    }),
  create: (payload: ClientPayload) =>
    apiRequest<Client>({
      url: "/clients",
      method: "POST",
      data: payload,
    }),
  update: (id: string, payload: Partial<ClientPayload>) =>
    apiRequest<Client>({
      url: `/clients/${id}`,
      method: "PATCH",
      data: payload,
    }),
  changeStatus: (id: string, payload: ChangeClientStatusPayload) =>
    apiRequest<Client>({
      url: `/clients/${id}/status`,
      method: "PATCH",
      data: payload,
    }),
  remove: (id: string) =>
    apiRequest<{ deleted: boolean }>({
      url: `/clients/${id}`,
      method: "DELETE",
    }),
  listContacts: (id: string) =>
    apiRequest<ClientContact[]>({
      url: `/clients/${id}/contacts`,
      method: "GET",
    }),
  addContact: (id: string, payload: ClientContactPayload) =>
    apiRequest<ClientContact>({
      url: `/clients/${id}/contacts`,
      method: "POST",
      data: payload,
    }),
  listActivities: (id: string) =>
    apiRequest<ClientActivity[]>({
      url: `/clients/${id}/activities`,
      method: "GET",
    }),
  addActivity: (id: string, payload: ClientActivityPayload) =>
    apiRequest<ClientActivity>({
      url: `/clients/${id}/activities`,
      method: "POST",
      data: payload,
    }),
  listNotes: (id: string) =>
    apiRequest<ClientNote[]>({
      url: `/clients/${id}/notes`,
      method: "GET",
    }),
  addNote: (id: string, payload: ClientNotePayload) =>
    apiRequest<ClientNote>({
      url: `/clients/${id}/notes`,
      method: "POST",
      data: payload,
    }),
  listDocuments: (id: string) =>
    apiRequest<ClientDocument[]>({
      url: `/clients/${id}/documents`,
      method: "GET",
    }),
  addDocument: (id: string, payload: ClientDocumentPayload) =>
    apiRequest<ClientDocument>({
      url: `/clients/${id}/documents`,
      method: "POST",
      data: payload,
    }),
};
