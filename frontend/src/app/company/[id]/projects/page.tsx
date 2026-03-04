import type { Metadata } from "next";
import ProjectsList from "@/components/projects/ProjectsList";

export const metadata: Metadata = {
  title: "Projects | Construction Accounting",
  description: "Manage construction projects – search, filter, and list.",
};

export default function ProjectsPage() {
  return <ProjectsList />;
}
