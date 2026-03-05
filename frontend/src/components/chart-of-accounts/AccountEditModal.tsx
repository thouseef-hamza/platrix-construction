"use client";

import React, { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import Label from "@/components/form/Label";
import type { Account, AccountType } from "@/types/chartOfAccounts";

const inputClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800";
const selectClass = inputClass;

const ACCOUNT_TYPES: { value: AccountType; label: string }[] = [
  { value: "asset", label: "Asset" },
  { value: "liability", label: "Liability" },
  { value: "equity", label: "Equity" },
  { value: "revenue", label: "Revenue" },
  { value: "expense", label: "Expense" },
];

interface AccountEditModalProps {
  account: Account | null;
  accounts: Account[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: number, data: { code: string; name: string; type: AccountType; parentId: number | null; isActive: boolean }) => void;
  isSubmitting?: boolean;
}

export default function AccountEditModal({
  account,
  accounts,
  isOpen,
  onClose,
  onSave,
  isSubmitting = false,
}: AccountEditModalProps) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("asset");
  const [parentId, setParentId] = useState("");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (account) {
      setCode(account.code);
      setName(account.name);
      setType(account.type);
      setParentId(account.parentId != null ? String(account.parentId) : "");
      setIsActive(account.isActive);
    }
  }, [account, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) return;
    onSave(account.id, {
      code: code.trim(),
      name: name.trim(),
      type,
      parentId: parentId ? Number(parentId) : null,
      isActive,
    });
    onClose();
  };

  if (!account) return null;

  const parentOptions = accounts
    .filter((a) => a.type === type && a.id !== account.id)
    .map((a) => (
      <option key={a.id} value={a.id}>
        {a.code} – {a.name}
      </option>
    ));

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[95vw] w-full mx-4">
      <form onSubmit={handleSubmit} className="p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Edit Account
        </h2>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Code</Label>
              <input
                type="text"
                className={inputClass}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. 1110"
                required
              />
            </div>
            <div>
              <Label>Name</Label>
              <input
                type="text"
                className={inputClass}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Cash and Bank"
                required
              />
            </div>
          </div>
          <div>
            <Label>Type</Label>
            <select
              className={selectClass}
              value={type}
              onChange={(e) => {
                setType(e.target.value as AccountType);
                setParentId("");
              }}
            >
              {ACCOUNT_TYPES.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Parent account (optional)</Label>
            <select
              className={selectClass}
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
            >
              <option value="">None</option>
              {parentOptions}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="account-edit-active"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800"
            />
            <Label htmlFor="account-edit-active" className="mb-0">Active</Label>
          </div>
        </div>
        <div className="mt-8 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 disabled:opacity-50 disabled:pointer-events-none"
          >
            {isSubmitting ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
