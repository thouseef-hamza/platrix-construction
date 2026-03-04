"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

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

const DEFAULT_ACCOUNTS: Account[] = [
  { id: "1", name: "Default Company", companyCode: "DEF-001" },
  { id: "2", name: "ABC Construction", companyCode: "ABC-002" },
  { id: "3", name: "XYZ Builders", companyCode: "XYZ-003" },
];

export const useAccount = () => {
  const context = useContext(AccountContext);
  if (!context) {
    throw new Error("useAccount must be used within an AccountProvider");
  }
  return context;
};

export const AccountProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [accounts, setAccountsState] = useState<Account[]>(DEFAULT_ACCOUNTS);
  const [currentAccount, setCurrentAccountState] = useState<Account | null>(
    DEFAULT_ACCOUNTS[0] ?? null
  );

  const setCurrentAccount = useCallback((account: Account) => {
    setCurrentAccountState(account);
  }, []);

  const switchAccount = useCallback(
    (accountId: string) => {
      const account = accounts.find((a) => a.id === accountId);
      if (account) setCurrentAccountState(account);
    },
    [accounts]
  );

  const setAccounts = useCallback((newAccounts: Account[]) => {
    setAccountsState(newAccounts);
    setCurrentAccountState((prev) => {
      if (!prev) return newAccounts[0] ?? null;
      const stillExists = newAccounts.find((a) => a.id === prev.id);
      return stillExists ?? newAccounts[0] ?? null;
    });
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
