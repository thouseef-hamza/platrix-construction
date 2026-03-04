import type { Metadata } from "next";
import ProjectPnLReport from "@/components/reports/ProjectPnLReport";

export const metadata: Metadata = {
  title: "Project Profit & Loss | Reports | Construction Accounting",
  description: "Revenue, expenses, and profit by project.",
};

export default function ProjectPnLPage() {
  return <ProjectPnLReport />;
}
