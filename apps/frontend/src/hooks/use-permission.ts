"use client";

import { useAuthStore } from "@/lib/auth/auth-store";

export function usePermission(permission?: string | string[]) {
  return useAuthStore((state) => state.hasPermission(permission));
}
