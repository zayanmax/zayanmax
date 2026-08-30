"use client";

import Link from "next/link";
import {
  ArrowRight,
  Bell,
  BriefcaseBusiness,
  Building2,
  ClipboardList,
  FileClock,
  KeyRound,
  Network,
  ShieldCheck,
  Users,
} from "lucide-react";
import { ErrorState } from "@/components/shared/error-state";
import { PermissionGuard } from "@/components/shared/permission-guard";

const settingsAreas = [
  {
    title: "Company profile",
    description:
      "Identity, legal details, contact information, timezone, and currency.",
    href: "/settings/company",
    icon: BriefcaseBusiness,
    permission: "settings.manage",
  },
  {
    title: "Branches",
    description:
      "Operating locations, addresses, phone numbers, and active status.",
    href: "/settings/branches",
    icon: Building2,
    permission: "settings.view",
  },
  {
    title: "Departments",
    description:
      "Organizational units used across employees, workflows, and reports.",
    href: "/settings/departments",
    icon: Network,
    permission: "settings.view",
  },
  {
    title: "Designations",
    description: "Job titles and role labels assigned to employee records.",
    href: "/settings/designations",
    icon: ClipboardList,
    permission: "settings.view",
  },
  {
    title: "Users",
    description:
      "Application accounts, employee links, invitations, and access status.",
    href: "/settings/users",
    icon: Users,
    permission: "settings.view",
  },
  {
    title: "Roles",
    description:
      "Reusable access profiles that group fine-grained permission keys.",
    href: "/settings/roles",
    icon: ShieldCheck,
    permission: "roles.view",
  },
  {
    title: "Permissions",
    description:
      "The platform-wide catalog used by backend guards and role assignments.",
    href: "/settings/permissions",
    icon: KeyRound,
    permission: "permissions.view",
  },
  {
    title: "Notification preferences",
    description:
      "In-app delivery preferences and notification category controls.",
    href: "/settings/notification-preferences",
    icon: Bell,
    permission: "notifications.view",
  },
  {
    title: "Audit logs",
    description:
      "Administrative activity, important mutations, outcomes, and timestamps.",
    href: "/settings/audit-logs",
    icon: FileClock,
    permission: "audit_logs.view",
  },
] as const;

export function DemoSettingsPage() {
  return (
    <PermissionGuard
      permission="settings.view"
      fallback={
        <ErrorState
          title="Permission required"
          message="You do not have access to company settings."
        />
      }
    >
      <div className="flex flex-col gap-6">
        <header className="rounded-2xl border border-l-4 border-l-primary bg-card px-5 py-5 shadow-sm sm:px-6">
          <span className="inline-flex rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
            Administration
          </span>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
            Settings
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            Configure company structure, application access, permissions,
            notifications, and administrative visibility from one control
            center.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {settingsAreas.map((area) => {
            const Icon = area.icon;

            return (
              <Link
                key={area.href}
                href={area.href}
                className="group rounded-xl border bg-card p-5 shadow-sm transition hover:border-primary/35 hover:bg-primary/[0.03]"
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="flex size-10 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <ArrowRight
                    className="size-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary"
                    aria-hidden="true"
                  />
                </div>
                <h2 className="mt-4 font-semibold">{area.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {area.description}
                </p>
                <p className="mt-4 text-xs font-medium text-primary">
                  {area.permission}
                </p>
              </Link>
            );
          })}
        </section>

        <section className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="font-semibold">Access-control foundation</h2>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
                ZayanMax authorizes controller actions through permission keys.
                Roles collect those keys, users receive roles, and audit logs
                retain important administrative changes.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg border bg-background px-4 py-3">
                <p className="text-xl font-semibold">69</p>
                <p className="text-[11px] text-muted-foreground">Permissions</p>
              </div>
              <div className="rounded-lg border bg-background px-4 py-3">
                <p className="text-xl font-semibold">4</p>
                <p className="text-[11px] text-muted-foreground">Demo roles</p>
              </div>
              <div className="rounded-lg border bg-background px-4 py-3">
                <p className="text-xl font-semibold">6</p>
                <p className="text-[11px] text-muted-foreground">Sessions</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </PermissionGuard>
  );
}
