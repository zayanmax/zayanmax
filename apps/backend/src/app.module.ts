import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { validateEnv } from './config/env.validation';
import { PrismaModule } from './database/prisma.module';
import { ApprovalsWorkflowModule } from './modules/approvals-workflow/approvals-workflow.module';
import { AttendanceLeaveModule } from './modules/attendance-leave/attendance-leave.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { AuthModule } from './modules/auth/auth.module';
import { BranchesModule } from './modules/branches/branches.module';
import { CalendarSchedulingModule } from './modules/calendar-scheduling/calendar-scheduling.module';
import { ClientsModule } from './modules/clients/clients.module';
import { CommunicationNotificationsModule } from './modules/communication-notifications/communication-notifications.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { DepartmentsModule } from './modules/departments/departments.module';
import { DesignationsModule } from './modules/designations/designations.module';
import { DashboardReportsModule } from './modules/dashboard-reports/dashboard-reports.module';
import { DocumentsKnowledgeBaseModule } from './modules/documents-knowledge-base/documents-knowledge-base.module';
import { EmployeesModule } from './modules/employees/employees.module';
import { FinanceModule } from './modules/finance/finance.module';
import { HelpdeskTicketsModule } from './modules/helpdesk-tickets/helpdesk-tickets.module';
import { HealthModule } from './modules/health/health.module';
import { InvoicesBillingReceivablesModule } from './modules/invoices-billing-receivables/invoices-billing-receivables.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { PayrollModule } from './modules/payroll/payroll.module';
import { PerformanceAppraisalsModule } from './modules/performance-appraisals/performance-appraisals.module';
import { PurchaseInventoryAssetsModule } from './modules/purchase-inventory-assets/purchase-inventory-assets.module';
import { RecruitmentOnboardingModule } from './modules/recruitment-onboarding/recruitment-onboarding.module';
import { RolesModule } from './modules/roles/roles.module';
import { SalesLeadsQuotationsModule } from './modules/sales-leads-quotations/sales-leads-quotations.module';
import { TasksProjectsModule } from './modules/tasks-projects/tasks-projects.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    PrismaModule,
    ApprovalsWorkflowModule,
    AuthModule,
    AttendanceLeaveModule,
    CalendarSchedulingModule,
    ClientsModule,
    CommunicationNotificationsModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    PayrollModule,
    PerformanceAppraisalsModule,
    CompaniesModule,
    BranchesModule,
    DepartmentsModule,
    DesignationsModule,
    DashboardReportsModule,
    DocumentsKnowledgeBaseModule,
    EmployeesModule,
    FinanceModule,
    HelpdeskTicketsModule,
    HealthModule,
    InvoicesBillingReceivablesModule,
    PurchaseInventoryAssetsModule,
    RecruitmentOnboardingModule,
    SalesLeadsQuotationsModule,
    TasksProjectsModule,
    AuditLogsModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
