"use client";

import React, { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Modal } from "@/components/ui/modal";
import { formatCurrency, formatDate } from "@/utils/format";
import type { Purchase } from "@/types/purchase";
import {
  deletePurchaseDocument,
  downloadPurchaseDocument,
  fetchPurchaseDocuments,
  uploadPurchaseDocument,
  type PurchaseDocument,
} from "@/lib/purchasesApi";
import ConfirmPostModal from "./ConfirmPostModal";
import ConfirmDeleteModal from "@/components/ui/ConfirmDeleteModal";
import MakePaymentModal from "./MakePaymentModal";

interface PurchaseViewModalProps {
  purchase: Purchase | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (id: string, updates: Partial<Purchase>) => void;
  /** Post a draft payment to the ledger. */
  onPostPayment?: (purchaseId: string, paymentId: string) => void;
}

type Tab = "details" | "payments" | "documents" | "activity";

export default function PurchaseViewModal({
  purchase,
  isOpen,
  onClose,
  onUpdate,
  onPostPayment,
}: PurchaseViewModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>("details");
  const [postModalOpen, setPostModalOpen] = useState(false);
  const [makePaymentModalOpen, setMakePaymentModalOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<PurchaseDocument | null>(null);
  const [previewDocument, setPreviewDocument] = useState<{ name: string; url: string | null; filename: string } | null>(null);
  const [uploadName, setUploadName] = useState("");
  const [uploadDescription, setUploadDescription] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const purchaseIdNum = purchase ? Number(purchase.id) : null;

  const { data: purchaseDocuments = [], isLoading: documentsLoading } = useQuery({
    queryKey: ["purchase-documents", purchaseIdNum],
    queryFn: () => fetchPurchaseDocuments(purchaseIdNum!),
    enabled: isOpen && purchaseIdNum != null,
  });
  const uploadDocMutation = useMutation({
    mutationFn: ({
      purchaseId,
      file,
      options,
    }: {
      purchaseId: number;
      file: File;
      options?: { name?: string; description?: string };
    }) => uploadPurchaseDocument(purchaseId, file, options),
    onSuccess: (_, { purchaseId }) => {
      queryClient.invalidateQueries({ queryKey: ["purchase-documents", purchaseId] });
      setUploadFile(null);
      setUploadName("");
      setUploadDescription("");
    },
  });
  const deleteDocMutation = useMutation({
    mutationFn: ({
      purchaseId,
      documentId,
    }: { purchaseId: number; documentId: number }) =>
      deletePurchaseDocument(purchaseId, documentId),
    onSuccess: (_, { purchaseId }) => {
      queryClient.invalidateQueries({ queryKey: ["purchase-documents", purchaseId] });
      setDocumentToDelete(null);
    },
  });

  if (!purchase) return null;

  const isDraft = purchase.status === "draft";
  const paymentStatus = purchase.paymentStatus ?? (purchase.paidAmount === undefined || purchase.paidAmount === 0 ? "not_completed" : purchase.paidAmount >= purchase.amount ? "completed" : "partial");
  const currentPaid = purchase.paidAmount ?? 0;
  const balance = purchase.amount - currentPaid;
  const showMakePayment = balance > 0;

  const handlePostConfirm = () => {
    onUpdate?.(purchase.id, { status: "posted" });
  };

  const handleMakePaymentSubmit = (
    amount: number,
    paymentDate: string,
    status: "draft" | "posted"
  ) => {
    const newPaidAmount = currentPaid + amount;
    const existingPayments = purchase.payments ?? [];
    const newPayment = { id: `pp-${Date.now()}`, date: paymentDate, amount, status };
    onUpdate?.(purchase.id, {
      paidAmount: newPaidAmount,
      paidAt: paymentDate || undefined,
      payments: [...existingPayments, newPayment],
    });
    setMakePaymentModalOpen(false);
  };

  const paymentList = purchase.payments ?? [];

  const handleDocumentFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setUploadFile(file ?? null);
    if (file && !uploadName) setUploadName(file.name);
  };
  const handleUploadDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || purchaseIdNum == null) return;
    uploadDocMutation.mutate({
      purchaseId: purchaseIdNum,
      file: uploadFile,
      options: { name: uploadName.trim() || undefined, description: uploadDescription.trim() || undefined },
    });
  };
  const openDocPreview = (doc: PurchaseDocument) => {
    setPreviewDocument({
      name: doc.name || doc.filename,
      url: doc.file_url ?? null,
      filename: doc.filename || doc.name || "document",
    });
  };
  const handleDownloadDocument = (doc: PurchaseDocument) => {
    if (purchaseIdNum == null) return;
    downloadPurchaseDocument(
      purchaseIdNum,
      doc.id,
      doc.filename || doc.name || "document"
    );
  };
  const handleDeleteDocumentClick = (doc: PurchaseDocument) => {
    setDocumentToDelete(doc);
  };
  const confirmDeleteDocument = () => {
    if (documentToDelete && purchaseIdNum != null)
      deleteDocMutation.mutate({ purchaseId: purchaseIdNum, documentId: documentToDelete.id });
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
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Paid amount (QAR)
                </dt>
                <dd className="mt-1 text-sm font-medium text-gray-900 dark:text-white tabular-nums">
                  {formatCurrency(currentPaid)}
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

            {/* Payment summary at last - when balance is outstanding */}
            {balance > 0 && (
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-white/[0.03] p-4 space-y-2">
                <h3 className="text-sm font-semibold text-gray-800 dark:text-white">Payment summary</h3>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Total amount</span>
                  <span className="tabular-nums font-medium text-gray-900 dark:text-white">
                    {formatCurrency(purchase.amount)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Paid</span>
                  <span className="tabular-nums font-medium text-gray-900 dark:text-white">
                    {formatCurrency(currentPaid)}
                  </span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-gray-700 dark:text-gray-300 font-medium">Balance due</span>
                  <span className="tabular-nums font-semibold text-error-600 dark:text-error-400">
                    {formatCurrency(balance)}
                  </span>
                </div>
                {onUpdate && purchase.status === "posted" && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 pt-1">
                    Go to the Payments tab to make a payment.
                  </p>
                )}
              </div>
            )}
          </dl>
          )}
          {activeTab === "payments" && (
            <div>
              <div className="flex items-center justify-between gap-4 mb-4">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Payments</span>
                {showMakePayment && onUpdate && purchase.status === "posted" && (
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
                        <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Status</th>
                        {onPostPayment ? (
                          <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400 w-24">Action</th>
                        ) : null}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                      {paymentList.map((p) => (
                        <tr key={p.id} className="bg-white dark:bg-transparent">
                          <td className="px-4 py-3 text-gray-900 dark:text-white">{formatDate(p.date)}</td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{p.reference ?? "—"}</td>
                          <td className="px-4 py-3 text-right tabular-nums text-gray-900 dark:text-white">{formatCurrency(p.amount)}</td>
                          <td className="px-4 py-3">
                            <span
                              className={
                                (p.status ?? "draft") === "posted"
                                  ? "inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                  : "inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                              }
                            >
                              {(p.status ?? "draft") === "posted" ? "Posted" : "Draft"}
                            </span>
                          </td>
                          {onPostPayment ? (
                            <td className="px-4 py-3 text-right">
                              {(p.status ?? "draft") === "draft" ? (
                                <button
                                  type="button"
                                  onClick={() => onPostPayment(purchase.id, p.id)}
                                  className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
                                >
                                  Post
                                </button>
                              ) : null}
                            </td>
                          ) : null}
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
            <div className="w-full space-y-6">
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Documents</h3>
              </div>
              {documentsLoading ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 py-4">Loading documents…</p>
              ) : purchaseDocuments.length > 0 ? (
                <ul className="space-y-2 w-full">
                  {purchaseDocuments.map((doc) => (
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
                        <button
                          type="button"
                          onClick={() => openDocPreview(doc)}
                          title="View"
                          className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/10 dark:hover:text-gray-300"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
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
                          onClick={() => handleDeleteDocumentClick(doc)}
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
              {onUpdate && (
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
      <ConfirmDeleteModal
        isOpen={!!documentToDelete}
        onClose={() => setDocumentToDelete(null)}
        onConfirm={confirmDeleteDocument}
        title="Delete document"
        itemName={documentToDelete?.name || documentToDelete?.filename}
      />
      <Modal
        isOpen={!!previewDocument}
        onClose={() => setPreviewDocument(null)}
        className="max-w-[95vw] w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col"
      >
        {previewDocument && (
          <div className="flex flex-col flex-1 min-h-0 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 truncate pr-10" title={previewDocument.name}>
              {previewDocument.name}
            </h3>
            <div className="flex-1 min-h-0 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 overflow-hidden flex items-center justify-center">
              {previewDocument.url ? (
                (() => {
                  const nameForExt = previewDocument.filename || previewDocument.name;
                  const ext = nameForExt.split(".").pop()?.toLowerCase();
                  const isPdf = ext === "pdf";
                  const isImage = ["png", "jpg", "jpeg", "gif", "webp"].includes(ext ?? "");
                  if (isPdf)
                    return (
                      <object
                        data={previewDocument.url}
                        type="application/pdf"
                        className="w-full h-[70vh] min-h-[400px] border-0 rounded-lg"
                        title={previewDocument.name}
                      />
                    );
                  if (isImage)
                    return (
                      <img
                        src={previewDocument.url}
                        alt={previewDocument.name}
                        className="max-w-full max-h-[70vh] object-contain"
                      />
                    );
                  return (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      <a href={previewDocument.url} target="_blank" rel="noopener noreferrer" className="text-brand-600 dark:text-brand-400 font-medium hover:underline">
                        Open in new tab
                      </a>
                      {" or "}
                      <a href={previewDocument.url} download={previewDocument.filename} className="text-brand-600 dark:text-brand-400 font-medium hover:underline">
                        Download
                      </a>
                    </p>
                  );
                })()
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">No preview available.</p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
