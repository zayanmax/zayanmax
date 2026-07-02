import { apiRequest } from "@/lib/api/client";
import type {
  LeadActivity,
  LeadListQuery,
  LeadListResult,
  LeadNote,
  LeadSource,
  LeadStage,
  OpportunityListQuery,
  OpportunityListResult,
  OpportunityPayload,
  Quotation,
  QuotationListQuery,
  QuotationListResult,
  QuotationPayload,
  QuotationStatus,
  QuotationUpdatePayload,
  SalesLead,
  SalesLeadPayload,
  SalesOpportunity,
  LeadStatus,
  OpportunityStatus,
} from "@/features/sales/types";
import type { PaginatedResult } from "@/types/api";

export const salesApi = {
  listLeadSources: () =>
    apiRequest<PaginatedResult<LeadSource>>({
      url: "/sales/lead-sources",
      method: "GET",
      params: { page: 1, limit: 100, sortBy: "name", sortOrder: "asc" },
    }),
  listLeadStages: () =>
    apiRequest<PaginatedResult<LeadStage>>({
      url: "/sales/lead-stages",
      method: "GET",
      params: { page: 1, limit: 100, sortBy: "sortOrder", sortOrder: "asc" },
    }),
  listLeads: (params: LeadListQuery) =>
    apiRequest<LeadListResult>({ url: "/sales/leads", method: "GET", params }),
  getLead: (id: string) =>
    apiRequest<SalesLead>({ url: `/sales/leads/${id}`, method: "GET" }),
  createLead: (payload: SalesLeadPayload) =>
    apiRequest<SalesLead>({ url: "/sales/leads", method: "POST", data: payload }),
  updateLead: (id: string, payload: Partial<SalesLeadPayload>) =>
    apiRequest<SalesLead>({ url: `/sales/leads/${id}`, method: "PATCH", data: payload }),
  deleteLead: (id: string) =>
    apiRequest<{ deleted: boolean }>({ url: `/sales/leads/${id}`, method: "DELETE" }),
  addLeadActivity: (
    id: string,
    payload: { activityType: string; title: string; description?: string; activityAt?: string },
  ) =>
    apiRequest<LeadActivity>({
      url: `/sales/leads/${id}/activities`,
      method: "POST",
      data: payload,
    }),
  addLeadNote: (id: string, payload: { note: string }) =>
    apiRequest<LeadNote>({
      url: `/sales/leads/${id}/notes`,
      method: "POST",
      data: payload,
    }),
  changeLeadStatus: (id: string, payload: { status: LeadStatus; lostReason?: string }) =>
    apiRequest<SalesLead>({
      url: `/sales/leads/${id}/status`,
      method: "PATCH",
      data: payload,
    }),
  convertLeadToClient: (id: string, payload: Record<string, unknown>) =>
    apiRequest<SalesLead>({
      url: `/sales/leads/${id}/convert-to-client`,
      method: "POST",
      data: payload,
    }),
  listOpportunities: (params: OpportunityListQuery) =>
    apiRequest<OpportunityListResult>({
      url: "/sales/opportunities",
      method: "GET",
      params,
    }),
  getOpportunity: (id: string) =>
    apiRequest<SalesOpportunity>({
      url: `/sales/opportunities/${id}`,
      method: "GET",
    }),
  createOpportunity: (payload: OpportunityPayload) =>
    apiRequest<SalesOpportunity>({
      url: "/sales/opportunities",
      method: "POST",
      data: payload,
    }),
  updateOpportunity: (id: string, payload: Partial<OpportunityPayload>) =>
    apiRequest<SalesOpportunity>({
      url: `/sales/opportunities/${id}`,
      method: "PATCH",
      data: payload,
    }),
  changeOpportunityStatus: (
    id: string,
    payload: { status: OpportunityStatus; lostReason?: string },
  ) =>
    apiRequest<SalesOpportunity>({
      url: `/sales/opportunities/${id}/status`,
      method: "PATCH",
      data: payload,
    }),
  deleteOpportunity: (id: string) =>
    apiRequest<{ deleted: boolean }>({
      url: `/sales/opportunities/${id}`,
      method: "DELETE",
    }),
  listQuotations: (params: QuotationListQuery) =>
    apiRequest<QuotationListResult>({
      url: "/sales/quotations",
      method: "GET",
      params,
    }),
  getQuotation: (id: string) =>
    apiRequest<Quotation>({
      url: `/sales/quotations/${id}`,
      method: "GET",
    }),
  createQuotation: (payload: QuotationPayload) =>
    apiRequest<Quotation>({
      url: "/sales/quotations",
      method: "POST",
      data: payload,
    }),
  updateQuotation: (id: string, payload: QuotationUpdatePayload) =>
    apiRequest<Quotation>({
      url: `/sales/quotations/${id}`,
      method: "PATCH",
      data: payload,
    }),
  changeQuotationStatus: (id: string, payload: { status: QuotationStatus }) =>
    apiRequest<Quotation>({
      url: `/sales/quotations/${id}/status`,
      method: "PATCH",
      data: payload,
    }),
  deleteQuotation: (id: string) =>
    apiRequest<{ deleted: boolean }>({
      url: `/sales/quotations/${id}`,
      method: "DELETE",
    }),
};
