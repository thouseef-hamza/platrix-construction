"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "@/context/AccountContext";
import { ChevronDownIcon } from "@/icons/index";

export default function AccountSwitcher() {
  const router = useRouter();
  const { currentAccount, accounts, switchAccount } = useAccount();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-left shadow-theme-xs transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800 min-w-[180px]"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label="Switch account"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-500/10 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400">
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
        </span>
        <span className="flex-1 truncate text-left">
          <span className="block text-sm font-medium text-gray-900 dark:text-white">
            {currentAccount?.name ?? "Select account"}
          </span>
          {currentAccount?.companyCode && (
            <span className="block text-xs text-gray-500 dark:text-gray-400">
              {currentAccount.companyCode}
            </span>
          )}
        </span>
        <ChevronDownIcon
          className={`h-5 w-5 shrink-0 text-gray-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div
          className="absolute left-0 right-0 top-full z-50 mt-2 rounded-xl border border-gray-200 bg-white py-1 shadow-theme-lg dark:border-gray-800 dark:bg-gray-900"
          role="listbox"
        >
          {accounts.map((account) => (
            <button
              key={account.id}
              type="button"
              role="option"
              aria-selected={currentAccount?.id === account.id}
              onClick={() => {
                switchAccount(account.id);
                setIsOpen(false);
                router.push(`/accounts/${account.id}`);
              }}
              className={`flex w-full items-center gap-2 px-3 py-2.5 text-left transition-colors ${
                currentAccount?.id === account.id
                  ? "bg-brand-500/10 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400"
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              }`}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                  {account.name.charAt(0)}
                </span>
              </span>
              <div className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">
                  {account.name}
                </span>
                {account.companyCode && (
                  <span className="block truncate text-xs text-gray-500 dark:text-gray-400">
                    {account.companyCode}
                  </span>
                )}
              </div>
              {currentAccount?.id === account.id && (
                <svg
                  className="h-5 w-5 shrink-0 text-brand-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
