"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { navigationGroups } from "@/config/navigation";
import { useAuthStore } from "@/lib/auth/auth-store";
import { hasAllPermissions } from "@/lib/permissions";
import { cn } from "@/lib/utils";

export function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const permissions = user?.permissions ?? [];

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/20 lg:hidden",
          open ? "block" : "hidden",
        )}
        onClick={onClose}
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-border bg-sidebar transition-transform lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <Link href="/dashboard" className="flex items-center gap-2" onClick={onClose}>
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
              ZM
            </span>
            <span className="font-semibold text-sidebar-foreground">Zayan Max</span>
          </Link>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onClose}
            aria-label="Close navigation"
          >
            <X className="size-4" />
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {navigationGroups.map((group) => {
            const items = group.items.filter((item) =>
              hasAllPermissions(permissions, item.permission),
            );
            if (!items.length) return null;

            return (
              <div key={group.label} className="mb-5">
                <p className="mb-2 px-2 text-xs font-medium uppercase text-muted-foreground">
                  {group.label}
                </p>
                <div className="space-y-1">
                  {items.map((item) => {
                    const Icon = item.icon;
                    const active =
                      pathname === item.href ||
                      (item.href !== "/dashboard" && pathname.startsWith(item.href));
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onClose}
                        className={cn(
                          "flex h-9 items-center gap-2 rounded-lg px-2.5 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                          active &&
                            "bg-sidebar-accent text-sidebar-accent-foreground",
                        )}
                      >
                        <Icon className="size-4" />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
