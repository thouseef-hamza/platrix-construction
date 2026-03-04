import type { Metadata } from "next";
import JournalEntriesList from "@/components/chart-of-accounts/JournalEntriesList";

export const metadata: Metadata = {
  title: "Journal Entries | Chart of Accounts | Construction Accounting",
  description: "Create and view general journal entries.",
};

export default function JournalEntriesPage() {
  return <JournalEntriesList />;
}
