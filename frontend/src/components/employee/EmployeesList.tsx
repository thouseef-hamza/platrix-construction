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
import type { Employee } from "@/types/employee";
import { MOCK_EMPLOYEES } from "@/data/mockEmployees";
import { MOCK_EXPENSES } from "@/data/mockExpenses";
import EmployeeViewModal from "./EmployeeViewModal";
import EmployeeCreateModal from "./EmployeeCreateModal";

const PAGE_SIZE = 8;

export default function EmployeesList() {
  const [items, setItems] = useState<Employee[]>(() => [...MOCK_EMPLOYEES]);
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selected, setSelected] = useState<Employee | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const departments = useMemo(
    () => [...new Set(items.map((e) => e.department))].sort(),
    [items]
  );

  const { pageItems, total, totalPages } = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = items;
    if (departmentFilter) {
      list = list.filter((e) => e.department === departmentFilter);
    }
    if (q) {
      list = list.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.email.toLowerCase().includes(q) ||
          e.department.toLowerCase().includes(q) ||
          e.position.toLowerCase().includes(q)
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
  }, [items, searchQuery, departmentFilter, currentPage]);

  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) setCurrentPage(1);
  }, [totalPages, currentPage]);

  const handleUpdate = (id: string, updates: Partial<Employee>) => {
    setItems((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updates } : e))
    );
    if (selected?.id === id)
      setSelected((s) => (s ? { ...s, ...updates } : null));
  };

  const pendingReimbursement = useMemo(() => {
    return 0;
  }, []);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <PageBreadcrumb pageTitle="Employees" />
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Employee
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
                placeholder="Name, email, department..."
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
                Department
              </label>
              <select
                value={departmentFilter}
                onChange={(e) => {
                  setDepartmentFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
              >
                <option value="">All departments</option>
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Showing {pageItems.length} of {total} employees
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
                      Name
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                    >
                      Department
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                    >
                      Position
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                    >
                      Join date
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 text-end text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                    >
                      Salary (QAR)
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 text-center text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                    >
                      Status
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 text-center text-theme-xs font-medium text-gray-500 dark:text-gray-400 w-20"
                    >
                      Action
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {pageItems.length === 0 ? (
                    <TableRow>
                      <td
                        colSpan={7}
                        className="px-5 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                      >
                        No employees match your search.
                      </td>
                    </TableRow>
                  ) : (
                    pageItems.map((employee) => (
                      <tr
                        key={employee.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          setSelected(employee);
                          setViewOpen(true);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setSelected(employee);
                            setViewOpen(true);
                          }
                        }}
                        className="cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                      >
                        <TableCell className="px-5 py-4 text-start text-theme-sm font-medium text-gray-800 dark:text-white/90">
                          {employee.name}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-600 dark:text-gray-400">
                          {employee.department}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-600 dark:text-gray-400">
                          {employee.position}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-600 dark:text-gray-400">
                          {formatDate(employee.joinDate)}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-end text-theme-sm text-gray-600 dark:text-gray-400 tabular-nums">
                          {formatCurrency(employee.salary)}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-center">
                          <span
                            className={
                              employee.status === "active"
                                ? "inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                : "inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                            }
                          >
                            {employee.status}
                          </span>
                        </TableCell>
                        <TableCell className="px-5 py-4 text-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelected(employee);
                              setViewOpen(true);
                            }}
                            className="inline-flex items-center justify-center rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-brand-600 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-brand-400"
                            title="Edit"
                            aria-label="Edit employee"
                          >
                            <svg
                              className="h-5 w-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </button>
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
      <EmployeeViewModal
        employee={selected}
        isOpen={viewOpen}
        onClose={() => {
          setViewOpen(false);
          setSelected(null);
        }}
        onUpdate={handleUpdate}
        pendingReimbursement={pendingReimbursement}
      />
      <EmployeeCreateModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={(data) => {
          const salaryNum = data.salary ?? 0;
          const initialEntry =
            salaryNum > 0 && data.joinDate
              ? [
                  {
                    id: `se-${Date.now()}`,
                    effectiveDate: data.joinDate,
                    amount: salaryNum,
                    type: "regular" as const,
                  },
                ]
              : [];
          setItems((prev) => [
            {
              ...data,
              id: `emp-${Date.now()}`,
              salaryEntries: initialEntry,
            },
            ...prev,
          ]);
        }}
      />
    </div>
  );
}
