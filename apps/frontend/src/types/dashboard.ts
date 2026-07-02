export type CountMap = Record<string, number>;

export type CompanyDashboardSummary = {
  employees?: { total?: number; active?: number };
  projects?: { active?: number };
  tasks?: { overdue?: number };
  clients?: { total?: number; active?: number };
  finance?: { expensesAmount?: number; outstandingReceivables?: number };
  helpdesk?: { openTickets?: number };
  approvals?: { pending?: number };
};

export type HrDashboardSummary = {
  employees?: { total?: number; active?: number };
  departmentsCount?: number;
  todayAttendance?: CountMap;
  leaveRequests?: CountMap;
  upcomingHolidays?: Array<Record<string, unknown>>;
};

export type ProjectsTasksDashboardSummary = {
  activeProjects?: number;
  overdueTasks?: number;
  taskStatusCounts?: CountMap;
  myTasks?: { total?: number; overdue?: number; byStatus?: CountMap };
  projectProgress?: Array<{
    id: string;
    name: string;
    status: string;
    totalTasks: number;
    completedTasks: number;
    progressPercent: number;
  }>;
};

export type CrmSalesDashboardSummary = {
  totalClients?: number;
  activeClients?: number;
  leadsByStage?: Array<{ stageId?: string; stageName?: string; count: number }>;
  quotationSummary?: {
    totalAmount?: number;
    byStatus?: Array<{ status: string; count: number; amount: number }>;
  };
  recentClientActivities?: Array<Record<string, unknown>>;
};

export type FinanceDashboardSummary = {
  expenses?: {
    totalAmount?: number;
    byStatus?: Array<Record<string, unknown>>;
  };
  vendorBills?: {
    totalAmount?: number;
    outstandingAmount?: number;
    byStatus?: Array<Record<string, unknown>>;
  };
  payroll?: {
    grossAmount?: number;
    deductionsAmount?: number;
    netAmount?: number;
  };
  pettyCash?: { currentBalance?: number };
  outstandingReceivables?: { count?: number; amount?: number };
};

export type InventoryAssetsDashboardSummary = {
  lowStockItems?: Array<Record<string, unknown>>;
  assetAssignments?: CountMap;
  maintenanceDue?: { count?: number; records?: Array<Record<string, unknown>> };
};

export type HelpdeskDashboardSummary = {
  openTickets?: number;
  urgentTickets?: number;
  slaBreachedTickets?: { count?: number };
  ticketsByCategory?: Array<{ categoryId?: string | null; count: number }>;
  ticketsByStatus?: CountMap;
};

export type ApprovalsDashboardSummary = {
  myPendingApprovals?: number;
  companyPendingApprovals?: number;
  recentApprovalActions?: Array<Record<string, unknown>>;
};

export type CalendarDashboardSummary = {
  todayEvents?: Array<Record<string, unknown>>;
  upcomingMeetings?: Array<Record<string, unknown>>;
  resourceBookings?: Array<{ status: string; count: number }>;
};
