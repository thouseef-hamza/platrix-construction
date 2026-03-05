"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import Label from "@/components/form/Label";
import DatePicker from "@/components/form/date-picker";
import type { Invoice } from "@/types/invoice";
import type { Company } from "@/types/company";
import { formatCurrency } from "@/utils/format";

const inputClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800";
const selectClass = inputClass;

export interface ProjectOption {
  id: string;
  name: string;
}

interface InvoiceCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  invoiceType: 0 | 1;
  parties: Company[];
  projects?: ProjectOption[];
  onCreate: (payload: {
    party: number;
    invoice_type: 0 | 1;
    project?: number | null;
    reference?: string;
    date: string;
    status: "draft" | "posted";
    payment_method: "cash" | "bank";
    amount: number;
    paid_amount?: number;
    description?: string;
  }) => void;
  invoiceToEdit?: Invoice | null;
  onUpdate?: (id: number, payload: { reference?: string; date?: string; status?: "draft" | "posted"; payment_method?: "cash" | "bank"; amount?: number; paid_amount?: number; description?: string; project?: number | null }) => void;
}

export default function InvoiceCreateModal({
  isOpen,
  onClose,
  title,
  invoiceType,
  parties,
  projects = [],
  onCreate,
  invoiceToEdit,
  onUpdate,
}: InvoiceCreateModalProps) {
  const [partyId, setPartyId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [reference, setReference] = useState("");
  const [date, setDate] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "bank">("bank");
  const [paidAmount, setPaidAmount] = useState("");
  const [status, setStatus] = useState<"draft" | "posted">("draft");
  const [errors, setErrors] = useState<{ party?: string; date?: string; amount?: string; paidAmount?: string }>({});

  const isEditMode = Boolean(invoiceToEdit && invoiceToEdit.status === "draft" && onUpdate);

  useEffect(() => {
    if (!isOpen) return;
    setErrors({});
    if (invoiceToEdit && invoiceToEdit.status === "draft") {
      setPartyId(String(invoiceToEdit.partyId));
      setProjectId(invoiceToEdit.projectId != null ? String(invoiceToEdit.projectId) : "");
      setReference(invoiceToEdit.reference ?? "");
      setDate(invoiceToEdit.date?.slice(0, 10) ?? "");
      setAmount(String(invoiceToEdit.amount ?? ""));
      setDescription(invoiceToEdit.description ?? "");
      setPaymentMethod(invoiceToEdit.paymentMethod ?? "bank");
      setPaidAmount(String(invoiceToEdit.paidAmount ?? ""));
      setStatus(invoiceToEdit.status ?? "draft");
    } else {
      setPartyId("");
      setProjectId("");
      setReference("");
      setDate(new Date().toISOString().slice(0, 10));
      setAmount("");
      setDescription("");
      setPaymentMethod("bank");
      setPaidAmount("");
      setStatus("draft");
    }
  }, [isOpen, invoiceToEdit]);

  const amountNum = parseFloat(amount) || 0;
  const paidNum = parseFloat(paidAmount) || 0;
  const balance = amountNum - paidNum;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: typeof errors = {};
    if (!partyId?.trim()) newErrors.party = "Party is required.";
    if (!date?.trim()) newErrors.date = "Date is required.";
    if (amountNum <= 0) newErrors.amount = "Amount must be greater than 0.";
    if (paidNum > amountNum) newErrors.paidAmount = invoiceType === 0 ? "Received amount cannot exceed total amount." : "Paid amount cannot exceed total amount.";
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    const partyNum = parseInt(partyId, 10);
    if (Number.isNaN(partyNum)) return;

    const projectNum = projectId ? parseInt(projectId, 10) : null;
    const dateStr = date.trim();

    if (isEditMode && invoiceToEdit) {
      onUpdate?.(Number(invoiceToEdit.id), {
        reference: reference.trim() || undefined,
        date: dateStr,
        status,
        payment_method: paymentMethod,
        amount: amountNum,
        paid_amount: paidNum > 0 ? paidNum : undefined,
        description: description.trim() || undefined,
        project: projectNum ?? null,
      });
    } else {
      onCreate({
        party: partyNum,
        invoice_type: invoiceType,
        project: projectNum ?? null,
        reference: reference.trim() || undefined,
        date: dateStr,
        status,
        payment_method: paymentMethod,
        amount: amountNum,
        paid_amount: paidNum > 0 ? paidNum : undefined,
        description: description.trim() || undefined,
      });
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[95vw] w-full mx-4 max-h-[90vh] overflow-y-auto">
      <form onSubmit={handleSubmit} className="p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">{isEditMode ? `Edit ${title}` : title}</h2>
        <div className="space-y-4">
          <div>
            <Label>Party <span className="text-red-600 dark:text-red-400">*</span></Label>
            <select
              className={selectClass + (errors.party ? " border-red-500" : "")}
              value={partyId}
              onChange={(e) => { setPartyId(e.target.value); setErrors((e) => ({ ...e, party: undefined })); }}
              required
              disabled={isEditMode}
            >
              <option value="">Select party</option>
              {parties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            {errors.party && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.party}</p>}
          </div>
          {projects.length > 0 && (
            <div>
              <Label>Project (optional)</Label>
              <select
                className={selectClass}
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
              >
                <option value="">No project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <Label>Reference</Label>
            <input
              type="text"
              className={inputClass}
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. INV-001"
            />
          </div>
          <div>
            <Label>Date <span className="text-red-600 dark:text-red-400">*</span></Label>
            <DatePicker
              id="invoice-date"
              placeholder="Select date"
              value={date}
              onChange={(_, dateStr) => { setDate(dateStr ?? ""); setErrors((e) => ({ ...e, date: undefined })); }}
            />
            {errors.date && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.date}</p>}
          </div>
          <div>
            <Label>Amount (QAR) <span className="text-red-600 dark:text-red-400">*</span></Label>
            <input
              type="number"
              min={0}
              step="0.01"
              className={inputClass + (errors.amount ? " border-red-500" : "")}
              value={amount}
              onChange={(e) => { setAmount(e.target.value); setErrors((e) => ({ ...e, amount: undefined, paidAmount: undefined })); }}
              placeholder="0"
            />
            {errors.amount && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.amount}</p>}
          </div>
          <div>
            <Label>Description</Label>
            <textarea
              className={inputClass + " min-h-[80px]"}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional notes"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Payment method</Label>
              <select
                className={selectClass}
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as "cash" | "bank")}
              >
                <option value="cash">Cash</option>
                <option value="bank">Bank</option>
              </select>
            </div>
            <div>
              <Label>{invoiceType === 0 ? "Received amount (QAR)" : "Paid amount (QAR)"}</Label>
              <input
                type="number"
                min={0}
                step="0.01"
                className={inputClass + (errors.paidAmount ? " border-red-500" : "")}
                value={paidAmount}
                onChange={(e) => { setPaidAmount(e.target.value); setErrors((e) => ({ ...e, paidAmount: undefined })); }}
                placeholder="0"
              />
              {errors.paidAmount && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.paidAmount}</p>}
              {paidNum > 0 && amountNum > 0 && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Balance: {formatCurrency(balance)}
                </p>
              )}
            </div>
          </div>
          <div>
            <Label>Status</Label>
            <select
              className={selectClass}
              value={status}
              onChange={(e) => setStatus(e.target.value as "draft" | "posted")}
            >
              <option value="draft">Draft</option>
              <option value="posted">Posted</option>
            </select>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
            Cancel
          </button>
          <button type="submit" className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600">
            {isEditMode ? "Save" : "Create"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
