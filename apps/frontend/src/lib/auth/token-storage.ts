import type { AuthSession } from "@/types/auth";

const ACCESS_TOKEN_KEY = "zayanmax.accessToken";
const REFRESH_TOKEN_KEY = "zayanmax.refreshToken";
const SESSION_ID_KEY = "zayanmax.sessionId";
const USER_KEY = "zayanmax.user";

const isBrowser = () => typeof window !== "undefined";

export function getStoredSession(): AuthSession {
  if (!isBrowser()) {
    return {
      tokens: { accessToken: "", refreshToken: "" },
      sessionId: null,
      user: null,
    };
  }

  const rawUser = window.localStorage.getItem(USER_KEY);

  return {
    tokens: {
      accessToken: window.localStorage.getItem(ACCESS_TOKEN_KEY) ?? "",
      refreshToken: window.localStorage.getItem(REFRESH_TOKEN_KEY) ?? "",
    },
    sessionId: window.localStorage.getItem(SESSION_ID_KEY),
    user: rawUser ? JSON.parse(rawUser) : null,
  };
}

export function saveAuthSession(session: AuthSession) {
  if (!isBrowser()) return;

  window.localStorage.setItem(ACCESS_TOKEN_KEY, session.tokens.accessToken);
  window.localStorage.setItem(REFRESH_TOKEN_KEY, session.tokens.refreshToken);
  if (session.sessionId) {
    window.localStorage.setItem(SESSION_ID_KEY, session.sessionId);
  } else {
    window.localStorage.removeItem(SESSION_ID_KEY);
  }
  if (session.user) {
    window.localStorage.setItem(USER_KEY, JSON.stringify(session.user));
  }
}

export function updateStoredTokens(
  accessToken: string,
  refreshToken: string,
  sessionId?: string | null,
) {
  if (!isBrowser()) return;

  window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  if (sessionId) window.localStorage.setItem(SESSION_ID_KEY, sessionId);
}

export function clearAuthSession() {
  if (!isBrowser()) return;

  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  window.localStorage.removeItem(SESSION_ID_KEY);
  window.localStorage.removeItem(USER_KEY);
}
