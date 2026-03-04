"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { login as apiLogin, type LoginResponse, setAuthToken } from "@/lib/api";

export type AuthUser = LoginResponse["user"];
export type AuthAccount = LoginResponse["accounts"][number];

const AUTH_STORAGE_KEY = "bf_auth";

function loadStored(): Partial<{
  token: string;
  user: AuthUser;
  accounts: AuthAccount[];
}> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Partial<{
      token: string;
      user: AuthUser;
      accounts: AuthAccount[];
    }>;
  } catch {
    return {};
  }
}

function saveStored(data: { token: string; user: AuthUser; accounts: AuthAccount[] } | null) {
  if (typeof window === "undefined") return;
  if (!data) {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return;
  }
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
}

type AuthContextType = {
  token: string | null;
  user: AuthUser | null;
  accounts: AuthAccount[];
  isAuthenticated: boolean;
  /** False until stored auth has been read from localStorage (avoids flash redirect). */
  authReady: boolean;
  login: (email: string, password: string) => Promise<LoginResponse>;
  logout: () => void;
  getAuthHeaders: () => Record<string, string>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accounts, setAccounts] = useState<AuthAccount[]>([]);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const stored = loadStored();
    if (stored.token && stored.user && stored.accounts) {
      setToken(stored.token);
      setUser(stored.user);
      setAccounts(stored.accounts);
      setAuthToken(stored.token);
    }
    setAuthReady(true);
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<LoginResponse> => {
    const payload = await apiLogin(email, password);
    const authData = {
      token: payload.token,
      user: payload.user,
      accounts: payload.accounts,
    };
    setToken(authData.token);
    setUser(authData.user);
    setAccounts(authData.accounts);
    setAuthToken(authData.token);
    saveStored(authData);
    return payload;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setAccounts([]);
    setAuthToken(null);
    saveStored(null);
  }, []);

  const getAuthHeaders = useCallback((): Record<string, string> => {
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
  }, [token]);

  const value: AuthContextType = {
    token,
    user,
    accounts,
    isAuthenticated: !!token && !!user,
    authReady,
    login,
    logout,
    getAuthHeaders,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
