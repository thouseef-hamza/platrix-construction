"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { useCompany } from "@/context/CompanyContext";
import { fetchProjects } from "@/lib/projectsApi";
import {
  fetchExpenses,
  getExpense,
  createExpense,
  updateExpense,
  addExpensePayment,
  patchExpensePayment,
  deleteExpensePayment,
  type CreateExpensePayload,
} from "@/lib/expensesApi";
import { fetchEmployees } from "@/lib/employeesApi";
import ExpenseViewModal from "./ExpenseViewModal";
import ExpenseCreateModal from "./ExpenseCreateModal";

const EXPENSES_QUERY_KEY = "expenses";
const PAGE_SIZE = 8;

const LABOR_TYPE_TO_BACKEND: Record<"hourly" | "daily", number> = {
  hourly: 0,
  daily: 1,
};
const PAYMENT_METHOD_TO_BACKEND: Record<"cash" | "bank", number> = {
  cash: 0,
  bank: 1,
};
const STATUS_TO_BACKEND: Record<"draft" | "posted", number> = {
  draft: 0,
  posted: 1,
};

const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  project: "Project",
  general: "General",
  outsourced_labor: "Labor",
  employee_paid: "Employee",
};

function buildCreatePayload(data: Omit<Expense, "id">): CreateExpensePayload {
  return {
    category: data.category,
    description: data.description ?? "—",
    amount: data.amount,
    date: data.date,
    project: data.project ? Number(data.project.id) : null,
    labor_type:
      data.laborType != null ? LABOR_TYPE_TO_BACKEND[data.laborType] : null,
    quantity: data.quantity ?? null,
    rate: data.rate ?? null,
    employee_id: data.employeeRef?.id ?? "",
    employee_name: data.employeeRef?.name ?? "",
    payment_method: PAYMENT_METHOD_TO_BACKEND[data.paymentMethod ?? "cash"],
    paid_amount: data.paidAmount ?? 0,
    status: STATUS_TO_BACKEND[data.status ?? "posted"],
    expense_account: data.category === "general" ? (data.expenseAccountId ?? null) : undefined,
  };
}

export default function ExpensesList() {
  const { companyId } = useCompany();
  const queryClient = useQueryClient();
  const { data: expenses = [], isLoading } = useQuery({
    queryKey: [EXPENSES_QUERY_KEY, companyId],
    queryFn: () => fetchExpenses(),
    enabled: !!companyId,
  });
  const { data: projects = [] } = useQuery({
    queryKey: ["projects", companyId],
    queryFn: () => fetchProjects(),
    enabled: !!companyId,
  });
  const { data: employeesList = [] } = useQuery({
    queryKey: ["employees", companyId],
    queryFn: () => fetchEmployees(),
    enabled: !!companyId,
  });
  const employeeRefs = useMemo(
    () => employeesList.map((e) => ({ id: e.id, name: e.fullName })),
    [employeesList]
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<ExpenseCategory | "">("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selected, setSelected] = useState<Expense | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);

  const { data: selectedDetail } = useQuery({
    queryKey: ["expense", selected?.id],
    queryFn: () => getExpense(Number(selected!.id)),
    enabled: !!selected?.id && viewOpen,
  });
  const expenseForModal = selectedDetail ?? selected;

  const createMutation = useMutation({
    mutationFn: createExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [EXPENSES_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ["project-financials"] });
    },
  });
  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: Parameters<typeof updateExpense>[1];
    }) => updateExpense(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [EXPENSES_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ["expense", String(id)] });
      queryClient.invalidateQueries({ queryKey: ["project-financials"] });
    },
  });
  const addPaymentMutation = useMutation({
    mutationFn: ({
      expenseId,
      payload,
    }: {
      expenseId: number;
      payload: Parameters<typeof addExpensePayment>[1];
    }) => addExpensePayment(expenseId, payload),
    onSuccess: (_, { expenseId }) => {
      queryClient.invalidateQueries({ queryKey: [EXPENSES_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ["expense", String(expenseId)] });
      queryClient.invalidateQueries({ queryKey: ["project-financials"] });
    },
  });
  const patchPaymentMutation = useMutation({
    mutationFn: ({
      expenseId,
      paymentId,
      payload,
    }: {
      expenseId: number;
      paymentId: number;
      payload: Parameters<typeof patchExpensePayment>[2];
    }) => patchExpensePayment(expenseId, paymentId, payload),
    onSuccess: (_, { expenseId }) => {
      queryClient.invalidateQueries({ queryKey: [EXPENSES_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ["expense", String(expenseId)] });
      queryClient.invalidateQueries({ queryKey: ["project-financials"] });
    },
  });
  const deletePaymentMutation = useMutation({
    mutationFn: ({ expenseId, paymentId }: { expenseId: number; paymentId: number }) =>
      deleteExpensePayment(expenseId, paymentId),
    onSuccess: (_, { expenseId }) => {
      queryClient.invalidateQueries({ queryKey: [EXPENSES_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ["expense", String(expenseId)] });
      queryClient.invalidateQueries({ queryKey: ["project-financials"] });
    },
  });

  const projectRefs = useMemo(
    () => projects.map((p) => ({ id: p.id, name: p.projectName })),
    [projects]
  );

  const items = expenses;
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
    const expenseId = Number(id);
    if (updates.status === "posted") {
      updateMutation.mutate({ id: expenseId, payload: { status: "posted" } });
      return;
    }
    if (
      updates.payments != null &&
      updates.paidAmount != null &&
      selected?.id === id &&
      expenseForModal &&
      updates.payments.length > (expenseForModal.payments?.length ?? 0)
    ) {
      const newPayment = updates.payments[updates.payments.length - 1];
      if (newPayment)
        addPaymentMutation.mutate({
          expenseId,
          payload: {
            date: newPayment.date,
            amount: newPayment.amount,
            reference: newPayment.reference,
            status: newPayment.status ?? "draft",
          },
        });
      return;
    }
  };

  if (!companyId) return null;

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
                      Ledger Status
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
                  {isLoading ? (
                    <TableRow>
                      <td
                        colSpan={7}
                        className="px-5 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                      >
                        Loading…
                      </td>
                    </TableRow>
                  ) : pageItems.length === 0 ? (
                    <TableRow>
                      <td
                        colSpan={7}
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
                        <TableCell className="px-5 py-4 text-start text-theme-sm">
                          <span
                            className={
                              expense.status === "posted"
                                ? "inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                : "inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                            }
                          >
                            {expense.status ?? "draft"}
                          </span>
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
        expense={expenseForModal}
        isOpen={viewOpen}
        onClose={() => {
          setViewOpen(false);
          setSelected(null);
        }}
        onUpdate={handleUpdate}
        onPostPayment={(expenseId, paymentId) =>
          patchPaymentMutation.mutate({
            expenseId: Number(expenseId),
            paymentId: Number(paymentId),
            payload: { status: "posted" },
          })
        }
        onEditPayment={(expenseId, paymentId, payload) =>
          patchPaymentMutation.mutate({
            expenseId: Number(expenseId),
            paymentId: Number(paymentId),
            payload: { date: payload.date, amount: payload.amount, reference: payload.reference ?? "" },
          })
        }
        onDeletePayment={(expenseId, paymentId) =>
          deletePaymentMutation.mutate({ expenseId: Number(expenseId), paymentId: Number(paymentId) })
        }
        onEdit={(exp) => {
          setExpenseToEdit(exp);
          setViewOpen(false);
          setSelected(null);
          setCreateOpen(true);
        }}
      />
      <ExpenseCreateModal
        isOpen={createOpen}
        onClose={() => {
          setCreateOpen(false);
          setExpenseToEdit(null);
        }}
        projects={projectRefs}
        employees={employeeRefs}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        expenseToEdit={expenseToEdit}
        onUpdate={
          expenseToEdit
            ? (id, payload) =>
                updateMutation.mutate(
                  { id: Number(id), payload },
                  {
                    onSuccess: () => {
                      setCreateOpen(false);
                      setExpenseToEdit(null);
                    },
                  }
                )
            : undefined
        }
        onCreate={(data) => {
          createMutation.mutate(buildCreatePayload(data), {
            onSuccess: () => setCreateOpen(false),
          });
        }}
      />
    </div>
  );
}
