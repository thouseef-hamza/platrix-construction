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
  MOCK_BALANCE_SHEET_ASSETS,
  MOCK_BALANCE_SHEET_LIABILITIES,
  MOCK_BALANCE_SHEET_EQUITY,
} from "@/data/mockReportData";

export default function BalanceSheetReport() {
  const [asOfDate, setAsOfDate] = useState("2024-10-31");

  const totalAssets = useMemo(
    () => MOCK_BALANCE_SHEET_ASSETS.reduce((s, i) => s + i.amount, 0),
    []
  );
  const totalLiabilities = useMemo(
    () => MOCK_BALANCE_SHEET_LIABILITIES.reduce((s, i) => s + i.amount, 0),
    []
  );
  const totalEquity = useMemo(
    () => MOCK_BALANCE_SHEET_EQUITY.reduce((s, i) => s + i.amount, 0),
    []
  );
  const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;

  const inputClass =
    "h-11 rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800";

  return (
    <div>
      <div className="mb-6">
        <PageBreadcrumb pageTitle="Balance Sheet" />
      </div>
      <ComponentCard>
        <div className="mb-6 flex flex-wrap items-end gap-4">
          <div>
            <DatePicker
              id="balance-sheet-date"
              label="As of date"
              placeholder="Select date"
              value={asOfDate}
              onChange={(_, dateStr) => setAsOfDate(dateStr ?? "")}
            />
          </div>
        </div>
        <div className="space-y-6">
          <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-white/[0.05]">
            <h3 className="px-5 py-3 text-sm font-semibold text-gray-800 dark:text-white bg-gray-50 dark:bg-white/[0.04] border-b border-gray-200 dark:border-white/[0.05]">
              Assets
            </h3>
            <Table>
              <SectionTableHeader />
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {MOCK_BALANCE_SHEET_ASSETS.map((item) => (
                  <tr key={item.code} className="hover:bg-gray-50 dark:hover:bg-white/[0.03]">
                    <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-600 dark:text-gray-400 tabular-nums">
                      {item.code}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-700 dark:text-gray-300">
                      {item.name}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-end text-theme-sm text-gray-600 dark:text-gray-400 tabular-nums">
                      {formatCurrency(item.amount)}
                    </TableCell>
                  </tr>
                ))}
                <tr className="bg-gray-50 dark:bg-white/[0.04] font-medium">
                  <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white" colSpan={2}>
                    Total Assets
                  </TableCell>
                  <TableCell className="px-5 py-4 text-end text-theme-sm font-medium tabular-nums text-gray-900 dark:text-white">
                    {formatCurrency(totalAssets)}
                  </TableCell>
                </tr>
              </TableBody>
            </Table>
          </div>
          <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-white/[0.05]">
            <h3 className="px-5 py-3 text-sm font-semibold text-gray-800 dark:text-white bg-gray-50 dark:bg-white/[0.04] border-b border-gray-200 dark:border-white/[0.05]">
              Liabilities
            </h3>
            <Table>
              <SectionTableHeader />
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {MOCK_BALANCE_SHEET_LIABILITIES.map((item) => (
                  <tr key={item.code} className="hover:bg-gray-50 dark:hover:bg-white/[0.03]">
                    <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-600 dark:text-gray-400 tabular-nums">
                      {item.code}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-700 dark:text-gray-300">
                      {item.name}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-end text-theme-sm text-gray-600 dark:text-gray-400 tabular-nums">
                      {formatCurrency(item.amount)}
                    </TableCell>
                  </tr>
                ))}
                <tr className="bg-gray-50 dark:bg-white/[0.04] font-medium">
                  <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white" colSpan={2}>
                    Total Liabilities
                  </TableCell>
                  <TableCell className="px-5 py-4 text-end text-theme-sm font-medium tabular-nums text-gray-900 dark:text-white">
                    {formatCurrency(totalLiabilities)}
                  </TableCell>
                </tr>
              </TableBody>
            </Table>
          </div>
          <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-white/[0.05]">
            <h3 className="px-5 py-3 text-sm font-semibold text-gray-800 dark:text-white bg-gray-50 dark:bg-white/[0.04] border-b border-gray-200 dark:border-white/[0.05]">
              Equity
            </h3>
            <Table>
              <SectionTableHeader />
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {MOCK_BALANCE_SHEET_EQUITY.map((item) => (
                  <tr key={item.code} className="hover:bg-gray-50 dark:hover:bg-white/[0.03]">
                    <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-600 dark:text-gray-400 tabular-nums">
                      {item.code}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-700 dark:text-gray-300">
                      {item.name}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-end text-theme-sm text-gray-600 dark:text-gray-400 tabular-nums">
                      {formatCurrency(item.amount)}
                    </TableCell>
                  </tr>
                ))}
                <tr className="bg-gray-50 dark:bg-white/[0.04] font-medium">
                  <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white" colSpan={2}>
                    Total Equity
                  </TableCell>
                  <TableCell className="px-5 py-4 text-end text-theme-sm font-medium tabular-nums text-gray-900 dark:text-white">
                    {formatCurrency(totalEquity)}
                  </TableCell>
                </tr>
              </TableBody>
            </Table>
          </div>
          <div className="overflow-hidden rounded-xl border border-brand-500/30 bg-brand-50/50 dark:bg-brand-500/10 dark:border-brand-500/20">
            <div className="flex items-center justify-between px-5 py-4">
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                Total Liabilities & Equity
              </span>
              <span className="tabular-nums text-lg font-semibold text-gray-900 dark:text-white">
                {formatCurrency(totalLiabilitiesAndEquity)}
              </span>
            </div>
          </div>
        </div>
      </ComponentCard>
    </div>
  );
}

function SectionTableHeader() {
  return (
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
          Account
        </TableCell>
        <TableCell
          isHeader
          className="px-5 py-3 text-end text-theme-xs font-medium text-gray-500 dark:text-gray-400"
        >
          Amount (QAR)
        </TableCell>
      </TableRow>
    </TableHeader>
  );
}
