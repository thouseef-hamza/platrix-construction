"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import Badge from "@/components/ui/badge/Badge";
import DocumentsSection from "@/components/common/DocumentsSection";
import MakePaymentModal from "@/components/purchase/MakePaymentModal";
import { formatCurrency, formatDate } from "@/utils/format";
import type { Bill } from "@/types/bill";

type Tab = "details" | "payments" | "documents" | "activity";

interface BillViewModalProps {
  bill: Bill | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (id: string, updates: Partial<Bill>) => void;
  onEdit?: (bill: Bill) => void;
  onPost?: (id: string) => void;
}

export default function BillViewModal({
  bill,
  isOpen,
  onClose,
  onUpdate,
  onEdit,
  onPost,
}: BillViewModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>("details");
  const [addPaymentOpen, setAddPaymentOpen] = useState(false);

  if (!bill) return null;

  const attachments = bill.attachments ?? [];
  const isDraft = bill.status === "draft";
  const paymentList = bill.payments ?? [];
  const paidAmount = bill.paidAmount ?? 0;
  const balance = bill.amount - paidAmount;

  const handleAddPaymentSubmit = (
    amount: number,
    paymentDate: string,
    _status: "draft" | "posted"
  ) => {
    const existingPayments = bill.payments ?? [];
    const newPayments = [...existingPayments, { id: `bp-${Date.now()}`, date: paymentDate, amount }];
    const newPaidAmount = newPayments.reduce((sum, p) => sum + p.amount, 0);
    onUpdate?.(bill.id, {
      payments: newPayments,
      paidAmount: newPaidAmount,
    });
    setAddPaymentOpen(false);
  };

  const handleUpload = (newFiles: { name: string }[]) => {
    if (!isDraft) return;
    onUpdate?.(bill.id, {
      attachments: [...attachments, ...newFiles],
    });
  };

  const handleDeleteDocument = (index: number) => {
    onUpdate?.(bill.id, {
      attachments: attachments.filter((_, i) => i !== index),
    });
  };

  const handleEdit = () => {
    onEdit?.(bill);
    onClose();
  };

  const handlePost = () => {
    onPost?.(bill.id);
    onClose();
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "details", label: "Details" },
    { id: "payments", label: "Payments" },
    { id: "documents", label: "Documents" },
    { id: "activity", label: "Activity" },
  ];

  return (
    <>
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[95vw] w-full mx-4 max-h-[90vh] overflow-y-auto">
      <div className="p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Subcontractor Invoice Details
          </h2>
          <div className="flex items-center gap-2">
            <Badge color={isDraft ? "warning" : "success"} size="sm">
              {bill.status === "draft" ? "Draft" : "Posted"}
            </Badge>
            {isDraft && onEdit && (
              <button
                type="button"
                onClick={handleEdit}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </button>
            )}
            {isDraft && onPost && (
              <button
                type="button"
                onClick={handlePost}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-3 py-2 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
              >
                Post
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
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Project</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white">{bill.project.name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Subcontractor</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white">{bill.subcontractor.name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Reference</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white">{bill.reference}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Date</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white">{formatDate(bill.date)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Amount (QAR)</dt>
              <dd className="mt-1 text-sm font-medium text-gray-900 dark:text-white tabular-nums">
                {formatCurrency(bill.amount)}
              </dd>
            </div>
          </dl>
        )}

        {activeTab === "payments" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-white/[0.03] p-4 space-y-2">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-white">Payment summary</h3>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Paid</span>
                <span className="tabular-nums font-medium text-gray-900 dark:text-white">{formatCurrency(paidAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Balance</span>
                <span className={`tabular-nums font-medium ${balance <= 0 ? "text-success-600 dark:text-success-400" : "text-error-600 dark:text-error-400"}`}>
                  {balance < 0 ? `-${formatCurrency(Math.abs(balance))}` : formatCurrency(balance)}
                </span>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between gap-4 mb-2">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Payments ({paymentList.length})</span>
                {balance > 0 && onUpdate && (
                  <button
                    type="button"
                    onClick={() => setAddPaymentOpen(true)}
                    className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
                  >
                    Add payment
                  </button>
                )}
              </div>
              {paymentList.length > 0 ? (
                <ul className="space-y-2">
                  {paymentList.map((p) => (
                    <li
                      key={p.id}
                      className="flex flex-wrap items-center gap-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-white/[0.03] px-3 py-2 text-sm"
                    >
                      <span className="font-medium text-gray-800 dark:text-white/90">{formatDate(p.date)}</span>
                      <span className="text-gray-600 dark:text-gray-400 tabular-nums">{formatCurrency(p.amount)}</span>
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
            onUpload={isDraft && onUpdate ? handleUpload : undefined}
            onDelete={isDraft && onUpdate ? handleDeleteDocument : undefined}
            noBorder
          />
        )}

        {activeTab === "activity" && (
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-white/[0.03] p-8 text-center">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Under development</p>
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">Activity timeline will appear here.</p>
          </div>
        )}
      </div>
    </Modal>
    {onUpdate && (
      <MakePaymentModal
        isOpen={addPaymentOpen}
        onClose={() => setAddPaymentOpen(false)}
        balance={balance}
        onSubmit={handleAddPaymentSubmit}
      />
    )}
    </>
  );
}
