import type { Metadata } from "next";
import React from "react";
import { ConstructionMetrics } from "@/components/dashboard/ConstructionMetrics";
import CashFlowChart from "@/components/dashboard/CashFlowChart";
import RecentProjects from "@/components/dashboard/RecentProjects";
import QuickActions from "@/components/dashboard/QuickActions";

export const metadata: Metadata = {
  title: "Dashboard | Blackfox",
  description: "Blackfox construction software – projects, invoices, and key metrics.",
};

export default function ConstructionDashboard() {
  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      <div className="col-span-12">
        <ConstructionMetrics />
      </div>

      <div className="col-span-12 xl:col-span-8">
        <CashFlowChart />
      </div>

      <div className="col-span-12 xl:col-span-4">
        <QuickActions />
      </div>

      <div className="col-span-12">
        <RecentProjects />
      </div>
    </div>
  );
}
