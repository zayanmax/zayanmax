import { apiRequest } from "@/lib/api/client";
import type { DateRangeQuery } from "@/types/api";
import type { AuthUser, LoginPayload, LoginResponse } from "@/types/auth";
import type {
  ApprovalsDashboardSummary,
  CalendarDashboardSummary,
  CompanyDashboardSummary,
  CrmSalesDashboardSummary,
  FinanceDashboardSummary,
  HelpdeskDashboardSummary,
  HrDashboardSummary,
  InventoryAssetsDashboardSummary,
  ProjectsTasksDashboardSummary,
} from "@/types/dashboard";

export const authApi = {
  login: (payload: LoginPayload) =>
    apiRequest<LoginResponse>({
      url: "/auth/login",
      method: "POST",
      data: payload,
      skipAuth: true,
    }),
  logout: () =>
    apiRequest<{ loggedOut: boolean }>({ url: "/auth/logout", method: "POST" }),
  logoutAll: () =>
    apiRequest<{ loggedOutAllSessions: boolean }>({
      url: "/auth/logout-all",
      method: "POST",
    }),
  me: () => apiRequest<AuthUser>({ url: "/auth/me", method: "GET" }),
  requestPasswordReset: (email: string) =>
    apiRequest<{ resetRequested: boolean; delivery: string }>({
      url: "/auth/password-reset/request",
      method: "POST",
      data: { email },
      skipAuth: true,
    }),
  confirmPasswordReset: (payload: {
    userId: string;
    token: string;
    newPassword: string;
    resetTokenId?: string;
  }) =>
    apiRequest<{ passwordReset: boolean }>({
      url: "/auth/password-reset/confirm",
      method: "POST",
      data: payload,
      skipAuth: true,
    }),
  changePassword: (payload: { currentPassword: string; newPassword: string }) =>
    apiRequest<{ passwordChanged: boolean }>({
      url: "/auth/change-password",
      method: "POST",
      data: payload,
    }),
};

export const dashboardApi = {
  company: (params?: DateRangeQuery) =>
    apiRequest<CompanyDashboardSummary>({
      url: "/dashboard/summary",
      method: "GET",
      params,
    }),
  hr: (params?: DateRangeQuery) =>
    apiRequest<HrDashboardSummary>({ url: "/dashboard/hr", method: "GET", params }),
  projectsTasks: (params?: DateRangeQuery) =>
    apiRequest<ProjectsTasksDashboardSummary>({
      url: "/dashboard/projects-tasks",
      method: "GET",
      params,
    }),
  crmSales: (params?: DateRangeQuery) =>
    apiRequest<CrmSalesDashboardSummary>({
      url: "/dashboard/crm-sales",
      method: "GET",
      params,
    }),
  finance: (params?: DateRangeQuery) =>
    apiRequest<FinanceDashboardSummary>({
      url: "/dashboard/finance",
      method: "GET",
      params,
    }),
  inventoryAssets: (params?: DateRangeQuery) =>
    apiRequest<InventoryAssetsDashboardSummary>({
      url: "/dashboard/inventory-assets",
      method: "GET",
      params,
    }),
  helpdesk: (params?: DateRangeQuery) =>
    apiRequest<HelpdeskDashboardSummary>({
      url: "/dashboard/helpdesk",
      method: "GET",
      params,
    }),
  approvals: (params?: DateRangeQuery) =>
    apiRequest<ApprovalsDashboardSummary>({
      url: "/dashboard/approvals",
      method: "GET",
      params,
    }),
  calendar: (params?: DateRangeQuery) =>
    apiRequest<CalendarDashboardSummary>({
      url: "/dashboard/calendar",
      method: "GET",
      params,
    }),
};
