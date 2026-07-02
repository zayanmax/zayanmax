"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { UNAUTHORIZED_EVENT } from "@/lib/auth/session-events";
import { useAuthStore } from "@/lib/auth/auth-store";

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const initializeFromStorage = useAuthStore((state) => state.initializeFromStorage);
  const refreshUser = useAuthStore((state) => state.refreshUser);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  useEffect(() => {
    initializeFromStorage();
    void refreshUser();
  }, [initializeFromStorage, refreshUser]);

  useEffect(() => {
    const handleUnauthorized = () => {
      clearAuth();
      router.replace("/login");
    };

    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
    return () =>
      window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
  }, [clearAuth, router]);

  return children;
}
