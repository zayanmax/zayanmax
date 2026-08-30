"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { navigationGroups } from "@/config/navigation";
import { useAuthStore } from "@/lib/auth/auth-store";
import { hasAllPermissions } from "@/lib/permissions";
import { cn } from "@/lib/utils";

function routeMatches(pathname: string, href: string) {
  return (
    pathname === href ||
    (href !== "/dashboard" && pathname.startsWith(`${href}/`))
  );
}

export function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const permissions = useAuthStore((state) => state.user?.permissions);
  const visibleGroups = useMemo(
    () => {
      const grantedPermissions = permissions ?? [];
      return navigationGroups
        .map((group) => ({
          ...group,
          items: group.items.filter((item) =>
            hasAllPermissions(grantedPermissions, item.permission),
          ),
        }))
        .filter((group) => group.items.length > 0);
    },
    [permissions],
  );
  const activeHref = visibleGroups
    .flatMap((group) => group.items)
    .reduce<string | undefined>((match, item) => {
      if (!routeMatches(pathname, item.href)) return match;
      return !match || item.href.length > match.length ? item.href : match;
    }, undefined);
  const activeGroupLabel = visibleGroups.find((group) =>
    group.items.some((item) => item.href === activeHref),
  )?.label;
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    () => new Set(["Workspace"]),
  );

  const toggleGroup = (label: string) => {
    setExpandedGroups((current) => {
      const next = new Set(current);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

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
          "fixed inset-y-0 left-0 z-50 flex h-dvh w-[272px] flex-col border-r border-border bg-sidebar shadow-xl transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 lg:shadow-none",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4">
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

        <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4 [scrollbar-gutter:stable]">
          <div className="space-y-1.5">
            {visibleGroups.map((group) => {
              const GroupIcon = group.icon;
              const expanded =
                expandedGroups.has(group.label) || activeGroupLabel === group.label;
              return (
              <div key={group.label} className="rounded-xl">
                <button
                  type="button"
                  onClick={() => toggleGroup(group.label)}
                  aria-expanded={expanded}
                  className={cn(
                    "flex h-10 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-sm font-semibold text-sidebar-foreground transition-colors hover:bg-sidebar-accent",
                    activeGroupLabel === group.label && "text-primary",
                  )}
                >
                  <GroupIcon className="size-4.5" />
                  <span className="min-w-0 flex-1 truncate">{group.label}</span>
                  <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground">
                    {group.items.length}
                  </span>
                  <ChevronDown
                    className={cn(
                      "size-4 text-muted-foreground transition-transform",
                      expanded && "rotate-180",
                    )}
                  />
                </button>
                <div
                  className={cn(
                    "grid transition-[grid-template-rows,opacity] duration-200",
                    expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                  )}
                >
                  <div className="overflow-hidden">
                  <div className="ml-4 space-y-1 border-l border-border py-1 pl-2">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = item.href === activeHref;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onClose}
                        className={cn(
                          "flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                          active &&
                            "bg-primary/10 text-primary",
                        )}
                      >
                        <Icon className="size-4 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    );
                  })}
                  </div>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        </nav>
      </aside>
    </>
  );
}
