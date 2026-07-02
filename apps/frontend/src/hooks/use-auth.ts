"use client";

import { useAuthStore } from "@/lib/auth/auth-store";

export function useAuth() {
  return useAuthStore();
}
