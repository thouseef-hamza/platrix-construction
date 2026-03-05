"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import Label from "@/components/form/Label";
import DatePicker from "@/components/form/date-picker";
import type { AddSalaryPayload, UpdateSalaryPayload } from "@/lib/employeesApi";
import type { EmployeeSalaryEntry } from "@/types/employee";

const inputClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800";
const selectClass = inputClass;

interface AddSalaryEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeName?: string;
  /** When set, modal works in edit mode for a draft entry. */
  entryToEdit?: EmployeeSalaryEntry | null;
  onSubmit: (payload: AddSalaryPayload) => void;
  onUpdate?: (entryId: number, payload: UpdateSalaryPayload) => void;
  isSubmitting?: boolean;
}

export default function AddSalaryEntryModal({
  isOpen,
  onClose,
  employeeName,
  entryToEdit,
  onSubmit,
  onUpdate,
  isSubmitting = false,
}: AddSalaryEntryModalProps) {
  const [date, setDate] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "bank">("bank");

  const isEditMode = Boolean(entryToEdit && entryToEdit.status === "draft");

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && entryToEdit) {
        setDate(entryToEdit.date.slice(0, 10));
        setAmount(String(entryToEdit.amount));
        setDescription(entryToEdit.description ?? "");
        setPaymentMethod(entryToEdit.paymentMethod ?? "bank");
      } else {
        setDate(new Date().toISOString().slice(0, 10));
        setAmount("");
        setDescription("");
        setPaymentMethod("bank");
      }
    }
  }, [isOpen, isEditMode, entryToEdit]);

  const handleSubmit = (status: "draft" | "posted") => {
    const amt = parseFloat(amount) || 0;
    if (!date || amt < 0) return;
    if (isEditMode && entryToEdit && onUpdate) {
      onUpdate(entryToEdit.id, {
        date,
        amount: amt,
        description: description.trim() || undefined,
        payment_method: paymentMethod,
        status,
      });
    } else {
      onSubmit({
        date,
        amount: amt,
        description: description.trim() || undefined,
        payment_method: paymentMethod,
        status,
      });
    }
  };

  const canSubmit = date && (parseFloat(amount) || 0) >= 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-md w-full mx-4"
    >
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
          {isEditMode ? "Edit salary entry" : "Add salary entry"}
        </h2>
        {employeeName && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            {employeeName}
          </p>
        )}
        {!employeeName && <div className="mb-6" />}

        <div className="space-y-4">
          <div>
            <Label>Date</Label>
            <DatePicker
              id="salary-entry-date"
              placeholder="Select date"
              value={date}
              onChange={(_, dateStr) => setDate(dateStr ?? "")}
            />
          </div>
          <div>
            <Label>Amount (QAR)</Label>
            <input
              type="number"
              min={0}
              step="0.01"
              className={inputClass}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
            />
          </div>
          <div>
            <Label>Payment method</Label>
            <select
              className={selectClass}
              value={paymentMethod}
              onChange={(e) =>
                setPaymentMethod(e.target.value as "cash" | "bank")
              }
            >
              <option value="cash">Cash</option>
              <option value="bank">Bank</option>
            </select>
          </div>
          <div>
            <Label>Description</Label>
            <input
              type="text"
              className={inputClass}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Advance, Bonus, Remaining amount"
            />
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canSubmit || isSubmitting}
            onClick={() => handleSubmit("draft")}
            className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:pointer-events-none"
          >
            {isSubmitting ? "Saving…" : "Draft"}
          </button>
          <button
            type="button"
            disabled={!canSubmit || isSubmitting}
            onClick={() => handleSubmit("posted")}
            className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 disabled:pointer-events-none"
          >
            {isSubmitting ? "Posting…" : "Post"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
