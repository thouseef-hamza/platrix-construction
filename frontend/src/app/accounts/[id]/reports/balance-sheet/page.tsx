import type { Metadata } from "next";
import BalanceSheetReport from "@/components/reports/BalanceSheetReport";

export const metadata: Metadata = {
  title: "Balance Sheet | Reports | Construction Accounting",
  description: "Assets, liabilities, and equity.",
};

export default function BalanceSheetPage() {
  return <BalanceSheetReport />;
}
