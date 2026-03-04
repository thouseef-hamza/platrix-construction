/**
 * Mock report data derived from accounts, journal entries, expenses, purchases.
 * In production, this would be computed from the database.
 */

export interface ProjectPnLRow {
  projectId: string;
  projectName: string;
  revenue: number;
  expenses: number;
  profit: number;
}

export interface OverallPnLRow {
  category: string;
  amount: number;
}

export interface BalanceSheetSection {
  title: string;
  items: { code: string; name: string; amount: number }[];
  total: number;
}

// Project P&L: revenue and expenses by project (simulated from purchases/expenses)
export const MOCK_PROJECT_PNL: ProjectPnLRow[] = [
  { projectId: "1", projectName: "Downtown Office Tower", revenue: 185000, expenses: 124500, profit: 60500 },
  { projectId: "2", projectName: "Harbor Bridge Repairs", revenue: 92000, expenses: 78000, profit: 14000 },
  { projectId: "3", projectName: "Lakeside Residences Phase 2", revenue: 45000, expenses: 38200, profit: 6800 },
];

// Overall P&L structure
export const MOCK_OVERALL_PNL_REVENUE: OverallPnLRow[] = [
  { category: "Construction Revenue", amount: 322000 },
  { category: "Other Income", amount: 8500 },
];

export const MOCK_OVERALL_PNL_EXPENSES: OverallPnLRow[] = [
  { category: "Cost of Materials", amount: 240700 },
  { category: "Labor Expense", amount: 185000 },
  { category: "Operating Expenses", amount: 28420 },
];

// Balance Sheet (as of date)
export const MOCK_BALANCE_SHEET_ASSETS: BalanceSheetSection["items"] = [
  { code: "1110", name: "Cash and Bank", amount: 116680 },
  { code: "1120", name: "Accounts Receivable", amount: 130000 },
  { code: "1130", name: "Inventory", amount: 57000 },
  { code: "1210", name: "Equipment", amount: 172000 },
];

export const MOCK_BALANCE_SHEET_LIABILITIES: BalanceSheetSection["items"] = [
  { code: "2110", name: "Accounts Payable", amount: 80000 },
  { code: "2120", name: "Accrued Expenses", amount: 15000 },
];

export const MOCK_BALANCE_SHEET_EQUITY: BalanceSheetSection["items"] = [
  { code: "3000", name: "Equity", amount: 250000 },
  { code: "3100", name: "Retained Earnings", amount: 91680 },
];
