"use client";

import React, { useEffect, useMemo, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import Pagination from "@/components/tables/Pagination";
import Badge from "@/components/ui/badge/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/utils/format";
import type { Bill } from "@/types/bill";
import type { ProjectRef } from "@/types/bill";
import { MOCK_BILLS } from "@/data/mockBills";
import { MOCK_SUBCONTRACTS } from "@/data/mockCompanies";
import { MOCK_PROJECTS } from "@/data/mockProjects";
import BillViewModal from "./BillViewModal";
import BillCreateModal from "./BillCreateModal";

const PAGE_SIZE = 5;

const PROJECT_OPTIONS: ProjectRef[] = MOCK_PROJECTS.map((p) => ({ id: p.id, name: p.projectName }));

export default function BillsList() {
  const [items, setItems] = useState<Bill[]>(() => [...MOCK_BILLS]);
  const [searchQuery, setSearchQuery] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selected, setSelected] = useState<Bill | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [billToEdit, setBillToEdit] = useState<Bill | null>(null);

  const { pageItems, total, totalPages } = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = items;
    if (q) {
      list = list.filter(
        (b) =>
          b.subcontractor.name.toLowerCase().includes(q) ||
          b.reference.toLowerCase().includes(q) ||
          b.project.name.toLowerCase().includes(q)
      );
    }
    if (projectFilter) {
      list = list.filter((b) => b.project.id === projectFilter);
    }
    const total = list.length;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const start = (currentPage - 1) * PAGE_SIZE;
    return {
      pageItems: list.slice(start, start + PAGE_SIZE),
      total,
      totalPages,
    };
  }, [items, searchQuery, projectFilter, currentPage]);

  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) setCurrentPage(1);
  }, [totalPages, currentPage]);

  const handleUpdate = (id: string, updates: Partial<Bill>) => {
    setItems((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...updates } : b))
    );
    if (selected?.id === id) setSelected((s) => (s ? { ...s, ...updates } : null));
    if (billToEdit?.id === id) setBillToEdit((b) => (b ? { ...b, ...updates } : null));
  };

  const handlePost = (id: string) => {
    handleUpdate(id, { status: "posted" });
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <PageBreadcrumb pageTitle="Subcontractor Invoice" />
        <button
          type="button"
          onClick={() => {
            setBillToEdit(null);
            setCreateOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Create Subcontractor Invoice
        </button>
      </div>
      <div className="space-y-6">
        <ComponentCard>
          <div className="mb-6 space-y-4">
            <div className="flex flex-wrap items-end gap-4">
              <div className="min-w-[200px] flex-1 max-w-xs">
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Search
                </label>
                <input
                  type="text"
                  placeholder="Subcontractor, reference, or project..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                />
              </div>
              <div className="w-full min-w-[160px] sm:w-48">
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Project
                </label>
                <select
                  value={projectFilter}
                  onChange={(e) => {
                    setProjectFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 pr-10 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                >
                  <option value="">All projects</option>
                  {PROJECT_OPTIONS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Showing {pageItems.length} of {total} subcontractor invoices
            </p>
          </div>
          <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-white/[0.05]">
            <div className="max-w-full overflow-x-auto">
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                  <TableRow>
                    <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">Project</TableCell>
                    <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">Subcontractor</TableCell>
                    <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">Reference</TableCell>
                    <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">Status</TableCell>
                    <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">Date</TableCell>
                    <TableCell isHeader className="px-5 py-3 text-end text-theme-xs font-medium text-gray-500 dark:text-gray-400">Amount (QAR)</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {pageItems.length === 0 ? (
                    <TableRow>
                      <td colSpan={6} className="px-5 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                        No subcontractor invoices match your search.
                      </td>
                    </TableRow>
                  ) : (
                    pageItems.map((bill) => (
                      <tr
                        key={bill.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          setSelected(bill);
                          setViewOpen(true);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setSelected(bill);
                            setViewOpen(true);
                          }
                        }}
                        className="cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                      >
                        <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">
                          {bill.project.name}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-start text-theme-sm font-medium text-gray-800 dark:text-white/90">
                          {bill.subcontractor.name}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-600 dark:text-gray-400">
                          {bill.reference}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-start">
                          <Badge size="sm" color={bill.status === "draft" ? "warning" : "success"}>
                            {bill.status === "draft" ? "Draft" : "Posted"}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-600 dark:text-gray-400">
                          {formatDate(bill.date)}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-end text-theme-sm text-gray-600 dark:text-gray-400 tabular-nums">
                          {formatCurrency(bill.amount)}
                        </TableCell>
                      </tr>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
          {totalPages > 1 && (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-gray-200 pt-4 dark:border-gray-800">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Page {currentPage} of {totalPages}
              </p>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </ComponentCard>
      </div>
      <BillViewModal
        bill={selected}
        isOpen={viewOpen}
        onClose={() => {
          setViewOpen(false);
          setSelected(null);
        }}
        onUpdate={handleUpdate}
        onEdit={(bill) => {
          if (bill.status !== "draft") return;
          setSelected(null);
          setViewOpen(false);
          setBillToEdit(bill);
          setCreateOpen(true);
        }}
        onPost={handlePost}
      />
      <BillCreateModal
        isOpen={createOpen}
        onClose={() => {
          setCreateOpen(false);
          setBillToEdit(null);
        }}
        projects={PROJECT_OPTIONS}
        subcontractors={MOCK_SUBCONTRACTS}
        onCreate={(data) => {
          setItems((prev) => [{ ...data, id: `b-${Date.now()}` }, ...prev]);
        }}
        bill={billToEdit}
        onUpdate={handleUpdate}
      />
    </div>
  );
}
