"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { AppBreadcrumbs } from "@/components/layout/breadcrumbs";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { LoadingState } from "@/components/shared/loading-state";
import { useAuthStore } from "@/lib/auth/auth-store";

export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const tokens = useAuthStore((state) => state.tokens);
  const isLoadingUser = useAuthStore((state) => state.isLoadingUser);

  useEffect(() => {
    if (isHydrated && !tokens?.accessToken) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [isHydrated, pathname, router, tokens?.accessToken]);

  if (!isHydrated || !tokens?.accessToken || isLoadingUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="w-full max-w-md rounded-lg border border-border bg-card p-5">
          <LoadingState rows={4} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mb-5">
            <AppBreadcrumbs />
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
