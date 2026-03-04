import type { Metadata } from "next";
import CompaniesList from "@/components/companies/CompaniesList";

export const metadata: Metadata = {
  title: "Suppliers | Companies | Construction Accounting",
  description: "Manage supplier companies",
};

export default function SuppliersPage() {
  return <CompaniesList title="Suppliers" type="suppliers" />;
}
