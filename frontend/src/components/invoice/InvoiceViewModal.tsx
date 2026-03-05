"use client";

import React, { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Modal } from "@/components/ui/modal";
import ConfirmPostModal from "@/components/purchase/ConfirmPostModal";
import ConfirmDeleteModal from "@/components/ui/ConfirmDeleteModal";
import MakePaymentModal from "@/components/purchase/MakePaymentModal";
import DatePicker from "@/components/form/date-picker";
import Label from "@/components/form/Label";
import { formatCurrency, formatDate } from "@/utils/format";
import type { Invoice, InvoicePayment, InvoiceDocument } from "@/types/invoice";
import {
  getInvoice,
  updateInvoice,
  addInvoicePayment,
  patchInvoicePayment,
  deleteInvoicePayment,
  fetchInvoiceDocuments,
  uploadInvoiceDocument,
  downloadInvoiceDocument,
  deleteInvoiceDocument,
  INVOICES_QUERY_KEY,
} from "@/lib/invoicesApi";

const inputClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800";

type Tab = "details" | "payments" | "documents";

function EditInvoicePaymentModal({
  isOpen,
  onClose,
  initialDate,
  initialAmount,
  initialReference,
  maxAmount,
  onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  initialDate: string;
  initialAmount: number;
  initialReference: string;
  maxAmount: number;
  onSubmit: (date: string, amount: number, reference: string) => void;
}) {
  const [date, setDate] = useState(initialDate?.slice(0, 10) ?? "");
  const [amount, setAmount] = useState(String(initialAmount ?? ""));
  const [reference, setReference] = useState(initialReference ?? "");
  const [amountError, setAmountError] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setDate(initialDate?.slice(0, 10) ?? "");
      setAmount(String(initialAmount ?? ""));
      setReference(initialReference ?? "");
      setAmountError(null);
    }
  }, [isOpen, initialDate, initialAmount, initialReference]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAmountError(null);
    const amountNum = parseFloat(amount) || 0;
    if (amountNum <= 0) {
      setAmountError("Amount must be greater than 0.");
      return;
    }
    if (amountNum > maxAmount) {
      setAmountError("Amount cannot exceed the remaining balance for this payment.");
      return;
    }
    if (!date?.trim()) return;
    onSubmit(date.trim(), amountNum, reference.trim());
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[95vw] w-full mx-4">
      <form onSubmit={handleSubmit} noValidate className="p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Edit payment</h2>
        <div className="space-y-4">
          <div>
            <Label>Date <span className="text-red-600 dark:text-red-400">*</span></Label>
            <DatePicker
              id="edit-invoice-payment-date"
              placeholder="Select date"
              value={date}
              onChange={(_, dateStr) => setDate(dateStr ?? "")}
            />
          </div>
          <div>
            <Label>Amount (QAR) <span className="text-red-600 dark:text-red-400">*</span></Label>
            <input
              type="number"
              min={0}
              step="0.01"
              className={inputClass + (amountError ? " border-red-500 dark:border-red-400" : "")}
              value={amount}
              onChange={(e) => { setAmount(e.target.value); setAmountError(null); }}
              placeholder="0"
            />
            {amountError && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{amountError}</p>}
          </div>
          <div>
            <Label>Reference (optional)</Label>
            <input
              type="text"
              className={inputClass}
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="—"
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700">
            Cancel
          </button>
          <button type="submit" className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600">
            Save
          </button>
        </div>
      </form>
    </Modal>
  );
}

interface InvoiceViewModalProps {
  invoiceId: number | null;
  isOpen: boolean;
  onClose: () => void;
  /** e.g. "Client Invoice" or "Subcontractor Invoice" */
  title: string;
  /** 0=client (income), 1=subcontractor (expense). Affects "Received" vs "Paid" labels. */
  invoiceType?: 0 | 1;
  onEdit?: (invoice: Invoice) => void;
}

export default function InvoiceViewModal({
  invoiceId,
  isOpen,
  onClose,
  title,
  invoiceType = 1,
  onEdit,
}: InvoiceViewModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>("details");
  const [postModalOpen, setPostModalOpen] = useState(false);
  const [addPaymentOpen, setAddPaymentOpen] = useState(false);
  const [paymentToEdit, setPaymentToEdit] = useState<{ id: number; date: string; amount: number; reference?: string } | null>(null);
  const [paymentToDelete, setPaymentToDelete] = useState<{ id: number; date: string; amount: number } | null>(null);
  const [documentToDelete, setDocumentToDelete] = useState<InvoiceDocument | null>(null);
  const [uploadName, setUploadName] = useState("");
  const [uploadDescription, setUploadDescription] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { data: invoice, isLoading: invoiceLoading } = useQuery({
    queryKey: ["invoice", invoiceId],
    queryFn: () => getInvoice(invoiceId!),
    enabled: isOpen && invoiceId != null,
  });

  const { data: documents = [], isLoading: documentsLoading } = useQuery({
    queryKey: ["invoice-documents", invoiceId],
    queryFn: () => fetchInvoiceDocuments(invoiceId!),
    enabled: isOpen && invoiceId != null,
  });

  const updateInvoiceMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Parameters<typeof updateInvoice>[1] }) =>
      updateInvoice(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["invoice", id] });
      queryClient.invalidateQueries({ queryKey: [INVOICES_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ["project-financials"] });
    },
  });

  const addPaymentMutation = useMutation({
    mutationFn: ({
      invoiceId: invId,
      date,
      amount,
      reference,
      status,
    }: {
      invoiceId: number;
      date: string;
      amount: number;
      reference?: string;
      status?: "draft" | "posted";
    }) => addInvoicePayment(invId, { date, amount, reference, status }),
    onSuccess: (_, { invoiceId: invId }) => {
      queryClient.invalidateQueries({ queryKey: ["invoice", invId] });
      queryClient.invalidateQueries({ queryKey: [INVOICES_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ["project-financials"] });
      setAddPaymentOpen(false);
    },
  });

  const patchPaymentMutation = useMutation({
    mutationFn: ({
      invoiceId: invId,
      paymentId,
      payload,
    }: {
      invoiceId: number;
      paymentId: number;
      payload: { date?: string; amount?: number; reference?: string; status?: "draft" | "posted" };
    }) => patchInvoicePayment(invId, paymentId, payload),
    onSuccess: (_, { invoiceId: invId }) => {
      queryClient.invalidateQueries({ queryKey: ["invoice", invId] });
      queryClient.invalidateQueries({ queryKey: [INVOICES_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ["project-financials"] });
      setPaymentToEdit(null);
    },
  });

  const deletePaymentMutation = useMutation({
    mutationFn: ({ invoiceId: invId, paymentId }: { invoiceId: number; paymentId: number }) =>
      deleteInvoicePayment(invId, paymentId),
    onSuccess: (_, { invoiceId: invId }) => {
      queryClient.invalidateQueries({ queryKey: ["invoice", invId] });
      queryClient.invalidateQueries({ queryKey: [INVOICES_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ["project-financials"] });
      setPaymentToDelete(null);
    },
  });

  const uploadDocMutation = useMutation({
    mutationFn: ({
      invoiceId: invId,
      file,
      options,
    }: { invoiceId: number; file: File; options?: { name?: string; description?: string } }) =>
      uploadInvoiceDocument(invId, file, options),
    onSuccess: (_, { invoiceId: invId }) => {
      queryClient.invalidateQueries({ queryKey: ["invoice-documents", invId] });
      setUploadFile(null);
      setUploadName("");
      setUploadDescription("");
    },
  });

  const deleteDocMutation = useMutation({
    mutationFn: ({ invoiceId: invId, documentId }: { invoiceId: number; documentId: number }) =>
      deleteInvoiceDocument(invId, documentId),
    onSuccess: (_, { invoiceId: invId }) => {
      queryClient.invalidateQueries({ queryKey: ["invoice-documents", invId] });
      setDocumentToDelete(null);
    },
  });

  if (!invoice && (invoiceLoading || !invoiceId)) return null;
  if (!invoice) return null;

  const isDraft = invoice.status === "draft";
  const paymentList = invoice.payments ?? [];
  const postedPaid = paymentList
    .filter((p) => (p.status ?? "draft") === "posted")
    .reduce((sum, p) => sum + (p.amount ?? 0), 0);
  const balanceFromPosted = invoice.amount - postedPaid;
  const showAddPayment = balanceFromPosted > 0 && invoice.status === "posted";
  const paymentStatus = invoice.paymentStatus ?? "not_completed";
  const currentPaid = invoice.paidAmount ?? 0;
  const balance = invoice.amount - currentPaid;

  const handlePostConfirm = () => {
    updateInvoiceMutation.mutate({ id: Number(invoice.id), payload: { status: "posted" } });
    setPostModalOpen(false);
  };

  const handleMakePaymentSubmit = (amount: number, paymentDate: string, status: "draft" | "posted") => {
    addPaymentMutation.mutate({
      invoiceId: Number(invoice.id),
      date: paymentDate,
      amount,
      reference: "",
      status,
    });
  };

  const handleEditPaymentSubmit = (date: string, amount: number, reference: string) => {
    if (!paymentToEdit) return;
    patchPaymentMutation.mutate({
      invoiceId: Number(invoice.id),
      paymentId: paymentToEdit.id,
      payload: { date, amount, reference },
    });
  };

  const handlePostPayment = (paymentId: number) => {
    patchPaymentMutation.mutate({
      invoiceId: Number(invoice.id),
      paymentId,
      payload: { status: "posted" },
    });
  };

  const handleDocumentFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setUploadFile(file ?? null);
    if (file && !uploadName) setUploadName(file.name);
  };

  const handleUploadDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || invoiceId == null) return;
    uploadDocMutation.mutate({
      invoiceId,
      file: uploadFile,
      options: { name: uploadName.trim() || undefined, description: uploadDescription.trim() || undefined },
    });
  };

  const handleDownloadDocument = (doc: InvoiceDocument) => {
    if (invoiceId == null) return;
    downloadInvoiceDocument(invoiceId, doc.id, doc.filename || doc.name || "document").then((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.filename || doc.name || "document";
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "details", label: "Details" },
    { id: "payments", label: "Payments" },
    { id: "documents", label: "Documents" },
  ];

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} className="max-w-[95vw] w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h2>
            {isDraft && onEdit && (
              <button
                type="button"
                onClick={() => onEdit(invoice)}
                title="Edit"
                className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-gray-200"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            )}
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
            <>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Party</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">{invoice.partyName}</dd>
                </div>
                {invoice.projectName && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Project</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">{invoice.projectName}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Reference</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">{invoice.reference || "—"}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</dt>
                  <dd className="mt-1">
                    <span
                      className={
                        invoice.status === "posted"
                          ? "inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : "inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                      }
                    >
                      {invoice.status}
                    </span>
                  </dd>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Payment method</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white capitalize">{invoice.paymentMethod}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Payment status</dt>
                    <dd className="mt-1">
                      <span
                        className={
                          paymentStatus === "completed"
                            ? "inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : paymentStatus === "partial"
                              ? "inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                              : "inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                        }
                      >
                        {paymentStatus === "not_completed" ? "Not completed" : paymentStatus === "completed" ? "Completed" : "Partial"}
                      </span>
                    </dd>
                  </div>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Date</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white">{formatDate(invoice.date)}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Amount (QAR)</dt>
                  <dd className="mt-1 text-sm font-medium text-gray-900 dark:text-white tabular-nums">{formatCurrency(invoice.amount)}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{invoiceType === 0 ? "Received amount (QAR)" : "Paid amount (QAR)"}</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-white tabular-nums">{formatCurrency(currentPaid)}</dd>
                </div>
                {invoice.description && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">{invoice.description}</dd>
                  </div>
                )}
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-white/[0.03] p-4 space-y-2">
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-white">Summary</h3>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Total</span>
                    <span className="tabular-nums font-medium text-gray-900 dark:text-white">{formatCurrency(invoice.amount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">{invoiceType === 0 ? "Received" : "Paid"}</span>
                    <span className="tabular-nums font-medium text-gray-900 dark:text-white">{formatCurrency(currentPaid)}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-gray-700 dark:text-gray-300 font-medium">Balance</span>
                    <span
                      className={`tabular-nums font-semibold ${
                        balance <= 0 ? "text-success-600 dark:text-success-400" : "text-error-600 dark:text-error-400"
                      }`}
                    >
                      {balance < 0 ? `-${formatCurrency(Math.abs(balance))}` : formatCurrency(balance)}
                    </span>
                  </div>
                </div>
              </dl>
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
            </>
          )}

          {activeTab === "payments" && (
            <div className="space-y-4">
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-white/[0.03] p-4 space-y-2">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-white">Payment summary</h3>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">{invoiceType === 0 ? "Received" : "Paid"}</span>
                  <span className="tabular-nums font-medium text-gray-900 dark:text-white">{formatCurrency(currentPaid)}</span>
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
                    {paymentList.map((p) => {
                      const pAmount = typeof p.amount === "number" ? p.amount : parseFloat(String(p.amount)) || 0;
                      const pId = typeof p.id === "string" ? parseInt(p.id, 10) : p.id;
                      return (
                        <li
                          key={p.id}
                          className="flex flex-wrap items-center gap-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-white/[0.03] px-3 py-2 text-sm"
                        >
                          <span className="font-medium text-gray-800 dark:text-white/90">{formatDate(p.date)}</span>
                          <span className="text-gray-600 dark:text-gray-400 tabular-nums">{formatCurrency(pAmount)}</span>
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
                          {invoice.status === "posted" && (
                            <div className="ml-auto flex items-center gap-1">
                              {(p.status ?? "draft") === "draft" && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handlePostPayment(pId)}
                                    disabled={patchPaymentMutation.isPending}
                                    className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
                                  >
                                    Post
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setPaymentToEdit({ id: pId, date: p.date, amount: pAmount, reference: p.reference })}
                                    title="Edit"
                                    className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/10 dark:hover:text-gray-200"
                                  >
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setPaymentToDelete({ id: pId, date: p.date, amount: pAmount })}
                                    title="Delete"
                                    className="rounded p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                                  >
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </li>
                      );
                    })}
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
              </div>
              {documentsLoading ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 py-4">Loading documents…</p>
              ) : documents.length > 0 ? (
                <ul className="space-y-2 w-full">
                  {documents.map((doc) => (
                    <li
                      key={doc.id}
                      className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 w-full rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2"
                    >
                      <span className="min-w-0 truncate flex-1" title={doc.description || undefined}>
                        {doc.name || doc.filename}
                      </span>
                      {doc.size != null && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">
                          {(doc.size / 1024).toFixed(1)} KB
                        </span>
                      )}
                      <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">
                        {formatDate(doc.created_at.slice(0, 10))}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        {doc.file_url && (
                          <a
                            href={doc.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/10 dark:hover:text-gray-300"
                            title="Open in new tab"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDownloadDocument(doc)}
                          title="Download"
                          className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/10 dark:hover:text-gray-300"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDocumentToDelete(doc)}
                          disabled={deleteDocMutation.isPending}
                          title="Delete"
                          className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-600 dark:hover:bg-white/10 dark:hover:text-red-400 disabled:opacity-50"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 py-4">No documents yet. Upload one below.</p>
              )}
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-white/[0.02] p-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Upload document</h4>
                <form onSubmit={handleUploadDocument} className="space-y-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleDocumentFileChange}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.txt"
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                      Choose file
                    </button>
                    {uploadFile && (
                      <span className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-[200px]">
                        {uploadFile.name}
                      </span>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Name (optional)</label>
                    <input
                      type="text"
                      value={uploadName}
                      onChange={(e) => setUploadName(e.target.value)}
                      className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                      placeholder="Document name"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Description (optional)</label>
                    <input
                      type="text"
                      value={uploadDescription}
                      onChange={(e) => setUploadDescription(e.target.value)}
                      className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                      placeholder="Description"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!uploadFile || uploadDocMutation.isPending}
                    className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
                  >
                    {uploadDocMutation.isPending ? "Uploading…" : "Upload"}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </Modal>

      <ConfirmPostModal
        isOpen={postModalOpen}
        onClose={() => setPostModalOpen(false)}
        onConfirm={handlePostConfirm}
        title="Post invoice"
        message="This action cannot be undone. The invoice will be recorded in the accounts."
      />

      <MakePaymentModal
        isOpen={addPaymentOpen}
        onClose={() => setAddPaymentOpen(false)}
        balance={balanceFromPosted}
        onSubmit={handleMakePaymentSubmit}
      />

      <EditInvoicePaymentModal
        isOpen={!!paymentToEdit}
        onClose={() => setPaymentToEdit(null)}
        initialDate={paymentToEdit?.date ?? ""}
        initialAmount={paymentToEdit?.amount ?? 0}
        initialReference={paymentToEdit?.reference ?? ""}
        maxAmount={balanceFromPosted + (paymentToEdit?.amount ?? 0)}
        onSubmit={handleEditPaymentSubmit}
      />

      {paymentToDelete && (
        <ConfirmDeleteModal
          isOpen={!!paymentToDelete}
          onClose={() => setPaymentToDelete(null)}
          onConfirm={() => {
            deletePaymentMutation.mutate({ invoiceId: Number(invoice.id), paymentId: paymentToDelete.id });
          }}
          title="Delete payment"
          message={`Remove payment of ${formatCurrency(paymentToDelete.amount)} on ${formatDate(paymentToDelete.date)}?`}
        />
      )}

      {documentToDelete && (
        <ConfirmDeleteModal
          isOpen={!!documentToDelete}
          onClose={() => setDocumentToDelete(null)}
          onConfirm={() => {
            deleteDocMutation.mutate({ invoiceId: Number(invoice.id), documentId: documentToDelete.id });
          }}
          title="Delete document"
          message={`Remove "${documentToDelete.name || documentToDelete.filename}"?`}
        />
      )}
    </>
  );
}
