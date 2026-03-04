import type { Metadata } from "next";
import PlaceholderPage from "@/components/common/PlaceholderPage";

export const metadata: Metadata = {
  title: "Client Contracts | Construction Accounting",
  description: "Manage client contracts",
};

export default function ClientContractsPage() {
  return (
    <PlaceholderPage
      title="Client Contracts"
      description="View and manage contracts with clients."
    />
  );
}
