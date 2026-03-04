"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

export type Account = {
  id: string;
  name: string;
  companyCode?: string;
};

type AccountContextType = {
  currentAccount: Account | null;
  accounts: Account[];
  setCurrentAccount: (account: Account) => void;
  switchAccount: (accountId: string) => void;
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

function saveCurrentAccountId(id: string | null) {
  if (typeof window === "undefined") return;
  if (id) localStorage.setItem(CURRENT_ACCOUNT_KEY, id);
  else localStorage.removeItem(CURRENT_ACCOUNT_KEY);
}

export const AccountProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated, accounts: authAccounts } = useAuth();
  const [currentAccountId, setCurrentAccountIdState] = useState<string | null>(null);

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
      return;
    }
    const storedId = loadCurrentAccountId();
    const valid = storedId && accounts.some((a) => a.id === storedId);
    const nextId = valid ? storedId : accounts[0].id;
    setCurrentAccountIdState(nextId);
    if (!valid) saveCurrentAccountId(nextId);
  }, [isAuthenticated, authAccounts]);

  const setCurrentAccount = useCallback((account: Account) => {
    setCurrentAccountIdState(account.id);
    saveCurrentAccountId(account.id);
  }, []);

  const switchAccount = useCallback((accountId: string) => {
    setCurrentAccountIdState(accountId);
    saveCurrentAccountId(accountId);
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
