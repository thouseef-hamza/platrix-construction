"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import Label from "@/components/form/Label";
import DatePicker from "@/components/form/date-picker";
import { formatCurrency, formatDate } from "@/utils/format";
import type { Employee, EmployeeSalaryEntry, EmployeeTransaction } from "@/types/employee";
import {
  SPONSORSHIP_LABELS,
  EMPLOYMENT_TYPE_LABELS,
  EMPLOYMENT_STATUS_LABELS,
} from "@/types/employee";
import type { AddSalaryPayload, AddTransactionPayload } from "@/lib/employeesApi";

type Tab =
  | "details"
  | "identification"
  | "employment"
  | "salary_wps"
  | "medical_insurance"
  | "salary_management"
  | "financial"
  | "documents";

const tabs: { id: Tab; label: string }[] = [
  { id: "details", label: "Details" },
  { id: "identification", label: "Identification" },
  { id: "employment", label: "Employment" },
  { id: "salary_wps", label: "Salary & WPS Details" },
  { id: "medical_insurance", label: "Medical & Insurance" },
  { id: "salary_management", label: "Salary Management" },
  { id: "financial", label: "Financial" },
  { id: "documents", label: "Documents" },
];

const inputClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800";

function Field({
  label,
  value,
  className = "",
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  if (value == null || value === "") return null;
  return (
    <div className={className}>
      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-gray-900 dark:text-white">{value}</dd>
    </div>
  );
}

interface EmployeeViewModalProps {
  employee: Employee | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (id: string, updates: Partial<Employee>) => void;
  onAddSalary?: (payload: AddSalaryPayload) => void;
  onAddTransaction?: (payload: AddTransactionPayload) => void;
  isAddingSalary?: boolean;
  isAddingTransaction?: boolean;
}

export default function EmployeeViewModal({
  employee,
  isOpen,
  onClose,
  onUpdate,
  onAddSalary,
  onAddTransaction,
  isAddingSalary = false,
  isAddingTransaction = false,
}: EmployeeViewModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>("details");
  const [salaryDate, setSalaryDate] = useState("");
  const [salaryAmount, setSalaryAmount] = useState("");
  const [salaryDescription, setSalaryDescription] = useState("");
  const [txDate, setTxDate] = useState("");
  const [txAmount, setTxAmount] = useState("");
  const [txDescription, setTxDescription] = useState("");
  const [txType, setTxType] = useState("");
  const [txReference, setTxReference] = useState("");

  if (!employee) return null;

  const salaryEntries: EmployeeSalaryEntry[] = employee.salaryEntries ?? [];
  const transactions: EmployeeTransaction[] = employee.transactions ?? [];
  const sortedSalaries = [...salaryEntries].sort(
    (a, b) => b.date.localeCompare(a.date)
  );
  const sortedTransactions = [...transactions].sort(
    (a, b) => b.date.localeCompare(a.date)
  );

  const totalSalary =
    (employee.basicSalary ?? 0) +
    (employee.housingAllowance ?? 0) +
    (employee.transportationAllowance ?? 0) +
    (employee.otherAllowances ?? 0);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-[95vw] w-full mx-4 max-h-[90vh] overflow-y-auto"
    >
      <div className="p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          {employee.fullName}
        </h2>
        {employee.employeeId && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            ID: {employee.employeeId}
          </p>
        )}
        {!employee.employeeId && <div className="mb-6" />}

        <div className="flex flex-wrap gap-1 border-b border-gray-200 dark:border-gray-700 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2 text-sm font-medium rounded-t-lg transition-colors ${
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
          <section className="space-y-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Basic Identity
            </h3>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Full name" value={employee.fullName} />
              <Field label="Nationality" value={employee.nationality} />
              <Field
                label="Gender"
                value={employee.gender ? String(employee.gender) : undefined}
              />
              <Field
                label="Date of birth"
                value={
                  employee.dateOfBirth
                    ? formatDate(employee.dateOfBirth)
                    : undefined
                }
              />
              <Field
                label="Marital status"
                value={employee.maritalStatus ?? undefined}
              />
            </dl>
          </section>
        )}

        {activeTab === "identification" && (
          <section className="space-y-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Identification
            </h3>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="QID number" value={employee.qidNumber} />
              <Field
                label="QID expiry date"
                value={
                  employee.qidExpiryDate
                    ? formatDate(employee.qidExpiryDate)
                    : undefined
                }
              />
              <Field label="Passport number" value={employee.passportNumber} />
              <Field
                label="Passport expiry date"
                value={
                  employee.passportExpiryDate
                    ? formatDate(employee.passportExpiryDate)
                    : undefined
                }
              />
              <Field label="Visa number" value={employee.visaNumber} />
              <Field
                label="Visa expiry date"
                value={
                  employee.visaExpiryDate
                    ? formatDate(employee.visaExpiryDate)
                    : undefined
                }
              />
              <Field
                label="Sponsorship type"
                value={
                  employee.sponsorshipType != null
                    ? SPONSORSHIP_LABELS[employee.sponsorshipType]
                    : undefined
                }
              />
            </dl>
          </section>
        )}

        {activeTab === "employment" && (
          <section className="space-y-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Employment details
            </h3>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Employee ID (internal)" value={employee.employeeId} />
              <Field
                label="Joining date"
                value={
                  employee.joiningDate
                    ? formatDate(employee.joiningDate)
                    : undefined
                }
              />
              <Field
                label="Employment type"
                value={
                  employee.employmentType != null
                    ? EMPLOYMENT_TYPE_LABELS[employee.employmentType]
                    : undefined
                }
              />
              <Field label="Job title" value={employee.jobTitle} />
              <Field label="Department" value={employee.department} />
              <Field
                label="Employment status"
                value={
                  employee.employmentStatus != null ? (
                    <span
                      className={
                        employee.employmentStatus === 0
                          ? "inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : employee.employmentStatus === 1
                            ? "inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                            : "inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                      }
                    >
                      {EMPLOYMENT_STATUS_LABELS[employee.employmentStatus]}
                    </span>
                  ) : undefined
                }
              />
            </dl>
          </section>
        )}

        {activeTab === "salary_wps" && (
          <section className="space-y-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Salary structure
            </h3>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                label="Basic salary"
                value={
                  employee.basicSalary != null
                    ? formatCurrency(employee.basicSalary)
                    : undefined
                }
              />
              <Field
                label="Housing allowance"
                value={
                  employee.housingAllowance != null
                    ? formatCurrency(employee.housingAllowance)
                    : undefined
                }
              />
              <Field
                label="Transportation allowance"
                value={
                  employee.transportationAllowance != null
                    ? formatCurrency(employee.transportationAllowance)
                    : undefined
                }
              />
              <Field
                label="Other allowances"
                value={
                  employee.otherAllowances != null
                    ? formatCurrency(employee.otherAllowances)
                    : undefined
                }
              />
            </dl>
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-white/[0.03] p-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Total (QAR)
              </p>
              <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white tabular-nums">
                {formatCurrency(totalSalary)}
              </p>
            </div>

            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 pt-4 border-t border-gray-200 dark:border-gray-700">
              Bank & WPS
            </h3>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Bank name" value={employee.bankName} />
              <Field label="IBAN" value={employee.iban} />
            </dl>
          </section>
        )}

        {activeTab === "medical_insurance" && (
          <section className="space-y-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Medical & insurance
            </h3>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                label="Health card number"
                value={employee.healthCardNumber}
              />
              <Field
                label="Health insurance policy"
                value={employee.healthInsurancePolicy}
              />
              <Field
                label="Insurance expiry"
                value={
                  employee.insuranceExpiry
                    ? formatDate(employee.insuranceExpiry)
                    : undefined
                }
              />
              <Field
                label="Emergency contact name"
                value={employee.emergencyContactName}
              />
              <Field
                label="Emergency contact phone"
                value={employee.emergencyContactPhone}
              />
            </dl>
          </section>
        )}

        {activeTab === "salary_management" && (
          <section className="space-y-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Salary entries
            </h3>
            {onAddSalary && (
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-white/[0.03] p-4 space-y-4">
                <h4 className="text-sm font-medium text-gray-800 dark:text-white">
                  Add salary entry
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Use description to identify type (e.g. Advance, Remaining amount, Bonus, Adjustment).
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label>Date</Label>
                    <DatePicker
                      id="salary-entry-date"
                      placeholder="Select date"
                      value={salaryDate}
                      onChange={(_, dateStr) => setSalaryDate(dateStr ?? "")}
                    />
                  </div>
                  <div>
                    <Label>Amount (QAR)</Label>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      className={inputClass}
                      value={salaryAmount}
                      onChange={(e) => setSalaryAmount(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <input
                      type="text"
                      className={inputClass}
                      value={salaryDescription}
                      onChange={(e) => setSalaryDescription(e.target.value)}
                      placeholder="e.g. Advance, Bonus"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  disabled={
                    isAddingSalary ||
                    !salaryDate ||
                    !salaryAmount ||
                    parseFloat(salaryAmount) < 0
                  }
                  onClick={() => {
                    onAddSalary({
                      date: salaryDate,
                      amount: parseFloat(salaryAmount) || 0,
                      description: salaryDescription.trim() || undefined,
                    });
                    setSalaryDate("");
                    setSalaryAmount("");
                    setSalaryDescription("");
                  }}
                  className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 disabled:pointer-events-none"
                >
                  {isAddingSalary ? "Adding…" : "Add entry"}
                </button>
              </div>
            )}
            {sortedSalaries.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 py-4 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 text-center">
                No salary entries yet.
              </p>
            ) : (
              <ul className="space-y-2">
                {sortedSalaries.map((se) => (
                  <li
                    key={se.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-white/[0.03] px-3 py-2 text-sm"
                  >
                    <span className="text-gray-700 dark:text-gray-300">
                      {formatDate(se.date)}
                    </span>
                    <span className="font-medium tabular-nums text-gray-900 dark:text-white">
                      {formatCurrency(se.amount)}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 w-full sm:w-auto">
                      {se.description || "—"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {activeTab === "financial" && (
          <section className="space-y-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Transactions (company – employee)
            </h3>
            {onAddTransaction && (
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-white/[0.03] p-4 space-y-4">
                <h4 className="text-sm font-medium text-gray-800 dark:text-white">
                  Add transaction
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <Label>Date</Label>
                    <DatePicker
                      id="tx-date"
                      placeholder="Select date"
                      value={txDate}
                      onChange={(_, dateStr) => setTxDate(dateStr ?? "")}
                    />
                  </div>
                  <div>
                    <Label>Amount (QAR)</Label>
                    <input
                      type="number"
                      step="0.01"
                      className={inputClass}
                      value={txAmount}
                      onChange={(e) => setTxAmount(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label>Type</Label>
                    <input
                      type="text"
                      className={inputClass}
                      value={txType}
                      onChange={(e) => setTxType(e.target.value)}
                      placeholder="e.g. salary_payment, advance"
                    />
                  </div>
                  <div>
                    <Label>Reference</Label>
                    <input
                      type="text"
                      className={inputClass}
                      value={txReference}
                      onChange={(e) => setTxReference(e.target.value)}
                      placeholder="Optional"
                    />
                  </div>
                </div>
                <div>
                  <Label>Description</Label>
                  <input
                    type="text"
                    className={inputClass}
                    value={txDescription}
                    onChange={(e) => setTxDescription(e.target.value)}
                    placeholder="Optional"
                  />
                </div>
                <button
                  type="button"
                  disabled={
                    isAddingTransaction ||
                    !txDate ||
                    !txAmount ||
                    parseFloat(txAmount) === 0
                  }
                  onClick={() => {
                    onAddTransaction({
                      date: txDate,
                      amount: parseFloat(txAmount) || 0,
                      description: txDescription.trim() || undefined,
                      transaction_type: txType.trim() || undefined,
                      reference: txReference.trim() || undefined,
                    });
                    setTxDate("");
                    setTxAmount("");
                    setTxDescription("");
                    setTxType("");
                    setTxReference("");
                  }}
                  className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 disabled:pointer-events-none"
                >
                  {isAddingTransaction ? "Adding…" : "Add transaction"}
                </button>
              </div>
            )}
            {sortedTransactions.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 py-4 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 text-center">
                No transactions yet.
              </p>
            ) : (
              <ul className="space-y-2">
                {sortedTransactions.map((tx) => (
                  <li
                    key={tx.id}
                    className="flex flex-wrap items-center gap-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-white/[0.03] px-3 py-2 text-sm"
                  >
                    <span className="text-gray-700 dark:text-gray-300">
                      {formatDate(tx.date)}
                    </span>
                    <span
                      className={`tabular-nums font-medium ${
                        tx.amount >= 0
                          ? "text-success-600 dark:text-success-400"
                          : "text-error-600 dark:text-error-400"
                      }`}
                    >
                      {tx.amount >= 0 ? "" : "-"}
                      {formatCurrency(Math.abs(tx.amount))}
                    </span>
                    {tx.transactionType && (
                      <span className="text-gray-500 dark:text-gray-400">
                        {tx.transactionType}
                      </span>
                    )}
                    <span className="text-gray-600 dark:text-gray-300 flex-1 min-w-0 truncate">
                      {tx.description || tx.reference || "—"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {activeTab === "documents" && (
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Documents
            </h3>
            {employee.documents && employee.documents.length > 0 ? (
              <ul className="space-y-2">
                {employee.documents.map((doc) => (
                  <li
                    key={doc.id}
                    className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-white/[0.03] px-3 py-2 text-sm text-gray-700 dark:text-gray-300"
                  >
                    <svg
                      className="h-5 w-5 text-gray-400 shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    {doc.name}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 py-6 text-center rounded-xl border border-dashed border-gray-300 dark:border-gray-600">
                No documents uploaded yet.
              </p>
            )}
          </section>
        )}
      </div>
    </Modal>
  );
}
