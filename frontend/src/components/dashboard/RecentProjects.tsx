"use client";

import React from "react";
import Link from "next/link";
import { ArrowRightIcon } from "@/icons";
import Badge from "../ui/badge/Badge";
import { useCompany } from "@/context/CompanyContext";

const projects = [
  { id: 1, name: "Residential Tower A", client: "ABC Builders", status: "Active", progress: 65 },
  { id: 2, name: "Highway Bridge Section", client: "PWD", status: "Active", progress: 40 },
  { id: 3, name: "Commercial Complex Phase 1", client: "XYZ Developers", status: "On Hold", progress: 80 },
  { id: 4, name: "Warehouse Unit 3", client: "LogiCorp", status: "Completed", progress: 100 },
  { id: 5, name: "School Block Renovation", client: "Municipal Corp", status: "Active", progress: 22 },
];

const statusColor: Record<string, "success" | "warning" | "info"> = {
  Active: "success",
  "On Hold": "warning",
  Completed: "info",
};

export default function RecentProjects() {
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
        {projects.map((p) => (
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
                {p.client}
              </p>
            </div>
            <div className="ml-4 flex shrink-0 items-center gap-3">
              <div className="hidden w-24 sm:block">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                  <div
                    className="h-full rounded-full bg-blue-500"
                    style={{ width: `${p.progress}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {p.progress}%
                </span>
              </div>
              <Badge color={statusColor[p.status] ?? "primary"}>{p.status}</Badge>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
