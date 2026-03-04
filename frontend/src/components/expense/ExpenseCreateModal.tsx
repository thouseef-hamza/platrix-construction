"use client";

import React, { useState, useMemo } from "react";
import { Modal } from "@/components/ui/modal";
import Label from "@/components/form/Label";
import DatePicker from "@/components/form/date-picker";
import type { Expense, ExpenseCategory, ProjectRef, EmployeeRef } from "@/types/expense";
import { formatCurrency } from "@/utils/format";

const inputClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800";
const selectClass = inputClass;

const CATEGORY_OPTIONS: { value: ExpenseCategory; label: string }[] = [
  { value: "project", label: "Project-level expense" },
  { value: "general", label: "General expense" },
  { value: "outsourced_labor", label: "Outsourced labor (hourly/daily)" },
  { value: "employee_paid", label: "Employee-paid expense" },
];

interface ExpenseCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: ProjectRef[];
  employees: EmployeeRef[];
  onCreate: (data: Omit<Expense, "id">) => void;
}

export default function ExpenseCreateModal({
  isOpen,
  onClose,
  projects,
  employees,
  onCreate,
}: ExpenseCreateModalProps) {
  const [category, setCategory] = useState<ExpenseCategory>("general");
  const [projectId, setProjectId] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [laborType, setLaborType] = useState<"hourly" | "daily">("hourly");
  const [quantity, setQuantity] = useState("");
  const [rate, setRate] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "bank">("cash");
  const [paidAmount, setPaidAmount] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);

  const isProject = category === "project";
  const isLabor = category === "outsourced_labor";
  const isEmployeePaid = category === "employee_paid";

  const laborAmount = useMemo(() => {
    const q = parseFloat(quantity) || 0;
    const r = parseFloat(rate) || 0;
    return q * r;
  }, [quantity, rate]);

  const totalAmount = useMemo(() => {
    if (isLabor) return laborAmount;
    return parseFloat(amount) || 0;
  }, [isLabor, laborAmount, amount]);

  const paidAmountNum = parseFloat(paidAmount) || 0;
  const balance = totalAmount - paidAmountNum;

  const resetForm = () => {
    setCategory("general");
    setProjectId("");
    setDescription("");
    setAmount("");
    setDate("");
    setLaborType("hourly");
    setQuantity("");
    setRate("");
    setEmployeeId("");
    setPaymentMethod("cash");
    setPaidAmount("");
    setFiles(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const attachments = files
      ? Array.from(files).map((f) => ({ name: f.name }))
      : undefined;

    if (isLabor) {
      const q = parseFloat(quantity) || 0;
      const r = parseFloat(rate) || 0;
      if (q <= 0 || r <= 0) return;
      const project = projectId ? projects.find((p) => p.id === projectId) ?? null : null;
      onCreate({
        category: "outsourced_labor",
        description: description.trim() || "—",
        amount: q * r,
        date: date || new Date().toISOString().slice(0, 10),
        laborType,
        quantity: q,
        rate: r,
        project: project ?? undefined,
        attachments,
        paymentMethod,
        paidAmount: paidAmountNum > 0 ? paidAmountNum : undefined,
        status: "posted",
      });
    } else if (isEmployeePaid) {
      const employee = employees.find((emp) => emp.id === employeeId) ?? null;
      if (!employee) return;
      const amt = parseFloat(amount) || 0;
      const project = projectId ? projects.find((p) => p.id === projectId) ?? null : null;
      onCreate({
        category: "employee_paid",
        description: description.trim() || "—",
        amount: amt,
        date: date || new Date().toISOString().slice(0, 10),
        employeeRef: employee,
        project: project ?? undefined,
        paymentMethod,
        paidAmount: paidAmountNum > 0 ? paidAmountNum : undefined,
        attachments,
        status: "posted",
      });
    } else {
      const amt = isProject ? parseFloat(amount) || 0 : parseFloat(amount) || 0;
      const project = isProject && projectId ? projects.find((p) => p.id === projectId) ?? null : null;
      if (isProject && !project) return;
      onCreate({
        category,
        description: description.trim() || "—",
        amount: amt,
        date: date || new Date().toISOString().slice(0, 10),
        project: isProject ? project ?? undefined : undefined,
        attachments,
        paymentMethod,
        paidAmount: paidAmountNum > 0 ? paidAmountNum : undefined,
        status: "posted",
      });
    }
    resetForm();
    onClose();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
      <form onSubmit={handleSubmit} className="p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Add Expense
        </h2>
        <div className="space-y-4">
          <div>
            <Label>Expense type</Label>
            <select
              className={selectClass}
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
            >
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {isProject && (
            <div>
              <Label>Project</Label>
              <select
                className={selectClass}
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                required={isProject}
              >
                <option value="">Select project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {isLabor && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Labor type</Label>
                  <select
                    className={selectClass}
                    value={laborType}
                    onChange={(e) => setLaborType(e.target.value as "hourly" | "daily")}
                  >
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                  </select>
                </div>
                <div>
                  <Label>Project (optional)</Label>
                  <select
                    className={selectClass}
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                  >
                    <option value="">None</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{laborType === "hourly" ? "Hours" : "Days"}</Label>
                  <input
                    type="number"
                    min={0}
                    step={laborType === "hourly" ? "0.5" : "1"}
                    className={inputClass}
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="0"
                    required={isLabor}
                  />
                </div>
                <div>
                  <Label>Rate (QAR per {laborType === "hourly" ? "hour" : "day"})</Label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    className={inputClass}
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    placeholder="0"
                    required={isLabor}
                  />
                </div>
              </div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 tabular-nums">
                Amount: {formatCurrency(laborAmount)}
              </p>
            </>
          )}

          {isEmployeePaid && (
            <>
              <div>
                <Label>Employee</Label>
                <select
                  className={selectClass}
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  required={isEmployeePaid}
                >
                  <option value="">Select employee</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Project (optional)</Label>
                <select
                  className={selectClass}
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                >
                  <option value="">None</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div>
            <Label>Description</Label>
            <input
              type="text"
              className={inputClass}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Site equipment rental"
              required
            />
          </div>

          {!isLabor && (
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
                  required={!isLabor}
                />
              </div>
              <div>
                <DatePicker
                  id="expense-date"
                  label="Date"
                  placeholder="Select date"
                  value={date}
                  onChange={(_, dateStr) => setDate(dateStr ?? "")}
                />
              </div>
            </div>
          )}

          {isLabor && (
            <div>
              <DatePicker
                id="expense-date-labor"
                label="Date"
                placeholder="Select date"
                value={date}
                onChange={(_, dateStr) => setDate(dateStr ?? "")}
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <Label>Paid amount (QAR)</Label>
              <input
                type="number"
                min={0}
                step="0.01"
                className={inputClass}
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-white/[0.03] p-4 space-y-2">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white">Summary</h3>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Paid</span>
              <span className="tabular-nums font-medium text-gray-900 dark:text-white">{formatCurrency(paidAmountNum)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Balance</span>
              <span className={`tabular-nums font-medium ${balance <= 0 ? "text-success-600 dark:text-success-400" : "text-error-600 dark:text-error-400"}`}>
                {balance < 0 ? `-${formatCurrency(Math.abs(balance))}` : formatCurrency(balance)}
              </span>
            </div>
          </div>

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
            Post
          </button>
        </div>
      </form>
    </Modal>
  );
}
