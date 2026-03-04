"use client";

import React from "react";
import Link from "next/link";
import {
  GridIcon,
  ListIcon,
  ArrowDownIcon,
  TableIcon,
  DollarLineIcon,
  DocsIcon,
  BoxIconLine,
  GroupIcon,
} from "@/icons";
import { useCompany } from "@/context/CompanyContext";

const actionPaths = [
  { label: "New Project", path: "/projects", icon: GridIcon },
  { label: "Add Expense", path: "/expense", icon: ListIcon },
  { label: "Client Invoice", path: "/payments", icon: ArrowDownIcon },
  { label: "Purchase Order", path: "/purchase", icon: DollarLineIcon },
  { label: "Subcontract Bill", path: "/bill", icon: DocsIcon },
  { label: "Reports", path: "/reports/project-pnl", icon: TableIcon },
  { label: "Materials", path: "/inventory/materials", icon: BoxIconLine },
  { label: "Companies", path: "/companies/clients", icon: GroupIcon },
];

export default function QuickActions() {
  const { path } = useCompany();
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] sm:p-6">
      <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
        Quick actions
      </h3>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {actionPaths.map((a) => {
          const Icon = a.icon;
          return (
            <Link
              key={a.label}
              href={path(a.path)}
              className="flex flex-col items-center gap-2 rounded-xl border border-gray-100 py-4 transition hover:border-gray-200 hover:bg-gray-50 dark:border-gray-800 dark:hover:border-gray-700 dark:hover:bg-white/[0.04]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                <Icon className="size-5 text-gray-600 dark:text-gray-400" />
              </div>
              <span className="text-center text-xs font-medium text-gray-700 dark:text-gray-300">
                {a.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
