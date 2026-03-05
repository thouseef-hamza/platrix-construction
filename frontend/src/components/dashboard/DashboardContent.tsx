"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchDashboard } from "@/lib/dashboardApi";
import { ConstructionMetrics } from "./ConstructionMetrics";
import CashFlowChart from "./CashFlowChart";
import QuickActions from "./QuickActions";
import RecentProjects from "./RecentProjects";

export default function DashboardContent() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboard,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 flex items-center justify-center py-24">
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 flex items-center justify-center py-24">
          <p className="text-sm text-red-500 dark:text-red-400">Failed to load dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      <div className="col-span-12">
        <ConstructionMetrics metrics={data?.metrics} />
      </div>

      <div className="col-span-12 xl:col-span-8">
        <CashFlowChart cashFlow={data?.cash_flow} />
      </div>

      <div className="col-span-12 xl:col-span-4">
        <QuickActions />
      </div>

      <div className="col-span-12">
        <RecentProjects projects={data?.recent_projects ?? []} />
      </div>
    </div>
  );
}
