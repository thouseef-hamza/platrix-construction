import type { Metadata } from "next";
import MaterialsList from "@/components/materials/MaterialsList";

export const metadata: Metadata = {
  title: "Materials | Inventory | Construction Accounting",
  description: "Manage materials inventory",
};

export default function MaterialsPage() {
  return <MaterialsList />;
}
