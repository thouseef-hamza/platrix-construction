import type { AccountType } from "@/types/chartOfAccounts";

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-QA", {
    style: "currency",
    currency: "QAR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

/** Tailwind text color class for account balance by type: expense=red, asset negative=red/else blue, liability negative=red/else amber, others=green/red/gray. */
export function getBalanceColorClass(
  accountType: AccountType,
  balance: number
): string {
  const bal = balance ?? 0;
  if (accountType === "expense") {
    return "text-red-600 dark:text-red-400";
  }
  if (accountType === "asset") {
    return bal < 0
      ? "text-red-600 dark:text-red-400"
      : "text-blue-600 dark:text-blue-400";
  }
  if (accountType === "liability") {
    return bal < 0
      ? "text-red-600 dark:text-red-400"
      : "text-amber-600 dark:text-amber-400";
  }
  // equity, revenue: negative red, positive green, zero gray
  return bal < 0
    ? "text-red-600 dark:text-red-400"
    : bal > 0
      ? "text-green-600 dark:text-green-400"
      : "text-gray-600 dark:text-gray-400";
}

export function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "Z");
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
