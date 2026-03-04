import type { Metadata } from "next";
import CompaniesList from "@/components/companies/CompaniesList";

export const metadata: Metadata = {
  title: "Subcontracts | Companies | Construction Accounting",
  description: "Manage subcontractor companies",
};

export default function SubcontractsPage() {
  return <CompaniesList title="Subcontracts" type="subcontracts" />;
}
