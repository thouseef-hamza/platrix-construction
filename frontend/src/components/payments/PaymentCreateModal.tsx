"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import Label from "@/components/form/Label";
import DatePicker from "@/components/form/date-picker";
import type { Payment, ClientRef, PaymentMethod } from "@/types/payment";
import { formatCurrency } from "@/utils/format";

const inputClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800";
const selectClass = inputClass;

interface PaymentCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: ClientRef[];
  onCreate: (data: Omit<Payment, "id">) => void;
  /** When set, form is in "Add Payment" mode with client/reference prefilled. */
  invoice?: Payment | null;
  /** When set (and draft) with onUpdate, form is in Edit Invoice mode. */
  invoiceToEdit?: Payment | null;
  onUpdate?: (id: string, data: Partial<Payment>) => void;
  /** Modal title when in Add Payment mode; default "Add Payment". */
  title?: string;
}

export default function PaymentCreateModal({
  isOpen,
  onClose,
  clients,
  onCreate,
  invoice: invoiceForPayment,
  invoiceToEdit,
  onUpdate,
  title: customTitle,
}: PaymentCreateModalProps) {
  const [clientId, setClientId] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [reference, setReference] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [receivedAmount, setReceivedAmount] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);

  const isAddPaymentMode = Boolean(invoiceForPayment && !invoiceToEdit);
  const isEditMode = Boolean(invoiceToEdit && invoiceToEdit.status === "draft" && onUpdate);
  const isInvoiceMode = !isAddPaymentMode;
  const invoiceAmount = parseFloat(amount) || 0;
  const receivedAmountNum = parseFloat(receivedAmount) || 0;
  const balance = invoiceAmount - receivedAmountNum;
  const modalTitle =
    customTitle ??
    (isEditMode ? "Edit Client Invoice" : isAddPaymentMode ? "Add Payment" : "Create Client Invoice");

  useEffect(() => {
    if (!isOpen) return;
    if (isEditMode && invoiceToEdit) {
      setClientId(invoiceToEdit.client.id);
      setReference(invoiceToEdit.reference);
      setAmount(String(invoiceToEdit.amount));
      setDate(invoiceToEdit.date);
      setPaymentMethod(invoiceToEdit.paymentMethod ?? "cash");
      setReceivedAmount(String(invoiceToEdit.receivedAmount ?? 0));
      setFiles(null);
    } else if (invoiceForPayment) {
      setClientId(invoiceForPayment.client.id);
      setReference(invoiceForPayment.reference);
      setAmount("");
      setDate("");
      setPaymentMethod("cash");
      setReceivedAmount("");
      setFiles(null);
    } else {
      setClientId("");
      setAmount("");
      setDate("");
      setReference("");
      setPaymentMethod("cash");
      setReceivedAmount("");
      setFiles(null);
    }
  }, [isOpen, invoiceForPayment, invoiceToEdit, isEditMode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const client = clients.find((c) => c.id === clientId);
    if (!client) return;
    const amt = parseFloat(amount) || 0;
    const received = parseFloat(receivedAmount) || 0;
    const attachments = files ? Array.from(files).map((f) => ({ name: f.name })) : undefined;
    const payload: Omit<Payment, "id"> = {
      client,
      amount: amt,
      date: date || new Date().toISOString().slice(0, 10),
      reference: reference.trim() || "—",
      attachments,
    };
    if (isInvoiceMode) {
      payload.paymentMethod = paymentMethod;
      payload.receivedAmount = received > 0 ? received : undefined;
    }
    if (isEditMode && invoiceToEdit) {
      onUpdate!(invoiceToEdit.id, { ...payload, status: invoiceToEdit.status });
    } else if (isAddPaymentMode) {
      onCreate(payload);
    } else {
      payload.status = "draft";
      onCreate(payload);
    }
    setClientId("");
    setAmount("");
    setDate("");
    setReference("");
    setPaymentMethod("cash");
    setReceivedAmount("");
    setFiles(null);
    onClose();
  };

  const handleClose = () => {
    setClientId("");
    setAmount("");
    setDate("");
    setReference("");
    setPaymentMethod("cash");
    setReceivedAmount("");
    setFiles(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-[95vw] w-full mx-4">
      <form onSubmit={handleSubmit} className="p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          {modalTitle}
        </h2>
        <div className="space-y-4">
          <div>
            <Label>Client</Label>
            <select
              className={selectClass}
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              required
              disabled={isAddPaymentMode}
            >
              <option value="">Select client</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Reference / Client Invoice #</Label>
            <input
              type="text"
              className={inputClass}
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. INV-2024-001"
              readOnly={isAddPaymentMode}
            />
            {isAddPaymentMode && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Pre-filled from selected client invoice.</p>
            )}
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
                id="payment-date"
                label="Date"
                placeholder="Select date"
                value={date}
                onChange={(_, dateStr) => setDate(dateStr ?? "")}
              />
            </div>
          </div>
          {isInvoiceMode && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Payment method</Label>
                  <select
                    className={selectClass}
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  >
                    <option value="cash">Cash</option>
                    <option value="bank">Bank</option>
                  </select>
                </div>
                <div>
                  <Label>Received amount (QAR)</Label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    className={inputClass}
                    value={receivedAmount}
                    onChange={(e) => setReceivedAmount(e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-white/[0.03] p-4 space-y-2">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-white">Summary</h3>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Received</span>
                  <span className="tabular-nums font-medium text-gray-900 dark:text-white">
                    {formatCurrency(receivedAmountNum)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Balance</span>
                  <span
                    className={`tabular-nums font-medium ${balance <= 0 ? "text-success-600 dark:text-success-400" : "text-error-600 dark:text-error-400"}`}
                  >
                    {balance < 0 ? `-${formatCurrency(Math.abs(balance))}` : formatCurrency(balance)}
                  </span>
                </div>
              </div>
            </>
          )}
          <div>
            <Label>Upload documents</Label>
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
            {isAddPaymentMode ? "Add Payment" : "Create"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
