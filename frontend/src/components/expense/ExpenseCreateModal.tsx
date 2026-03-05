"use client";

import React, { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Modal } from "@/components/ui/modal";
import ConfirmPostModal from "@/components/purchase/ConfirmPostModal";
import Label from "@/components/form/Label";
import DatePicker from "@/components/form/date-picker";
import type { Expense, ExpenseCategory, ProjectRef, EmployeeRef } from "@/types/expense";
import { fetchExpenseAccountsForGeneral, updateExpense } from "@/lib/expensesApi";
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
  isSubmitting?: boolean;
  onCreate: (data: Omit<Expense, "id">) => void;
  /** When set, modal works in edit mode (prefill and call onUpdate on submit). */
  expenseToEdit?: Expense | null;
  onUpdate?: (id: string, payload: Parameters<typeof updateExpense>[1]) => void;
}

export default function ExpenseCreateModal({
  isOpen,
  onClose,
  projects,
  employees,
  isSubmitting = false,
  onCreate,
  expenseToEdit,
  onUpdate,
}: ExpenseCreateModalProps) {
  const [category, setCategory] = useState<ExpenseCategory>("general");
  const [expenseAccountId, setExpenseAccountId] = useState<string>("");
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
  const [showPostConfirm, setShowPostConfirm] = useState(false);
  const [errors, setErrors] = useState<{
    description?: string;
    date?: string;
    amount?: string;
    project?: string;
    employee?: string;
    quantity?: string;
    rate?: string;
    paidAmount?: string;
  }>({});
  const formRef = useRef<HTMLFormElement>(null);
  const submitActionRef = useRef<"draft" | "posted">("draft");
  const isEditMode = Boolean(expenseToEdit && onUpdate);

  useEffect(() => {
    if (isOpen && expenseToEdit) {
      setCategory(expenseToEdit.category);
      setProjectId(expenseToEdit.project?.id ?? "");
      setDescription(expenseToEdit.description ?? "");
      setAmount(String(expenseToEdit.amount ?? ""));
      setDate(expenseToEdit.date?.slice(0, 10) ?? "");
      setLaborType(expenseToEdit.laborType ?? "hourly");
      setQuantity(String(expenseToEdit.quantity ?? ""));
      setRate(String(expenseToEdit.rate ?? ""));
      setEmployeeId(expenseToEdit.employeeRef?.id ?? "");
      setPaymentMethod(expenseToEdit.paymentMethod ?? "cash");
      setPaidAmount("");
      if (expenseToEdit.category === "general" && expenseToEdit.expenseAccountId != null) {
        setExpenseAccountId(String(expenseToEdit.expenseAccountId));
      }
    }
  }, [isOpen, expenseToEdit]);

  const { data: expenseAccounts = [] } = useQuery({
    queryKey: ["expense-accounts-for-general"],
    queryFn: () => fetchExpenseAccountsForGeneral(),
    enabled: isOpen,
  });
  const defaultExpenseAccount = expenseAccounts.find((a) => a.code === "5000");
  useEffect(() => {
    if (isOpen && category === "general" && expenseAccounts.length > 0) {
      const defaultId = defaultExpenseAccount?.id ?? expenseAccounts[0]?.id;
      setExpenseAccountId(defaultId != null ? String(defaultId) : "");
    }
  }, [isOpen, category, expenseAccounts.length, defaultExpenseAccount?.id]);

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

  type ValidationErrors = typeof errors;
  const runValidation = useCallback((): { valid: boolean; newErrors: ValidationErrors } => {
    const newErrors: ValidationErrors = {};
    if (!description?.trim()) newErrors.description = "Description is required.";
    if (!date?.trim()) newErrors.date = "Date is required.";
    if (isProject && !projectId?.trim()) newErrors.project = "Project is required.";
    if (isEmployeePaid && !employeeId?.trim()) newErrors.employee = "Employee is required.";
    if (!isLabor) {
      const amt = parseFloat(amount) || 0;
      if (amt <= 0) newErrors.amount = "Amount must be greater than 0.";
    } else {
      const q = parseFloat(quantity) || 0;
      const r = parseFloat(rate) || 0;
      if (q <= 0) newErrors.quantity = "Quantity must be greater than 0.";
      if (r <= 0) newErrors.rate = "Rate must be greater than 0.";
    }
    const paidAmountNum = parseFloat(paidAmount) || 0;
    if (paidAmountNum > totalAmount) {
      newErrors.paidAmount = "Paid amount cannot exceed total amount.";
    }
    const valid = Object.keys(newErrors).length === 0;
    return { valid, newErrors };
  }, [description, date, projectId, employeeId, amount, quantity, rate, paidAmount, totalAmount, isProject, isLabor, isEmployeePaid]);

  const resetForm = () => {
    setCategory("general");
    setExpenseAccountId("");
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
    setErrors({});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const { valid, newErrors } = runValidation();
    if (!valid) {
      setErrors(newErrors);
      return;
    }
    const status = submitActionRef.current;
    const attachments = files
      ? Array.from(files).map((f) => ({ name: f.name }))
      : undefined;

    if (isEditMode && expenseToEdit && onUpdate) {
      const amt = isLabor ? laborAmount : parseFloat(amount) || 0;
      const employee = employees.find((emp) => emp.id === employeeId) ?? null;
      const status = submitActionRef.current;
      const paidAmountNum = parseFloat(paidAmount) || 0;
      onUpdate(expenseToEdit.id, {
        reference: (description.trim() || (expenseToEdit as Expense & { reference?: string }).reference) ?? "",
        date: date || new Date().toISOString().slice(0, 10),
        category,
        description: description.trim() || "—",
        amount: amt,
        labor_type: isLabor ? (laborType === "hourly" ? 0 : 1) : undefined,
        quantity: isLabor ? parseFloat(quantity) || null : undefined,
        rate: isLabor ? parseFloat(rate) || null : undefined,
        employee_id: isEmployeePaid ? ((employeeId || employee?.id) ?? "") : undefined,
        employee_name: isEmployeePaid ? (employee?.name ?? "") : undefined,
        payment_method: paymentMethod,
        project: projectId ? Number(projectId) : null,
        expense_account: category === "general" && expenseAccountId ? Number(expenseAccountId) : undefined,
        status,
        paid_amount: status === "posted" && paidAmountNum > 0 ? paidAmountNum : undefined,
      });
      resetForm();
      onClose();
      return;
    }

    if (isLabor) {
      const q = parseFloat(quantity) || 0;
      const r = parseFloat(rate) || 0;
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
        paidAmount: status === "posted" && paidAmountNum > 0 ? paidAmountNum : undefined,
        status,
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
        paidAmount: status === "posted" && paidAmountNum > 0 ? paidAmountNum : undefined,
        attachments,
        status,
      });
    } else {
      const amt = parseFloat(amount) || 0;
      const project = isProject && projectId ? projects.find((p) => p.id === projectId) ?? null : null;
      onCreate({
        category,
        description: description.trim() || "—",
        amount: amt,
        date: date || new Date().toISOString().slice(0, 10),
        project: isProject ? project ?? undefined : undefined,
        attachments,
        paymentMethod,
        paidAmount: status === "posted" && paidAmountNum > 0 ? paidAmountNum : undefined,
        status,
        expenseAccountId: category === "general" && expenseAccountId ? Number(expenseAccountId) : undefined,
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
    <>
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-[95vw] w-full mx-4 max-h-[90vh] overflow-y-auto">
      <form ref={formRef} onSubmit={handleSubmit} className="p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          {isEditMode ? "Edit Expense" : "Add Expense"}
        </h2>
        <div className="space-y-4">
          <div className={`grid gap-4 ${category === "general" ? "grid-cols-2" : "grid-cols-1"}`}>
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
            {category === "general" && (
              <div>
                <Label>Expense account</Label>
                <select
                  className={selectClass}
                  value={expenseAccountId}
                  onChange={(e) => setExpenseAccountId(e.target.value)}
                >
                  <option value="">Default (5000 – Expense)</option>
                  {expenseAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.code} – {acc.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {isProject && (
            <div>
              <Label>Project</Label>
              <select
                className={errors.project ? selectClass + " border-error-500" : selectClass}
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
              {errors.project && <p className="mt-1 text-xs text-error-600 dark:text-error-400">{errors.project}</p>}
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
                    className={errors.quantity ? inputClass + " border-error-500" : inputClass}
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="0"
                    required={isLabor}
                  />
                  {errors.quantity && <p className="mt-1 text-xs text-error-600 dark:text-error-400">{errors.quantity}</p>}
                </div>
                <div>
                  <Label>Rate (QAR per {laborType === "hourly" ? "hour" : "day"})</Label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    className={errors.rate ? inputClass + " border-error-500" : inputClass}
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    placeholder="0"
                    required={isLabor}
                  />
                  {errors.rate && <p className="mt-1 text-xs text-error-600 dark:text-error-400">{errors.rate}</p>}
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
                  className={errors.employee ? selectClass + " border-error-500" : selectClass}
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
                {errors.employee && <p className="mt-1 text-xs text-error-600 dark:text-error-400">{errors.employee}</p>}
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
              className={errors.description ? inputClass + " border-error-500" : inputClass}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Site equipment rental"
              required
            />
            {errors.description && <p className="mt-1 text-xs text-error-600 dark:text-error-400">{errors.description}</p>}
          </div>

          {!isLabor && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Amount (QAR)</Label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  className={errors.amount ? inputClass + " border-error-500" : inputClass}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  required={!isLabor}
                />
                {errors.amount && <p className="mt-1 text-xs text-error-600 dark:text-error-400">{errors.amount}</p>}
              </div>
              <div>
                <DatePicker
                  id="expense-date"
                  label="Date"
                  placeholder="Select date"
                  value={date}
                  onChange={(_, dateStr) => setDate(dateStr ?? "")}
                />
                {errors.date && <p className="mt-1 text-xs text-error-600 dark:text-error-400">{errors.date}</p>}
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
              {errors.date && <p className="mt-1 text-xs text-error-600 dark:text-error-400">{errors.date}</p>}
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
              {errors.paidAmount && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.paidAmount}</p>
              )}
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
            disabled={isSubmitting}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              submitActionRef.current = "draft";
              formRef.current?.requestSubmit();
            }}
            disabled={isSubmitting}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 disabled:opacity-60"
          >
            {isSubmitting ? "Saving…" : "Draft"}
          </button>
          <button
            type="button"
            onClick={() => {
              setErrors({});
              const { valid, newErrors } = runValidation();
              if (!valid) {
                setErrors(newErrors);
                return;
              }
              setShowPostConfirm(true);
            }}
            disabled={isSubmitting}
            className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 disabled:opacity-60"
          >
            {isSubmitting ? "Saving…" : "Post"}
          </button>
        </div>
      </form>
    </Modal>
    <ConfirmPostModal
      isOpen={showPostConfirm}
      onClose={() => setShowPostConfirm(false)}
      onConfirm={() => {
        setShowPostConfirm(false);
        submitActionRef.current = "posted";
        formRef.current?.requestSubmit();
      }}
      title="Post Expense"
      message="Once posted, this expense cannot be edited. Posting will reflect in the accounts. Do you want to continue?"
    />
    </>
  );
}
