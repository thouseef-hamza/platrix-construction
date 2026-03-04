"use client";

import React from "react";
import { Modal } from "@/components/ui/modal";

interface ConfirmPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  /** Optional title. Default: "Post Purchase" */
  title?: string;
  /** Optional message. Default: standard post warning. */
  message?: string;
}

const defaultMessage =
  "This action cannot be undone. The entry will be recorded in the accounts.";

export default function ConfirmPostModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Post Purchase",
  message = defaultMessage,
}: ConfirmPostModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md mx-4">
      <div className="p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {title}
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          {message}
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
            className="rounded-lg bg-warning-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-warning-600"
          >
            Post
          </button>
        </div>
      </div>
    </Modal>
  );
}
