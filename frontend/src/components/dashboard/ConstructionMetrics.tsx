"use client";

import React from "react";
import Link from "next/link";
import { useCompany } from "@/context/CompanyContext";
import {
  ArrowDownIcon,
  GridIcon,
  ListIcon,
  ArrowRightIcon,
  UserCircleIcon,
} from "@/icons";
import type { DashboardMetrics } from "@/lib/dashboardApi";
import { formatMetricCurrency } from "@/lib/dashboardApi";

const METRIC_CONFIG = [
  {
    key: "active_projects" as const,
    label: "Active Projects",
    icon: GridIcon,
    href: "/projects",
    bgClass: "bg-blue-100 dark:bg-blue-900/30",
    iconClass: "text-blue-600 dark:text-blue-400",
  },
  {
    key: "expenses_mtd" as const,
    label: "Expenses (MTD)",
    icon: ListIcon,
    href: "/expense",
    bgClass: "bg-amber-100 dark:bg-amber-900/30",
    iconClass: "text-amber-600 dark:text-amber-400",
  },
  {
    key: "invoices_mtd" as const,
    label: "Client Invoices (MTD)",
    icon: ArrowDownIcon,
    href: "/payments",
    bgClass: "bg-emerald-100 dark:bg-emerald-900/30",
    iconClass: "text-emerald-600 dark:text-emerald-400",
  },
  {
    key: "employees_count" as const,
    label: "Employees",
    icon: UserCircleIcon,
    href: "/employee",
    bgClass: "bg-violet-100 dark:bg-violet-900/30",
    iconClass: "text-violet-600 dark:text-violet-400",
  },
];

export function ConstructionMetrics({
  metrics,
}: {
  metrics?: DashboardMetrics | null;
}) {
  const { path } = useCompany();
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {METRIC_CONFIG.map((m) => {
        const Icon = m.icon;
        const raw = metrics?.[m.key];
        const value =
          m.key === "active_projects" || m.key === "employees_count"
            ? String(raw ?? 0)
            : formatMetricCurrency(raw ?? 0);
        return (
          <Link
            key={m.label}
            href={path(m.href)}
            className="group block rounded-2xl border border-gray-200 bg-white p-5 transition hover:border-gray-300 hover:shadow-sm dark:border-gray-800 dark:bg-white/[0.03] dark:hover:border-gray-700 md:p-6"
          >
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-xl ${m.bgClass}`}
            >
              <Icon className={`size-6 ${m.iconClass}`} />
            </div>
            <div className="mt-4">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {m.label}
              </span>
              <h4 className="mt-1 text-xl font-bold text-gray-900 dark:text-white/90">
                {value}
              </h4>
            </div>
            <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-gray-500 group-hover:text-gray-700 dark:text-gray-400 dark:group-hover:text-gray-300">
              View
              <ArrowRightIcon className="size-3.5 transition group-hover:translate-x-0.5" />
            </span>
          </Link>
        );
      })}
    </div>
  );
}
