"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import type { Purchase, PurchasePaymentStatus } from "@/types/purchase";
import { MOCK_PURCHASES } from "@/data/mockPurchases";
import { MOCK_SUPPLIERS } from "@/data/mockCompanies";
import { MOCK_PROJECTS } from "@/data/mockProjects";
import { MOCK_ACCOUNTS } from "@/data/mockAccounts";
import { useCompany } from "@/context/CompanyContext";
import { fetchMaterials } from "@/lib/materialsApi";
import PurchaseViewModal from "./PurchaseViewModal";
import PurchaseCreateModal from "./PurchaseCreateModal";

const MATERIALS_QUERY_KEY = "materials";

const PAGE_SIZE = 5;

export default function PurchasesList() {
  const { companyId } = useCompany();
  const { data: materials = [] } = useQuery({
    queryKey: [MATERIALS_QUERY_KEY, companyId],
    queryFn: () => fetchMaterials(),
    enabled: !!companyId,
  });
  const [items, setItems] = useState<Purchase[]>(() => [...MOCK_PURCHASES]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selected, setSelected] = useState<Purchase | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const { pageItems, total, totalPages } = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = q
      ? items.filter(
          (p) =>
            p.supplier.name.toLowerCase().includes(q) ||
            p.reference.toLowerCase().includes(q) ||
            (p.description?.toLowerCase().includes(q) ?? false)
        )
      : items;
    const total = list.length;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const start = (currentPage - 1) * PAGE_SIZE;
    return {
      pageItems: list.slice(start, start + PAGE_SIZE),
      total,
      totalPages,
    };
  }, [items, searchQuery, currentPage]);

  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) setCurrentPage(1);
  }, [totalPages, currentPage]);

  const handleUpdate = (id: string, updates: Partial<Purchase>) => {
    setItems((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const next = { ...p, ...updates };
        if (updates.paidAmount !== undefined && updates.paymentStatus === undefined) {
          (next as Purchase).paymentStatus =
            next.paidAmount! >= p.amount ? "completed" : next.paidAmount! > 0 ? "partial" : "not_completed";
        }
        return next;
      })
    );
    if (selected?.id === id) {
      const next = { ...selected, ...updates };
      if (updates.paidAmount !== undefined && updates.paymentStatus === undefined)
        (next as Purchase).paymentStatus =
          next.paidAmount! >= selected.amount ? "completed" : next.paidAmount! > 0 ? "partial" : "not_completed";
      setSelected(next);
    }
  };

  const getPaymentStatus = (p: Purchase): PurchasePaymentStatus =>
    p.paymentStatus ??
    (p.paidAmount === undefined || p.paidAmount === 0
      ? "not_completed"
      : p.paidAmount >= p.amount
        ? "completed"
        : "partial");

  const paymentStatusLabel = (s: PurchasePaymentStatus): string => {
    switch (s) {
      case "not_completed": return "Not completed";
      case "completed": return "Completed";
      case "partial": return "Partial";
      default: return s;
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <PageBreadcrumb pageTitle="Purchase" />
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
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add Purchase
        </button>
      </div>
      <div className="space-y-6">
        <ComponentCard>
          <div className="mb-6 space-y-4">
            <div className="max-w-xs">
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Search
              </label>
              <input
                type="text"
                placeholder="Search by supplier, reference or description..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Showing {pageItems.length} of {total} purchases
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
                      Supplier
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                    >
                      Reference
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
                      Payment status
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                    >
                      Date
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
                        No purchases match your search.
                      </td>
                    </TableRow>
                  ) : (
                    pageItems.map((purchase) => (
                      <tr
                        key={purchase.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          setSelected(purchase);
                          setViewOpen(true);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setSelected(purchase);
                            setViewOpen(true);
                          }
                        }}
                        className="cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                      >
                        <TableCell className="px-5 py-4 text-start text-theme-sm font-medium text-gray-800 dark:text-white/90">
                          {purchase.supplier.name}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-600 dark:text-gray-400">
                          {purchase.reference}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-start text-theme-sm">
                          <span
                            className={
                              purchase.status === "posted"
                                ? "inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                : "inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                            }
                          >
                            {purchase.status}
                          </span>
                        </TableCell>
                        <TableCell className="px-5 py-4 text-start text-theme-sm">
                          <span
                            className={
                              purchase.paymentStatus === "completed"
                                ? "inline-flex items-center rounded-full bg-success-100 px-2 py-0.5 text-xs font-medium text-success-800 dark:bg-success-900/30 dark:text-success-400"
                                : purchase.paymentStatus === "partial"
                                  ? "inline-flex items-center rounded-full bg-warning-100 px-2 py-0.5 text-xs font-medium text-warning-800 dark:bg-warning-900/30 dark:text-warning-400"
                                  : "inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                            }
                          >
                            {paymentStatusLabel(getPaymentStatus(purchase))}
                          </span>
                        </TableCell>
                        <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-600 dark:text-gray-400">
                          {formatDate(purchase.date)}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-end text-theme-sm text-gray-600 dark:text-gray-400 tabular-nums">
                          {formatCurrency(purchase.amount)}
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
      <PurchaseViewModal
        purchase={selected}
        isOpen={viewOpen}
        onClose={() => {
          setViewOpen(false);
          setSelected(null);
        }}
        onUpdate={handleUpdate}
      />
      <PurchaseCreateModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        accounts={MOCK_ACCOUNTS}
        suppliers={MOCK_SUPPLIERS}
        projects={MOCK_PROJECTS.map((p) => ({ id: p.id, name: p.projectName }))}
        materials={materials}
        onCreate={(data) => {
          setItems((prev) => [{ ...data, id: `pu-${Date.now()}` }, ...prev]);
        }}
      />
    </div>
  );
}
