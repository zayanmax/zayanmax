export type AuthUser = {
  id: string;
  companyId: string;
  employeeId: string | null;
  email: string;
  permissions: string[];
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type LoginResponse = AuthTokens & {
  sessionId: string;
  user: AuthUser;
};

export type RefreshResponse = AuthTokens & {
  sessionId?: string;
};

export type AuthSession = {
  tokens: AuthTokens;
  sessionId: string | null;
  user: AuthUser | null;
};
