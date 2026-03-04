"use client";

import React, { useMemo, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import DatePicker from "@/components/form/date-picker";
import { formatCurrency } from "@/utils/format";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  MOCK_OVERALL_PNL_REVENUE,
  MOCK_OVERALL_PNL_EXPENSES,
} from "@/data/mockReportData";

export default function OverallPnLReport() {
  const [dateFrom, setDateFrom] = useState("2024-10-01");
  const [dateTo, setDateTo] = useState("2024-10-31");

  const totalRevenue = useMemo(
    () => MOCK_OVERALL_PNL_REVENUE.reduce((s, r) => s + r.amount, 0),
    []
  );
  const totalExpenses = useMemo(
    () => MOCK_OVERALL_PNL_EXPENSES.reduce((s, r) => s + r.amount, 0),
    []
  );
  const netProfit = totalRevenue - totalExpenses;

  const inputClass =
    "h-11 rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800";

  return (
    <div>
      <div className="mb-6">
        <PageBreadcrumb pageTitle="Overall P&L" />
      </div>
      <ComponentCard>
        <div className="mb-6 flex flex-wrap items-end gap-4">
          <div>
            <DatePicker
              id="report-overall-from"
              label="From"
              placeholder="Select date"
              value={dateFrom}
              onChange={(_, dateStr) => setDateFrom(dateStr ?? "")}
            />
          </div>
          <div>
            <DatePicker
              id="report-overall-to"
              label="To"
              placeholder="Select date"
              value={dateTo}
              onChange={(_, dateStr) => setDateTo(dateStr ?? "")}
            />
          </div>
        </div>
        <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-white/[0.05]">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell
                  isHeader
                  className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                >
                  Revenue
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
              {MOCK_OVERALL_PNL_REVENUE.map((row) => (
                <tr key={row.category} className="hover:bg-gray-50 dark:hover:bg-white/[0.03]">
                  <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-600 dark:text-gray-400">
                    {row.category}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-end text-theme-sm text-gray-600 dark:text-gray-400 tabular-nums">
                    {formatCurrency(row.amount)}
                  </TableCell>
                </tr>
              ))}
              <tr className="bg-gray-50 dark:bg-white/[0.04]">
                <TableCell className="px-5 py-4 text-start text-theme-sm font-medium text-gray-800 dark:text-white">
                  Total Revenue
                </TableCell>
                <TableCell className="px-5 py-4 text-end text-theme-sm font-medium tabular-nums text-gray-900 dark:text-white">
                  {formatCurrency(totalRevenue)}
                </TableCell>
              </tr>
            </TableBody>
          </Table>
        </div>
        <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 dark:border-white/[0.05]">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell
                  isHeader
                  className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                >
                  Expenses
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
              {MOCK_OVERALL_PNL_EXPENSES.map((row) => (
                <tr key={row.category} className="hover:bg-gray-50 dark:hover:bg-white/[0.03]">
                  <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-600 dark:text-gray-400">
                    {row.category}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-end text-theme-sm text-gray-600 dark:text-gray-400 tabular-nums">
                    {formatCurrency(row.amount)}
                  </TableCell>
                </tr>
              ))}
              <tr className="bg-gray-50 dark:bg-white/[0.04]">
                <TableCell className="px-5 py-4 text-start text-theme-sm font-medium text-gray-800 dark:text-white">
                  Total Expenses
                </TableCell>
                <TableCell className="px-5 py-4 text-end text-theme-sm font-medium tabular-nums text-gray-900 dark:text-white">
                  {formatCurrency(totalExpenses)}
                </TableCell>
              </tr>
            </TableBody>
          </Table>
        </div>
        <div className="mt-6 overflow-hidden rounded-xl border border-brand-500/30 bg-brand-50/50 dark:bg-brand-500/10 dark:border-brand-500/20">
          <div className="flex items-center justify-between px-5 py-4">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              Net Profit
            </span>
            <span
              className={`tabular-nums text-lg font-semibold ${
                netProfit >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
              }`}
            >
              {formatCurrency(netProfit)}
            </span>
          </div>
        </div>
      </ComponentCard>
    </div>
  );
}
