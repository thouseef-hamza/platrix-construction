"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import DocumentsSection from "@/components/common/DocumentsSection";
import { formatCurrency, formatDate } from "@/utils/format";
import type { Purchase } from "@/types/purchase";
import ConfirmPostModal from "./ConfirmPostModal";
import MakePaymentModal from "./MakePaymentModal";

interface PurchaseViewModalProps {
  purchase: Purchase | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (id: string, updates: Partial<Purchase>) => void;
}

type Tab = "details" | "payments" | "documents" | "activity";

export default function PurchaseViewModal({
  purchase,
  isOpen,
  onClose,
  onUpdate,
}: PurchaseViewModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>("details");
  const [postModalOpen, setPostModalOpen] = useState(false);
  const [makePaymentModalOpen, setMakePaymentModalOpen] = useState(false);

  if (!purchase) return null;

  const attachments = purchase.attachments ?? [];
  const isDraft = purchase.status === "draft";
  const paymentStatus = purchase.paymentStatus ?? (purchase.paidAmount === undefined || purchase.paidAmount === 0 ? "not_completed" : purchase.paidAmount >= purchase.amount ? "completed" : "partial");
  const showMakePayment = paymentStatus === "partial" || paymentStatus === "not_completed";
  const currentPaid = purchase.paidAmount ?? 0;
  const balance = purchase.amount - currentPaid;

  const handleUpload = (newFiles: { name: string }[]) => {
    onUpdate?.(purchase.id, {
      attachments: [...attachments, ...newFiles],
    });
  };

  const handlePostConfirm = () => {
    onUpdate?.(purchase.id, { status: "posted" });
  };

  const handleMakePaymentSubmit = (amount: number, paymentDate: string, newAttachmentNames: { name: string }[]) => {
    const newPaidAmount = currentPaid + amount;
    const existingPayments = purchase.payments ?? [];
    const newPayment = { id: `pp-${Date.now()}`, date: paymentDate, amount };
    onUpdate?.(purchase.id, {
      paidAmount: newPaidAmount,
      paidAt: paymentDate || undefined,
      payments: [...existingPayments, newPayment],
      attachments: [...attachments, ...newAttachmentNames],
    });
    setMakePaymentModalOpen(false);
  };

  const paymentList = purchase.payments ?? [];

  const handleDeleteDocument = (index: number) => {
    onUpdate?.(purchase.id, {
      attachments: attachments.filter((_, i) => i !== index),
    });
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "details", label: "Details" },
    { id: "payments", label: "Payments" },
    { id: "documents", label: "Documents" },
    { id: "activity", label: "Activity" },
  ];

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Purchase Details
          </h2>
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
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Project
              </dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                {purchase.project?.name ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Supplier
              </dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                {purchase.supplier.name}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Reference / PO #
              </dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                {purchase.reference}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Status
              </dt>
                <dd className="mt-1">
                  <span
                    className={
                      purchase.status === "posted"
                        ? "inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400"
                        : "inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                    }
                  >
                    {purchase.status}
                  </span>
                </dd>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Payment method
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white capitalize">
                  {purchase.paymentMethod}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Payment status
                </dt>
                <dd className="mt-1">
                  <span
                    className={
                      paymentStatus === "completed"
                        ? "inline-flex items-center rounded-full bg-success-100 px-2 py-0.5 text-xs font-medium text-success-800 dark:bg-success-900/30 dark:text-success-400"
                        : paymentStatus === "partial"
                          ? "inline-flex items-center rounded-full bg-warning-100 px-2 py-0.5 text-xs font-medium text-warning-800 dark:bg-warning-900/30 dark:text-warning-400"
                          : "inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                    }
                  >
                    {paymentStatus === "not_completed" ? "Not completed" : paymentStatus === "completed" ? "Completed" : "Partial"}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Date
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {formatDate(purchase.date)}
                </dd>
              </div>
            </div>
            {purchase.description && (
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Description
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {purchase.description}
                </dd>
              </div>
            )}

            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                Line items
              </dt>
              <dd>
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-white/[0.04]">
                        <th className="px-3 py-2 text-left font-medium text-gray-500 dark:text-gray-400">
                          Material
                        </th>
                        <th className="px-3 py-2 text-right font-medium text-gray-500 dark:text-gray-400 w-20">
                          Qty
                        </th>
                        <th className="px-3 py-2 text-right font-medium text-gray-500 dark:text-gray-400 w-24">
                          Rate (QAR)
                        </th>
                        <th className="px-3 py-2 text-right font-medium text-gray-500 dark:text-gray-400 w-28">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {purchase.lineItems.map((line) => (
                        <tr
                          key={line.id}
                          className="border-b border-gray-100 dark:border-gray-800"
                        >
                          <td className="px-3 py-2 text-gray-900 dark:text-white">
                            {line.materialName} ({line.materialCode})
                          </td>
                          <td className="px-3 py-2 text-right text-gray-600 dark:text-gray-400">
                            {line.quantity} {line.unit}
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums text-gray-600 dark:text-gray-400">
                            {formatCurrency(line.rate)}
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums text-gray-900 dark:text-white">
                            {formatCurrency(line.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-2 text-sm font-medium text-gray-900 dark:text-white text-right tabular-nums">
                  Total: {formatCurrency(purchase.amount)}
                </p>
              </dd>
            </div>
          </dl>
          )}
          {activeTab === "payments" && (
            <div>
              <div className="flex items-center justify-between gap-4 mb-4">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Payments</span>
                {showMakePayment && onUpdate && (
                  <button
                    type="button"
                    onClick={() => setMakePaymentModalOpen(true)}
                    className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
                  >
                    Add payment
                  </button>
                )}
              </div>
              {paymentList.length > 0 ? (
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-white/[0.04]">
                        <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Date</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Reference</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Amount (QAR)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                      {paymentList.map((p) => (
                        <tr key={p.id} className="bg-white dark:bg-transparent">
                          <td className="px-4 py-3 text-gray-900 dark:text-white">{formatDate(p.date)}</td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{p.reference ?? "—"}</td>
                          <td className="px-4 py-3 text-right tabular-nums text-gray-900 dark:text-white">{formatCurrency(p.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 py-4">No payments recorded yet.</p>
              )}
            </div>
          )}
          {activeTab === "details" && (
            <div className="mt-6 flex flex-wrap gap-3">
              {isDraft && (
                <button
                  type="button"
                  onClick={() => setPostModalOpen(true)}
                  className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
                >
                  Post
                </button>
              )}
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

      <ConfirmPostModal
        isOpen={postModalOpen}
        onClose={() => setPostModalOpen(false)}
        onConfirm={handlePostConfirm}
      />
      <MakePaymentModal
        isOpen={makePaymentModalOpen}
        onClose={() => setMakePaymentModalOpen(false)}
        balance={balance}
        onSubmit={handleMakePaymentSubmit}
      />
    </>
  );
}
