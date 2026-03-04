"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import DocumentsSection from "@/components/common/DocumentsSection";
import { formatCurrency, formatDate } from "@/utils/format";
import type { Payment } from "@/types/payment";

type Tab = "details" | "payments" | "documents" | "activity";

interface PaymentViewModalProps {
  payment: Payment | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (id: string, updates: Partial<Payment>) => void;
  onAddPayment?: (invoice: Payment) => void;
  onEdit?: (invoice: Payment) => void;
  /** For invoices: total received (receivedAmount + receipt amounts). When provided, Summary uses this. */
  totalReceived?: number;
  /** For invoices: list of receipt (payment) records against this invoice. */
  receipts?: Payment[];
}

export default function PaymentViewModal({
  payment,
  isOpen,
  onClose,
  onUpdate,
  onAddPayment,
  onEdit,
  totalReceived: totalReceivedProp,
  receipts = [],
}: PaymentViewModalProps) {
  if (!payment) return null;

  const attachments = payment.attachments ?? [];
  const isInvoice = !payment.invoiceId;
  const isDraft = isInvoice && (payment.status ?? "draft") === "draft";
  const totalReceived = isInvoice
    ? (totalReceivedProp ?? payment.receivedAmount ?? 0)
    : 0;
  const balance = isInvoice ? payment.amount - totalReceived : 0;

  const handleUpload = (newFiles: { name: string }[]) => {
    onUpdate?.(payment.id, {
      attachments: [...attachments, ...newFiles],
    });
  };

  const handleAddPayment = () => {
    onAddPayment?.(payment);
  };

  const handleEdit = () => {
    onEdit?.(payment);
  };

  const handleDeleteDocument = (index: number) => {
    onUpdate?.(payment.id, {
      attachments: attachments.filter((_, i) => i !== index),
    });
  };

  const [activeTab, setActiveTab] = useState<Tab>("details");
  const tabs: { id: Tab; label: string }[] = [
    { id: "details", label: "Details" },
    { id: "payments", label: "Payments" },
    { id: "documents", label: "Documents" },
    { id: "activity", label: "Activity" },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
      <div className="p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Client Invoice Details
          </h2>
          <div className="flex gap-2">
            {isDraft && onEdit && (
              <button
                type="button"
                onClick={handleEdit}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Edit
              </button>
            )}
            {isInvoice && onAddPayment && (
              <button
                type="button"
                onClick={handleAddPayment}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-3 py-2 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
              >
                Add Payment
              </button>
            )}
          </div>
        </div>
        <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === tab.id
                  ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white border-b-2 border-brand-500 -mb-px"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "details" && (
          <dl className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Client</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white">{payment.client.name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Reference</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white">{payment.reference}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Date</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white">{formatDate(payment.date)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Amount (QAR)</dt>
              <dd className="mt-1 text-sm font-medium text-gray-900 dark:text-white tabular-nums">
                {formatCurrency(payment.amount)}
              </dd>
            </div>
            {isInvoice && payment.paymentMethod != null && (
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Payment method</dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white capitalize">{payment.paymentMethod}</dd>
              </div>
            )}
            {isInvoice && (
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-white/[0.03] p-4 space-y-2">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-white">Summary</h3>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Received</span>
                  <span className="tabular-nums font-medium text-gray-900 dark:text-white">
                    {formatCurrency(totalReceived)}
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
            )}
          </dl>
        )}

        {activeTab === "payments" && isInvoice && (
          <div className="space-y-4">
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-white/[0.03] p-4 space-y-2">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-white">Payment summary</h3>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Received</span>
                <span className="tabular-nums font-medium text-gray-900 dark:text-white">
                  {formatCurrency(totalReceived)}
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
            <div>
              <div className="flex items-center justify-between gap-4 mb-2">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Payments ({receipts.length})</span>
                {onAddPayment && (
                  <button
                    type="button"
                    onClick={handleAddPayment}
                    className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
                  >
                    Add payment
                  </button>
                )}
              </div>
              {receipts.length > 0 ? (
                <ul className="space-y-2">
                  {receipts.map((r) => (
                    <li
                      key={r.id}
                      className="flex flex-wrap items-center gap-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-white/[0.03] px-3 py-2 text-sm"
                    >
                      <span className="font-medium text-gray-800 dark:text-white/90">{formatDate(r.date)}</span>
                      <span className="text-gray-600 dark:text-gray-400 tabular-nums">{formatCurrency(r.amount)}</span>
                      {r.reference && r.reference !== "—" && (
                        <span className="text-gray-500 dark:text-gray-400">{r.reference}</span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">No payments recorded yet.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === "documents" && (
          <DocumentsSection
            attachments={attachments}
            onUpload={onUpdate ? handleUpload : undefined}
            onDelete={onUpdate ? handleDeleteDocument : undefined}
            noBorder
          />
        )}

        {activeTab === "activity" && (
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-white/[0.03] p-8 text-center">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Under development
            </p>
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              Activity timeline will appear here.
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}
