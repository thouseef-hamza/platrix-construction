"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { fetchOverallPnL } from "@/lib/reportsApi";

export default function OverallPnLReport() {
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    d.setDate(1);
    return d.toISOString().slice(0, 10);
  });
  const [dateTo, setDateTo] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ["reports", "overall-pnl", dateFrom, dateTo],
    queryFn: () =>
      fetchOverallPnL({
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      }),
  });

  const revenue = data?.revenue ?? [];
  const expenses = data?.expenses ?? [];
  const totalRevenue = data?.total_revenue ?? 0;
  const totalExpenses = data?.total_expenses ?? 0;
  const netProfit = data?.net_profit ?? 0;

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
        {isLoading && (
          <div className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
            Loading…
          </div>
        )}
        {error && (
          <div className="py-8 text-center text-sm text-red-600 dark:text-red-400">
            Failed to load report.
          </div>
        )}
        {!isLoading && !error && (
          <>
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
                  {revenue.length === 0 ? (
                    <tr>
                      <TableCell
                        colSpan={2}
                        className="px-5 py-4 text-start text-theme-sm text-gray-500 dark:text-gray-400"
                      >
                        No revenue in period
                      </TableCell>
                    </tr>
                  ) : (
                    revenue.map((row) => (
                      <tr
                        key={row.code}
                        className="hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                      >
                        <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-600 dark:text-gray-400">
                          {row.name}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-end text-theme-sm text-gray-600 dark:text-gray-400 tabular-nums">
                          {formatCurrency(row.amount)}
                        </TableCell>
                      </tr>
                    ))
                  )}
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
                  {expenses.length === 0 ? (
                    <tr>
                      <TableCell
                        colSpan={2}
                        className="px-5 py-4 text-start text-theme-sm text-gray-500 dark:text-gray-400"
                      >
                        No expenses in period
                      </TableCell>
                    </tr>
                  ) : (
                    expenses.map((row) => (
                      <tr
                        key={row.code}
                        className="hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                      >
                        <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-600 dark:text-gray-400">
                          {row.name}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-end text-theme-sm text-gray-600 dark:text-gray-400 tabular-nums">
                          {formatCurrency(row.amount)}
                        </TableCell>
                      </tr>
                    ))
                  )}
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
                    netProfit >= 0
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {formatCurrency(netProfit)}
                </span>
              </div>
            </div>
          </>
        )}
      </ComponentCard>
    </div>
  );
}
