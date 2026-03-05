import type { JournalEntry } from "@/types/chartOfAccounts";

export const MOCK_JOURNAL_ENTRIES: JournalEntry[] = [
  {
    id: 1,
    number: "JE-2024-001",
    date: "2024-10-01",
    description: "Opening balance allocation",
    status: "posted",
    lines: [
      { id: 1, accountId: 3, accountCode: "1110", accountName: "Cash and Bank", debit: 125000, credit: 0 },
      { id: 2, accountId: 12, accountCode: "3000", accountName: "Equity", debit: 0, credit: 125000 },
    ],
  },
  {
    id: 2,
    number: "JE-2024-002",
    date: "2024-10-05",
    description: "Purchase materials on credit",
    status: "posted",
    lines: [
      { id: 3, accountId: 18, accountCode: "5100", accountName: "Cost of Materials", debit: 15000, credit: 0 },
      { id: 4, accountId: 10, accountCode: "2110", accountName: "Accounts Payable", debit: 0, credit: 15000 },
    ],
  },
  {
    id: 3,
    number: "JE-2024-003",
    date: "2024-10-10",
    description: "Client invoice - construction revenue",
    status: "posted",
    lines: [
      { id: 5, accountId: 4, accountCode: "1120", accountName: "Accounts Receivable", debit: 45000, credit: 0 },
      { id: 6, accountId: 15, accountCode: "4100", accountName: "Construction Revenue", debit: 0, credit: 45000 },
    ],
  },
  {
    id: 4,
    number: "JE-2024-004",
    date: "2024-10-15",
    description: "Pay subcontractor labor",
    status: "draft",
    lines: [
      { id: 7, accountId: 19, accountCode: "5200", accountName: "Labor Expense", debit: 8000, credit: 0 },
      { id: 8, accountId: 3, accountCode: "1110", accountName: "Cash and Bank", debit: 0, credit: 8000 },
    ],
  },
  {
    id: 5,
    number: "JE-2024-005",
    date: "2024-10-20",
    description: "Office supplies",
    status: "posted",
    lines: [
      { id: 9, accountId: 20, accountCode: "5300", accountName: "Operating Expenses", debit: 320, credit: 0, description: "Office supplies" },
      { id: 10, accountId: 3, accountCode: "1110", accountName: "Cash and Bank", debit: 0, credit: 320 },
    ],
  },
];
