"use client";

import React, { useRef, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Modal } from "@/components/ui/modal";
import Badge from "@/components/ui/badge/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });
import BudgetGauge from "@/components/common/BudgetGauge";
import {
  deleteProjectDocument,
  downloadProjectDocument,
  fetchProjectDocuments,
  fetchProjectFinancials,
  uploadProjectDocument,
  type ProjectDocument,
} from "@/lib/projectsApi";
import {
  PROJECT_TYPES,
  PROJECT_STATUSES,
  type Project,
  type ProjectStatus,
  type ProjectType,
  type ProjectComment,
  type ProjectActivity,
  type ProjectAttachment,
} from "@/types/project";

type Tab = "dashboard" | "details" | "documents" | "financial" | "notes" | "activity";

function formatBudget(value: number): string {
  return new Intl.NumberFormat("en-QA", {
    style: "currency",
    currency: "QAR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function getStatusBadgeColor(status: ProjectStatus): "primary" | "success" | "error" | "warning" | "info" {
  switch (status) {
    case "active":
      return "success";
    case "planning":
      return "info";
    case "onhold":
      return "warning";
    case "completed":
      return "primary";
    case "cancelled":
      return "error";
    default:
      return "primary";
  }
}

function formatType(type: ProjectType): string {
  return PROJECT_TYPES.find((t) => t.value === type)?.label ?? type;
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "Z");
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr + "Z");
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

type FeedItem = { type: "comment"; data: ProjectComment } | { type: "activity"; data: ProjectActivity };

interface ProjectViewModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateProject?: (projectId: string, updates: Partial<Project>) => void;
  onAddComment?: (projectId: string, message: string) => void;
  onEdit?: (project: Project) => void;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function useMonthlyBreakdown(transactions: { date: string; amount: number; type: string }[]) {
  return useMemo(() => {
    const byMonth: Record<string, { income: number; expense: number }> = {};
    MONTHS.forEach((_, i) => {
      const key = `${new Date().getFullYear()}-${String(i + 1).padStart(2, "0")}`;
      byMonth[key] = { income: 0, expense: 0 };
    });
    transactions.forEach((t) => {
      const key = t.date.slice(0, 7);
      if (!byMonth[key]) byMonth[key] = { income: 0, expense: 0 };
      if (t.type === "income" && t.amount > 0) byMonth[key].income += t.amount;
      if (t.type === "expense" && t.amount < 0) byMonth[key].expense += Math.abs(t.amount);
    });
    return {
      monthlyInvoices: MONTHS.map((_, i) => {
        const key = `${new Date().getFullYear()}-${String(i + 1).padStart(2, "0")}`;
        return byMonth[key]?.income ?? 0;
      }),
      monthlyExpenses: MONTHS.map((_, i) => {
        const key = `${new Date().getFullYear()}-${String(i + 1).padStart(2, "0")}`;
        return byMonth[key]?.expense ?? 0;
      }),
    };
  }, [transactions]);
}

export default function ProjectViewModal({
  project,
  isOpen,
  onClose,
  onUpdateProject,
  onAddComment,
  onEdit,
}: ProjectViewModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [newComment, setNewComment] = useState("");
  const [previewDocument, setPreviewDocument] = useState<ProjectAttachment | null>(null);
  const [uploadName, setUploadName] = useState("");
  const [uploadDescription, setUploadDescription] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  const queryClient = useQueryClient();
  const projectIdNum = project?.id != null ? Number(project.id) : null;
  const {
    data: projectDocuments = [],
    isLoading: documentsLoading,
  } = useQuery({
    queryKey: ["project-documents", projectIdNum],
    queryFn: () => fetchProjectDocuments(projectIdNum!),
    enabled: isOpen && projectIdNum != null,
  });
  const {
    data: financials,
    isLoading: financialsLoading,
  } = useQuery({
    queryKey: ["project-financials", projectIdNum],
    queryFn: () => fetchProjectFinancials(projectIdNum!),
    enabled: isOpen && projectIdNum != null,
  });
  const uploadDocMutation = useMutation({
    mutationFn: ({
      projectId,
      file,
      name,
      description,
    }: {
      projectId: number;
      file: File;
      name?: string;
      description?: string;
    }) => uploadProjectDocument(projectId, file, { name, description }),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ["project-documents", projectId] });
      setUploadFile(null);
      setUploadName("");
      setUploadDescription("");
      fileInputRef.current?.value && (fileInputRef.current.value = "");
    },
  });
  const deleteDocMutation = useMutation({
    mutationFn: ({
      projectId,
      documentId,
    }: {
      projectId: number;
      documentId: number;
    }) => deleteProjectDocument(projectId, documentId),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ["project-documents", projectId] });
    },
  });

  const budget = project?.budget ?? 0;
  const income = financials?.income ?? 0;
  const expenses = financials?.expense ?? 0;
  const variation = financials?.variation ?? 0;
  const financialTransactions = financials?.transactions ?? [];
  const recentTransactions = financialTransactions.slice(0, 5);
  const { monthlyInvoices, monthlyExpenses } = useMonthlyBreakdown(financialTransactions);
  const comments = project?.comments ?? [];
  const activities = project?.activities ?? [];
  const feedItems: FeedItem[] = useMemo(() => {
    const items: FeedItem[] = [
      ...comments.map((c) => ({ type: "comment" as const, data: c })),
      ...activities.map((a) => ({ type: "activity" as const, data: a })),
    ];
    items.sort((a, b) => new Date(b.data.createdAt).getTime() - new Date(a.data.createdAt).getTime());
    return items;
  }, [comments, activities]);
  if (!project) return null;

  const statusLabel = PROJECT_STATUSES.find((s) => s.value === project.status)?.label ?? project.status;
  const budgetSpent = expenses;
  const budgetPercent = Math.min(100, (budgetSpent / project.budget) * 100);
  const budgetPercentRounded = Math.round(budgetPercent * 100) / 100;
  const budgetChangePercent = 10;

  const handleDocumentFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setUploadFile(file ?? null);
    if (file && !uploadName) setUploadName(file.name);
    e.target.value = "";
  };

  const handleUploadDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || projectIdNum == null) return;
    uploadDocMutation.mutate({
      projectId: projectIdNum,
      file: uploadFile,
      name: uploadName.trim() || undefined,
      description: uploadDescription.trim() || undefined,
    });
  };

  const openDocPreview = (doc: ProjectDocument) => {
    setPreviewDocument({
      name: doc.name,
      url: doc.file_url,
      filename: doc.filename,
      projectId: projectIdNum ?? undefined,
      documentId: doc.id,
    });
  };

  const handleDownloadDocument = (doc: ProjectDocument) => {
    if (projectIdNum == null) return;
    downloadProjectDocument(
      projectIdNum,
      doc.id,
      doc.filename || doc.name || "document"
    );
  };

  const handleDeleteDocument = (doc: ProjectDocument) => {
    if (!projectIdNum || !window.confirm(`Delete "${doc.name || doc.filename}"?`)) return;
    deleteDocMutation.mutate({ projectId: projectIdNum, documentId: doc.id });
  };

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    const msg = newComment.trim();
    if (!msg || !onAddComment) return;
    onAddComment(project.id, msg);
    setNewComment("");
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "dashboard", label: "Dashboard" },
    { id: "details", label: "Details" },
    { id: "documents", label: "Documents" },
    { id: "financial", label: "Financial" },
    { id: "notes", label: "Notes" },
    { id: "activity", label: "Activity" },
  ];

  return (
    <>
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[95vw] w-full mx-4 max-h-[90vh] overflow-y-auto">
      <div className="p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {project.projectName}
          </h2>
          {onEdit && (
            <button
              type="button"
              onClick={() => {
                onEdit(project);
                onClose();
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
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

        {/* Dashboard */}
        {activeTab === "dashboard" && (
          <div className="space-y-6 w-full">
            {/* Left: Revenue + Expense cards and Cash flow chart. Right: Budget gauge (full height) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 w-full items-stretch">
              {/* Left column: cards + chart (width never exceeds chart area) */}
              <div className="lg:col-span-2 flex flex-col gap-4 min-w-0">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] min-w-0">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-success-100 dark:bg-success-500/20 text-success-600 dark:text-success-400">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Revenue</p>
                        <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white tabular-nums truncate">{formatBudget(income)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] min-w-0">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-error-100 dark:bg-error-500/20 text-error-600 dark:text-error-400">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Expense</p>
                        <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white tabular-nums truncate">{formatBudget(expenses)}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03] min-h-[280px] flex flex-col">
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-4">Cash flow (Invoices vs Expenses)</h3>
                  <div className="h-56 -ml-2 flex-1 min-h-0">
                    <ReactApexChart
                      options={{
                        chart: { type: "bar", toolbar: { show: false }, fontFamily: "Outfit, sans-serif" },
                        plotOptions: { bar: { horizontal: false, columnWidth: "70%", borderRadius: 4 } },
                        dataLabels: { enabled: false },
                        xaxis: { categories: MONTHS, axisBorder: { show: false }, axisTicks: { show: false } },
                        yaxis: { labels: { formatter: (v: number) => (v / 1000).toFixed(0) + "K" } },
                        grid: { yaxis: { lines: { show: true } }, xaxis: { lines: { show: false } } },
                        colors: ["#12b76a", "#f97316"] as string[],
                        legend: { position: "top", horizontalAlign: "right" },
                      }}
                      series={[
                        { name: "Invoices", data: monthlyInvoices },
                        { name: "Expenses", data: monthlyExpenses },
                      ]}
                      type="bar"
                      height={224}
                    />
                  </div>
                </div>
              </div>

              {/* Right column: Budget gauge (same height as revenue + expense cards + cash flow chart) */}
              <div className="flex h-full min-h-0 flex-col min-w-0">
                <BudgetGauge
                  title="Budget"
                  subtitle="Planned budget vs used"
                  percent={budgetPercent}
                  changePercent={budgetChangePercent}
                  message={`${formatBudget(budgetSpent)} used of ${formatBudget(project.budget)} planned`}
                  showDropdown={false}
                  compact={true}
                  fillHeight={true}
                  stats={[
                    { label: "Budget", value: formatBudget(project.budget) },
                    { label: "Expense", value: formatBudget(budgetSpent), trend: budgetSpent > project.budget ? "down" : undefined },
                  ]}
                />
              </div>
            </div>

            <div className="w-full rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-3">Recent transactions</h3>
              <ul className="space-y-2">
                {financialsLoading ? (
                  <li className="text-sm text-gray-500 dark:text-gray-400 py-2">Loading…</li>
                ) : recentTransactions.length === 0 ? (
                  <li className="text-sm text-gray-500 dark:text-gray-400 py-2">No payment entries yet.</li>
                ) : (
                recentTransactions.slice(0, 5).map((tx) => (
                  <li key={tx.id} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
                    <span className="text-gray-700 dark:text-gray-300 truncate mr-2">{tx.description}</span>
                    <span className={`tabular-nums shrink-0 ${tx.type === "income" ? "text-success-600 dark:text-success-400" : "text-error-600 dark:text-error-400"}`}>
                      {tx.type === "income" ? "+" : "-"}{formatBudget(tx.type === "income" ? tx.amount : Math.abs(tx.amount))}
                    </span>
                  </li>
                ))
                )}
              </ul>
            </div>
          </div>
        )}

        {/* Details */}
        {activeTab === "details" && (
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 w-full">
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Project Name</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white">{project.projectName}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Project Code</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white">{project.projectCode}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Client</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white">{project.client.name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Type</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white">{formatType(project.type)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Location</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white">{project.location}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</dt>
              <dd className="mt-1">
                <Badge size="sm" color={getStatusBadgeColor(project.status)}>
                  {statusLabel}
                </Badge>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Contract Value</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white tabular-nums">
                {project.contractValue != null ? formatBudget(project.contractValue) : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Start Date</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white">{formatDate(project.startDate)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">End Date</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-white">{formatDate(project.endDate)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Budget</dt>
              <dd className="mt-1 text-sm font-medium text-gray-900 dark:text-white tabular-nums">
                {formatBudget(project.budget)}
              </dd>
            </div>
          </dl>
        )}

        {/* Documents */}
        {activeTab === "documents" && (
          <div className="w-full space-y-6">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Documents</h3>
            </div>

            {documentsLoading ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 py-4">Loading documents…</p>
            ) : projectDocuments.length > 0 ? (
              <ul className="space-y-2 w-full">
                {projectDocuments.map((doc) => (
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
                        title="Preview"
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
                      <button
                        type="button"
                        onClick={() => handleDeleteDocument(doc)}
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

            {/* Upload form */}
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
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    {uploadFile ? uploadFile.name : "Choose file"}
                  </button>
                  {uploadFile && (
                    <>
                      <input
                        type="text"
                        placeholder="Display name (optional)"
                        value={uploadName}
                        onChange={(e) => setUploadName(e.target.value)}
                        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 min-w-[160px]"
                      />
                      <input
                        type="text"
                        placeholder="Description (optional)"
                        value={uploadDescription}
                        onChange={(e) => setUploadDescription(e.target.value)}
                        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 min-w-[160px]"
                      />
                      <button
                        type="submit"
                        disabled={uploadDocMutation.isPending}
                        className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
                      >
                        {uploadDocMutation.isPending ? "Uploading…" : "Upload"}
                      </button>
                    </>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Financial */}
        {activeTab === "financial" && (
          <div className="space-y-6 w-full">
            {financialsLoading ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 py-8">Loading financial data…</p>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 w-full">
                  <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] w-full">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Income</p>
                    <p className="mt-2 text-2xl font-semibold text-success-600 dark:text-success-400 tabular-nums">
                      {formatBudget(income)}
                    </p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">From client invoice payments</p>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] w-full">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Expense</p>
                    <p className="mt-2 text-2xl font-semibold text-error-600 dark:text-error-400 tabular-nums">
                      {formatBudget(expenses)}
                    </p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Subcontractor, expenses, purchases</p>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] w-full">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Variation</p>
                    <p className={`mt-2 text-2xl font-semibold tabular-nums ${variation >= 0 ? "text-success-600 dark:text-success-400" : "text-error-600 dark:text-error-400"}`}>
                      {variation >= 0 ? "+" : ""}{formatBudget(variation)}
                    </p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Income − Expense</p>
                  </div>
                </div>
                <div className="w-full overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
                  <h3 className="px-4 py-3 text-sm font-semibold text-gray-800 dark:text-white bg-gray-50 dark:bg-white/[0.04] border-b border-gray-200 dark:border-gray-800">
                    Financial transactions (payment entries)
                  </h3>
                  <Table>
                    <TableHeader className="border-b border-gray-200 dark:border-gray-800">
                      <TableRow>
                        <TableCell isHeader className="px-4 py-3 text-left text-theme-xs font-medium text-gray-500 dark:text-gray-400">Date</TableCell>
                        <TableCell isHeader className="px-4 py-3 text-left text-theme-xs font-medium text-gray-500 dark:text-gray-400">Description</TableCell>
                        <TableCell isHeader className="px-4 py-3 text-right text-theme-xs font-medium text-gray-500 dark:text-gray-400">Amount</TableCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {financialTransactions.length === 0 ? (
                        <TableRow>
                          <td colSpan={3} className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                            No payment entries yet for this project.
                          </td>
                        </TableRow>
                      ) : (
                        financialTransactions.map((tx) => (
                          <TableRow key={tx.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                            <TableCell className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                              {formatDate(tx.date)}
                            </TableCell>
                            <TableCell className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                              {tx.description}
                            </TableCell>
                            <TableCell className={`px-4 py-3 text-sm text-right tabular-nums font-medium ${tx.type === "income" ? "text-success-600 dark:text-success-400" : "text-error-600 dark:text-error-400"}`}>
                              {tx.type === "income" ? "+" : "-"}{formatBudget(tx.type === "income" ? tx.amount : Math.abs(tx.amount))}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </div>
        )}

        {/* Notes - under development */}
        {activeTab === "notes" && (
          <div className="flex flex-col items-center justify-center py-16 px-6 w-full rounded-xl border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50/50 dark:bg-white/[0.02]">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 mb-4">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Under development</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Notes will be available in a future update.</p>
          </div>
        )}

        {/* Activity - under development */}
        {activeTab === "activity" && (
          <div className="flex flex-col items-center justify-center py-16 px-6 w-full rounded-xl border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50/50 dark:bg-white/[0.02]">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 mb-4">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Under development</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Activity will be available in a future update.</p>
          </div>
        )}
      </div>
    </Modal>

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
                const pdfFallback = (
                  <div className="flex flex-col items-center justify-center py-12 px-6 text-center bg-gray-100 dark:bg-gray-800/50 rounded-lg">
                    <p className="text-sm text-gray-700 dark:text-gray-300">PDF preview is not available in this browser.</p>
                    <div className="flex gap-4 mt-3">
                      <a
                        href={previewDocument.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-600 dark:text-brand-400 font-medium hover:underline"
                      >
                        Open in new tab
                      </a>
                      {previewDocument.projectId != null && previewDocument.documentId != null ? (
                        <button
                          type="button"
                          onClick={() =>
                            downloadProjectDocument(
                              previewDocument.projectId!,
                              previewDocument.documentId!,
                              previewDocument.filename || previewDocument.name || "document"
                            )
                          }
                          className="text-brand-600 dark:text-brand-400 font-medium hover:underline bg-transparent border-0 cursor-pointer"
                        >
                          Download
                        </button>
                      ) : (
                        <a
                          href={previewDocument.url}
                          download={previewDocument.filename || previewDocument.name}
                          className="text-brand-600 dark:text-brand-400 font-medium hover:underline"
                        >
                          Download
                        </a>
                      )}
                    </div>
                  </div>
                );
                if (isPdf) {
                  return (
                    <object
                      data={previewDocument.url}
                      type="application/pdf"
                      className="w-full h-[70vh] min-h-[400px] border-0 rounded-lg"
                      title={previewDocument.name}
                    >
                      {pdfFallback}
                    </object>
                  );
                }
                if (isImage) {
                  return (
                    <img
                      src={previewDocument.url}
                      alt={previewDocument.name}
                      className="max-w-full max-h-[70vh] object-contain"
                    />
                  );
                }
                return (
                  <iframe
                    src={previewDocument.url}
                    title={previewDocument.name}
                    className="w-full h-[70vh] min-h-[400px] border-0"
                  />
                );
              })()
            ) : (
              <div className="text-center py-12 px-6">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 mb-4">
                  <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Preview not available</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
                  This document has no preview URL. When documents are stored with a URL, the preview will appear here.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  </>
  );
}
