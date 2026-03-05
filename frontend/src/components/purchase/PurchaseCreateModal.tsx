"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import ConfirmPostModal from "./ConfirmPostModal";
import Label from "@/components/form/Label";
import DatePicker from "@/components/form/date-picker";
import type { Purchase, PurchaseLineItem, SupplierRef, ProjectRef } from "@/types/purchase";
import type { Material } from "@/types/material";
import { formatCurrency } from "@/utils/format";

const inputClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800";
const selectClass = inputClass;
const inputSm = "h-10 rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 " +
  "focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:focus:border-brand-800";

interface PurchaseCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  suppliers: SupplierRef[];
  projects: ProjectRef[];
  materials: Material[];
  isSubmitting?: boolean;
  onCreate: (data: Omit<Purchase, "id">) => void;
  /** When set, modal works in edit mode (prefill and call onUpdate on submit). */
  purchaseToEdit?: Purchase | null;
  onUpdate?: (id: string, payload: { reference: string; date: string; payment_method: "cash" | "bank"; description?: string; project?: number | null; line_items: { material: number; quantity: number; rate: number }[]; status?: "draft" | "posted"; paid_amount?: number }) => void;
}

interface LineRow {
  id: string;
  materialId: string;
  quantity: string;
  rate: string;
}

export default function PurchaseCreateModal({
  isOpen,
  onClose,
  suppliers,
  projects,
  materials,
  isSubmitting = false,
  onCreate,
  purchaseToEdit,
  onUpdate,
}: PurchaseCreateModalProps) {
  const [projectId, setProjectId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [reference, setReference] = useState("");
  const [date, setDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "bank">("cash");
  const [paidAmount, setPaidAmount] = useState("");
  const [description, setDescription] = useState("");
  const [lines, setLines] = useState<LineRow[]>([
    { id: "row-1", materialId: "", quantity: "", rate: "" },
  ]);
  const [files, setFiles] = useState<FileList | null>(null);
  const [showPostConfirm, setShowPostConfirm] = useState(false);
  const [errors, setErrors] = useState<{
    supplier?: string;
    date?: string;
    lines?: Record<string, { quantity?: string; rate?: string }>;
    paidAmount?: string;
  }>({});
  const formRef = useRef<HTMLFormElement>(null);
  const submitActionRef = useRef<"draft" | "posted">("draft");
  const isEditMode = Boolean(purchaseToEdit && onUpdate);

  const normalizeDate = (d: unknown): string => {
    if (d == null) return "";
    if (typeof d === "string") {
      const trimmed = d.trim();
      if (trimmed.length >= 10) return trimmed.slice(0, 10);
      return trimmed;
    }
    return "";
  };

  useEffect(() => {
    if (isOpen && purchaseToEdit) {
      setProjectId(purchaseToEdit.project?.id ?? "");
      setSupplierId(purchaseToEdit.supplier?.id ?? "");
      setReference(purchaseToEdit.reference ?? "");
      setDate(normalizeDate(purchaseToEdit.date));
      setPaymentMethod(purchaseToEdit.paymentMethod ?? "cash");
      setDescription(purchaseToEdit.description ?? "");
      setPaidAmount(
        purchaseToEdit.paidAmount != null ? String(purchaseToEdit.paidAmount) : ""
      );
      setLines(
        purchaseToEdit.lineItems?.length
          ? purchaseToEdit.lineItems.map((item, i) => ({
              id: `row-${i}-${item.id}`,
              materialId: item.materialId,
              quantity: String(item.quantity),
              rate: String(item.rate),
            }))
          : [{ id: "row-1", materialId: "", quantity: "", rate: "" }]
      );
    }
  }, [isOpen, purchaseToEdit]);

  const addLine = useCallback(() => {
    setLines((prev) => [
      ...prev,
      { id: `row-${Date.now()}`, materialId: "", quantity: "", rate: "" },
    ]);
  }, []);

  const removeLine = useCallback((id: string) => {
    setLines((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));
  }, []);

  const updateLine = useCallback((id: string, field: keyof LineRow, value: string) => {
    setLines((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  }, []);

  type ValidationErrors = typeof errors;
  const runValidation = useCallback((): { valid: boolean; newErrors: ValidationErrors } => {
    const newErrors: ValidationErrors = {};
    if (!supplierId?.trim()) {
      newErrors.supplier = "Supplier is required.";
    }
    if (!date?.trim()) {
      newErrors.date = "Date is required.";
    }
    const lineErrors: Record<string, { quantity?: string; rate?: string }> = {};
    let hasValidLine = false;
    lines.forEach((row) => {
      if (!row.materialId) return;
      const qty = parseFloat(row.quantity) || 0;
      const rate = parseFloat(row.rate) || 0;
      const qtyInvalid = qty <= 0;
      const rateInvalid = rate <= 0;
      if (qtyInvalid || rateInvalid) {
        lineErrors[row.id] = {};
        if (qtyInvalid) lineErrors[row.id].quantity = "Quantity must be greater than 0.";
        if (rateInvalid) lineErrors[row.id].rate = "Rate must be greater than 0.";
      } else {
        hasValidLine = true;
      }
    });
    if (Object.keys(lineErrors).length > 0) newErrors.lines = lineErrors;
    if (!hasValidLine) {
      if (!newErrors.lines) newErrors.lines = {};
      const firstRowId = lines[0]?.id;
      if (firstRowId && !newErrors.lines[firstRowId]) {
        newErrors.lines[firstRowId] = { quantity: "Add at least one material with quantity and rate greater than 0." };
      }
    }
    const totalAmount = lines.reduce(
      (sum, r) => sum + (parseFloat(r.quantity) || 0) * (parseFloat(r.rate) || 0),
      0
    );
    const paidAmountNum = parseFloat(paidAmount) || 0;
    if (paidAmountNum > totalAmount) {
      newErrors.paidAmount = "Paid amount cannot exceed total amount.";
    }
    const valid = Object.keys(newErrors).length === 0;
    return { valid, newErrors };
  }, [supplierId, date, lines, paidAmount]);

    const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const { valid, newErrors } = runValidation();
    if (!valid) {
      setErrors(newErrors);
      return;
    }

    if (isEditMode && purchaseToEdit && onUpdate) {
      const lineItemsPayload = lines
        .filter((r) => r.materialId && (parseFloat(r.quantity) || 0) > 0 && (parseFloat(r.rate) || 0) > 0)
        .map((r) => ({
          material: Number(r.materialId),
          quantity: parseFloat(r.quantity) || 0,
          rate: parseFloat(r.rate) || 0,
        }));
      if (lineItemsPayload.length === 0) return;
      const paidAmountNum = parseFloat(paidAmount) || 0;
      onUpdate(purchaseToEdit.id, {
        reference: reference.trim() || "—",
        date: date || new Date().toISOString().slice(0, 10),
        payment_method: paymentMethod,
        description: description.trim(),
        project: projectId ? Number(projectId) : null,
        line_items: lineItemsPayload,
        status: submitActionRef.current,
        paid_amount: paidAmountNum,
      });
      resetForm();
      onClose();
      return;
    }

    const supplier = suppliers.find((s) => s.id === supplierId);
    if (!supplier) return;
    const project = projectId ? projects.find((p) => p.id === projectId) ?? null : null;
    const lineItems: PurchaseLineItem[] = lines
      .filter((r) => r.materialId && (parseFloat(r.quantity) || 0) > 0 && (parseFloat(r.rate) || 0) > 0)
      .map((r) => {
        const mat = materials.find(
          (m) => String(m.id) === String(r.materialId)
        );
        if (!mat) return null;
        const qty = parseFloat(r.quantity) || 0;
        const rate = parseFloat(r.rate) || 0;
        return {
          id: r.id,
          materialId: String(mat.id),
          materialName: mat.name,
          materialCode: mat.code,
          unit: mat.unitDisplay,
          quantity: qty,
          rate,
          amount: qty * rate,
        };
      })
      .filter((l): l is NonNullable<typeof l> => l != null);
    if (lineItems.length === 0) return;
    const amount = lineItems.reduce((sum, l) => sum + l.amount, 0);
    const paidAmountNum = parseFloat(paidAmount) || 0;
    const attachments = files
      ? Array.from(files).map((f) => ({ name: f.name }))
      : undefined;
    const status = submitActionRef.current;
    const paymentStatus =
      paidAmountNum >= amount ? "completed" : paidAmountNum > 0 ? "partial" : "not_completed";
    onCreate({
      project: project ?? undefined,
      supplier,
      reference: reference.trim() || "—",
      date: date || new Date().toISOString().slice(0, 10),
      status,
      paymentMethod,
      lineItems,
      amount,
      description: description.trim() || undefined,
      attachments,
      paidAmount: paidAmountNum,
      paymentStatus,
    });
    resetForm();
    onClose();
  };

  function resetForm() {
    setProjectId("");
    setSupplierId("");
    setReference("");
    setDate("");
    setPaymentMethod("cash");
    setPaidAmount("");
    setDescription("");
    setLines([{ id: `row-${Date.now()}`, materialId: "", quantity: "", rate: "" }]);
    setFiles(null);
    setErrors({});
  }

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const totalAmount = lines.reduce((sum, r) => {
    const qty = parseFloat(r.quantity) || 0;
    const rate = parseFloat(r.rate) || 0;
    return sum + qty * rate;
  }, 0);
  const paidAmountNum = parseFloat(paidAmount) || 0;
  const balance = totalAmount - paidAmountNum;

  return (
    <>
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-[95vw] w-full mx-4 max-h-[90vh] overflow-y-auto">
      <form ref={formRef} onSubmit={handleSubmit} noValidate className="p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          {isEditMode ? "Edit Purchase" : "Add Purchase"}
        </h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <div>
              <Label>
                Supplier <span className="text-red-600 dark:text-red-400">*</span>
              </Label>
              <select
                className={selectClass + (errors.supplier ? " border-red-500 dark:border-red-400" : "")}
                value={supplierId}
                onChange={(e) => {
                  setSupplierId(e.target.value);
                  if (errors.supplier) setErrors((prev) => ({ ...prev, supplier: undefined }));
                }}
              >
                <option value="">Select supplier</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              {errors.supplier && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.supplier}</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Reference / PO #</Label>
              <input
                type="text"
                className={inputClass}
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="e.g. PO-2024-001"
              />
            </div>
            <div>
              <Label>
                Date <span className="text-red-600 dark:text-red-400">*</span>
              </Label>
              <DatePicker
                key={`purchase-date-${date || "empty"}`}
                id="purchase-date"
                placeholder="Select date"
                value={date}
                onChange={(_, dateStr) => {
                  setDate(dateStr ?? "");
                  if (errors.date) setErrors((prev) => ({ ...prev, date: undefined }));
                }}
                error={!!errors.date}
              />
              {errors.date && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.date}</p>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>
                Materials <span className="text-red-600 dark:text-red-400">*</span>
              </Label>
              <button
                type="button"
                onClick={addLine}
                className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
              >
                + Add line
              </button>
            </div>
            <div className={`rounded-xl border overflow-hidden ${Object.keys(errors.lines ?? {}).length > 0 ? "border-red-500 dark:border-red-400" : "border-gray-200 dark:border-gray-700"}`}>
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-white/[0.04]">
                    <th className="px-3 py-2 text-left font-medium text-gray-500 dark:text-gray-400">Material</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-500 dark:text-gray-400 w-24">Qty <span className="text-red-600 dark:text-red-400">*</span></th>
                    <th className="px-3 py-2 text-right font-medium text-gray-500 dark:text-gray-400 w-28">Rate (QAR) <span className="text-red-600 dark:text-red-400">*</span></th>
                    <th className="px-3 py-2 text-right font-medium text-gray-500 dark:text-gray-400 w-28">Amount</th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody>
                  {lines.map((row) => {
                    const mat = materials.find((m) => String(m.id) === row.materialId);
                    const qty = parseFloat(row.quantity) || 0;
                    const rate = parseFloat(row.rate) || (mat?.rate ?? 0);
                    const amount = qty * rate;
                    return (
                      <tr key={row.id} className="border-b border-gray-100 dark:border-gray-800">
                        <td className="px-3 py-2">
                          <select
                            className={inputSm + " w-full min-w-[180px]"}
                            value={row.materialId}
                            onChange={(e) => {
                              const id = e.target.value;
                              updateLine(row.id, "materialId", id);
                              const m = materials.find((x) => String(x.id) === id);
                              if (m && !row.rate) updateLine(row.id, "rate", String(m.rate));
                            }}
                          >
                            <option value="">Select material</option>
                            {materials.map((m) => (
                              <option key={m.id} value={String(m.id)}>
                                {m.name} ({m.code})
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <div>
                            <input
                              type="number"
                              min={0}
                              step="any"
                              className={inputSm + " w-full text-right" + (errors.lines?.[row.id]?.quantity ? " border-red-500 dark:border-red-400" : "")}
                              value={row.quantity}
                              onChange={(e) => {
                                updateLine(row.id, "quantity", e.target.value);
                                if (errors.lines?.[row.id]) setErrors((prev) => ({ ...prev, lines: { ...prev.lines, [row.id]: { ...prev.lines?.[row.id], quantity: undefined } } }));
                              }}
                              placeholder="0"
                            />
                            {errors.lines?.[row.id]?.quantity && (
                              <p className="mt-0.5 text-xs text-red-600 dark:text-red-400">{errors.lines[row.id].quantity}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div>
                            <input
                              type="number"
                              min={0}
                              step="0.01"
                              className={inputSm + " w-full text-right" + (errors.lines?.[row.id]?.rate ? " border-red-500 dark:border-red-400" : "")}
                              value={row.rate}
                              onChange={(e) => {
                                updateLine(row.id, "rate", e.target.value);
                                if (errors.lines?.[row.id]) setErrors((prev) => ({ ...prev, lines: { ...prev.lines, [row.id]: { ...prev.lines?.[row.id], rate: undefined } } }));
                              }}
                              placeholder="0"
                            />
                            {errors.lines?.[row.id]?.rate && (
                              <p className="mt-0.5 text-xs text-red-600 dark:text-red-400">{errors.lines[row.id].rate}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-gray-700 dark:text-gray-300">
                          {formatCurrency(amount)}
                        </td>
                        <td className="px-1 py-2">
                          <button
                            type="button"
                            onClick={() => removeLine(row.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 rounded"
                            aria-label="Remove line"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300 text-right">
              Total: {formatCurrency(totalAmount)}
            </p>
          </div>

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
            <Label>Description (optional)</Label>
            <input
              type="text"
              className={inputClass}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Steel rebar and mesh"
            />
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
      title="Post Purchase"
      message="Once posted, this purchase cannot be edited. Posting will reflect in the accounts. Do you want to continue?"
    />
  </>
  );
}
