import type { Metadata } from "next";
import OverallPnLReport from "@/components/reports/OverallPnLReport";

export const metadata: Metadata = {
  title: "Overall P&L | Reports | Construction Accounting",
  description: "Profit and loss statement.",
};

export default function OverallPnLPage() {
  return <OverallPnLReport />;
}
