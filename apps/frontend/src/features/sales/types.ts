import type { ApiMeta } from "@/types/api";
import type { Client } from "@/features/clients/types";

export type RecordStatus = "ACTIVE" | "INACTIVE" | "ARCHIVED";
export type LeadStatus =
  | "NEW"
  | "CONTACTED"
  | "QUALIFIED"
  | "PROPOSAL"
  | "NEGOTIATION"
  | "WON"
  | "LOST"
  | "ARCHIVED";
export type OpportunityStatus = "OPEN" | "WON" | "LOST" | "CANCELLED";
export type QuotationStatus =
  | "DRAFT"
  | "SENT"
  | "ACCEPTED"
  | "REJECTED"
  | "EXPIRED"
  | "CANCELLED";

export type SalesUser = { id: string; email: string };
export type SalesEmployee = {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  employeeCode?: string;
};

export type LeadSource = {
  id: string;
  name: string;
  description?: string | null;
  status: RecordStatus;
};

export type LeadStage = LeadSource & {
  sortOrder?: number;
};

export type OpportunityStage = LeadStage;

export type SalesLead = {
  id: string;
  companyId: string;
  sourceId?: string | null;
  stageId?: string | null;
  name: string;
  companyName?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  industry?: string | null;
  estimatedValue?: number | string | null;
  status: LeadStatus;
  assignedUserId?: string | null;
  assignedEmployeeId?: string | null;
  convertedClientId?: string | null;
  convertedAt?: string | null;
  lostReason?: string | null;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  source?: LeadSource | null;
  stage?: LeadStage | null;
  assignedUser?: SalesUser | null;
  assignedEmployee?: SalesEmployee | null;
  convertedClient?: Pick<Client, "id" | "name"> | null;
  activities?: LeadActivity[];
  leadNotes?: LeadNote[];
  opportunities?: SalesOpportunity[];
  quotations?: Quotation[];
  _count?: { activities?: number; leadNotes?: number };
};

export type LeadActivity = {
  id: string;
  leadId: string;
  activityType: string;
  title: string;
  description?: string | null;
  activityAt?: string | null;
  createdAt?: string;
};

export type LeadNote = {
  id: string;
  leadId: string;
  note: string;
  createdAt?: string;
};

export type SalesLeadPayload = {
  sourceId?: string;
  stageId?: string;
  name: string;
  companyName?: string;
  email?: string;
  phone?: string;
  website?: string;
  industry?: string;
  estimatedValue?: number;
  assignedEmployeeId?: string;
  assignedUserId?: string;
  notes?: string;
};

export type LeadListQuery = {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  status?: LeadStatus;
  sourceId?: string;
  stageId?: string;
  assignedEmployeeId?: string;
  assignedUserId?: string;
};

export type LeadListResult = {
  data: SalesLead[];
  meta: Required<ApiMeta>;
};

export type SalesOpportunity = {
  id: string;
  companyId: string;
  leadId?: string | null;
  clientId?: string | null;
  stageId?: string | null;
  name: string;
  description?: string | null;
  expectedValue?: number | string | null;
  probability?: number | null;
  expectedCloseDate?: string | null;
  status: OpportunityStatus;
  assignedUserId?: string | null;
  assignedEmployeeId?: string | null;
  wonAt?: string | null;
  lostAt?: string | null;
  cancelledAt?: string | null;
  lostReason?: string | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  lead?: SalesLead | null;
  client?: Pick<Client, "id" | "name"> | null;
  stage?: OpportunityStage | null;
  quotations?: Quotation[];
};

export type OpportunityPayload = {
  leadId?: string;
  clientId?: string;
  stageId?: string;
  name: string;
  description?: string;
  expectedValue?: number;
  probability?: number;
  expectedCloseDate?: string;
  assignedEmployeeId?: string;
  assignedUserId?: string;
};

export type OpportunityListQuery = {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  status?: OpportunityStatus;
  leadId?: string;
  clientId?: string;
  stageId?: string;
};

export type OpportunityListResult = {
  data: SalesOpportunity[];
  meta: Required<ApiMeta>;
};

export type QuotationItem = {
  id?: string;
  description: string;
  quantity: number | string;
  unitPrice: number | string;
  discountAmount?: number | string | null;
  taxAmount?: number | string | null;
  lineTotal?: number | string | null;
  sortOrder?: number;
};

export type QuotationVersion = {
  id: string;
  quotationId: string;
  versionNumber: number;
  metadata?: Record<string, unknown> | null;
  notes?: string | null;
  createdAt?: string;
};

export type Quotation = {
  id: string;
  companyId: string;
  opportunityId?: string | null;
  leadId?: string | null;
  clientId?: string | null;
  quotationNumber: string;
  title: string;
  status: QuotationStatus;
  versionNumber: number;
  currency: string;
  validUntil?: string | null;
  subTotal: number | string;
  discountTotal: number | string;
  taxTotal: number | string;
  grandTotal: number | string;
  terms?: string | null;
  notes?: string | null;
  sentAt?: string | null;
  acceptedAt?: string | null;
  rejectedAt?: string | null;
  expiredAt?: string | null;
  cancelledAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  opportunity?: SalesOpportunity | null;
  lead?: SalesLead | null;
  client?: Pick<Client, "id" | "name"> | null;
  items?: QuotationItem[];
  versions?: QuotationVersion[];
};

export type QuotationPayload = {
  opportunityId?: string;
  leadId?: string;
  clientId?: string;
  quotationNumber: string;
  title: string;
  currency?: string;
  validUntil?: string;
  terms?: string;
  notes?: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    discountAmount?: number;
    taxAmount?: number;
    sortOrder?: number;
  }>;
};

export type QuotationUpdatePayload = Pick<
  QuotationPayload,
  "title" | "currency" | "validUntil" | "terms" | "notes"
>;

export type QuotationListQuery = {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  status?: QuotationStatus;
  opportunityId?: string;
  leadId?: string;
  clientId?: string;
};

export type QuotationListResult = {
  data: Quotation[];
  meta: Required<ApiMeta>;
};
