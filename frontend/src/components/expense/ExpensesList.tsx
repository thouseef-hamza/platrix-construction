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
import type { Expense, ExpenseCategory } from "@/types/expense";
import { MOCK_EXPENSES } from "@/data/mockExpenses";
import { MOCK_PROJECTS } from "@/data/mockProjects";
import { MOCK_EMPLOYEE_REFS } from "@/data/mockEmployees";
import ExpenseViewModal from "./ExpenseViewModal";
import ExpenseCreateModal from "./ExpenseCreateModal";

const PAGE_SIZE = 8;

const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  project: "Project",
  general: "General",
  outsourced_labor: "Labor",
  employee_paid: "Employee",
};

export default function ExpensesList() {
  const [items, setItems] = useState<Expense[]>(() => [...MOCK_EXPENSES]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<ExpenseCategory | "">("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selected, setSelected] = useState<Expense | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const projects = useMemo(
    () => MOCK_PROJECTS.map((p) => ({ id: p.id, name: p.projectName })),
    []
  );

  const { pageItems, total, totalPages } = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = items;
    if (categoryFilter) {
      list = list.filter((e) => e.category === categoryFilter);
    }
    if (q) {
      list = list.filter(
        (e) =>
          e.description.toLowerCase().includes(q) ||
          e.project?.name.toLowerCase().includes(q) ||
          e.employeeRef?.name.toLowerCase().includes(q)
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
  }, [items, searchQuery, categoryFilter, currentPage]);

  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) setCurrentPage(1);
  }, [totalPages, currentPage]);

  const handleUpdate = (id: string, updates: Partial<Expense>) => {
    setItems((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updates } : e))
    );
    if (selected?.id === id)
      setSelected((p) => (p ? { ...p, ...updates } : null));
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <PageBreadcrumb pageTitle="Expense" />
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
          Add Expense
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
                placeholder="Description, project, or employee..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              />
            </div>
            <div className="w-48">
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Type
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(
                    e.target.value === ""
                      ? ""
                      : (e.target.value as ExpenseCategory)
                  );
                  setCurrentPage(1);
                }}
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
              >
                <option value="">All types</option>
                <option value="project">Project</option>
                <option value="general">General</option>
                <option value="outsourced_labor">Outsourced labor</option>
                <option value="employee_paid">Employee-paid</option>
              </select>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Showing {pageItems.length} of {total} expenses
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
                      Type
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                    >
                      Description
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                    >
                      Project
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
                      Employee
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 text-end text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                    >
                      Amount (QAR)
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
                        No expenses match your search.
                      </td>
                    </TableRow>
                  ) : (
                    pageItems.map((expense) => (
                      <tr
                        key={expense.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          setSelected(expense);
                          setViewOpen(true);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setSelected(expense);
                            setViewOpen(true);
                          }
                        }}
                        className="cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                      >
                        <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-700 dark:text-gray-300">
                          {CATEGORY_LABELS[expense.category]}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-start text-theme-sm font-medium text-gray-800 dark:text-white/90">
                          {expense.description}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-600 dark:text-gray-400">
                          {expense.project?.name ?? "—"}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-600 dark:text-gray-400">
                          {formatDate(expense.date)}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-600 dark:text-gray-400">
                          {expense.employeeRef?.name ?? "—"}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-end text-theme-sm text-gray-600 dark:text-gray-400 tabular-nums">
                          {formatCurrency(expense.amount)}
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
      <ExpenseViewModal
        expense={selected}
        isOpen={viewOpen}
        onClose={() => {
          setViewOpen(false);
          setSelected(null);
        }}
        onUpdate={handleUpdate}
      />
      <ExpenseCreateModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        projects={projects}
        employees={MOCK_EMPLOYEE_REFS}
        onCreate={(data) => {
          setItems((prev) => [{ ...data, id: `e-${Date.now()}` }, ...prev]);
        }}
      />
    </div>
  );
}
