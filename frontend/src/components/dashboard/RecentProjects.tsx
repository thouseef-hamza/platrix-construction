"use client";

import React from "react";
import Link from "next/link";
import { ArrowRightIcon } from "@/icons";
import Badge from "../ui/badge/Badge";
import { useCompany } from "@/context/CompanyContext";
import type { DashboardRecentProject } from "@/lib/dashboardApi";

const statusColor: Record<string, "primary" | "success" | "warning" | "info"> = {
  Active: "success",
  "On Hold": "warning",
  Completed: "info",
  Planning: "primary",
  Cancelled: "primary",
};

export default function RecentProjects({
  projects = [],
}: {
  projects?: DashboardRecentProject[];
}) {
  const { path } = useCompany();
  const projectsPath = path("/projects");
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800 sm:px-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Recent Projects
        </h3>
        <Link
          href={projectsPath}
          className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          View all
          <ArrowRightIcon className="size-4" />
        </Link>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {projects.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-gray-500 dark:text-gray-400 sm:px-6">
            No projects yet.
          </div>
        ) : (
          projects.map((p) => (
            <Link
              key={p.id}
              href={projectsPath}
              className="flex items-center justify-between px-5 py-3 transition hover:bg-gray-50 dark:hover:bg-white/[0.02] sm:px-6"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-gray-900 dark:text-white">
                  {p.name}
                </p>
                <p className="truncate text-sm text-gray-500 dark:text-gray-400">
                  {p.client_name}
                </p>
              </div>
              <div className="ml-4 flex shrink-0 items-center">
                <Badge color={statusColor[p.status] ?? "primary"}>{p.status}</Badge>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
