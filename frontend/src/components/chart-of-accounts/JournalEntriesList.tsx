"use client";

import React, { useEffect, useMemo, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import Pagination from "@/components/tables/Pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/utils/format";
import type { JournalEntry, JournalEntryStatus } from "@/types/chartOfAccounts";
import { MOCK_JOURNAL_ENTRIES } from "@/data/mockJournalEntries";
import { MOCK_ACCOUNTS } from "@/data/mockAccounts";
import JournalEntryViewModal from "./JournalEntryViewModal";
import JournalEntryCreateModal from "./JournalEntryCreateModal";

const PAGE_SIZE = 8;

export default function JournalEntriesList() {
  const [items, setItems] = useState<JournalEntry[]>(() => [...MOCK_JOURNAL_ENTRIES]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<JournalEntryStatus | "">("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selected, setSelected] = useState<JournalEntry | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const { pageItems, total, totalPages } = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = items;
    if (statusFilter) {
      list = list.filter((e) => e.status === statusFilter);
    }
    if (q) {
      list = list.filter(
        (e) =>
          e.number.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q)
      );
    }
    const total = list.length;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const start = (currentPage - 1) * PAGE_SIZE;
    return {
      pageItems: list.slice(start, start + PAGE_SIZE),
      total,
      totalPages,
    };
  }, [items, searchQuery, statusFilter, currentPage]);

  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) setCurrentPage(1);
  }, [totalPages, currentPage]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <PageBreadcrumb pageTitle="Journal Entries" />
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Journal Entry
        </button>
      </div>
      <div className="space-y-6">
        <ComponentCard>
          <div className="mb-6 flex flex-wrap items-end gap-4">
            <div className="max-w-xs">
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Search
              </label>
              <input
                type="text"
                placeholder="Search by number or description..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              />
            </div>
            <div className="w-32">
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(
                    e.target.value === ""
                      ? ""
                      : (e.target.value as JournalEntryStatus)
                  );
                  setCurrentPage(1);
                }}
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
              >
                <option value="">All</option>
                <option value="draft">Draft</option>
                <option value="posted">Posted</option>
              </select>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Showing {pageItems.length} of {total} entries
            </p>
          </div>
          <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-white/[0.05]">
            <div className="max-w-full overflow-x-auto">
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                  <TableRow>
                    <TableCell
                      isHeader
                      className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                    >
                      Number
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                    >
                      Date
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                    >
                      Description
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 text-center text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                    >
                      Status
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 text-end text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                    >
                      Debit (QAR)
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 text-end text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                    >
                      Credit (QAR)
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {pageItems.length === 0 ? (
                    <TableRow>
                      <td
                        colSpan={6}
                        className="px-5 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                      >
                        No journal entries match your search.
                      </td>
                    </TableRow>
                  ) : (
                    pageItems.map((entry) => {
                      const totalDebit = entry.lines.reduce((s, l) => s + l.debit, 0);
                      const totalCredit = entry.lines.reduce((s, l) => s + l.credit, 0);
                      return (
                        <tr
                          key={entry.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => {
                            setSelected(entry);
                            setViewOpen(true);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              setSelected(entry);
                              setViewOpen(true);
                            }
                          }}
                          className="cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                        >
                          <TableCell className="px-5 py-4 text-start text-theme-sm font-medium text-gray-800 dark:text-white/90">
                            {entry.number}
                          </TableCell>
                          <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-600 dark:text-gray-400">
                            {formatDate(entry.date)}
                          </TableCell>
                          <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-600 dark:text-gray-400 line-clamp-1 max-w-[200px]">
                            {entry.description}
                          </TableCell>
                          <TableCell className="px-5 py-4 text-center">
                            <span
                              className={
                                entry.status === "posted"
                                  ? "inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                  : "inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                              }
                            >
                              {entry.status}
                            </span>
                          </TableCell>
                          <TableCell className="px-5 py-4 text-end text-theme-sm text-gray-600 dark:text-gray-400 tabular-nums">
                            {formatCurrency(totalDebit)}
                          </TableCell>
                          <TableCell className="px-5 py-4 text-end text-theme-sm text-gray-600 dark:text-gray-400 tabular-nums">
                            {formatCurrency(totalCredit)}
                          </TableCell>
                        </tr>
                      );
                    })
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
      <JournalEntryViewModal
        entry={selected}
        isOpen={viewOpen}
        onClose={() => {
          setViewOpen(false);
          setSelected(null);
        }}
      />
      <JournalEntryCreateModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        accounts={MOCK_ACCOUNTS}
        onCreate={(data) => {
          setItems((prev) => [
            { ...data, id: `je-${Date.now()}` },
            ...prev,
          ]);
        }}
      />
    </div>
  );
}
