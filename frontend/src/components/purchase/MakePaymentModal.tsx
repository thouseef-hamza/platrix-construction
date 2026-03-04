"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import DatePicker from "@/components/form/date-picker";
import { formatCurrency } from "@/utils/format";

const inputClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800";

interface MakePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  balance: number;
  onSubmit: (amount: number, paymentDate: string, attachments: { name: string }[]) => void;
}

export default function MakePaymentModal({
  isOpen,
  onClose,
  balance,
  onSubmit,
}: MakePaymentModalProps) {
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);

  useEffect(() => {
    if (isOpen) {
      setAmount("");
      setPaymentDate(new Date().toISOString().slice(0, 10));
      setFiles(null);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(amount) || 0;
    if (amountNum <= 0) return;
    const attachmentNames = files ? Array.from(files).map((f) => ({ name: f.name })) : [];
    onSubmit(amountNum, paymentDate, attachmentNames);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md mx-4">
      <form onSubmit={handleSubmit} className="p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Make payment
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Balance due: {formatCurrency(balance)}
        </p>
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Amount (QAR)
            </label>
            <input
              type="number"
              min={0}
              step="0.01"
              className={inputClass}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              required
            />
          </div>
          <div>
            <DatePicker
              id="make-payment-date"
              label="Date"
              placeholder="Select date"
              value={paymentDate}
              onChange={(_, dateStr) => setPaymentDate(dateStr ?? "")}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Document (optional)
            </label>
            <input
              type="file"
              multiple
              className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-2.5 file:text-sm file:font-medium file:text-brand-600 hover:file:bg-brand-100 dark:file:bg-brand-500/10 dark:file:text-brand-400"
              onChange={(e) => setFiles(e.target.files ?? null)}
            />
            {files?.length ? (
              <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                {files.length} file(s) selected
              </p>
            ) : null}
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
          >
            Add payment
          </button>
        </div>
      </form>
    </Modal>
  );
}
