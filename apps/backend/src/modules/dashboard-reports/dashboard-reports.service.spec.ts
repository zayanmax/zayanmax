import { DashboardReportsService } from './dashboard-reports.service';

describe('DashboardReportsService', () => {
  const prisma = {
    company: { findFirst: jest.fn() },
    employee: { count: jest.fn() },
    department: { count: jest.fn() },
    attendanceRecord: { groupBy: jest.fn() },
    leaveRequest: { groupBy: jest.fn() },
    holiday: { findMany: jest.fn() },
    project: { count: jest.fn(), findMany: jest.fn() },
    task: { count: jest.fn(), groupBy: jest.fn() },
    taskAssignee: { findMany: jest.fn() },
    client: { count: jest.fn() },
    salesLead: { groupBy: jest.fn() },
    quotation: { groupBy: jest.fn(), aggregate: jest.fn() },
    clientActivity: { findMany: jest.fn() },
    expenseClaim: { groupBy: jest.fn(), aggregate: jest.fn() },
    vendorBill: { groupBy: jest.fn(), aggregate: jest.fn() },
    payrollRun: { groupBy: jest.fn(), aggregate: jest.fn() },
    pettyCashAccount: { aggregate: jest.fn() },
    invoice: { aggregate: jest.fn(), count: jest.fn() },
    inventoryItem: { findMany: jest.fn() },
    asset: { groupBy: jest.fn() },
    assetMaintenanceRecord: { count: jest.fn(), findMany: jest.fn() },
    helpdeskTicket: { count: jest.fn(), groupBy: jest.fn() },
    approvalStepInstance: { count: jest.fn(), findMany: jest.fn() },
    approvalRequest: { count: jest.fn() },
    approvalActionRecord: { findMany: jest.fn() },
    calendarEvent: { findMany: jest.fn(), count: jest.fn() },
    calendarResourceBooking: { groupBy: jest.fn() },
    reportExportRequest: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(() => jest.clearAllMocks());

  it('builds company dashboard summary from company-scoped module totals', async () => {
    prisma.company.findFirst.mockResolvedValue({ id: 'company-id' });
    prisma.employee.count.mockResolvedValueOnce(10).mockResolvedValueOnce(8);
    prisma.project.count.mockResolvedValue(3);
    prisma.task.count.mockResolvedValue(4);
    prisma.client.count.mockResolvedValueOnce(6).mockResolvedValueOnce(5);
    prisma.expenseClaim.aggregate.mockResolvedValue({
      _sum: { totalAmount: 2500 },
    });
    prisma.invoice.aggregate.mockResolvedValue({
      _sum: { balanceAmount: 1200 },
    });
    prisma.helpdeskTicket.count.mockResolvedValue(2);
    prisma.approvalRequest.count.mockResolvedValue(1);

    const service = new DashboardReportsService(prisma as never);
    const summary = await service.companyDashboardSummary('company-id', {
      fromDate: '2035-01-01',
      toDate: '2035-01-31',
    });

    expect(summary).toEqual(
      expect.objectContaining({
        employees: { total: 10, active: 8 },
        projects: { active: 3 },
        tasks: { overdue: 4 },
        clients: { total: 6, active: 5 },
        finance: { expensesAmount: 2500, outstandingReceivables: 1200 },
        helpdesk: { openTickets: 2 },
        approvals: { pending: 1 },
      }),
    );
  });

  it('creates export request metadata and lists it with pagination', async () => {
    prisma.reportExportRequest.create.mockResolvedValue({
      id: 'export-id',
      companyId: 'company-id',
      reportType: 'hr_summary',
      format: 'CSV',
      status: 'PENDING',
    });
    prisma.reportExportRequest.findMany.mockResolvedValue([
      { id: 'export-id', reportType: 'hr_summary' },
    ]);
    prisma.reportExportRequest.count.mockResolvedValue(1);

    const service = new DashboardReportsService(prisma as never);
    const created = await service.createExportRequest('company-id', 'user-id', {
      reportType: 'hr_summary',
      requestedFilters: { fromDate: '2035-01-01' },
      format: 'CSV',
    });
    const list = await service.findExportRequests('company-id', {
      page: 1,
      limit: 20,
      sortBy: 'requestedAt',
      sortOrder: 'desc',
    });

    expect(created).toEqual(expect.objectContaining({ id: 'export-id' }));
    expect(prisma.reportExportRequest.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          companyId: 'company-id',
          requestedByUserId: 'user-id',
          reportType: 'hr_summary',
          format: 'CSV',
          status: 'PENDING',
        }),
      }),
    );
    expect(list.meta.total).toBe(1);
  });
});
