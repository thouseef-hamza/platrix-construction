"use client";

import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Modal } from "@/components/ui/modal";
import { formatCurrency, formatDate } from "@/utils/format";
import type { Company } from "@/types/company";
import type { CompanyType } from "@/types/company";
import { fetchInvoices } from "@/lib/invoicesApi";
import { fetchPurchases } from "@/lib/purchasesApi";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Tab = "dashboard" | "details" | "financial";

interface FinancialRow {
  id: string;
  date: string;
  reference: string;
  amount: number;
  paidAmount: number;
  balance: number;
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
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");

  const { data: invoices = [] } = useQuery({
    queryKey: ["invoices", type],
    queryFn: () =>
      type === "clients"
        ? fetchInvoices(0)
        : type === "subcontracts"
          ? fetchInvoices(1)
          : Promise.resolve([]),
    enabled: isOpen && (type === "clients" || type === "subcontracts"),
  });

  const { data: purchases = [] } = useQuery({
    queryKey: ["purchases"],
    queryFn: fetchPurchases,
    enabled: isOpen && type === "suppliers",
  });

  const { financialRows, totalPaid, totalToPay, totalReceived, totalToReceive } =
    useMemo(() => {
      if (!company) {
        return {
          financialRows: [] as FinancialRow[],
          totalPaid: 0,
          totalToPay: 0,
          totalReceived: 0,
          totalToReceive: 0,
        };
      }

      const companyId = company.id;

      if (type === "clients") {
        const filtered = invoices.filter(
          (inv) => inv.partyId === companyId || String(inv.partyId) === String(companyId)
        );
        const rows: FinancialRow[] = filtered.map((inv) => ({
          id: String(inv.id),
          date: inv.date,
          reference: inv.reference,
          amount: inv.amount,
          paidAmount: inv.paidAmount ?? 0,
          balance: inv.amount - (inv.paidAmount ?? 0),
        }));
        const totalReceived = rows.reduce((s, r) => s + r.paidAmount, 0);
        const totalToReceive = rows.reduce((s, r) => s + r.balance, 0);
        return {
          financialRows: rows.sort((a, b) => b.date.localeCompare(a.date)),
          totalPaid: 0,
          totalToPay: 0,
          totalReceived,
          totalToReceive,
        };
      }

      if (type === "suppliers") {
        const filtered = purchases.filter(
          (p) =>
            p.supplier.id === String(companyId) ||
            Number(p.supplier.id) === companyId
        );
        const rows: FinancialRow[] = filtered.map((p) => ({
          id: p.id,
          date: p.date,
          reference: p.reference,
          amount: p.amount,
          paidAmount: p.paidAmount ?? 0,
          balance: p.amount - (p.paidAmount ?? 0),
        }));
        const totalPaid = rows.reduce((s, r) => s + r.paidAmount, 0);
        const totalToPay = rows.reduce((s, r) => s + r.balance, 0);
        return {
          financialRows: rows.sort((a, b) => b.date.localeCompare(a.date)),
          totalPaid,
          totalToPay,
          totalReceived: 0,
          totalToReceive: 0,
        };
      }

      if (type === "subcontracts") {
        const filtered = invoices.filter(
          (inv) => inv.partyId === companyId || String(inv.partyId) === String(companyId)
        );
        const rows: FinancialRow[] = filtered.map((inv) => ({
          id: String(inv.id),
          date: inv.date,
          reference: inv.reference,
          amount: inv.amount,
          paidAmount: inv.paidAmount ?? 0,
          balance: inv.amount - (inv.paidAmount ?? 0),
        }));
        const totalPaid = rows.reduce((s, r) => s + r.paidAmount, 0);
        const totalToPay = rows.reduce((s, r) => s + r.balance, 0);
        return {
          financialRows: rows.sort((a, b) => b.date.localeCompare(a.date)),
          totalPaid,
          totalToPay,
          totalReceived: 0,
          totalToReceive: 0,
        };
      }

      return {
        financialRows: [] as FinancialRow[],
        totalPaid: 0,
        totalToPay: 0,
        totalReceived: 0,
        totalToReceive: 0,
      };
    }, [company, type, invoices, purchases]);

  if (!company) return null;

  const financialLabel =
    type === "clients"
      ? "Invoices"
      : type === "suppliers"
        ? "Purchases"
        : "Bills";

  const tabs: { id: Tab; label: string }[] = [
    { id: "dashboard", label: "Dashboard" },
    { id: "details", label: "Details" },
    { id: "financial", label: "Financial" },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-[95vw] w-full mx-4 max-h-[90vh] overflow-y-auto"
    >
      <div className="p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          {title} Details
        </h2>

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

        {activeTab === "dashboard" && (
          <section className="flex flex-col items-center justify-center py-16">
            <div className="rounded-xl border border-amber-200 bg-amber-50/50 px-6 py-8 text-center dark:border-amber-800 dark:bg-amber-900/20">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Under development
              </p>
              <p className="mt-1 text-xs text-amber-700 dark:text-amber-300/80">
                This section is coming soon.
              </p>
            </div>
          </section>
        )}

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

        {activeTab === "financial" && (
          <section className="space-y-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Financial summary
            </h3>

            {(type === "suppliers" || type === "subcontracts") && (
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[140px] rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-white/[0.03] p-4">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Total paid
                  </p>
                  <p className="text-lg font-semibold tabular-nums text-gray-900 dark:text-white">
                    {formatCurrency(totalPaid)}
                  </p>
                </div>
                <div className="flex-1 min-w-[140px] rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-white/[0.03] p-4">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Amount to pay
                  </p>
                  <p className="text-lg font-semibold tabular-nums text-error-600 dark:text-error-400">
                    {formatCurrency(totalToPay)}
                  </p>
                </div>
              </div>
            )}

            {type === "clients" && (
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[140px] rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-white/[0.03] p-4">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Total received
                  </p>
                  <p className="text-lg font-semibold tabular-nums text-gray-900 dark:text-white">
                    {formatCurrency(totalReceived)}
                  </p>
                </div>
                <div className="flex-1 min-w-[140px] rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-white/[0.03] p-4">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Amount to receive
                  </p>
                  <p className="text-lg font-semibold tabular-nums text-error-600 dark:text-error-400">
                    {formatCurrency(totalToReceive)}
                  </p>
                </div>
              </div>
            )}

            <h4 className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
              {financialLabel}
            </h4>
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
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
                    <TableCell
                      isHeader
                      className="px-4 py-3 text-end text-xs font-medium text-gray-500 dark:text-gray-400"
                    >
                      {type === "clients" ? "Received" : "Paid"}
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 text-end text-xs font-medium text-gray-500 dark:text-gray-400"
                    >
                      Balance
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {financialRows.length === 0 ? (
                    <TableRow>
                      <td
                        colSpan={5}
                        className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                      >
                        No {financialLabel.toLowerCase()} found.
                      </td>
                    </TableRow>
                  ) : (
                    financialRows.map((r) => (
                      <tr
                        key={r.id}
                        className="hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                      >
                        <TableCell className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {formatDate(r.date)}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          {r.reference}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-sm text-end tabular-nums text-gray-900 dark:text-white">
                          {formatCurrency(r.amount)}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-sm text-end tabular-nums text-gray-600 dark:text-gray-400">
                          {formatCurrency(r.paidAmount)}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-sm text-end tabular-nums font-medium text-gray-900 dark:text-white">
                          {formatCurrency(r.balance)}
                        </TableCell>
                      </tr>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </section>
        )}
      </div>
    </Modal>
  );
}
