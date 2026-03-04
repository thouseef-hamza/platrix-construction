import axios, { type AxiosError } from "axios";

export const API_BASE_URL =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api")
    : process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

let authToken: string | null = null;
let currentAccountId: number | null = null;

/** Set the JWT for the axios instance. Call from AuthContext on login/logout. */
export function setAuthToken(token: string | null) {
  authToken = token;
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

/** Extract error message from axios error (e.g. API detail or network). */
export function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const ax = err as AxiosError<{ detail?: string }>;
    return ax.response?.data?.detail ?? ax.message ?? "Request failed.";
  }
  return err instanceof Error ? err.message : "Request failed.";
}
