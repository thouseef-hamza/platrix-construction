import type { Account } from "@/types/chartOfAccounts";

export const MOCK_ACCOUNTS: Account[] = [
  // Assets (1000-1999)
  { id: 1, code: "1000", name: "Assets", type: "asset", parentId: null, balance: 0, isActive: true },
  { id: 2, code: "1100", name: "Current Assets", type: "asset", parentId: 1, balance: 0, isActive: true },
  { id: 3, code: "1110", name: "Cash and Bank", type: "asset", parentId: 2, balance: 125000, isActive: true },
  { id: 4, code: "1120", name: "Accounts Receivable", type: "asset", parentId: 2, balance: 85000, isActive: true },
  { id: 5, code: "1130", name: "Inventory", type: "asset", parentId: 2, balance: 42000, isActive: true },
  { id: 6, code: "1200", name: "Fixed Assets", type: "asset", parentId: 1, balance: 0, isActive: true },
  { id: 7, code: "1210", name: "Equipment", type: "asset", parentId: 6, balance: 180000, isActive: true },
  // Liabilities (2000-2999)
  { id: 8, code: "2000", name: "Liabilities", type: "liability", parentId: null, balance: 0, isActive: true },
  { id: 9, code: "2100", name: "Current Liabilities", type: "liability", parentId: 8, balance: 0, isActive: true },
  { id: 10, code: "2110", name: "Accounts Payable", type: "liability", parentId: 9, balance: 65000, isActive: true },
  { id: 11, code: "2120", name: "Accrued Expenses", type: "liability", parentId: 9, balance: 12000, isActive: true },
  // Equity (3000)
  { id: 12, code: "3000", name: "Equity", type: "equity", parentId: null, balance: 250000, isActive: true },
  { id: 13, code: "3100", name: "Retained Earnings", type: "equity", parentId: 12, balance: 75000, isActive: true },
  // Revenue (4000)
  { id: 14, code: "4000", name: "Revenue", type: "revenue", parentId: null, balance: 0, isActive: true },
  { id: 15, code: "4100", name: "Construction Revenue", type: "revenue", parentId: 14, balance: 0, isActive: true },
  { id: 16, code: "4200", name: "Other Income", type: "revenue", parentId: 14, balance: 0, isActive: true },
  // Expense (5000-5999)
  { id: 17, code: "5000", name: "Expenses", type: "expense", parentId: null, balance: 0, isActive: true },
  { id: 18, code: "5100", name: "Cost of Materials", type: "expense", parentId: 17, balance: 0, isActive: true },
  { id: 19, code: "5200", name: "Labor Expense", type: "expense", parentId: 17, balance: 0, isActive: true },
  { id: 20, code: "5300", name: "Operating Expenses", type: "expense", parentId: 17, balance: 0, isActive: true },
];
