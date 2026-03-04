"use client";

import React, { useMemo, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { formatCurrency, formatDate } from "@/utils/format";
import type { Company } from "@/types/company";
import type { CompanyType } from "@/types/company";
import { MOCK_PAYMENTS } from "@/data/mockPayments";
import { MOCK_PURCHASES } from "@/data/mockPurchases";
import { MOCK_BILLS } from "@/data/mockBills";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Tab = "details" | "dashboard";

interface TransactionRow {
  id: string;
  date: string;
  reference: string;
  amount: number;
}

interface CompanyViewModalProps {
  company: Company | null;
  isOpen: boolean;
  onClose: () => void;
  title: string;
  type: CompanyType;
}

export default function CompanyViewModal({
  company,
  isOpen,
  onClose,
  title,
  type,
}: CompanyViewModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>("details");

  const { transactions, totalAmount } = useMemo(() => {
    if (!company) return { transactions: [] as TransactionRow[], totalAmount: 0 };

    if (type === "clients") {
      const list = MOCK_PAYMENTS.filter((p) => p.client.id === company.id).map(
        (p) => ({
          id: p.id,
          date: p.date,
          reference: p.reference,
          amount: p.amount,
        })
      );
      const total = list.reduce((s, t) => s + t.amount, 0);
      return { transactions: list.sort((a, b) => b.date.localeCompare(a.date)), totalAmount: total };
    }

    if (type === "suppliers") {
      const list = MOCK_PURCHASES.filter((p) => p.supplier.id === company.id).map(
        (p) => ({
          id: p.id,
          date: p.date,
          reference: p.reference,
          amount: p.amount,
        })
      );
      const total = list.reduce((s, t) => s + t.amount, 0);
      return { transactions: list.sort((a, b) => b.date.localeCompare(a.date)), totalAmount: total };
    }

    if (type === "subcontracts") {
      const list = MOCK_BILLS.filter((b) => b.subcontractor.id === company.id).map(
        (b) => ({
          id: b.id,
          date: b.date,
          reference: b.reference,
          amount: b.amount,
        })
      );
      const total = list.reduce((s, t) => s + t.amount, 0);
      return { transactions: list.sort((a, b) => b.date.localeCompare(a.date)), totalAmount: total };
    }

    return { transactions: [] as TransactionRow[], totalAmount: 0 };
  }, [company, type]);

  if (!company) return null;

  const transactionLabel =
    type === "clients"
      ? "Client invoices"
      : type === "suppliers"
        ? "Purchases"
        : "Bills";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
    >
      <div className="p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          {title} Details
        </h2>

        <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700 mb-6">
          <button
            type="button"
            onClick={() => setActiveTab("details")}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === "details"
                ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white border-b-2 border-brand-500 -mb-px"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            Details
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("dashboard")}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === "dashboard"
                ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white border-b-2 border-brand-500 -mb-px"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          >
            Dashboard
          </button>
        </div>

        {activeTab === "details" && (
          <section>
            <dl>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Company Name
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {company.name}
                </dd>
              </div>
            </dl>
          </section>
        )}

        {activeTab === "dashboard" && (
          <section>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
              Financial transactions
            </h3>
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden mb-4">
              <Table>
                <TableHeader className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-white/[0.04]">
                  <TableRow>
                    <TableCell
                      isHeader
                      className="px-4 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-400"
                    >
                      Date
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-400"
                    >
                      Reference
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 text-end text-xs font-medium text-gray-500 dark:text-gray-400"
                    >
                      Amount (QAR)
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {transactions.length === 0 ? (
                    <TableRow>
                      <td
                        colSpan={3}
                        className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                      >
                        No {transactionLabel.toLowerCase()} found.
                      </td>
                    </TableRow>
                  ) : (
                    transactions.map((t) => (
                      <tr
                        key={t.id}
                        className="hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                      >
                        <TableCell className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {formatDate(t.date)}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {t.reference}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-sm text-end tabular-nums font-medium text-gray-900 dark:text-white">
                          {formatCurrency(t.amount)}
                        </TableCell>
                      </tr>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            {transactions.length > 0 && (
              <div className="flex justify-end rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-white/[0.04] px-4 py-3">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Total ({transactionLabel}):{" "}
                </span>
                <span className="ml-2 text-sm font-semibold tabular-nums text-gray-900 dark:text-white">
                  {formatCurrency(totalAmount)}
                </span>
              </div>
            )}
          </section>
        )}
      </div>
    </Modal>
  );
}
