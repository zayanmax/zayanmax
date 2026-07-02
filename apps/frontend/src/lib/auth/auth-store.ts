"use client";

import { create } from "zustand";
import { authApi } from "@/lib/api/endpoints";
import {
  clearAuthSession,
  getStoredSession,
  saveAuthSession,
} from "@/lib/auth/token-storage";
import type { AuthTokens, AuthUser, LoginResponse } from "@/types/auth";

type AuthState = {
  user: AuthUser | null;
  tokens: AuthTokens | null;
  sessionId: string | null;
  isHydrated: boolean;
  isLoadingUser: boolean;
  initializeFromStorage: () => void;
  refreshUser: () => Promise<void>;
  setAuthenticated: (response: LoginResponse) => void;
  setUser: (user: AuthUser | null) => void;
  clearAuth: () => void;
  hasPermission: (permission?: string | string[]) => boolean;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  tokens: null,
  sessionId: null,
  isHydrated: false,
  isLoadingUser: false,

  initializeFromStorage: () => {
    const session = getStoredSession();
    set({
      user: session.user,
      tokens: session.tokens.accessToken ? session.tokens : null,
      sessionId: session.sessionId,
      isHydrated: true,
    });
  },

  refreshUser: async () => {
    const { tokens } = get();
    if (!tokens?.accessToken) return;

    set({ isLoadingUser: true });
    try {
      const user = await authApi.me();
      const current = getStoredSession();
      saveAuthSession({ ...current, user });
      set({ user, isLoadingUser: false });
    } catch {
      get().clearAuth();
      set({ isLoadingUser: false });
    }
  },

  setAuthenticated: (response) => {
    const session = {
      tokens: {
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
      },
      sessionId: response.sessionId,
      user: response.user,
    };
    saveAuthSession(session);
    set({
      user: response.user,
      tokens: session.tokens,
      sessionId: response.sessionId,
      isHydrated: true,
    });
  },

  setUser: (user) => set({ user }),

  clearAuth: () => {
    clearAuthSession();
    set({ user: null, tokens: null, sessionId: null, isHydrated: true });
  },

  hasPermission: (permission) => {
    if (!permission) return true;
    const permissions = get().user?.permissions ?? [];
    const required = Array.isArray(permission) ? permission : [permission];
    return required.every((key) => permissions.includes(key));
  },
}));
