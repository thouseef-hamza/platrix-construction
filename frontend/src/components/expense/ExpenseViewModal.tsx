"use client";

import React, { useRef, useState } from "react";
import { Modal } from "@/components/ui/modal";
import MakePaymentModal from "@/components/purchase/MakePaymentModal";
import ConfirmDeleteModal from "@/components/ui/ConfirmDeleteModal";
import { formatCurrency, formatDate } from "@/utils/format";
import type { Expense, ExpenseCategory } from "@/types/expense";

const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  project: "Project-level expense",
  general: "General expense",
  outsourced_labor: "Outsourced labor",
  employee_paid: "Employee-paid expense",
};

interface ExpenseViewModalProps {
  expense: Expense | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (id: string, updates: Partial<Expense>) => void;
  /** Post a draft payment to the ledger. */
  onPostPayment?: (expenseId: string, paymentId: string) => void;
}

type Tab = "details" | "payments" | "documents" | "activity";

export default function ExpenseViewModal({
  expense,
  isOpen,
  onClose,
  onUpdate,
  onPostPayment,
}: ExpenseViewModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>("details");
  const [addPaymentOpen, setAddPaymentOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<{ index: number; name: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!expense) return null;

  const attachments = expense.attachments ?? [];
  const isLabor = expense.category === "outsourced_labor";
  const paymentList = expense.payments ?? [];
  const paidAmount = expense.paidAmount ?? 0;
  const expenseBalance = expense.amount - paidAmount;
  const showAddPayment = expenseBalance > 0 && onUpdate && expense.status === "posted";

  const handleAddPaymentSubmit = (
    amount: number,
    paymentDate: string,
    status: "draft" | "posted"
  ) => {
    const existingPayments = expense.payments ?? [];
    onUpdate?.(expense.id, {
      payments: [...existingPayments, { id: `ep-${Date.now()}`, date: paymentDate, amount, status }],
      paidAmount: paidAmount + amount,
    });
    setAddPaymentOpen(false);
  };

  const handleDeleteDocumentClick = (index: number, name: string) => {
    setDocumentToDelete({ index, name });
  };
  const confirmDeleteDocument = () => {
    if (documentToDelete != null) {
      onUpdate?.(expense.id, {
        attachments: attachments.filter((_, i) => i !== documentToDelete.index),
      });
      setDocumentToDelete(null);
    }
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length || !onUpdate) return;
    const newAttachments = Array.from(files).map((f) => ({ name: f.name }));
    onUpdate(expense.id, { attachments: [...attachments, ...newAttachments] });
    e.target.value = "";
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
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Expense Details
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
              Type
            </dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white">
              {CATEGORY_LABELS[expense.category]}
            </dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Ledger status
            </dt>
            <dd className="mt-1">
              <span
                className={
                  expense.status === "posted"
                    ? "inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400"
                    : "inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                }
              >
                {expense.status ?? "draft"}
              </span>
            </dd>
          </div>

          {(expense.category === "project" || (isLabor && expense.project)) && expense.project && (
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Project
              </dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                {expense.project.name}
              </dd>
            </div>
          )}

          {isLabor && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Labor type
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white capitalize">
                    {expense.laborType}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {expense.laborType === "hourly" ? "Hours" : "Days"}
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white tabular-nums">
                    {expense.quantity}
                  </dd>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Rate (QAR per {expense.laborType === "hourly" ? "hour" : "day"})
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white tabular-nums">
                    {formatCurrency(expense.rate ?? 0)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Amount
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-gray-900 dark:text-white tabular-nums">
                    {formatCurrency(expense.amount)}
                  </dd>
                </div>
              </div>
            </>
          )}

          {expense.category === "employee_paid" && expense.employeeRef && (
            <>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Employee
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {expense.employeeRef.name}
                </dd>
              </div>
              {expense.project && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Project
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                    {expense.project.name}
                  </dd>
                </div>
              )}
            </>
          )}

          {(expense.paymentMethod != null || (expense.paidAmount != null && expense.paidAmount > 0)) && (
            <div className="grid grid-cols-2 gap-4">
              {expense.paymentMethod != null && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Payment method
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white capitalize">
                    {expense.paymentMethod}
                  </dd>
                </div>
              )}
              {expense.paidAmount != null && expense.paidAmount > 0 && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Paid amount (QAR)
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white tabular-nums">
                    {formatCurrency(expense.paidAmount)}
                  </dd>
                </div>
              )}
            </div>
          )}

          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-white/[0.03] p-4 space-y-2">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white">Summary</h3>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Paid</span>
              <span className="tabular-nums font-medium text-gray-900 dark:text-white">
                {formatCurrency(expense.paidAmount ?? 0)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Balance</span>
              <span
                className={`tabular-nums font-medium ${
                  (expense.amount - (expense.paidAmount ?? 0)) <= 0
                    ? "text-success-600 dark:text-success-400"
                    : "text-error-600 dark:text-error-400"
                }`}
              >
                {(() => {
                  const balance = expense.amount - (expense.paidAmount ?? 0);
                  return balance < 0
                    ? `-${formatCurrency(Math.abs(balance))}`
                    : formatCurrency(balance);
                })()}
              </span>
            </div>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Description
            </dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white">
              {expense.description}
            </dd>
          </div>

          {!isLabor && (
            <>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Date
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {formatDate(expense.date)}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Amount (QAR)
                </dt>
                <dd className="mt-1 text-sm font-medium text-gray-900 dark:text-white tabular-nums">
                  {formatCurrency(expense.amount)}
                </dd>
              </div>
            </>
          )}

          {isLabor && (
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Date
              </dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                {formatDate(expense.date)}
              </dd>
            </div>
          )}
        </dl>
        )}

        {activeTab === "payments" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-white/[0.03] p-4 space-y-2">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-white">Payment summary</h3>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Paid</span>
                <span className="tabular-nums font-medium text-gray-900 dark:text-white">
                  {formatCurrency(paidAmount)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Balance</span>
                <span
                  className={`tabular-nums font-medium ${expenseBalance <= 0 ? "text-success-600 dark:text-success-400" : "text-error-600 dark:text-error-400"}`}
                >
                  {expenseBalance < 0 ? `-${formatCurrency(Math.abs(expenseBalance))}` : formatCurrency(expenseBalance)}
                </span>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between gap-4 mb-2">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Payments ({paymentList.length})</span>
                {showAddPayment && (
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
                      {p.reference ? (
                        <span className="text-gray-500 dark:text-gray-500 truncate max-w-[120px]">{p.reference}</span>
                      ) : null}
                      <span
                        className={
                          (p.status ?? "draft") === "posted"
                            ? "inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : "inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                        }
                      >
                        {(p.status ?? "draft") === "posted" ? "Posted" : "Draft"}
                      </span>
                      {onPostPayment && (p.status ?? "draft") === "draft" ? (
                        <button
                          type="button"
                          onClick={() => onPostPayment(expense.id, p.id)}
                          className="ml-auto text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
                        >
                          Post
                        </button>
                      ) : null}
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
          <div className="w-full space-y-6">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Documents</h3>
              {onUpdate && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
                  >
                    Upload
                  </button>
                </>
              )}
            </div>
            {attachments.length > 0 ? (
              <ul className="space-y-2 w-full">
                {attachments.map((a, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 w-full rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2"
                  >
                    <span className="min-w-0 truncate flex-1">{a.name}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      {onUpdate && (
                        <button
                          type="button"
                          onClick={() => handleDeleteDocumentClick(i, a.name)}
                          title="Delete"
                          className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-600 dark:hover:bg-white/10 dark:hover:text-red-400"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 py-4">No documents uploaded.</p>
            )}
          </div>
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
    {onUpdate && (
      <MakePaymentModal
        isOpen={addPaymentOpen}
        onClose={() => setAddPaymentOpen(false)}
        balance={expenseBalance}
        onSubmit={handleAddPaymentSubmit}
      />
    )}
    <ConfirmDeleteModal
      isOpen={!!documentToDelete}
      onClose={() => setDocumentToDelete(null)}
      onConfirm={confirmDeleteDocument}
      title="Delete document"
      itemName={documentToDelete?.name}
    />
    </>
  );
}
