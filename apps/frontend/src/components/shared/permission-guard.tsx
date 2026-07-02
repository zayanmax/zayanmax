"use client";

import type { ReactNode } from "react";
import { usePermission } from "@/hooks/use-permission";

export function PermissionGuard({
  permission,
  children,
  fallback = null,
}: {
  permission?: string | string[];
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const allowed = usePermission(permission);
  return allowed ? children : fallback;
}
