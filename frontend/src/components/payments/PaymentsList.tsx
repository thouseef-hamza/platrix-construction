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
import Badge from "@/components/ui/badge/Badge";
import { formatCurrency, formatDate } from "@/utils/format";
import type { Payment, PaymentStatus } from "@/types/payment";
import { MOCK_PAYMENTS } from "@/data/mockPayments";
import { MOCK_CLIENTS } from "@/data/mockCompanies";
import PaymentViewModal from "./PaymentViewModal";
import PaymentCreateModal from "./PaymentCreateModal";

const PAGE_SIZE = 5;

function getTotalPaidForInvoice(items: Payment[], invoiceId: string): number {
  return items
    .filter((p) => p.invoiceId === invoiceId)
    .reduce((sum, p) => sum + p.amount, 0);
}

function getTotalReceivedForInvoice(items: Payment[], invoice: Payment): number {
  return (invoice.receivedAmount ?? 0) + getTotalPaidForInvoice(items, invoice.id);
}

function getPaymentsForInvoice(items: Payment[], invoiceId: string): Payment[] {
  return items.filter((p) => p.invoiceId === invoiceId);
}

function getPaymentStatus(items: Payment[], invoice: Payment): PaymentStatus {
  const totalReceived = getTotalReceivedForInvoice(items, invoice);
  if (totalReceived === 0) return "credit";
  if (totalReceived >= invoice.amount) return "completed";
  return "partial";
}

const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  credit: "Not completed",
  partial: "Partial",
  completed: "Completed",
};

const PAYMENT_STATUS_COLOR: Record<PaymentStatus, "warning" | "info" | "success"> = {
  credit: "warning",
  partial: "info",
  completed: "success",
};

export default function PaymentsList() {
  const [items, setItems] = useState<Payment[]>(() => [...MOCK_PAYMENTS]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selected, setSelected] = useState<Payment | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [addPaymentOpen, setAddPaymentOpen] = useState(false);
  const [invoiceForPayment, setInvoiceForPayment] = useState<Payment | null>(null);
  const [editInvoiceOpen, setEditInvoiceOpen] = useState(false);
  const [invoiceToEdit, setInvoiceToEdit] = useState<Payment | null>(null);

  const invoices = useMemo(
    () => items.filter((p) => !p.invoiceId),
    [items]
  );

  const { pageItems, total, totalPages } = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = q
      ? invoices.filter(
          (p) =>
            p.client.name.toLowerCase().includes(q) ||
            p.reference.toLowerCase().includes(q)
        )
      : invoices;
    const total = list.length;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const start = (currentPage - 1) * PAGE_SIZE;
    return {
      pageItems: list.slice(start, start + PAGE_SIZE),
      total,
      totalPages,
    };
  }, [invoices, searchQuery, currentPage]);

  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) setCurrentPage(1);
  }, [totalPages, currentPage]);

  const handleUpdate = (id: string, updates: Partial<Payment>) => {
    setItems((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
    if (selected?.id === id) setSelected((s) => (s ? { ...s, ...updates } : null));
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <PageBreadcrumb pageTitle="Client Invoice" />
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Create Client Invoice
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
                placeholder="Search by client or reference..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Showing {pageItems.length} of {total} client invoices
            </p>
          </div>
          <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-white/[0.05]">
            <div className="max-w-full overflow-x-auto">
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                  <TableRow>
                    <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">Client</TableCell>
                    <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">Reference</TableCell>
                    <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">Date</TableCell>
                    <TableCell isHeader className="px-5 py-3 text-end text-theme-xs font-medium text-gray-500 dark:text-gray-400">Amount (QAR)</TableCell>
                    <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">Ledger status</TableCell>
                    <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">Payment status</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {pageItems.length === 0 ? (
                    <TableRow>
                      <td colSpan={6} className="px-5 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                        No client invoices match your search.
                      </td>
                    </TableRow>
                  ) : (
                    pageItems.map((invoice) => {
                      const status = getPaymentStatus(items, invoice);
                      const ledgerStatus = invoice.status ?? "draft";
                      return (
                        <tr
                          key={invoice.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => {
                            setSelected(invoice);
                            setViewOpen(true);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              setSelected(invoice);
                              setViewOpen(true);
                            }
                          }}
                          className="cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                        >
                          <TableCell className="px-5 py-4 text-start text-theme-sm font-medium text-gray-800 dark:text-white/90">
                            {invoice.client.name}
                          </TableCell>
                          <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-600 dark:text-gray-400">
                            {invoice.reference}
                          </TableCell>
                          <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-600 dark:text-gray-400">
                            {formatDate(invoice.date)}
                          </TableCell>
                          <TableCell className="px-5 py-4 text-end text-theme-sm text-gray-600 dark:text-gray-400 tabular-nums">
                            {formatCurrency(invoice.amount)}
                          </TableCell>
                          <TableCell className="px-5 py-4 text-start">
                            <Badge size="sm" color={ledgerStatus === "posted" ? "success" : "warning"}>
                              {ledgerStatus === "posted" ? "Posted" : "Draft"}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-5 py-4 text-start">
                            <Badge size="sm" color={PAYMENT_STATUS_COLOR[status]}>
                              {PAYMENT_STATUS_LABEL[status]}
                            </Badge>
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
      <PaymentViewModal
        payment={selected}
        isOpen={viewOpen}
        onClose={() => {
          setViewOpen(false);
          setSelected(null);
        }}
        onUpdate={handleUpdate}
        onAddPayment={(invoice) => {
          setInvoiceForPayment(invoice);
          setViewOpen(false);
          setAddPaymentOpen(true);
        }}
        onEdit={(invoice) => {
          setInvoiceToEdit(invoice);
          setViewOpen(false);
          setEditInvoiceOpen(true);
        }}
        totalReceived={selected && !selected.invoiceId ? getTotalReceivedForInvoice(items, selected) : undefined}
        receipts={selected && !selected.invoiceId ? getPaymentsForInvoice(items, selected.id) : []}
      />
      <PaymentCreateModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        clients={MOCK_CLIENTS}
        onCreate={(data) => {
          setItems((prev) => [{ ...data, id: `p-${Date.now()}`, status: "draft" }, ...prev]);
        }}
      />
      <PaymentCreateModal
        isOpen={editInvoiceOpen}
        onClose={() => {
          setEditInvoiceOpen(false);
          setInvoiceToEdit(null);
        }}
        clients={MOCK_CLIENTS}
        onCreate={() => {}}
        invoiceToEdit={invoiceToEdit}
        onUpdate={handleUpdate}
      />
      <PaymentCreateModal
        isOpen={addPaymentOpen}
        onClose={() => {
          setAddPaymentOpen(false);
          setInvoiceForPayment(null);
        }}
        clients={MOCK_CLIENTS}
        onCreate={(data) => {
          const newId = `p-${Date.now()}`;
          setItems((prev) => [
            { ...data, id: newId, invoiceId: invoiceForPayment?.id }, ...prev,
          ]);
        }}
        invoice={invoiceForPayment}
        title="Add Payment"
      />
    </div>
  );
}
