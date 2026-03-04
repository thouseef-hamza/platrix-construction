"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import Label from "@/components/form/Label";
import type { Company } from "@/types/company";

const inputClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800";

interface CompanyCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  onCreate: (data: Omit<Company, "id">) => void;
}

export default function CompanyCreateModal({
  isOpen,
  onClose,
  title,
  onCreate,
}: CompanyCreateModalProps) {
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onCreate({ name: trimmed });
    setName("");
    onClose();
  };

  const handleClose = () => {
    setName("");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-md mx-4">
      <form onSubmit={handleSubmit} className="p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Add {title.slice(0, -1)}
        </h2>
        <div className="space-y-4">
          <div>
            <Label>Company Name</Label>
            <input
              type="text"
              className={inputClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter company name"
              required
            />
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
            className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
          >
            Create
          </button>
        </div>
      </form>
    </Modal>
  );
}
