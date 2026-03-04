import type { Metadata } from "next";
import AccountsList from "@/components/chart-of-accounts/AccountsList";

export const metadata: Metadata = {
  title: "Accounts | Chart of Accounts | Construction Accounting",
  description: "Manage your chart of accounts and account types.",
};

export default function AccountsPage() {
  return <AccountsList />;
}
