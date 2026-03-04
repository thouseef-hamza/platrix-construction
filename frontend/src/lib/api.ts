import axios, { type AxiosError } from "axios";

export const API_BASE_URL =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api")
    : process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

let authToken: string | null = null;
let storedRefreshToken: string | null = null;
let currentAccountId: number | null = null;

/** Set the JWT for the axios instance. Call from AuthContext on login/logout. */
export function setAuthToken(token: string | null) {
  authToken = token;
}

/** Set the refresh token (used to get new access token). Call from AuthContext. */
export function setRefreshToken(token: string | null) {
  storedRefreshToken = token;
}

/** Get current refresh token (used by refresh interceptor). */
export function getRefreshToken(): string | null {
  return storedRefreshToken;
}

/** Callback when token is refreshed (so AuthContext can update state and storage). */
let onTokenRefreshed: ((token: string, refresh: string) => void) | null = null;
export function setOnTokenRefreshed(cb: ((token: string, refresh: string) => void) | null) {
  onTokenRefreshed = cb;
}

/** Set current account id for x-account-id header. Call from AccountContext when current account changes. */
export function setCurrentAccountId(id: number | null) {
  currentAccountId = id;
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  if (currentAccountId != null) {
    config.headers["x-account-id"] = String(currentAccountId);
  }
  return config;
});

let refreshPromise: Promise<{ token: string; refresh: string }> | null = null;

/** Call backend to exchange refresh token for new access (and refresh) tokens. */
export async function refreshAuth(): Promise<{ token: string; refresh: string }> {
  const r = getRefreshToken();
  if (!r) {
    throw new Error("No refresh token");
  }
  const { data } = await axios.post<{ token: string; refresh: string }>(
    `${API_BASE_URL}/auth/refresh/`,
    { refresh: r },
    { headers: { "Content-Type": "application/json" } }
  );
  return data;
}

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;
    if (err.response?.status !== 401 || originalRequest._retryAfterRefresh) {
      return Promise.reject(err);
    }
    if (!getRefreshToken()) {
      return Promise.reject(err);
    }
    if (!refreshPromise) {
      refreshPromise = refreshAuth()
        .then((data) => {
          setAuthToken(data.token);
          setRefreshToken(data.refresh);
          onTokenRefreshed?.(data.token, data.refresh);
          return data;
        })
        .finally(() => {
          refreshPromise = null;
        });
    }
    try {
      const data = await refreshPromise;
      originalRequest._retryAfterRefresh = true;
      originalRequest.headers.Authorization = `Bearer ${data.token}`;
      return api(originalRequest);
    } catch {
      return Promise.reject(err);
    }
  }
);

export type LoginResponse = {
  token: string;
  refresh: string;
  user: {
    id: number;
    email: string;
    name: string;
    is_active: boolean;
    is_staff: boolean;
    is_superuser: boolean;
    created_at: string;
  };
  accounts: Array<{
    id: number;
    name: string;
    status: number;
    role: number;
    role_display: string;
  }>;
};

export type RefreshResponse = {
  token: string;
  refresh: string;
};

export async function login(
  email: string,
  password: string
): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>("/auth/login/", {
    email,
    password,
  });
  return data;
}

/** Exchange a refresh token for new access and refresh tokens (e.g. for manual refresh). */
export async function refreshTokenRequest(
  refresh: string
): Promise<RefreshResponse> {
  const { data } = await api.post<RefreshResponse>("/auth/refresh/", {
    refresh,
  });
  return data;
}

/** Extract error message from axios error (e.g. API detail or network). */
export function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const ax = err as AxiosError<{ detail?: string }>;
    return ax.response?.data?.detail ?? ax.message ?? "Request failed.";
  }
  return err instanceof Error ? err.message : "Request failed.";
}
