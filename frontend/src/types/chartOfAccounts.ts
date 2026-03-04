export type AccountType =
  | "asset"
  | "liability"
  | "equity"
  | "revenue"
  | "expense";

export interface Account {
  id: number;
  code: string;
  name: string;
  type: AccountType;
  parentId: number | null;
  openingBalance: number; // positive = debit balance for asset/expense, credit for liability/equity/revenue
  isActive: boolean;
}

export type JournalEntryStatus = "draft" | "posted";

export interface JournalEntryLine {
  id: number;
  accountId: number;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  description?: string;
}

export interface JournalEntry {
  id: number;
  number: string;
  date: string;
  description: string;
  status: JournalEntryStatus;
  lines: JournalEntryLine[];
}
