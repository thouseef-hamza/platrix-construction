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
import { formatCurrency } from "@/utils/format";
import type { Account, AccountType } from "@/types/chartOfAccounts";
import { useCompany } from "@/context/CompanyContext";
import {
  fetchChartOfAccounts,
  createChartOfAccount,
} from "@/lib/accountingApi";
import AccountViewModal from "./AccountViewModal";
import AccountCreateModal from "./AccountCreateModal";

const PAGE_SIZE = 10;

const TYPE_LABELS: Record<AccountType, string> = {
  asset: "Asset",
  liability: "Liability",
  equity: "Equity",
  revenue: "Revenue",
  expense: "Expense",
};

const ACCOUNTS_QUERY_KEY = "chart-of-accounts";

export default function AccountsList() {
  const { companyId } = useCompany();
  const queryClient = useQueryClient();
  const { data: items = [], isLoading } = useQuery({
    queryKey: [ACCOUNTS_QUERY_KEY, companyId],
    queryFn: () => fetchChartOfAccounts(companyId!),
    enabled: !!companyId,
  });
  const createMutation = useMutation({
    mutationFn: (payload: Omit<Account, "id">) =>
      createChartOfAccount(companyId!, {
        code: payload.code,
        name: payload.name,
        type: payload.type,
        parentId: payload.parentId,
        isActive: payload.isActive,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ACCOUNTS_QUERY_KEY, companyId] });
    },
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<AccountType | "">("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selected, setSelected] = useState<Account | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const sortedAccounts = useMemo(() => {
    return [...items].sort((a, b) => a.code.localeCompare(b.code));
  }, [items]);

  const { pageItems, total, totalPages } = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = sortedAccounts;
    if (typeFilter) {
      list = list.filter((a) => a.type === typeFilter);
    }
    if (q) {
      list = list.filter(
        (a) =>
          a.code.toLowerCase().includes(q) ||
          a.name.toLowerCase().includes(q)
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
  }, [sortedAccounts, searchQuery, typeFilter, currentPage]);

  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) setCurrentPage(1);
  }, [totalPages, currentPage]);

  const handleUpdate = (_id: string, _updates: Partial<Account>) => {
    queryClient.invalidateQueries({ queryKey: [ACCOUNTS_QUERY_KEY, companyId] });
    setSelected(null);
    setViewOpen(false);
  };

  if (!companyId) return null;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <PageBreadcrumb pageTitle="Accounts" />
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
          Add Account
        </button>
      </div>
      <div className="space-y-6">
        <ComponentCard>
          {isLoading && (
            <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
              Loading accounts…
            </p>
          )}
          <div className="mb-6 flex flex-wrap items-end gap-4">
            <div className="max-w-xs">
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Search
              </label>
              <input
                type="text"
                placeholder="Search by code or name..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              />
            </div>
            <div className="w-40">
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Type
              </label>
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(
                    e.target.value === "" ? "" : (e.target.value as AccountType)
                  );
                  setCurrentPage(1);
                }}
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
              >
                <option value="">All types</option>
                {Object.entries(TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Showing {pageItems.length} of {total} accounts
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
                      Code
                    </TableCell>
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
                      Type
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 text-end text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                    >
                      Opening balance (QAR)
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 text-center text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                    >
                      Status
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {pageItems.length === 0 ? (
                    <TableRow>
                      <td
                        colSpan={5}
                        className="px-5 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                      >
                        No accounts match your search.
                      </td>
                    </TableRow>
                  ) : (
                    pageItems.map((account) => (
                      <tr
                        key={account.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          setSelected(account);
                          setViewOpen(true);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setSelected(account);
                            setViewOpen(true);
                          }
                        }}
                        className="cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                      >
                        <TableCell className="px-5 py-4 text-start text-theme-sm font-medium text-gray-800 dark:text-white/90 tabular-nums">
                          {account.code}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-700 dark:text-gray-300">
                          {account.name}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-600 dark:text-gray-400">
                          {TYPE_LABELS[account.type]}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-end text-theme-sm text-gray-600 dark:text-gray-400 tabular-nums">
                          {formatCurrency(account.openingBalance)}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-center">
                          <span
                            className={
                              account.isActive
                                ? "inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                : "inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                            }
                          >
                            {account.isActive ? "Active" : "Inactive"}
                          </span>
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
      <AccountViewModal
        account={selected}
        accounts={items}
        isOpen={viewOpen}
        onClose={() => {
          setViewOpen(false);
          setSelected(null);
        }}
        onUpdate={handleUpdate}
      />
      <AccountCreateModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        accounts={items}
        onCreate={(data) => {
          createMutation.mutate(data, {
            onSuccess: () => setCreateOpen(false),
          });
        }}
        isSubmitting={createMutation.isPending}
      />
    </div>
  );
}
