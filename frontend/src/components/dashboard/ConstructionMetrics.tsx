"use client";

import React from "react";
import Link from "next/link";
import { useCompany } from "@/context/CompanyContext";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  GridIcon,
  ListIcon,
  ArrowRightIcon,
  UserCircleIcon,
  DollarLineIcon,
  DocsIcon,
} from "@/icons";
import Badge from "../ui/badge/Badge";

const metrics = [
  {
    label: "Active Projects",
    value: "12",
    change: "+2",
    trend: "up" as const,
    icon: GridIcon,
    href: "/projects",
    bgClass: "bg-blue-100 dark:bg-blue-900/30",
    iconClass: "text-blue-600 dark:text-blue-400",
  },
  {
    label: "Expenses (MTD)",
    value: "₹ 4.2L",
    change: "-5%",
    trend: "down" as const,
    icon: ListIcon,
    href: "/expense",
    bgClass: "bg-amber-100 dark:bg-amber-900/30",
    iconClass: "text-amber-600 dark:text-amber-400",
  },
  {
    label: "Client Invoices (MTD)",
    value: "₹ 8.5L",
    change: "+12%",
    trend: "up" as const,
    icon: ArrowDownIcon,
    href: "/payments",
    bgClass: "bg-emerald-100 dark:bg-emerald-900/30",
    iconClass: "text-emerald-600 dark:text-emerald-400",
  },
  {
    label: "Employees",
    value: "24",
    change: "+3",
    trend: "up" as const,
    icon: UserCircleIcon,
    href: "/employee",
    bgClass: "bg-violet-100 dark:bg-violet-900/30",
    iconClass: "text-violet-600 dark:text-violet-400",
  },
];

export function ConstructionMetrics() {
  const { path } = useCompany();
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((m) => {
        const Icon = m.icon;
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
            <div className="mt-4 flex items-end justify-between">
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {m.label}
                </span>
                <h4 className="mt-1 text-xl font-bold text-gray-900 dark:text-white/90">
                  {m.value}
                </h4>
              </div>
              <Badge color={m.trend === "up" ? "success" : "error"}>
                {m.trend === "up" ? (
                  <ArrowUpIcon className="size-3.5" />
                ) : (
                  <ArrowDownIcon className="size-3.5 text-error-500" />
                )}
                {m.change}
              </Badge>
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
