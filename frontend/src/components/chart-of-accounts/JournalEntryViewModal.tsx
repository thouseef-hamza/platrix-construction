"use client";

import React from "react";
import { Modal } from "@/components/ui/modal";
import { formatCurrency, formatDate } from "@/utils/format";
import type { JournalEntry } from "@/types/chartOfAccounts";

interface JournalEntryViewModalProps {
  entry: JournalEntry | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function JournalEntryViewModal({
  entry,
  isOpen,
  onClose,
}: JournalEntryViewModalProps) {
  if (!entry) return null;

  const totalDebit = entry.lines.reduce((s, l) => s + l.debit, 0);
  const totalCredit = entry.lines.reduce((s, l) => s + l.credit, 0);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
    >
      <div className="p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Journal Entry
        </h2>
        <dl className="space-y-4 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Number
              </dt>
              <dd className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                {entry.number}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Date
              </dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                {formatDate(entry.date)}
              </dd>
            </div>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Description
            </dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white">
              {entry.description}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Status
            </dt>
            <dd className="mt-1">
              <span
                className={
                  entry.status === "posted"
                    ? "inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400"
                    : "inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                }
              >
                {entry.status}
              </span>
            </dd>
          </div>
        </dl>
        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Lines
          </h3>
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-white/[0.04]">
                  <th className="px-3 py-2 text-left font-medium text-gray-500 dark:text-gray-400">
                    Account
                  </th>
                  <th className="px-3 py-2 text-right font-medium text-gray-500 dark:text-gray-400 w-28">
                    Debit (QAR)
                  </th>
                  <th className="px-3 py-2 text-right font-medium text-gray-500 dark:text-gray-400 w-28">
                    Credit (QAR)
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-gray-500 dark:text-gray-400">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody>
                {entry.lines.map((line) => (
                  <tr
                    key={line.id}
                    className="border-b border-gray-100 dark:border-gray-800"
                  >
                    <td className="px-3 py-2 text-gray-900 dark:text-white">
                      {line.accountCode} – {line.accountName}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-gray-700 dark:text-gray-300">
                      {line.debit > 0 ? formatCurrency(line.debit) : "—"}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-gray-700 dark:text-gray-300">
                      {line.credit > 0 ? formatCurrency(line.credit) : "—"}
                    </td>
                    <td className="px-3 py-2 text-gray-600 dark:text-gray-400">
                      {line.description ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-2 flex justify-end gap-6 text-sm font-medium tabular-nums text-gray-900 dark:text-white">
            <span>Total Debit: {formatCurrency(totalDebit)}</span>
            <span>Total Credit: {formatCurrency(totalCredit)}</span>
          </div>
        </div>
      </div>
    </Modal>
  );
}
