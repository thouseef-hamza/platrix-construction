"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import Label from "@/components/form/Label";
import DatePicker from "@/components/form/date-picker";
import type { Bill } from "@/types/bill";
import type { SubcontractorRef, ProjectRef } from "@/types/bill";

const inputClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800";
const selectClass = inputClass;

interface BillCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: ProjectRef[];
  subcontractors: SubcontractorRef[];
  onCreate: (data: Omit<Bill, "id">) => void;
  /** When provided (and status is draft), modal works in edit mode. */
  bill?: Bill | null;
  onUpdate?: (id: string, updates: Partial<Bill>) => void;
}

export default function BillCreateModal({
  isOpen,
  onClose,
  projects,
  subcontractors,
  onCreate,
  bill: billToEdit,
  onUpdate,
}: BillCreateModalProps) {
  const [projectId, setProjectId] = useState("");
  const [subId, setSubId] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [reference, setReference] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);

  const isEditMode = Boolean(billToEdit && billToEdit.status === "draft" && onUpdate);

  useEffect(() => {
    if (!isOpen) return;
    if (billToEdit && billToEdit.status === "draft") {
      setProjectId(billToEdit.project.id);
      setSubId(billToEdit.subcontractor.id);
      setAmount(String(billToEdit.amount));
      setDate(billToEdit.date);
      setReference(billToEdit.reference);
      setFiles(null);
    } else {
      setProjectId("");
      setSubId("");
      setAmount("");
      setDate("");
      setReference("");
      setFiles(null);
    }
  }, [isOpen, billToEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const project = projects.find((p) => p.id === projectId);
    const sub = subcontractors.find((s) => s.id === subId);
    if (!project || !sub) return;
    const amt = parseFloat(amount) || 0;
    const newAttachments = files ? Array.from(files).map((f) => ({ name: f.name })) : [];
    const existingAttachments = billToEdit?.attachments ?? [];
    const attachments =
      newAttachments.length > 0
        ? [...existingAttachments, ...newAttachments]
        : existingAttachments.length > 0
          ? existingAttachments
          : undefined;

    if (isEditMode && billToEdit) {
      onUpdate!(billToEdit.id, {
        project,
        subcontractor: sub,
        amount: amt,
        date: date || new Date().toISOString().slice(0, 10),
        reference: reference.trim() || "—",
        attachments,
      });
    } else {
      onCreate({
        project,
        subcontractor: sub,
        amount: amt,
        date: date || new Date().toISOString().slice(0, 10),
        reference: reference.trim() || "—",
        status: "draft",
        attachments,
      });
    }
    setProjectId("");
    setSubId("");
    setAmount("");
    setDate("");
    setReference("");
    setFiles(null);
    onClose();
  };

  const handleClose = () => {
    setProjectId("");
    setSubId("");
    setAmount("");
    setDate("");
    setReference("");
    setFiles(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-[95vw] w-full mx-4">
      <form onSubmit={handleSubmit} className="p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          {isEditMode ? "Edit Subcontractor Invoice" : "Create Subcontractor Invoice"}
        </h2>
        <div className="space-y-4">
          <div>
            <Label>Project</Label>
            <select
              className={selectClass}
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              required
              disabled={isEditMode}
            >
              <option value="">Select project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            {isEditMode && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Project cannot be changed when editing.</p>
            )}
          </div>
          <div>
            <Label>Subcontractor</Label>
            <select
              className={selectClass}
              value={subId}
              onChange={(e) => setSubId(e.target.value)}
              required
            >
              <option value="">Select subcontractor</option>
              {subcontractors.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Reference / Bill #</Label>
            <input
              type="text"
              className={inputClass}
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. BL-2024-001"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
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
                required
              />
            </div>
            <div>
              <DatePicker
                id="bill-date"
                label="Date"
                placeholder="Select date"
                value={date}
                onChange={(_, dateStr) => setDate(dateStr ?? "")}
              />
            </div>
          </div>
          <div>
            <Label>Upload documents</Label>
            {isEditMode && (billToEdit?.attachments?.length ?? 0) > 0 && (
              <p className="mb-1.5 text-xs text-gray-500 dark:text-gray-400">
                Existing: {billToEdit!.attachments!.map((a) => a.name).join(", ")}
              </p>
            )}
            <input
              type="file"
              multiple
              className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-2.5 file:text-sm file:font-medium file:text-brand-600 hover:file:bg-brand-100 dark:file:bg-brand-500/10 dark:file:text-brand-400"
              onChange={(e) => setFiles(e.target.files ?? null)}
            />
            {files?.length ? (
              <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                {isEditMode ? `${files.length} new file(s) selected` : `${files.length} file(s) selected`}
              </p>
            ) : null}
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
            {isEditMode ? "Save changes" : "Create"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
