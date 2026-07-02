import { Injectable, NotFoundException } from '@nestjs/common';
import {
  ApprovalAction,
  CalendarEventType,
  HelpdeskTicketStatus,
  InvoiceStatus,
  Prisma,
  ProjectStatus,
  RecordStatus,
  ReportExportStatus,
  TaskStatus,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateReportExportRequestDto,
  DashboardDateRangeQueryDto,
  ReportExportRequestQueryDto,
} from './dto/dashboard-reports.dto';

type ReportRegistryEntry = {
  reportType: string;
  name: string;
  module: string;
  description: string;
  permissionKey: string;
  availableFilters: Array<{
    key: string;
    label: string;
    type: 'date' | 'string' | 'enum' | 'uuid';
    required?: boolean;
    options?: string[];
  }>;
};

@Injectable()
export class DashboardReportsService {
  private readonly registry: ReportRegistryEntry[] = [
    {
      reportType: 'company_dashboard_summary',
      name: 'Company Dashboard Summary',
      module: 'dashboard',
      description: 'High-level company operational summary.',
      permissionKey: 'dashboard.view',
      availableFilters: this.dateFilters(),
    },
    {
      reportType: 'hr_summary',
      name: 'HR Dashboard Summary',
      module: 'hr',
      description:
        'Employees, departments, attendance, leave, and holiday summary.',
      permissionKey: 'reports.view',
      availableFilters: this.dateFilters(),
    },
    {
      reportType: 'projects_tasks_summary',
      name: 'Projects And Tasks Summary',
      module: 'projects',
      description: 'Projects, overdue work, task status, and progress summary.',
      permissionKey: 'reports.view',
      availableFilters: [
        ...this.dateFilters(),
        { key: 'projectId', label: 'Project', type: 'uuid' },
      ],
    },
    {
      reportType: 'crm_sales_summary',
      name: 'CRM And Sales Summary',
      module: 'sales',
      description: 'Clients, leads, quotations, and recent activity summary.',
      permissionKey: 'reports.view',
      availableFilters: this.dateFilters(),
    },
    {
      reportType: 'finance_summary',
      name: 'Finance Summary',
      module: 'finance',
      description:
        'Expenses, vendor bills, payroll, petty cash, and receivables summary.',
      permissionKey: 'reports.view',
      availableFilters: this.dateFilters(),
    },
    {
      reportType: 'inventory_assets_summary',
      name: 'Inventory And Assets Summary',
      module: 'inventory',
      description: 'Low stock, asset assignments, and maintenance due summary.',
      permissionKey: 'reports.view',
      availableFilters: this.dateFilters(),
    },
    {
      reportType: 'helpdesk_summary',
      name: 'Helpdesk Summary',
      module: 'helpdesk',
      description: 'Open tickets, urgent tickets, SLA metadata, and queues.',
      permissionKey: 'reports.view',
      availableFilters: this.dateFilters(),
    },
    {
      reportType: 'approvals_summary',
      name: 'Approvals Summary',
      module: 'approvals',
      description: 'Pending approvals and recent approval action metadata.',
      permissionKey: 'reports.view',
      availableFilters: this.dateFilters(),
    },
    {
      reportType: 'calendar_summary',
      name: 'Calendar Summary',
      module: 'calendar',
      description: 'Today events, upcoming meetings, and resource bookings.',
      permissionKey: 'reports.view',
      availableFilters: this.dateFilters(),
    },
  ];

  constructor(private readonly prisma: PrismaService) {}

  async companyDashboardSummary(
    companyId: string,
    query: DashboardDateRangeQueryDto,
  ) {
    const createdAtRange = this.dateRange(query);
    const [
      totalEmployees,
      activeEmployees,
      activeProjects,
      overdueTasks,
      totalClients,
      activeClients,
      expenses,
      receivables,
      openTickets,
      pendingApprovals,
    ] = await Promise.all([
      this.prisma.employee.count({
        where: { companyId, deletedAt: null },
      }),
      this.prisma.employee.count({
        where: { companyId, deletedAt: null, status: RecordStatus.ACTIVE },
      }),
      this.prisma.project.count({
        where: {
          companyId,
          deletedAt: null,
          status: ProjectStatus.ACTIVE,
          ...createdAtRange,
        },
      }),
      this.prisma.task.count({
        where: {
          companyId,
          deletedAt: null,
          dueDate: { lt: new Date() },
          status: { notIn: [TaskStatus.DONE, TaskStatus.CANCELLED] },
          ...createdAtRange,
        },
      }),
      this.prisma.client.count({
        where: { companyId, deletedAt: null },
      }),
      this.prisma.client.count({
        where: { companyId, deletedAt: null, status: 'ACTIVE' },
      }),
      this.prisma.expenseClaim.aggregate({
        where: {
          companyId,
          deletedAt: null,
          ...this.dateRange(query, 'claimDate'),
        },
        _sum: { totalAmount: true },
      }),
      this.prisma.invoice.aggregate({
        where: {
          companyId,
          deletedAt: null,
          status: { notIn: [InvoiceStatus.PAID, InvoiceStatus.CANCELLED] },
          ...this.dateRange(query, 'issueDate'),
        },
        _sum: { balanceAmount: true },
      }),
      this.prisma.helpdeskTicket.count({
        where: {
          companyId,
          deletedAt: null,
          status: {
            in: [
              HelpdeskTicketStatus.OPEN,
              HelpdeskTicketStatus.IN_PROGRESS,
              HelpdeskTicketStatus.WAITING_FOR_ADMIN,
              HelpdeskTicketStatus.WAITING_FOR_EMPLOYEE,
            ],
          },
          ...createdAtRange,
        },
      }),
      this.prisma.approvalRequest.count({
        where: {
          companyId,
          deletedAt: null,
          status: 'PENDING',
          ...createdAtRange,
        },
      }),
    ]);

    return {
      employees: { total: totalEmployees, active: activeEmployees },
      projects: { active: activeProjects },
      tasks: { overdue: overdueTasks },
      clients: { total: totalClients, active: activeClients },
      finance: {
        expensesAmount: this.decimal(expenses._sum.totalAmount),
        outstandingReceivables: this.decimal(receivables._sum.balanceAmount),
      },
      helpdesk: { openTickets },
      approvals: { pending: pendingApprovals },
    };
  }

  async hrDashboardSummary(
    companyId: string,
    query: DashboardDateRangeQueryDto,
  ) {
    const today = this.todayRange();
    const holidayRange = this.dateRangeOrDefault(query, 30);
    const [
      totalEmployees,
      activeEmployees,
      departmentsCount,
      attendanceByStatus,
      leaveRequestsByStatus,
      upcomingHolidays,
    ] = await Promise.all([
      this.prisma.employee.count({ where: { companyId, deletedAt: null } }),
      this.prisma.employee.count({
        where: { companyId, deletedAt: null, status: RecordStatus.ACTIVE },
      }),
      this.prisma.department.count({
        where: { companyId, deletedAt: null, status: RecordStatus.ACTIVE },
      }),
      this.prisma.attendanceRecord.groupBy({
        by: ['status'],
        where: { companyId, deletedAt: null, date: today },
        _count: { _all: true },
      }),
      this.prisma.leaveRequest.groupBy({
        by: ['status'],
        where: {
          companyId,
          deletedAt: null,
          ...this.dateRange(query, 'fromDate'),
        },
        _count: { _all: true },
      }),
      this.prisma.holiday.findMany({
        where: {
          companyId,
          deletedAt: null,
          status: RecordStatus.ACTIVE,
          date: holidayRange,
        },
        orderBy: { date: 'asc' },
        take: 10,
      }),
    ]);

    return {
      employees: { total: totalEmployees, active: activeEmployees },
      departmentsCount,
      todayAttendance: this.countsByField(attendanceByStatus, 'status'),
      leaveRequests: this.countsByField(leaveRequestsByStatus, 'status'),
      upcomingHolidays,
    };
  }

  async projectsTasksDashboardSummary(
    companyId: string,
    userId: string,
    query: DashboardDateRangeQueryDto,
  ) {
    const [
      activeProjects,
      overdueTasks,
      taskStatusCounts,
      myAssignments,
      projects,
    ] = await Promise.all([
      this.prisma.project.count({
        where: {
          companyId,
          deletedAt: null,
          status: ProjectStatus.ACTIVE,
          ...this.dateRange(query),
        },
      }),
      this.prisma.task.count({
        where: {
          companyId,
          deletedAt: null,
          dueDate: { lt: new Date() },
          status: { notIn: [TaskStatus.DONE, TaskStatus.CANCELLED] },
        },
      }),
      this.prisma.task.groupBy({
        by: ['status'],
        where: { companyId, deletedAt: null, ...this.dateRange(query) },
        _count: { _all: true },
      }),
      this.prisma.taskAssignee.findMany({
        where: { companyId, deletedAt: null, userId },
        include: {
          task: { select: { id: true, status: true, dueDate: true } },
        },
      }),
      this.prisma.project.findMany({
        where: {
          companyId,
          deletedAt: null,
          status: {
            in: [
              ProjectStatus.PLANNED,
              ProjectStatus.ACTIVE,
              ProjectStatus.ON_HOLD,
            ],
          },
        },
        include: {
          tasks: { where: { deletedAt: null }, select: { status: true } },
        },
        orderBy: { updatedAt: 'desc' },
        take: 10,
      }),
    ]);

    const myTasksByStatus = this.countsByValues(
      myAssignments.map((assignment) => assignment.task.status),
    );
    const myOverdueTasks = myAssignments.filter(
      (assignment) =>
        assignment.task.dueDate &&
        assignment.task.dueDate < new Date() &&
        assignment.task.status !== TaskStatus.DONE &&
        assignment.task.status !== TaskStatus.CANCELLED,
    ).length;

    return {
      activeProjects,
      overdueTasks,
      taskStatusCounts: this.countsByField(taskStatusCounts, 'status'),
      myTasks: {
        total: myAssignments.length,
        overdue: myOverdueTasks,
        byStatus: myTasksByStatus,
      },
      projectProgress: projects.map((project) => {
        const totalTasks = project.tasks.length;
        const completedTasks = project.tasks.filter(
          (task) => task.status === TaskStatus.DONE,
        ).length;
        return {
          id: project.id,
          name: project.name,
          status: project.status,
          totalTasks,
          completedTasks,
          progressPercent:
            totalTasks === 0
              ? 0
              : Math.round((completedTasks / totalTasks) * 100),
        };
      }),
    };
  }

  async crmSalesDashboardSummary(
    companyId: string,
    query: DashboardDateRangeQueryDto,
  ) {
    const [
      totalClients,
      activeClients,
      leads,
      quotations,
      quotationTotal,
      recentActivities,
    ] = await Promise.all([
      this.prisma.client.count({ where: { companyId, deletedAt: null } }),
      this.prisma.client.count({
        where: { companyId, deletedAt: null, status: 'ACTIVE' },
      }),
      this.prisma.salesLead.findMany({
        where: { companyId, ...this.dateRange(query) },
        select: {
          status: true,
          stage: { select: { id: true, name: true, sortOrder: true } },
        },
      }),
      this.prisma.quotation.groupBy({
        by: ['status'],
        where: { companyId, deletedAt: null, ...this.dateRange(query) },
        _count: { _all: true },
        _sum: { grandTotal: true },
      }),
      this.prisma.quotation.aggregate({
        where: { companyId, deletedAt: null, ...this.dateRange(query) },
        _sum: { grandTotal: true },
      }),
      this.prisma.clientActivity.findMany({
        where: { companyId, ...this.dateRange(query) },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { client: { select: { id: true, name: true } } },
      }),
    ]);

    return {
      totalClients,
      activeClients,
      leadsByStage: this.leadsByStage(leads),
      quotationSummary: {
        totalAmount: this.decimal(quotationTotal._sum.grandTotal),
        byStatus: quotations.map((quotation) => ({
          status: quotation.status,
          count: quotation._count._all,
          amount: this.decimal(quotation._sum.grandTotal),
        })),
      },
      recentClientActivities: recentActivities,
    };
  }

  async financeDashboardSummary(
    companyId: string,
    query: DashboardDateRangeQueryDto,
  ) {
    const [
      expensesByStatus,
      expensesTotal,
      vendorBillsByStatus,
      vendorBillsTotal,
      payrollByStatus,
      payrollTotal,
      pettyCash,
      receivables,
      outstandingInvoiceCount,
    ] = await Promise.all([
      this.prisma.expenseClaim.groupBy({
        by: ['status'],
        where: {
          companyId,
          deletedAt: null,
          ...this.dateRange(query, 'claimDate'),
        },
        _count: { _all: true },
        _sum: { totalAmount: true },
      }),
      this.prisma.expenseClaim.aggregate({
        where: {
          companyId,
          deletedAt: null,
          ...this.dateRange(query, 'claimDate'),
        },
        _sum: { totalAmount: true },
      }),
      this.prisma.vendorBill.groupBy({
        by: ['status'],
        where: {
          companyId,
          deletedAt: null,
          ...this.dateRange(query, 'billDate'),
        },
        _count: { _all: true },
        _sum: { totalAmount: true, balanceAmount: true },
      }),
      this.prisma.vendorBill.aggregate({
        where: {
          companyId,
          deletedAt: null,
          ...this.dateRange(query, 'billDate'),
        },
        _sum: { totalAmount: true, balanceAmount: true },
      }),
      this.prisma.payrollRun.groupBy({
        by: ['status'],
        where: { companyId, deletedAt: null, ...this.dateRange(query) },
        _count: { _all: true },
        _sum: { totalNet: true },
      }),
      this.prisma.payrollRun.aggregate({
        where: { companyId, deletedAt: null, ...this.dateRange(query) },
        _sum: { totalGross: true, totalDeductions: true, totalNet: true },
      }),
      this.prisma.pettyCashAccount.aggregate({
        where: { companyId, deletedAt: null, status: RecordStatus.ACTIVE },
        _sum: { currentBalance: true },
      }),
      this.prisma.invoice.aggregate({
        where: {
          companyId,
          deletedAt: null,
          status: { notIn: [InvoiceStatus.PAID, InvoiceStatus.CANCELLED] },
          ...this.dateRange(query, 'issueDate'),
        },
        _sum: { balanceAmount: true },
      }),
      this.prisma.invoice.count({
        where: {
          companyId,
          deletedAt: null,
          status: { notIn: [InvoiceStatus.PAID, InvoiceStatus.CANCELLED] },
          ...this.dateRange(query, 'issueDate'),
        },
      }),
    ]);

    return {
      expenses: {
        totalAmount: this.decimal(expensesTotal._sum.totalAmount),
        byStatus: this.amountGroups(expensesByStatus, 'totalAmount'),
      },
      vendorBills: {
        totalAmount: this.decimal(vendorBillsTotal._sum.totalAmount),
        outstandingAmount: this.decimal(vendorBillsTotal._sum.balanceAmount),
        byStatus: vendorBillsByStatus.map((bill) => ({
          status: bill.status,
          count: bill._count._all,
          totalAmount: this.decimal(bill._sum.totalAmount),
          outstandingAmount: this.decimal(bill._sum.balanceAmount),
        })),
      },
      payroll: {
        grossAmount: this.decimal(payrollTotal._sum.totalGross),
        deductionsAmount: this.decimal(payrollTotal._sum.totalDeductions),
        netAmount: this.decimal(payrollTotal._sum.totalNet),
        byStatus: this.amountGroups(payrollByStatus, 'totalNet'),
      },
      pettyCash: {
        currentBalance: this.decimal(pettyCash._sum.currentBalance),
      },
      outstandingReceivables: {
        count: outstandingInvoiceCount,
        amount: this.decimal(receivables._sum.balanceAmount),
      },
    };
  }

  async inventoryAssetsDashboardSummary(
    companyId: string,
    query: DashboardDateRangeQueryDto,
  ) {
    const maintenanceRange = this.dateRangeOrDefault(query, 30);
    const [items, assetAssignments, maintenanceDue, maintenanceRecords] =
      await Promise.all([
        this.prisma.inventoryItem.findMany({
          where: {
            companyId,
            deletedAt: null,
            status: RecordStatus.ACTIVE,
          },
          orderBy: { updatedAt: 'desc' },
          take: 100,
        }),
        this.prisma.asset.groupBy({
          by: ['status'],
          where: { companyId, deletedAt: null },
          _count: { _all: true },
        }),
        this.prisma.assetMaintenanceRecord.count({
          where: {
            companyId,
            deletedAt: null,
            nextMaintenanceDate: maintenanceRange,
          },
        }),
        this.prisma.assetMaintenanceRecord.findMany({
          where: {
            companyId,
            deletedAt: null,
            nextMaintenanceDate: maintenanceRange,
          },
          orderBy: { nextMaintenanceDate: 'asc' },
          take: 10,
          include: {
            asset: { select: { id: true, name: true, assetTag: true } },
          },
        }),
      ]);

    return {
      lowStockItems: items
        .filter(
          (item) =>
            this.decimal(item.currentStock) <=
            this.decimal(item.lowStockThreshold),
        )
        .slice(0, 10),
      assetAssignments: this.countsByField(assetAssignments, 'status'),
      maintenanceDue: {
        count: maintenanceDue,
        records: maintenanceRecords,
      },
    };
  }

  async helpdeskDashboardSummary(
    companyId: string,
    query: DashboardDateRangeQueryDto,
  ) {
    const [openTickets, urgentTickets, slaBreached, byCategory, byStatus] =
      await Promise.all([
        this.prisma.helpdeskTicket.count({
          where: {
            companyId,
            deletedAt: null,
            status: {
              in: [
                HelpdeskTicketStatus.OPEN,
                HelpdeskTicketStatus.IN_PROGRESS,
                HelpdeskTicketStatus.WAITING_FOR_ADMIN,
                HelpdeskTicketStatus.WAITING_FOR_EMPLOYEE,
              ],
            },
            ...this.dateRange(query),
          },
        }),
        this.prisma.helpdeskTicket.count({
          where: {
            companyId,
            deletedAt: null,
            priority: 'URGENT',
            status: {
              notIn: [
                HelpdeskTicketStatus.CLOSED,
                HelpdeskTicketStatus.CANCELLED,
              ],
            },
            ...this.dateRange(query),
          },
        }),
        this.prisma.helpdeskTicket.count({
          where: {
            companyId,
            deletedAt: null,
            OR: [{ firstResponseBreached: true }, { resolutionBreached: true }],
            ...this.dateRange(query),
          },
        }),
        this.prisma.helpdeskTicket.groupBy({
          by: ['categoryId'],
          where: { companyId, deletedAt: null, ...this.dateRange(query) },
          _count: { _all: true },
        }),
        this.prisma.helpdeskTicket.groupBy({
          by: ['status'],
          where: { companyId, deletedAt: null, ...this.dateRange(query) },
          _count: { _all: true },
        }),
      ]);

    return {
      openTickets,
      urgentTickets,
      slaBreachedTickets: { count: slaBreached },
      ticketsByCategory: byCategory.map((category) => ({
        categoryId: category.categoryId,
        count: category._count._all,
      })),
      ticketsByStatus: this.countsByField(byStatus, 'status'),
    };
  }

  async approvalsDashboardSummary(
    companyId: string,
    userId: string,
    query: DashboardDateRangeQueryDto,
  ) {
    const [myPendingApprovals, companyPendingApprovals, recentApprovalActions] =
      await Promise.all([
        this.prisma.approvalStepInstance.count({
          where: {
            companyId,
            status: 'PENDING',
            OR: [{ approverUserId: userId }, { delegatedToUserId: userId }],
          },
        }),
        this.prisma.approvalRequest.count({
          where: {
            companyId,
            deletedAt: null,
            status: 'PENDING',
            ...this.dateRange(query),
          },
        }),
        this.prisma.approvalActionRecord.findMany({
          where: {
            companyId,
            action: {
              in: [
                ApprovalAction.APPROVE,
                ApprovalAction.REJECT,
                ApprovalAction.CANCEL,
                ApprovalAction.DELEGATE,
              ],
            },
            ...this.dateRange(query),
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            request: {
              select: {
                id: true,
                title: true,
                entityType: true,
                entityId: true,
              },
            },
          },
        }),
      ]);

    return {
      myPendingApprovals,
      companyPendingApprovals,
      recentApprovalActions,
    };
  }

  async calendarDashboardSummary(
    companyId: string,
    query: DashboardDateRangeQueryDto,
  ) {
    const today = this.todayRange();
    const upcomingRange = this.dateRangeOrDefault(query, 14);
    const [todayEvents, upcomingMeetings, resourceBookings] = await Promise.all(
      [
        this.prisma.calendarEvent.findMany({
          where: {
            companyId,
            deletedAt: null,
            status: 'SCHEDULED',
            startAt: today,
          },
          orderBy: { startAt: 'asc' },
          take: 20,
        }),
        this.prisma.calendarEvent.findMany({
          where: {
            companyId,
            deletedAt: null,
            status: 'SCHEDULED',
            eventType: {
              in: [CalendarEventType.MEETING, CalendarEventType.CLIENT_MEETING],
            },
            startAt: upcomingRange,
          },
          orderBy: { startAt: 'asc' },
          take: 10,
        }),
        this.prisma.calendarResourceBooking.groupBy({
          by: ['status'],
          where: { companyId, deletedAt: null, startAt: upcomingRange },
          _count: { _all: true },
        }),
      ],
    );

    return {
      todayEvents,
      upcomingMeetings,
      resourceBookings: resourceBookings.map((booking) => ({
        status: booking.status,
        count: booking._count._all,
      })),
    };
  }

  reportsRegistry() {
    return this.registry;
  }

  reportMetadata(reportType: string) {
    const report = this.registry.find(
      (entry) => entry.reportType === reportType,
    );
    if (!report) throw new NotFoundException('Report metadata not found');
    return report;
  }

  async createExportRequest(
    companyId: string,
    userId: string,
    dto: CreateReportExportRequestDto,
  ) {
    this.reportMetadata(dto.reportType);

    return this.prisma.reportExportRequest.create({
      data: {
        companyId,
        requestedByUserId: userId,
        reportType: dto.reportType,
        requestedFilters: dto.requestedFilters as
          | Prisma.InputJsonValue
          | undefined,
        format: dto.format,
        status: ReportExportStatus.PENDING,
        fileName: null,
        storageKey: null,
        mimeType: null,
        fileSize: null,
        failureReason: null,
      },
    });
  }

  async findExportRequests(
    companyId: string,
    query: ReportExportRequestQueryDto,
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.ReportExportRequestWhereInput = {
      companyId,
      deletedAt: null,
      ...(query.reportType ? { reportType: query.reportType } : {}),
      ...(query.format ? { format: query.format } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.fromDate || query.toDate
        ? { requestedAt: this.dateRangeOrDefault(query, 0) }
        : {}),
      ...(query.search
        ? { reportType: { contains: query.search, mode: 'insensitive' } }
        : {}),
    };
    const [data, total] = await Promise.all([
      this.prisma.reportExportRequest.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [query.sortBy ?? 'requestedAt']: query.sortOrder ?? 'desc' },
      }),
      this.prisma.reportExportRequest.count({ where }),
    ]);
    return this.paginated(data, page, limit, total);
  }

  private dateFilters(): ReportRegistryEntry['availableFilters'] {
    return [
      { key: 'fromDate', label: 'From date', type: 'date' },
      { key: 'toDate', label: 'To date', type: 'date' },
    ];
  }

  private dateRange(
    query: DashboardDateRangeQueryDto,
    field = 'createdAt',
  ): Record<string, { gte?: Date; lte?: Date }> {
    if (!query.fromDate && !query.toDate) return {};
    return {
      [field]: {
        ...(query.fromDate ? { gte: this.startOfDay(query.fromDate) } : {}),
        ...(query.toDate ? { lte: this.endOfDay(query.toDate) } : {}),
      },
    };
  }

  private dateRangeOrDefault(
    query: DashboardDateRangeQueryDto,
    nextDays: number,
  ) {
    if (query.fromDate || query.toDate) {
      return {
        ...(query.fromDate ? { gte: this.startOfDay(query.fromDate) } : {}),
        ...(query.toDate ? { lte: this.endOfDay(query.toDate) } : {}),
      };
    }
    const now = new Date();
    return {
      gte: now,
      lte: new Date(now.getTime() + nextDays * 86_400_000),
    };
  }

  private todayRange() {
    const now = new Date();
    const date = now.toISOString().slice(0, 10);
    return { gte: this.startOfDay(date), lte: this.endOfDay(date) };
  }

  private startOfDay(value: string) {
    const date = new Date(value);
    return new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
    );
  }

  private endOfDay(value: string) {
    const date = new Date(value);
    return new Date(
      Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate(),
        23,
        59,
        59,
        999,
      ),
    );
  }

  private countsByField<T extends Record<string, unknown>>(
    rows: T[],
    field: keyof T,
  ) {
    return rows.reduce<Record<string, number>>((result, row) => {
      const key = String(row[field] ?? 'UNASSIGNED');
      const count = row._count as { _all?: number } | undefined;
      result[key] = count?._all ?? 0;
      return result;
    }, {});
  }

  private countsByValues(values: string[]) {
    return values.reduce<Record<string, number>>((result, value) => {
      result[value] = (result[value] ?? 0) + 1;
      return result;
    }, {});
  }

  private amountGroups(
    rows: Array<{
      status: string;
      _count: { _all: number };
      _sum: Record<string, Prisma.Decimal | number | null>;
    }>,
    amountField: string,
  ) {
    return rows.map((row) => ({
      status: row.status,
      count: row._count._all,
      amount: this.decimal(row._sum[amountField]),
    }));
  }

  private leadsByStage(
    leads: Array<{
      status: string;
      stage: { id: string; name: string; sortOrder: number } | null;
    }>,
  ) {
    const stages = new Map<
      string,
      {
        stageId: string | null;
        stageName: string;
        sortOrder: number;
        count: number;
      }
    >();
    for (const lead of leads) {
      const key = lead.stage?.id ?? `status:${lead.status}`;
      const existing = stages.get(key) ?? {
        stageId: lead.stage?.id ?? null,
        stageName: lead.stage?.name ?? lead.status,
        sortOrder: lead.stage?.sortOrder ?? 999,
        count: 0,
      };
      existing.count += 1;
      stages.set(key, existing);
    }
    return [...stages.values()].sort(
      (a, b) =>
        a.sortOrder - b.sortOrder || a.stageName.localeCompare(b.stageName),
    );
  }

  private decimal(value?: Prisma.Decimal | number | null) {
    return Number(value ?? 0);
  }

  private paginated<T>(data: T[], page: number, limit: number, total: number) {
    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
}
