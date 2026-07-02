import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Bell,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  FileCheck2,
  FileBarChart2,
  FileText,
  FolderTree,
  HelpCircle,
  KanbanSquare,
  Library,
  LayoutDashboard,
  Megaphone,
  Package,
  PackageCheck,
  ReceiptText,
  Send,
  ShoppingCart,
  Target,
  SquareCheckBig,
  Settings,
  Tags,
  Timer,
  Truck,
  Users,
  WalletCards,
  Warehouse,
  Wrench,
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
        label: "Finance Overview",
        href: "/finance",
        icon: WalletCards,
        permission: "finance.view",
      },
      {
        label: "Expenses",
        href: "/finance/expenses",
        icon: ReceiptText,
        permission: "finance.view",
      },
      {
        label: "Expense Categories",
        href: "/finance/expense-categories",
        icon: ClipboardList,
        permission: "finance.manage",
      },
      {
        label: "Vendors",
        href: "/finance/vendors",
        icon: Building2,
        permission: "vendors.view",
      },
      {
        label: "Vendor Bills",
        href: "/finance/vendor-bills",
        icon: FileText,
        permission: ["finance.view", "vendors.view"],
      },
      {
        label: "Vendor Payments",
        href: "/finance/vendor-payments",
        icon: CreditCard,
        permission: "finance.view",
      },
      {
        label: "Petty Cash",
        href: "/finance/petty-cash",
        icon: WalletCards,
        permission: "finance.view",
      },
      {
        label: "Purchase Overview",
        href: "/purchase",
        icon: ShoppingCart,
        permission: ["purchases.view", "inventory.view", "assets.view"],
      },
      {
        label: "Purchase Requests",
        href: "/purchase/requests",
        icon: ClipboardList,
        permission: "purchases.view",
      },
      {
        label: "Purchase Orders",
        href: "/purchase/orders",
        icon: ShoppingCart,
        permission: "purchases.view",
      },
      {
        label: "GRN",
        href: "/purchase/grn",
        icon: PackageCheck,
        permission: "purchases.view",
      },
      {
        label: "Inventory Overview",
        href: "/inventory",
        icon: Warehouse,
        permission: "inventory.view",
      },
      {
        label: "Inventory Items",
        href: "/inventory/items",
        icon: Package,
        permission: "inventory.view",
      },
      {
        label: "Inventory Categories",
        href: "/inventory/categories",
        icon: ClipboardList,
        permission: "inventory.view",
      },
      {
        label: "Stock Movements",
        href: "/inventory/stock-movements",
        icon: Truck,
        permission: "inventory.view",
      },
      {
        label: "Stock Adjustment",
        href: "/inventory/stock-adjustments/new",
        icon: PackageCheck,
        permission: "inventory.manage",
      },
      {
        label: "Assets",
        href: "/assets",
        icon: Package,
        permission: "assets.view",
      },
      {
        label: "Asset Categories",
        href: "/assets/categories",
        icon: ClipboardList,
        permission: "assets.view",
      },
      {
        label: "Asset Assignments",
        href: "/assets/assignments",
        icon: Users,
        permission: "assets.view",
      },
      {
        label: "Asset Maintenance",
        href: "/assets/maintenance",
        icon: Wrench,
        permission: "assets.view",
      },
      {
        label: "Documents Overview",
        href: "/documents",
        icon: FileText,
        permission: "documents.view",
      },
      {
        label: "Document Folders",
        href: "/documents/folders",
        icon: FolderTree,
        permission: "documents.view",
      },
      {
        label: "Document Records",
        href: "/documents/records",
        icon: FileText,
        permission: "documents.view",
      },
      {
        label: "Document Categories",
        href: "/documents/categories",
        icon: ClipboardList,
        permission: "documents.view",
      },
      {
        label: "Document Tags",
        href: "/documents/tags",
        icon: Tags,
        permission: "documents.view",
      },
      {
        label: "Knowledge Base",
        href: "/knowledge-base/articles",
        icon: BookOpen,
        permission: "documents.view",
      },
      {
        label: "KB Categories",
        href: "/knowledge-base/categories",
        icon: Library,
        permission: "documents.view",
      },
      {
        label: "Communication",
        href: "/communication",
        icon: Megaphone,
        permission: "communications.view",
      },
      {
        label: "Announcements",
        href: "/communication/announcements",
        icon: Megaphone,
        permission: "communications.view",
      },
      {
        label: "Notifications",
        href: "/notifications",
        icon: Bell,
        permission: "notifications.view",
      },
      {
        label: "Notification Templates",
        href: "/communication/notification-templates",
        icon: Send,
        permission: "notifications.manage",
      },
      {
        label: "Reminders",
        href: "/communication/reminders",
        icon: Timer,
        permission: "notifications.view",
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
        label: "Notification Preferences",
        href: "/settings/notification-preferences",
        icon: Bell,
        permission: "notifications.view",
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
