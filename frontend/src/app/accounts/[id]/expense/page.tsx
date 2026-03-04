import type { Metadata } from "next";
import ExpensesList from "@/components/expense/ExpensesList";

export const metadata: Metadata = {
  title: "Expense | Construction Accounting",
  description: "Manage expenses",
};

export default function ExpensePage() {
  return <ExpensesList />;
}
