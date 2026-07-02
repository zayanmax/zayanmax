import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  FileCheck2,
  FileBarChart2,
  FileText,
  HelpCircle,
  KanbanSquare,
  LayoutDashboard,
  Package,
  ReceiptText,
  Target,
  SquareCheckBig,
  Settings,
  Users,
  WalletCards,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  permission?: string | string[];
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export const navigationGroups: NavGroup[] = [
  {
    label: "Workspace",
    items: [
      {
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        permission: "dashboard.view",
      },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Employees", href: "/employees", icon: Users, permission: "employees.view" },
      {
        label: "Clients & CRM",
        href: "/clients",
        icon: Building2,
        permission: "clients.view",
      },
      {
        label: "Projects",
        href: "/projects",
        icon: ClipboardList,
        permission: "projects.view",
      },
      {
        label: "Tasks",
        href: "/tasks",
        icon: SquareCheckBig,
        permission: "tasks.view",
      },
      {
        label: "Kanban",
        href: "/tasks/kanban",
        icon: KanbanSquare,
        permission: "tasks.view",
      },
      { label: "Leads", href: "/sales/leads", icon: Target, permission: "sales.view" },
      {
        label: "Opportunities",
        href: "/sales/opportunities",
        icon: BarChart3,
        permission: "sales.view",
      },
      {
        label: "Quotations",
        href: "/sales/quotations",
        icon: FileCheck2,
        permission: "sales.view",
      },
      {
        label: "Billing Overview",
        href: "/billing",
        icon: ReceiptText,
        permission: "billing.view",
      },
      {
        label: "Invoices",
        href: "/billing/invoices",
        icon: FileText,
        permission: "billing.view",
      },
      {
        label: "Receipts",
        href: "/billing/receipts",
        icon: CreditCard,
        permission: "billing.view",
      },
      {
        label: "Client Statements",
        href: "/billing/client-statements",
        icon: WalletCards,
        permission: "billing.view",
      },
      {
        label: "Finance",
        href: "/finance",
        icon: WalletCards,
        permission: "finance.view",
      },
      {
        label: "Inventory & Assets",
        href: "/inventory-assets",
        icon: Package,
        permission: ["inventory.view", "assets.view"],
      },
      {
        label: "Documents",
        href: "/documents",
        icon: FileText,
        permission: "documents.view",
      },
      {
        label: "Calendar",
        href: "/calendar",
        icon: CalendarDays,
        permission: "calendar.view",
      },
      {
        label: "Helpdesk",
        href: "/helpdesk",
        icon: HelpCircle,
        permission: "helpdesk.view",
      },
      {
        label: "Approvals",
        href: "/approvals",
        icon: CheckCircle2,
        permission: "approvals.view",
      },
    ],
  },
  {
    label: "Control",
    items: [
      {
        label: "Reports",
        href: "/reports",
        icon: FileBarChart2,
        permission: "reports.view",
      },
      {
        label: "Settings",
        href: "/settings",
        icon: Settings,
        permission: "settings.view",
      },
      {
        label: "Branches",
        href: "/settings/branches",
        icon: Building2,
        permission: "settings.view",
      },
      {
        label: "Departments",
        href: "/settings/departments",
        icon: Users,
        permission: "settings.view",
      },
      {
        label: "Designations",
        href: "/settings/designations",
        icon: ClipboardList,
        permission: "settings.view",
      },
      {
        label: "Change Password",
        href: "/change-password",
        icon: CreditCard,
      },
      {
        label: "Company",
        href: "/settings/company",
        icon: BriefcaseBusiness,
        permission: "settings.manage",
      },
    ],
  },
];
