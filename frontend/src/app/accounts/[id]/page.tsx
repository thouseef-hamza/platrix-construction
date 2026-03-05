import type { Metadata } from "next";
import React from "react";
import DashboardContent from "@/components/dashboard/DashboardContent";

export const metadata: Metadata = {
  title: "Dashboard | Blackfox",
  description: "Blackfox construction software – projects, invoices, and key metrics.",
};

export default function ConstructionDashboard() {
  return <DashboardContent />;
}
