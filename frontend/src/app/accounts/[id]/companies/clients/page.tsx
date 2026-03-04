import type { Metadata } from "next";
import CompaniesList from "@/components/companies/CompaniesList";

export const metadata: Metadata = {
  title: "Clients | Companies | Construction Accounting",
  description: "Manage client companies",
};

export default function ClientsPage() {
  return <CompaniesList title="Clients" type="clients" />;
}
