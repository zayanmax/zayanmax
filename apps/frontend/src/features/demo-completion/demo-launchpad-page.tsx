"use client";

import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  CreditCard,
  Database,
  FileBarChart2,
  FileText,
  Headphones,
  LayoutDashboard,
  Package,
  ReceiptText,
  RefreshCw,
  Rocket,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  WalletCards,
} from "lucide-react";
import { useState } from "react";
import { ErrorState } from "@/components/shared/error-state";
import { PermissionGuard } from "@/components/shared/permission-guard";

const DEMO_STORAGE_PREFIX = "zayanmax.demo.";

const groups = [
  {
    title: "People & HR",
    description: "The complete employee journey from hiring to payroll.",
    items: [
      { label: "Employees", href: "/employees", icon: Users, source: "API-backed" },
      { label: "Attendance", href: "/attendance", icon: ClipboardCheck, source: "API-backed" },
      { label: "Leave", href: "/leave", icon: CalendarDays, source: "Presenter data" },
      { label: "Payroll", href: "/payroll", icon: CreditCard, source: "Presenter data" },
      { label: "Performance", href: "/performance", icon: Target, source: "Presenter data" },
      { label: "Recruitment", href: "/recruitment", icon: BriefcaseBusiness, source: "Presenter data" },
    ],
  },
  {
    title: "Work & Customers",
    description: "Customer relationships, delivery execution, support, and decisions.",
    items: [
      { label: "Clients & CRM", href: "/clients", icon: Building2, source: "API-backed" },
      { label: "Projects", href: "/projects", icon: ClipboardCheck, source: "API-backed" },
      { label: "Tasks", href: "/tasks", icon: CheckCircle2, source: "API-backed" },
      { label: "Helpdesk", href: "/helpdesk", icon: Headphones, source: "Presenter data" },
      { label: "Approvals", href: "/approvals", icon: ShieldCheck, source: "Presenter data" },
    ],
  },
  {
    title: "Revenue & Operations",
    description: "Lead-to-cash, purchasing, stock, assets, and financial control.",
    items: [
      { label: "Leads", href: "/sales/leads", icon: Target, source: "API-backed" },
      { label: "Quotations", href: "/sales/quotations", icon: FileText, source: "API-backed" },
      { label: "Billing", href: "/billing", icon: ReceiptText, source: "API-backed" },
      { label: "Finance", href: "/finance", icon: WalletCards, source: "API-backed" },
      { label: "Purchasing", href: "/purchase", icon: Package, source: "API-backed" },
      { label: "Inventory", href: "/inventory", icon: Database, source: "API-backed" },
      { label: "Assets", href: "/assets", icon: BriefcaseBusiness, source: "API-backed" },
    ],
  },
  {
    title: "Company Platform",
    description: "Knowledge, communication, scheduling, reporting, and administration.",
    items: [
      { label: "Documents", href: "/documents", icon: FileText, source: "API-backed" },
      { label: "Knowledge Base", href: "/knowledge-base/articles", icon: FileText, source: "API-backed" },
      { label: "Communication", href: "/communication", icon: Users, source: "API-backed" },
      { label: "Calendar", href: "/calendar", icon: CalendarDays, source: "API-backed" },
      { label: "Reports", href: "/reports", icon: FileBarChart2, source: "Presenter data" },
      { label: "Settings", href: "/settings", icon: Settings, source: "Ready" },
    ],
  },
] as const;

const guidedDemo = [
  {
    number: "01",
    label: "Dashboard",
    href: "/dashboard",
    note: "Open with the company-wide operating snapshot.",
  },
  {
    number: "02",
    label: "Employees",
    href: "/employees",
    note: "Show the organization and employee master records.",
  },
  {
    number: "03",
    label: "Projects & Billing",
    href: "/projects",
    note: "Explain delivery, tasks, quotations, invoices, and receipts.",
  },
  {
    number: "04",
    label: "People Operations",
    href: "/attendance",
    note: "Demonstrate attendance, leave, payroll, and performance.",
  },
  {
    number: "05",
    label: "Helpdesk & Approvals",
    href: "/helpdesk",
    note: "Create a ticket, advance its workflow, then review approvals.",
  },
  {
    number: "06",
    label: "Reports & Control",
    href: "/reports",
    note: "Export CSV and finish with roles, permissions, and audit logs.",
  },
] as const;

export function DemoLaunchpadPage() {
  const [notice, setNotice] = useState("");

  function resetPresenterData() {
    const keys: string[] = [];

    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (key?.startsWith(DEMO_STORAGE_PREFIX)) {
        keys.push(key);
      }
    }

    for (const key of keys) {
      window.localStorage.removeItem(key);
    }

    setNotice("Presenter data cleared. Each module will restore its default dataset when opened.");
    window.setTimeout(() => setNotice(""), 3200);
  }

  return (
    <PermissionGuard
      permission="dashboard.view"
      fallback={
        <ErrorState
          title="Permission required"
          message="You do not have access to the demo center."
        />
      }
    >
      <div className="flex flex-col gap-6">
        <header className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="relative border-l-4 border-l-primary px-5 py-6 sm:px-7 sm:py-7">
            <div
              className="pointer-events-none absolute -right-14 -top-20 size-64 rounded-full bg-primary/10 blur-3xl"
              aria-hidden="true"
            />
            <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-3xl">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                  <Rocket className="size-3.5" aria-hidden="true" />
                  Presenter launchpad
                </span>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                  ZayanMax full-system demo
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                  One company-scoped workspace for people, customers, projects,
                  revenue, finance, purchasing, inventory, documents, communication,
                  scheduling, support, approvals, and reporting.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={resetPresenterData}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md border bg-background px-4 text-sm font-medium transition hover:bg-muted"
                >
                  <RefreshCw className="size-4" aria-hidden="true" />
                  Reset presenter data
                </button>
                <Link
                  href="/dashboard"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90"
                >
                  Start guided demo
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Active employees",
              value: "42",
              helper: "Across 3 branches",
              icon: Users,
              className:
                "border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-300",
            },
            {
              label: "Attendance rate",
              value: "93%",
              helper: "Today",
              icon: ClipboardCheck,
              className:
                "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
            },
            {
              label: "Receivables",
              value: "₹6.8L",
              helper: "Outstanding",
              icon: BarChart3,
              className:
                "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300",
            },
            {
              label: "Open tickets",
              value: "7",
              helper: "96% within SLA",
              icon: Headphones,
              className:
                "border-violet-500/25 bg-violet-500/10 text-violet-700 dark:text-violet-300",
            },
          ].map((metric) => {
            const Icon = metric.icon;
            return (
              <article key={metric.label} className="rounded-xl border bg-card p-4 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{metric.label}</p>
                    <p className="mt-2 text-2xl font-semibold tracking-tight">
                      {metric.value}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">{metric.helper}</p>
                  </div>
                  <span
                    className={`flex size-10 items-center justify-center rounded-lg border ${metric.className}`}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                </div>
              </article>
            );
          })}
        </section>

        <section className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="rounded-xl border bg-card shadow-sm">
            <div className="border-b px-5 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-semibold">System coverage</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Launch any operational area without a broken destination.
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="size-3.5" aria-hidden="true" />
                  Demo route coverage ready
                </span>
              </div>
            </div>

            <div className="grid gap-5 p-5 xl:grid-cols-2">
              {groups.map((group) => (
                <article key={group.title} className="rounded-xl border bg-background/50 p-4">
                  <h3 className="font-semibold">{group.title}</h3>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {group.description}
                  </p>
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="group flex min-w-0 items-center gap-3 rounded-lg border bg-card p-3 transition hover:border-primary/35 hover:bg-primary/5"
                        >
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-md border bg-background text-muted-foreground transition group-hover:text-primary">
                            <Icon className="size-4" aria-hidden="true" />
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium">
                              {item.label}
                            </span>
                            <span className="block truncate text-[11px] text-muted-foreground">
                              {item.source}
                            </span>
                          </span>
                          <ArrowRight
                            className="ml-auto size-3.5 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary"
                            aria-hidden="true"
                          />
                        </Link>
                      );
                    })}
                  </div>
                </article>
              ))}
            </div>
          </div>

          <aside className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 text-primary">
                <LayoutDashboard className="size-4" aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-semibold">Guided presentation</h2>
                <p className="text-xs text-muted-foreground">A focused 10–15 minute flow</p>
              </div>
            </div>

            <ol className="mt-5 space-y-2">
              {guidedDemo.map((step) => (
                <li key={step.number}>
                  <Link
                    href={step.href}
                    className="group flex gap-3 rounded-lg border border-transparent p-2.5 transition hover:border-border hover:bg-muted/40"
                  >
                    <span className="mt-0.5 text-xs font-semibold text-primary">
                      {step.number}
                    </span>
                    <span className="min-w-0">
                      <span className="flex items-center gap-1.5 text-sm font-medium">
                        {step.label}
                        <ArrowRight
                          className="size-3.5 opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100"
                          aria-hidden="true"
                        />
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                        {step.note}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ol>

            <div className="mt-5 rounded-lg border border-primary/20 bg-primary/5 p-3">
              <div className="flex items-center gap-2 text-xs font-medium text-primary">
                <Sparkles className="size-3.5" aria-hidden="true" />
                Presentation tip
              </div>
              <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
                Use the presenter-data screens for fast create, search, status,
                reset, and CSV demonstrations. Existing modules continue to use
                the real backend API.
              </p>
            </div>
          </aside>
        </section>

        {notice ? (
          <div
            className="fixed bottom-5 right-5 z-50 max-w-sm rounded-lg border bg-card px-4 py-3 text-sm shadow-xl"
            role="status"
          >
            {notice}
          </div>
        ) : null}
      </div>
    </PermissionGuard>
  );
}
