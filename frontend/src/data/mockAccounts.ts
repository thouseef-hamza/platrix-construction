import type { Account } from "@/types/chartOfAccounts";

export const MOCK_ACCOUNTS: Account[] = [
  // Assets (1000-1999)
  { id: "a1", code: "1000", name: "Assets", type: "asset", parentId: null, balance: 0, isActive: true },
  { id: "a2", code: "1100", name: "Current Assets", type: "asset", parentId: "a1", balance: 0, isActive: true },
  { id: "a3", code: "1110", name: "Cash and Bank", type: "asset", parentId: "a2", balance: 125000, isActive: true },
  { id: "a4", code: "1120", name: "Accounts Receivable", type: "asset", parentId: "a2", balance: 85000, isActive: true },
  { id: "a5", code: "1130", name: "Inventory", type: "asset", parentId: "a2", balance: 42000, isActive: true },
  { id: "a6", code: "1200", name: "Fixed Assets", type: "asset", parentId: "a1", balance: 0, isActive: true },
  { id: "a7", code: "1210", name: "Equipment", type: "asset", parentId: "a6", balance: 180000, isActive: true },
  // Liabilities (2000-2999)
  { id: "a8", code: "2000", name: "Liabilities", type: "liability", parentId: null, balance: 0, isActive: true },
  { id: "a9", code: "2100", name: "Current Liabilities", type: "liability", parentId: "a8", balance: 0, isActive: true },
  { id: "a10", code: "2110", name: "Accounts Payable", type: "liability", parentId: "a9", balance: 65000, isActive: true },
  { id: "a11", code: "2120", name: "Accrued Expenses", type: "liability", parentId: "a9", balance: 12000, isActive: true },
  // Equity (3000)
  { id: "a12", code: "3000", name: "Equity", type: "equity", parentId: null, balance: 250000, isActive: true },
  { id: "a13", code: "3100", name: "Retained Earnings", type: "equity", parentId: "a12", balance: 75000, isActive: true },
  // Revenue (4000)
  { id: "a14", code: "4000", name: "Revenue", type: "revenue", parentId: null, balance: 0, isActive: true },
  { id: "a15", code: "4100", name: "Construction Revenue", type: "revenue", parentId: "a14", balance: 0, isActive: true },
  { id: "a16", code: "4200", name: "Other Income", type: "revenue", parentId: "a14", balance: 0, isActive: true },
  // Expense (5000-5999)
  { id: "a17", code: "5000", name: "Expenses", type: "expense", parentId: null, balance: 0, isActive: true },
  { id: "a18", code: "5100", name: "Cost of Materials", type: "expense", parentId: "a17", balance: 0, isActive: true },
  { id: "a19", code: "5200", name: "Labor Expense", type: "expense", parentId: "a17", balance: 0, isActive: true },
  { id: "a20", code: "5300", name: "Operating Expenses", type: "expense", parentId: "a17", balance: 0, isActive: true },
];
