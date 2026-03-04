import type { Metadata } from "next";
import PurchasesList from "@/components/purchase/PurchasesList";

export const metadata: Metadata = {
  title: "Purchase | Construction Accounting",
  description: "Manage purchases",
};

export default function PurchasePage() {
  return <PurchasesList />;
}
