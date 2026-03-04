"use client";

import React from "react";
import { Modal } from "@/components/ui/modal";
import { formatCurrency, getBalanceColorClass } from "@/utils/format";
import type { Account, AccountType } from "@/types/chartOfAccounts";

const TYPE_LABELS: Record<AccountType, string> = {
  asset: "Asset",
  liability: "Liability",
  equity: "Equity",
  revenue: "Revenue",
  expense: "Expense",
};

interface AccountViewModalProps {
  account: Account | null;
  accounts: Account[];
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (id: number, updates: Partial<Account>) => void;
}

export default function AccountViewModal({
  account,
  accounts,
  isOpen,
  onClose,
}: AccountViewModalProps) {
  if (!account) return null;

  const parent = account.parentId
    ? accounts.find((a) => a.id === account.parentId)
    : null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg mx-4">
      <div className="p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Account Details
        </h2>
        <dl className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Code
              </dt>
              <dd className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                {account.code}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Name
              </dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                {account.name}
              </dd>
            </div>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Type
            </dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white">
              {TYPE_LABELS[account.type]}
            </dd>
          </div>
          {parent && (
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Parent account
              </dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                {parent.code} – {parent.name}
              </dd>
            </div>
          )}
          <div>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Balance
            </dt>
            <dd
              className={`mt-1 text-sm font-medium tabular-nums ${getBalanceColorClass(
                account.type,
                account.balance ?? 0
              )}`}
            >
              {formatCurrency(account.balance)}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Status
            </dt>
            <dd className="mt-1">
              <span
                className={
                  account.isActive
                    ? "inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400"
                    : "inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                }
              >
                {account.isActive ? "Active" : "Inactive"}
              </span>
            </dd>
          </div>
        </dl>
      </div>
    </Modal>
  );
}
