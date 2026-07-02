import axios, {
  AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";
import { appConfig } from "@/config/app";
import { notifyUnauthorizedSession } from "@/lib/auth/session-events";
import {
  clearAuthSession,
  getStoredSession,
  updateStoredTokens,
} from "@/lib/auth/token-storage";
import type { StandardApiError, StandardApiResponse } from "@/types/api";
import type { RefreshResponse } from "@/types/auth";

type ApiRequestConfig = AxiosRequestConfig & {
  skipAuth?: boolean;
  _retry?: boolean;
};

export class ApiClientError extends Error {
  status?: number;
  errorCode?: string;
  details?: unknown;

  constructor(
    message: string,
    options?: { status?: number; errorCode?: string; details?: unknown },
  ) {
    super(message);
    this.name = "ApiClientError";
    this.status = options?.status;
    this.errorCode = options?.errorCode;
    this.details = options?.details;
  }
}

const apiClient = axios.create({
  baseURL: appConfig.apiBaseUrl,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const requestConfig = config as InternalAxiosRequestConfig & {
    skipAuth?: boolean;
  };
  if (requestConfig.skipAuth) return requestConfig;

  const { tokens } = getStoredSession();
  if (tokens.accessToken) {
    requestConfig.headers.Authorization = `Bearer ${tokens.accessToken}`;
  }

  return requestConfig;
});

apiClient.interceptors.response.use(
  (response) => unwrapResponse(response.data),
  async (error: AxiosError<StandardApiError>) => {
    const original = error.config as ApiRequestConfig | undefined;
    const status = error.response?.status;

    if (status === 401 && original && !original._retry && !original.skipAuth) {
      original._retry = true;
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        original.headers = {
          ...(original.headers ?? {}),
          Authorization: `Bearer ${refreshed.accessToken}`,
        };
        return apiClient.request(original);
      }

      clearAuthSession();
      notifyUnauthorizedSession();
    }

    throw toApiClientError(error);
  },
);

function unwrapResponse<T>(payload: StandardApiResponse<T> | T): T {
  if (
    payload &&
    typeof payload === "object" &&
    "success" in payload &&
    (payload as StandardApiResponse<T>).success === true
  ) {
    return (payload as StandardApiResponse<T>).data;
  }

  return payload as T;
}

async function refreshAccessToken() {
  const { tokens, sessionId, user } = getStoredSession();
  if (!tokens.refreshToken || !user?.id) return null;

  try {
    const response = await axios.post<StandardApiResponse<RefreshResponse>>(
      `${appConfig.apiBaseUrl}/auth/refresh`,
      {
        userId: user.id,
        refreshToken: tokens.refreshToken,
        sessionId,
      },
    );
    const refreshed = response.data.data;
    updateStoredTokens(
      refreshed.accessToken,
      refreshed.refreshToken,
      refreshed.sessionId ?? sessionId,
    );
    return refreshed;
  } catch {
    return null;
  }
}

function toApiClientError(error: AxiosError<StandardApiError>) {
  const response = error.response;
  const payload = response?.data;

  return new ApiClientError(payload?.message ?? error.message, {
    status: response?.status,
    errorCode: payload?.errorCode,
    details: payload?.details,
  });
}

export async function apiRequest<T>(config: ApiRequestConfig): Promise<T> {
  return apiClient.request<unknown, T>(config);
}
