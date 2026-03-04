"use client";

import React from "react";
import { Modal } from "@/components/ui/modal";

interface ConfirmMarkPaidModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ConfirmMarkPaidModal({
  isOpen,
  onClose,
  onConfirm,
}: ConfirmMarkPaidModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[95vw] w-full mx-4">
      <div className="p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Mark as Paid
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Accounts Payable will be reduced and the amount will be recorded in the Expense account.
        </p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
          >
            Mark as Paid
          </button>
        </div>
      </div>
    </Modal>
  );
}
