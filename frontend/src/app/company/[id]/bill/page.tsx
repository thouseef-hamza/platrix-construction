import type { Metadata } from "next";
import BillsList from "@/components/bills/BillsList";

export const metadata: Metadata = {
  title: "Subcontractor Invoice | Construction Accounting",
  description: "Manage subcontractor invoices",
};

export default function BillPage() {
  return <BillsList />;
}
