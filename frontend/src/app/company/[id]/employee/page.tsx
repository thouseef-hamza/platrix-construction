import type { Metadata } from "next";
import EmployeesList from "@/components/employee/EmployeesList";

export const metadata: Metadata = {
  title: "Employees | Construction Accounting",
  description: "View and manage employee details and salary.",
};

export default function EmployeePage() {
  return <EmployeesList />;
}
