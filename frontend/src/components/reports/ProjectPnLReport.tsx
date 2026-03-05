"use client";

import React, { useMemo, useState } from "react";
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
import { fetchProjectPnL } from "@/lib/reportsApi";

export default function ProjectPnLReport() {
  const [projectId, setProjectId] = useState<string>("");
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
    queryKey: ["reports", "project-pnl", dateFrom, dateTo],
    queryFn: () =>
      fetchProjectPnL({
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      }),
  });

  const projects = data?.projects ?? [];
  const filteredData = useMemo(() => {
    if (!projectId) return projects;
    return projects.filter((r) => String(r.project_id) === projectId);
  }, [projects, projectId]);

  const totals = useMemo(() => {
    const revenue = filteredData.reduce((s, r) => s + r.income, 0);
    const expenses = filteredData.reduce((s, r) => s + r.expense, 0);
    const profit = filteredData.reduce((s, r) => s + r.profit, 0);
    return { revenue, expenses, profit };
  }, [filteredData]);

  const inputClass =
    "h-11 rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800";

  return (
    <div>
      <div className="mb-6">
        <PageBreadcrumb pageTitle="Project Profit & Loss" />
      </div>
      <ComponentCard>
        <div className="mb-6 flex flex-wrap items-end gap-4">
          <div className="w-56">
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
              Project
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className={inputClass + " w-full"}
            >
              <option value="">All projects</option>
              {projects.map((p) => (
                <option key={p.project_id} value={String(p.project_id)}>
                  {p.project_name} ({p.project_code})
                </option>
              ))}
            </select>
          </div>
          <div>
            <DatePicker
              id="report-pnl-from"
              label="From"
              placeholder="Select date"
              value={dateFrom}
              onChange={(_, dateStr) => setDateFrom(dateStr ?? "")}
            />
          </div>
          <div>
            <DatePicker
              id="report-pnl-to"
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
                      Project
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 text-end text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                    >
                      Revenue (QAR)
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 text-end text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                    >
                      Expenses (QAR)
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 text-end text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                    >
                      Profit (QAR)
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {filteredData.length === 0 ? (
                    <tr>
                      <TableCell
                        colSpan={4}
                        className="px-5 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                      >
                        No data for the selected period.
                      </TableCell>
                    </tr>
                  ) : (
                    filteredData.map((row) => (
                      <tr
                        key={row.project_id}
                        className="hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                      >
                        <TableCell className="px-5 py-4 text-start text-theme-sm font-medium text-gray-800 dark:text-white/90">
                          {row.project_name}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-end text-theme-sm text-gray-600 dark:text-gray-400 tabular-nums">
                          {formatCurrency(row.income)}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-end text-theme-sm text-gray-600 dark:text-gray-400 tabular-nums">
                          {formatCurrency(row.expense)}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-end text-theme-sm font-medium tabular-nums text-gray-900 dark:text-white">
                          {formatCurrency(row.profit)}
                        </TableCell>
                      </tr>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="mt-4 flex justify-end border-t border-gray-200 pt-4 dark:border-gray-800">
              <div className="flex gap-8 text-sm font-medium">
                <span className="text-gray-600 dark:text-gray-400">
                  Total Revenue: {formatCurrency(totals.revenue)}
                </span>
                <span className="text-gray-600 dark:text-gray-400">
                  Total Expenses: {formatCurrency(totals.expenses)}
                </span>
                <span className="text-gray-900 dark:text-white tabular-nums">
                  Net Profit: {formatCurrency(totals.profit)}
                </span>
              </div>
            </div>
          </>
        )}
      </ComponentCard>
    </div>
  );
}
