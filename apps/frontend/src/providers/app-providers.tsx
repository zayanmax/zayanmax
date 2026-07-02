"use client";

import { type ReactNode } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/providers/auth-provider";
import { QueryProvider } from "@/providers/query-provider";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>
        <TooltipProvider>{children}</TooltipProvider>
      </AuthProvider>
    </QueryProvider>
  );
}
