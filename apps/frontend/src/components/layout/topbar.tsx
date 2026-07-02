"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Bell, LogOut, Menu, Search, ShieldCheck, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authApi } from "@/lib/api/endpoints";
import { useAuthStore } from "@/lib/auth/auth-store";

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const logout = async (allSessions = false) => {
    try {
      if (allSessions) {
        await authApi.logoutAll();
      } else {
        await authApi.logout();
      }
    } finally {
      clearAuth();
      router.replace("/login");
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenuClick}
        aria-label="Open navigation"
      >
        <Menu className="size-5" />
      </Button>

      <div className="relative hidden max-w-md flex-1 md:block">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search workspace"
          className="h-9 bg-card pl-8"
          disabled
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Button type="button" variant="ghost" size="icon" aria-label="Notifications">
          <Bell className="size-4" />
        </Button>

        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <Button type="button" variant="outline" className="h-9 gap-2">
              <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                <UserRound className="size-3.5" />
              </span>
              <span className="hidden max-w-40 truncate sm:inline">
                {user?.email ?? "Account"}
              </span>
            </Button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={8}
              className="z-50 min-w-56 rounded-lg border border-border bg-popover p-1 text-sm text-popover-foreground shadow-md"
            >
              <DropdownMenu.Label className="px-2 py-1.5 text-xs text-muted-foreground">
                Signed in as
              </DropdownMenu.Label>
              <div className="px-2 pb-2 text-sm font-medium">{user?.email}</div>
              <DropdownMenu.Separator className="my-1 h-px bg-border" />
              <DropdownMenu.Item
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 outline-none hover:bg-accent"
                onSelect={() => router.push("/change-password")}
              >
                <ShieldCheck className="size-4" />
                Change password
              </DropdownMenu.Item>
              <DropdownMenu.Item
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-destructive outline-none hover:bg-destructive/10"
                onSelect={() => void logout(false)}
              >
                <LogOut className="size-4" />
                Logout
              </DropdownMenu.Item>
              <DropdownMenu.Item
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-destructive outline-none hover:bg-destructive/10"
                onSelect={() => void logout(true)}
              >
                <LogOut className="size-4" />
                Logout all sessions
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </header>
  );
}
