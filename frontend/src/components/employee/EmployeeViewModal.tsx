"use client";

import React, { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Modal } from "@/components/ui/modal";
import { formatCurrency, formatDate } from "@/utils/format";
import type { Employee, EmployeeSalaryEntry } from "@/types/employee";
import type {
  AddSalaryPayload,
  UpdateSalaryPayload,
  EmployeeDocument,
} from "@/lib/employeesApi";
import {
  deleteEmployeeDocument,
  downloadEmployeeDocument,
  fetchEmployeeDocuments,
  uploadEmployeeDocument,
} from "@/lib/employeesApi";
import AddSalaryEntryModal from "./AddSalaryEntryModal";
import ConfirmDeleteModal from "@/components/ui/ConfirmDeleteModal";

type Tab =
  | "details"
  | "dashboard"
  | "identification"
  | "employment"
  | "salary_wps"
  | "medical_insurance"
  | "salary_management"
  | "financial"
  | "documents";

const tabs: { id: Tab; label: string }[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "details", label: "Details" },
  { id: "identification", label: "Identification" },
  { id: "employment", label: "Employment" },
  { id: "salary_wps", label: "Salary & WPS Details" },
  { id: "medical_insurance", label: "Medical & Insurance" },
  { id: "salary_management", label: "Salary Management" },
  { id: "financial", label: "Financial" },
  { id: "documents", label: "Documents" },
];

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
  onAddSalary?: (payload: AddSalaryPayload, onSuccess?: () => void) => void;
  onEditSalary?: (
    entryId: number,
    payload: UpdateSalaryPayload,
    onSuccess?: () => void
  ) => void;
  onDeleteSalary?: (entryId: number, onSuccess?: () => void) => void;
  isAddingSalary?: boolean;
  isEditingSalary?: boolean;
  isDeletingSalary?: boolean;
}

export default function EmployeeViewModal({
  employee,
  isOpen,
  onClose,
  onUpdate,
  onAddSalary,
  onEditSalary,
  onDeleteSalary,
  isAddingSalary = false,
  isEditingSalary = false,
  isDeletingSalary = false,
}: EmployeeViewModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [addSalaryModalOpen, setAddSalaryModalOpen] = useState(false);
  const [entryToEdit, setEntryToEdit] = useState<EmployeeSalaryEntry | null>(null);
  const [entryToDelete, setEntryToDelete] = useState<EmployeeSalaryEntry | null>(null);
  const [documentToDelete, setDocumentToDelete] = useState<EmployeeDocument | null>(null);
  const [previewDocument, setPreviewDocument] = useState<{
    name: string;
    url: string | null;
    filename: string;
  } | null>(null);
  const [uploadName, setUploadName] = useState("");
  const [uploadDescription, setUploadDescription] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const employeeIdNum = employee ? Number(employee.id) : null;

  const { data: employeeDocuments = [], isLoading: documentsLoading } = useQuery({
    queryKey: ["employee-documents", employeeIdNum],
    queryFn: () => fetchEmployeeDocuments(employeeIdNum!),
    enabled: isOpen && employeeIdNum != null,
  });
  const uploadDocMutation = useMutation({
    mutationFn: ({
      employeeId,
      file,
      options,
    }: {
      employeeId: number;
      file: File;
      options?: { name?: string; description?: string };
    }) => uploadEmployeeDocument(employeeId, file, options),
    onSuccess: (_, { employeeId }) => {
      queryClient.invalidateQueries({ queryKey: ["employee-documents", employeeId] });
      setUploadFile(null);
      setUploadName("");
      setUploadDescription("");
    },
  });
  const deleteDocMutation = useMutation({
    mutationFn: ({
      employeeId,
      documentId,
    }: { employeeId: number; documentId: number }) =>
      deleteEmployeeDocument(employeeId, documentId),
    onSuccess: (_, { employeeId }) => {
      queryClient.invalidateQueries({ queryKey: ["employee-documents", employeeId] });
      setDocumentToDelete(null);
    },
  });

  if (!employee) return null;

  const handleConfirmDeleteDocument = () => {
    if (documentToDelete && employeeIdNum != null)
      deleteDocMutation.mutate({
        employeeId: employeeIdNum,
        documentId: documentToDelete.id,
      });
  };

  const salaryEntries: EmployeeSalaryEntry[] = employee.salaryEntries ?? [];
  const sortedSalaries = [...salaryEntries].sort(
    (a, b) => b.date.localeCompare(a.date)
  );

  return (
    <>
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

        {(activeTab === "dashboard" ||
          activeTab === "identification" ||
          activeTab === "employment" ||
          activeTab === "salary_wps" ||
          activeTab === "medical_insurance") && (
          <section className="flex flex-col items-center justify-center py-16">
            <div className="rounded-xl border border-amber-200 bg-amber-50/50 px-6 py-8 text-center dark:border-amber-800 dark:bg-amber-900/20">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Under development
              </p>
              <p className="mt-1 text-xs text-amber-700 dark:text-amber-300/80">
                This section is coming soon.
              </p>
            </div>
          </section>
        )}

        {activeTab === "salary_management" && (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Salary entries
              </h3>
              {onAddSalary && (
                <button
                  type="button"
                  onClick={() => setAddSalaryModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Add salary
                </button>
              )}
            </div>
            {(onAddSalary || onEditSalary) && (
              <AddSalaryEntryModal
                isOpen={addSalaryModalOpen || !!entryToEdit}
                onClose={() => {
                  setAddSalaryModalOpen(false);
                  setEntryToEdit(null);
                }}
                employeeName={employee.fullName}
                entryToEdit={entryToEdit}
                onSubmit={(payload) => {
                  onAddSalary?.(payload, () => {
                    setAddSalaryModalOpen(false);
                  });
                }}
                onUpdate={
                  onEditSalary
                    ? (entryId, payload) => {
                        onEditSalary(entryId, payload, () => {
                          setEntryToEdit(null);
                        });
                      }
                    : undefined
                }
                isSubmitting={isAddingSalary || isEditingSalary}
              />
            )}
            {onDeleteSalary && (
              <ConfirmDeleteModal
                isOpen={!!entryToDelete}
                onClose={() => setEntryToDelete(null)}
                onConfirm={() => {
                  if (entryToDelete) {
                    onDeleteSalary(entryToDelete.id, () => setEntryToDelete(null));
                  }
                }}
                title="Delete salary entry"
                message="Are you sure you want to delete this draft salary entry? This action cannot be undone."
              />
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
                    {(se.paymentMethodDisplay || se.statusDisplay) && (
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {[se.paymentMethodDisplay, se.statusDisplay].filter(Boolean).join(" · ")}
                      </span>
                    )}
                    {se.status === "draft" && (onEditSalary || onDeleteSalary) && (
                      <div className="flex items-center gap-1 ml-auto">
                        {onEditSalary && (
                          <button
                            type="button"
                            onClick={() => setEntryToEdit(se)}
                            className="rounded px-2 py-1 text-xs font-medium text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-500/10"
                          >
                            Edit
                          </button>
                        )}
                        {onDeleteSalary && (
                          <button
                            type="button"
                            onClick={() => setEntryToDelete(se)}
                            className="rounded px-2 py-1 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {activeTab === "financial" && (
          <section className="space-y-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Financial overview
            </h3>

            <div>
              <h4 className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Salary entries
              </h4>
              {sortedSalaries.length === 0 ? (
                <p className="rounded-xl border border-dashed border-gray-300 py-4 text-center text-sm text-gray-500 dark:border-gray-600 dark:text-gray-400">
                  No salary entries.
                </p>
              ) : (
                <ul className="space-y-2">
                  {sortedSalaries.map((se) => (
                    <li
                      key={`salary-${se.id}`}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-white/[0.03]"
                    >
                      <span className="text-gray-700 dark:text-gray-300">
                        {formatDate(se.date)}
                      </span>
                      <span className="font-medium tabular-nums text-gray-900 dark:text-white">
                        {formatCurrency(se.amount)}
                      </span>
                      <span className="w-full text-gray-500 dark:text-gray-400 sm:w-auto">
                        {se.description || "—"}
                      </span>
                      {(se.paymentMethodDisplay || se.statusDisplay) && (
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          {[se.paymentMethodDisplay, se.statusDisplay]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        )}

        {activeTab === "documents" && (
          <div className="w-full space-y-6">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Documents
              </h3>
            </div>
            {documentsLoading ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 py-4">
                Loading documents…
              </p>
            ) : employeeDocuments.length > 0 ? (
              <ul className="space-y-2 w-full">
                {employeeDocuments.map((doc) => (
                  <li
                    key={doc.id}
                    className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 w-full rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2"
                  >
                    <span
                      className="min-w-0 truncate flex-1"
                      title={doc.description || undefined}
                    >
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
                        onClick={() =>
                          setPreviewDocument({
                            name: doc.name || doc.filename,
                            url: doc.file_url ?? null,
                            filename: doc.filename || doc.name || "document",
                          })
                        }
                        title="View"
                        className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/10 dark:hover:text-gray-300"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          downloadEmployeeDocument(
                            employeeIdNum!,
                            doc.id,
                            doc.filename || doc.name || "document"
                          )
                        }
                        title="Download"
                        className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/10 dark:hover:text-gray-300"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                          />
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
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                          </svg>
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => setDocumentToDelete(doc)}
                        disabled={deleteDocMutation.isPending}
                        title="Delete"
                        className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-600 dark:hover:bg-white/10 dark:hover:text-red-400 disabled:opacity-50"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 py-4">
                No documents yet. Upload one below.
              </p>
            )}
            {onUpdate && (
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-white/[0.02] p-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Upload document
                </h4>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!uploadFile || employeeIdNum == null) return;
                    uploadDocMutation.mutate({
                      employeeId: employeeIdNum,
                      file: uploadFile,
                      options: {
                        name: uploadName.trim() || undefined,
                        description: uploadDescription.trim() || undefined,
                      },
                    });
                  }}
                  className="space-y-3"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      setUploadFile(file ?? null);
                      if (file && !uploadName) setUploadName(file.name);
                    }}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.txt"
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 4v16m8-8H4"
                        />
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
                    <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                      Name (optional)
                    </label>
                    <input
                      type="text"
                      value={uploadName}
                      onChange={(e) => setUploadName(e.target.value)}
                      className="h-9 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                      placeholder="Document name"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                      Description (optional)
                    </label>
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
      </div>
    </Modal>

    <ConfirmDeleteModal
      isOpen={!!documentToDelete}
      onClose={() => setDocumentToDelete(null)}
      onConfirm={handleConfirmDeleteDocument}
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
