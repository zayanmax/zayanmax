import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { salesApi } from "@/features/sales/api";
import type {
  LeadListQuery,
  LeadStatus,
  OpportunityListQuery,
  OpportunityPayload,
  OpportunityStatus,
  QuotationListQuery,
  QuotationPayload,
  QuotationStatus,
  QuotationUpdatePayload,
  SalesLeadPayload,
} from "@/features/sales/types";

export const salesKeys = {
  all: ["sales"] as const,
  leadSources: () => [...salesKeys.all, "lead-sources"] as const,
  leadStages: () => [...salesKeys.all, "lead-stages"] as const,
  leads: (query: LeadListQuery) => [...salesKeys.all, "leads", query] as const,
  lead: (id: string) => [...salesKeys.all, "lead", id] as const,
  opportunities: (query: OpportunityListQuery) =>
    [...salesKeys.all, "opportunities", query] as const,
  opportunity: (id: string) => [...salesKeys.all, "opportunity", id] as const,
  quotations: (query: QuotationListQuery) =>
    [...salesKeys.all, "quotations", query] as const,
  quotation: (id: string) => [...salesKeys.all, "quotation", id] as const,
};

export function useLeadSources() {
  return useQuery({
    queryKey: salesKeys.leadSources(),
    queryFn: salesApi.listLeadSources,
  });
}

export function useLeadStages() {
  return useQuery({
    queryKey: salesKeys.leadStages(),
    queryFn: salesApi.listLeadStages,
  });
}

export function useSalesLeads(query: LeadListQuery) {
  return useQuery({
    queryKey: salesKeys.leads(query),
    queryFn: () => salesApi.listLeads(query),
  });
}

export function useSalesLead(id: string) {
  return useQuery({
    queryKey: salesKeys.lead(id),
    queryFn: () => salesApi.getLead(id),
    enabled: Boolean(id),
  });
}

export function useCreateSalesLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SalesLeadPayload) => salesApi.createLead(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: salesKeys.all });
    },
  });
}

export function useUpdateSalesLead(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<SalesLeadPayload>) =>
      salesApi.updateLead(id, payload),
    onSuccess: async (lead) => {
      await queryClient.invalidateQueries({ queryKey: salesKeys.all });
      queryClient.setQueryData(salesKeys.lead(lead.id), lead);
    },
  });
}

export function useDeleteSalesLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => salesApi.deleteLead(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: salesKeys.all });
    },
  });
}

export function useAddLeadActivity(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { activityType: string; title: string; description?: string; activityAt?: string }) =>
      salesApi.addLeadActivity(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: salesKeys.lead(id) });
    },
  });
}

export function useAddLeadNote(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { note: string }) => salesApi.addLeadNote(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: salesKeys.lead(id) });
    },
  });
}

export function useChangeLeadStatus(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { status: LeadStatus; lostReason?: string }) =>
      salesApi.changeLeadStatus(id, payload),
    onSuccess: async (lead) => {
      await queryClient.invalidateQueries({ queryKey: salesKeys.all });
      queryClient.setQueryData(salesKeys.lead(lead.id), lead);
    },
  });
}

export function useConvertLeadToClient(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => salesApi.convertLeadToClient(id, {}),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: salesKeys.all });
    },
  });
}

export function useSalesOpportunities(query: OpportunityListQuery) {
  return useQuery({
    queryKey: salesKeys.opportunities(query),
    queryFn: () => salesApi.listOpportunities(query),
  });
}

export function useSalesOpportunity(id: string) {
  return useQuery({
    queryKey: salesKeys.opportunity(id),
    queryFn: () => salesApi.getOpportunity(id),
    enabled: Boolean(id),
  });
}

export function useCreateSalesOpportunity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: OpportunityPayload) => salesApi.createOpportunity(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: salesKeys.all });
    },
  });
}

export function useUpdateSalesOpportunity(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<OpportunityPayload>) =>
      salesApi.updateOpportunity(id, payload),
    onSuccess: async (opportunity) => {
      await queryClient.invalidateQueries({ queryKey: salesKeys.all });
      queryClient.setQueryData(salesKeys.opportunity(opportunity.id), opportunity);
    },
  });
}

export function useChangeOpportunityStatus(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { status: OpportunityStatus; lostReason?: string }) =>
      salesApi.changeOpportunityStatus(id, payload),
    onSuccess: async (opportunity) => {
      await queryClient.invalidateQueries({ queryKey: salesKeys.all });
      queryClient.setQueryData(salesKeys.opportunity(opportunity.id), opportunity);
    },
  });
}

export function useDeleteSalesOpportunity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => salesApi.deleteOpportunity(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: salesKeys.all });
    },
  });
}

export function useSalesQuotations(query: QuotationListQuery) {
  return useQuery({
    queryKey: salesKeys.quotations(query),
    queryFn: () => salesApi.listQuotations(query),
  });
}

export function useSalesQuotation(id: string) {
  return useQuery({
    queryKey: salesKeys.quotation(id),
    queryFn: () => salesApi.getQuotation(id),
    enabled: Boolean(id),
  });
}

export function useCreateSalesQuotation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: QuotationPayload) => salesApi.createQuotation(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: salesKeys.all });
    },
  });
}

export function useUpdateSalesQuotation(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: QuotationUpdatePayload) =>
      salesApi.updateQuotation(id, payload),
    onSuccess: async (quotation) => {
      await queryClient.invalidateQueries({ queryKey: salesKeys.all });
      queryClient.setQueryData(salesKeys.quotation(quotation.id), quotation);
    },
  });
}

export function useChangeQuotationStatus(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { status: QuotationStatus }) =>
      salesApi.changeQuotationStatus(id, payload),
    onSuccess: async (quotation) => {
      await queryClient.invalidateQueries({ queryKey: salesKeys.all });
      queryClient.setQueryData(salesKeys.quotation(quotation.id), quotation);
    },
  });
}

export function useDeleteSalesQuotation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => salesApi.deleteQuotation(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: salesKeys.all });
    },
  });
}
