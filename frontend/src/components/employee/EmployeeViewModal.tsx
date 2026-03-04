"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import Label from "@/components/form/Label";
import DatePicker from "@/components/form/date-picker";
import { formatCurrency, formatDate } from "@/utils/format";
import type { Employee, SalaryEntry, SalaryEntryType } from "@/types/employee";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const inputClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800";

const TYPE_LABELS: Record<SalaryEntryType, string> = {
  regular: "Regular",
  bonus: "Bonus",
  adjustment: "Adjustment",
};

type Tab = "details" | "dashboard" | "salary";

function monthsBetween(startDate: string, endDate: string): number {
  const s = new Date(startDate);
  const e = new Date(endDate);
  return Math.max(
    0,
    (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth())
  );
}

interface EmployeeViewModalProps {
  employee: Employee | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (id: string, updates: Partial<Employee>) => void;
  /** Pending reimbursement amount (employee-paid expenses not yet reimbursed) */
  pendingReimbursement?: number;
}

export default function EmployeeViewModal({
  employee,
  isOpen,
  onClose,
  onUpdate,
  pendingReimbursement = 0,
}: EmployeeViewModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>("details");
  const [showAddSalary, setShowAddSalary] = useState(false);
  const [newEffectiveDate, setNewEffectiveDate] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newType, setNewType] = useState<SalaryEntryType>("regular");
  const [newNotes, setNewNotes] = useState("");

  if (!employee) return null;

  const entries = employee.salaryEntries ?? [];
  const sortedEntries = [...entries].sort(
    (a, b) => b.effectiveDate.localeCompare(a.effectiveDate)
  );

  const today = new Date().toISOString().slice(0, 10);
  const monthsEmployed = monthsBetween(employee.joinDate, today);
  const bonusAndAdjustmentTotal = entries
    .filter((e) => e.type === "bonus" || e.type === "adjustment")
    .reduce((sum, e) => sum + e.amount, 0);
  const totalEarned =
    monthsEmployed * employee.salary + bonusAndAdjustmentTotal;

  const resetAddSalary = () => {
    setShowAddSalary(false);
    setNewEffectiveDate("");
    setNewAmount("");
    setNewType("regular");
    setNewNotes("");
  };

  const handleAddSalary = () => {
    const amount = parseFloat(newAmount);
    if (isNaN(amount) || amount < 0 || !newEffectiveDate) return;
    const newEntry: SalaryEntry = {
      id: `se-${Date.now()}`,
      effectiveDate: newEffectiveDate,
      amount,
      type: newType,
      notes: newNotes.trim() || undefined,
    };
    const updatedEntries = [newEntry, ...entries];
    const updates: Partial<Employee> = {
      salaryEntries: updatedEntries,
    };
    if (newType === "regular") {
      updates.salary = amount;
    }
    onUpdate?.(employee.id, updates);
    resetAddSalary();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
    >
      <div className="p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Employee Details
        </h2>

        <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700 mb-6">
          <button
            type="button"
            onClick={() => setActiveTab("details")}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === "details"
                ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white border-b-2 border-brand-500 -mb-px"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            Details
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("dashboard")}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === "dashboard"
                ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white border-b-2 border-brand-500 -mb-px"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            Dashboard
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("salary")}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === "salary"
                ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white border-b-2 border-brand-500 -mb-px"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            Salary Management
          </button>
        </div>

        {activeTab === "details" && (
          <section>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
              Personal Information
            </h3>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Name
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {employee.name}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Email
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {employee.email}
                </dd>
              </div>
              {employee.phone && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Phone
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                    {employee.phone}
                  </dd>
                </div>
              )}
              {employee.dateOfBirth && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Date of birth
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                    {formatDate(employee.dateOfBirth)}
                  </dd>
                </div>
              )}
              {employee.address && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Address
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                    {employee.address}
                  </dd>
                </div>
              )}
              {employee.nationality && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Nationality
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                    {employee.nationality}
                  </dd>
                </div>
              )}
              {employee.qatarDocuments && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Qatar documents
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                    {employee.qatarDocuments}
                  </dd>
                </div>
              )}
              {employee.passportExpiry && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Passport expiry
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                    {formatDate(employee.passportExpiry)}
                  </dd>
                </div>
              )}
              {employee.visaExpiry && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Visa expiry
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                    {formatDate(employee.visaExpiry)}
                  </dd>
                </div>
              )}
              {employee.qidExpiry && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    QID expiry
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                    {formatDate(employee.qidExpiry)}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Department
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {employee.department}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Position
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {employee.position}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Join date
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {formatDate(employee.joinDate)}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Current salary
                </dt>
                <dd className="mt-1 text-sm font-medium text-gray-900 dark:text-white tabular-nums">
                  {formatCurrency(employee.salary)} {employee.currency ?? "QAR"}
                </dd>
              </div>
              {employee.bankAccount && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Bank account
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white font-mono">
                    {employee.bankAccount}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Status
                </dt>
                <dd className="mt-1">
                  <span
                    className={
                      employee.status === "active"
                        ? "inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400"
                        : "inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                    }
                  >
                    {employee.status}
                  </span>
                </dd>
              </div>
            </dl>
          </section>
        )}

        {activeTab === "dashboard" && (
          <section>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
              Compensation overview
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-white/[0.04] p-5">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                  Basic salary
                </p>
                <p className="text-xl font-semibold text-gray-900 dark:text-white tabular-nums">
                  {formatCurrency(employee.salary)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {employee.currency ?? "QAR"} per month
                </p>
              </div>
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-white/[0.04] p-5">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                  Total amount given
                </p>
                <p className="text-xl font-semibold text-gray-900 dark:text-white tabular-nums">
                  {formatCurrency(totalEarned)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Estimated total paid by company
                </p>
              </div>
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-white/[0.04] p-5">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                  Total money earned
                </p>
                <p className="text-xl font-semibold text-gray-900 dark:text-white tabular-nums">
                  {formatCurrency(totalEarned)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Through this company ({monthsEmployed} months)
                </p>
              </div>
              <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-500/10 p-5">
                <p className="text-xs font-medium text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-1">
                  Amount to reimburse
                </p>
                <p className="text-xl font-semibold text-amber-800 dark:text-amber-300 tabular-nums">
                  {formatCurrency(pendingReimbursement)}
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400/80 mt-1">
                  Pending employee-paid expenses
                </p>
              </div>
            </div>
          </section>
        )}

        {activeTab === "salary" && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Salary history
              </h3>
              {onUpdate && (
                <button
                  type="button"
                  onClick={() => setShowAddSalary(!showAddSalary)}
                  className="rounded-lg bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600"
                >
                  {showAddSalary ? "Cancel" : "+ Add salary entry"}
                </button>
              )}
            </div>

            {showAddSalary && (
              <div className="mb-6 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-white/[0.03] space-y-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  New salary entry
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <DatePicker
                      id="employee-effective-date"
                      label="Effective date"
                      placeholder="Select date"
                      value={newEffectiveDate}
                      onChange={(_, dateStr) => setNewEffectiveDate(dateStr ?? "")}
                    />
                  </div>
                  <div>
                    <Label>Amount (QAR)</Label>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      className={inputClass}
                      value={newAmount}
                      onChange={(e) => setNewAmount(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label>Type</Label>
                    <select
                      className={inputClass}
                      value={newType}
                      onChange={(e) =>
                        setNewType(e.target.value as SalaryEntryType)
                      }
                    >
                      <option value="regular">Regular</option>
                      <option value="bonus">Bonus</option>
                      <option value="adjustment">Adjustment</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Notes (optional)</Label>
                    <input
                      type="text"
                      className={inputClass}
                      value={newNotes}
                      onChange={(e) => setNewNotes(e.target.value)}
                      placeholder="e.g. Annual review, promotion"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleAddSalary}
                    disabled={
                      !newEffectiveDate ||
                      !newAmount ||
                      parseFloat(newAmount) < 0
                    }
                    className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    Add entry
                  </button>
                  <button
                    type="button"
                    onClick={resetAddSalary}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <Table>
                <TableHeader className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-white/[0.04]">
                  <TableRow>
                    <TableCell
                      isHeader
                      className="px-4 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-400"
                    >
                      Effective date
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 text-end text-xs font-medium text-gray-500 dark:text-gray-400"
                    >
                      Amount (QAR)
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-400"
                    >
                      Type
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-400"
                    >
                      Notes
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {sortedEntries.length === 0 ? (
                    <TableRow>
                      <td
                        colSpan={4}
                        className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                      >
                        No salary entries yet.
                      </td>
                    </TableRow>
                  ) : (
                    sortedEntries.map((entry) => (
                      <tr
                        key={entry.id}
                        className="hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                      >
                        <TableCell className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {formatDate(entry.effectiveDate)}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-sm text-right tabular-nums font-medium text-gray-900 dark:text-white">
                          {formatCurrency(entry.amount)}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                          {TYPE_LABELS[entry.type]}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                          {entry.notes ?? "—"}
                        </TableCell>
                      </tr>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </section>
        )}
      </div>
    </Modal>
  );
}
