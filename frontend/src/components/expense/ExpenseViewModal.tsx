"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import DocumentsSection from "@/components/common/DocumentsSection";
import MakePaymentModal from "@/components/purchase/MakePaymentModal";
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
}

type Tab = "details" | "payments" | "documents" | "activity";

export default function ExpenseViewModal({
  expense,
  isOpen,
  onClose,
  onUpdate,
}: ExpenseViewModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>("details");
  const [addPaymentOpen, setAddPaymentOpen] = useState(false);

  if (!expense) return null;

  const attachments = expense.attachments ?? [];
  const isLabor = expense.category === "outsourced_labor";
  const paymentList = expense.payments ?? [];
  const paidAmount = expense.paidAmount ?? 0;
  const expenseBalance = expense.amount - paidAmount;
  const showAddPayment = expenseBalance > 0 && onUpdate;

  const handleAddPaymentSubmit = (amount: number, paymentDate: string, newAttachmentNames: { name: string }[]) => {
    const existingPayments = expense.payments ?? [];
    onUpdate?.(expense.id, {
      payments: [...existingPayments, { id: `ep-${Date.now()}`, date: paymentDate, amount }],
      paidAmount: paidAmount + amount,
      attachments: [...attachments, ...newAttachmentNames],
    });
    setAddPaymentOpen(false);
  };

  const handleUpload = (newFiles: { name: string }[]) => {
    onUpdate?.(expense.id, {
      attachments: [...attachments, ...newFiles],
    });
  };

  const handleDeleteDocument = (index: number) => {
    onUpdate?.(expense.id, {
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
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
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
            {expense.paymentMethod != null && (
              <div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Payment method</span>
                <p className="mt-1 text-sm text-gray-900 dark:text-white capitalize">{expense.paymentMethod}</p>
              </div>
            )}
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
    {onUpdate && (
      <MakePaymentModal
        isOpen={addPaymentOpen}
        onClose={() => setAddPaymentOpen(false)}
        balance={expenseBalance}
        onSubmit={handleAddPaymentSubmit}
      />
    )}
    </>
  );
}
