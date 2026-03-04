"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { setCurrentAccountId } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export type Account = {
  id: number;
  name: string;
  companyCode?: string;
};

type AccountContextType = {
  currentAccount: Account | null;
  accounts: Account[];
  setCurrentAccount: (account: Account) => void;
  switchAccount: (accountId: number) => void;
  setAccounts: (accounts: Account[]) => void;
};

const AccountContext = createContext<AccountContextType | undefined>(undefined);
const CURRENT_ACCOUNT_KEY = "bf_current_account_id";

export const useAccount = () => {
  const context = useContext(AccountContext);
  if (!context) {
    throw new Error("useAccount must be used within an AccountProvider");
  }
  return context;
};

function loadCurrentAccountId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(CURRENT_ACCOUNT_KEY);
  } catch {
    return null;
  }
}

function saveCurrentAccountId(id: number | string | null) {
  if (typeof window === "undefined") return;
  if (id != null) localStorage.setItem(CURRENT_ACCOUNT_KEY, String(id));
  else localStorage.removeItem(CURRENT_ACCOUNT_KEY);
}

export const AccountProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated, accounts: authAccounts } = useAuth();
  const [currentAccountId, setCurrentAccountIdState] = useState<number | null>(null);

  const accounts: Account[] = isAuthenticated
    ? authAccounts.map((a) => ({
        id: a.id,
        name: a.name,
        companyCode: a.role_display || undefined,
      }))
    : [];

  const currentAccount =
    accounts.find((a) => a.id === currentAccountId) ?? accounts[0] ?? null;

  useEffect(() => {
    if (!accounts.length) {
      setCurrentAccountIdState(null);
      saveCurrentAccountId(null);
      setCurrentAccountId(null);
      return;
    }
    const storedId = loadCurrentAccountId();
    const parsed = storedId ? parseInt(storedId, 10) : NaN;
    const valid = !Number.isNaN(parsed) && accounts.some((a) => a.id === parsed);
    const nextId = valid ? parsed : accounts[0].id;
    setCurrentAccountIdState(nextId);
    saveCurrentAccountId(nextId);
    setCurrentAccountId(nextId);
  }, [isAuthenticated, authAccounts]);

  useEffect(() => {
    setCurrentAccountId(currentAccount?.id ?? null);
  }, [currentAccount?.id]);

  const setCurrentAccount = useCallback((account: Account) => {
    setCurrentAccountIdState(account.id);
    saveCurrentAccountId(account.id);
    setCurrentAccountId(account.id);
  }, []);

  const switchAccount = useCallback((accountId: number) => {
    setCurrentAccountIdState(accountId);
    saveCurrentAccountId(accountId);
    setCurrentAccountId(accountId);
  }, []);

  const setAccounts = useCallback((_newAccounts: Account[]) => {
    // No-op: accounts are driven by AuthContext when authenticated
  }, []);

  return (
    <AccountContext.Provider
      value={{
        currentAccount,
        accounts,
        setCurrentAccount,
        switchAccount,
        setAccounts,
      }}
    >
      {children}
    </AccountContext.Provider>
  );
};
