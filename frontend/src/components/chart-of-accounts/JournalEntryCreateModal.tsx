"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Modal } from "@/components/ui/modal";
import Label from "@/components/form/Label";
import DatePicker from "@/components/form/date-picker";
import type { Account, JournalEntryStatus } from "@/types/chartOfAccounts";
import { formatCurrency } from "@/utils/format";
import {
  fetchJournalEntryNextNumber,
  type CreateJournalEntryPayload,
} from "@/lib/accountingApi";

const inputClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800";
const inputSm =
  "h-10 rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:focus:border-brand-800";

interface LineRow {
  id: string;
  accountId: string;
  debit: string;
  credit: string;
  description: string;
}

interface JournalEntryCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  onCreate: (data: CreateJournalEntryPayload) => void;
  isSubmitting?: boolean;
}

export default function JournalEntryCreateModal({
  isOpen,
  onClose,
  accounts,
  onCreate,
  isSubmitting = false,
}: JournalEntryCreateModalProps) {
  const { data: nextNumber } = useQuery({
    queryKey: ["journal-entry-next-number"],
    queryFn: () => fetchJournalEntryNextNumber(),
    enabled: isOpen,
  });
  useEffect(() => {
    if (isOpen && nextNumber) setNumber(nextNumber);
  }, [isOpen, nextNumber]);

  const [number, setNumber] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<JournalEntryStatus>("draft");
  const [lines, setLines] = useState<LineRow[]>([
    { id: "l1", accountId: "", debit: "", credit: "", description: "" },
    { id: "l2", accountId: "", debit: "", credit: "", description: "" },
  ]);

  const addLine = useCallback(() => {
    setLines((prev) => [
      ...prev,
      {
        id: `l-${Date.now()}`,
        accountId: "",
        debit: "",
        credit: "",
        description: "",
      },
    ]);
  }, []);

  const removeLine = useCallback((id: string) => {
    setLines((prev) => (prev.length > 2 ? prev.filter((r) => r.id !== id) : prev));
  }, []);

  const updateLine = useCallback(
    (id: string, field: keyof LineRow, value: string) => {
      setLines((prev) =>
        prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
      );
    },
    []
  );

  const { totalDebit, totalCredit, isValid } = useMemo(() => {
    let debit = 0;
    let credit = 0;
    let valid = true;
    for (const row of lines) {
      const d = parseFloat(row.debit) || 0;
      const c = parseFloat(row.credit) || 0;
      if (d < 0 || c < 0) valid = false;
      if (d > 0 && c > 0) valid = false;
      debit += d;
      credit += c;
      if (row.accountId && (d > 0 || c > 0)) {
        // at least one line with account and amount
      }
    }
    return {
      totalDebit: debit,
      totalCredit: credit,
      isValid: valid && Math.abs(debit - credit) < 0.01 && debit > 0,
    };
  }, [lines]);

  const resetForm = () => {
    setNumber("");
    setDate("");
    setDescription("");
    setStatus("draft");
    setLines([
      { id: `l-${Date.now()}`, accountId: "", debit: "", credit: "", description: "" },
      { id: `l-${Date.now() + 1}`, accountId: "", debit: "", credit: "", description: "" },
    ]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    const lineItems = lines
      .filter((r) => r.accountId && (parseFloat(r.debit) > 0 || parseFloat(r.credit) > 0))
      .map((r) => {
        const acc = accounts.find((a) => String(a.id) === r.accountId)!;
        return {
          accountId: acc.id,
          debit: parseFloat(r.debit) || 0,
          credit: parseFloat(r.credit) || 0,
          description: r.description.trim() || undefined,
        };
      });
    if (lineItems.length < 2) return;
    onCreate({
      number: number.trim(),
      date: date || new Date().toISOString().slice(0, 10),
      description: description.trim() || "—",
      status,
      lines: lineItems,
    });
    resetForm();
    onClose();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      className="max-w-[95vw] w-full mx-4 max-h-[90vh] overflow-y-auto"
    >
      <form onSubmit={handleSubmit} className="p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Add Journal Entry
        </h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Number</Label>
              <input
                type="text"
                className={inputClass}
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                placeholder="e.g. JE-2024-006"
                required
              />
            </div>
            <div>
              <DatePicker
                id="journal-entry-date"
                label="Date"
                placeholder="Select date"
                value={date}
                onChange={(_, dateStr) => setDate(dateStr ?? "")}
              />
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <input
              type="text"
              className={inputClass}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Monthly accrual"
            />
          </div>
          <div>
            <Label>Status</Label>
            <select
              className={inputClass}
              value={status}
              onChange={(e) => setStatus(e.target.value as JournalEntryStatus)}
            >
              <option value="draft">Draft</option>
              <option value="posted">Posted</option>
            </select>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Lines</Label>
              <button
                type="button"
                onClick={addLine}
                className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
              >
                + Add line
              </button>
            </div>
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
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody>
                  {lines.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-gray-100 dark:border-gray-800"
                    >
                      <td className="px-3 py-2">
                        <select
                          className={inputSm + " w-full min-w-[160px]"}
                          value={row.accountId}
                          onChange={(e) =>
                            updateLine(row.id, "accountId", e.target.value)
                          }
                        >
                          <option value="">Select account</option>
                          {accounts.map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.code} – {a.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          className={inputSm + " w-full text-right"}
                          value={row.debit}
                          onChange={(e) => {
                            updateLine(row.id, "debit", e.target.value);
                            if (parseFloat(e.target.value) > 0)
                              updateLine(row.id, "credit", "");
                          }}
                          placeholder="0"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          className={inputSm + " w-full text-right"}
                          value={row.credit}
                          onChange={(e) => {
                            updateLine(row.id, "credit", e.target.value);
                            if (parseFloat(e.target.value) > 0)
                              updateLine(row.id, "debit", "");
                          }}
                          placeholder="0"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          className={inputSm + " w-full"}
                          value={row.description}
                          onChange={(e) =>
                            updateLine(row.id, "description", e.target.value)
                          }
                          placeholder="Optional"
                        />
                      </td>
                      <td className="px-1 py-2">
                        <button
                          type="button"
                          onClick={() => removeLine(row.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 rounded"
                          aria-label="Remove line"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-2 flex justify-end gap-6 text-sm">
              <span className="tabular-nums text-gray-600 dark:text-gray-400">
                Total Debit: {formatCurrency(totalDebit)}
              </span>
              <span className="tabular-nums text-gray-600 dark:text-gray-400">
                Total Credit: {formatCurrency(totalCredit)}
              </span>
            </div>
            {!isValid && totalDebit + totalCredit > 0 && (
              <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                Debit and credit totals must be equal.
              </p>
            )}
          </div>
        </div>
        <div className="mt-8 flex justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!isValid || isSubmitting}
            className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 disabled:opacity-50 disabled:pointer-events-none"
          >
            {isSubmitting ? "Creating…" : "Create"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
