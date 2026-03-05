import { api } from "./api";

export interface ProjectPnLRow {
  project_id: number;
  project_name: string;
  project_code: string;
  income: number;
  expense: number;
  profit: number;
}

export interface ProjectPnLResponse {
  projects: ProjectPnLRow[];
}

export async function fetchProjectPnL(params?: {
  date_from?: string;
  date_to?: string;
}): Promise<ProjectPnLResponse> {
  const { data } = await api.get<ProjectPnLResponse>("/reports/project-pnl/", {
    params: params ?? {},
  });
  return data ?? { projects: [] };
}

export interface PnLLineItem {
  code: string;
  name: string;
  amount: number;
}

export interface OverallPnLResponse {
  revenue: PnLLineItem[];
  total_revenue: number;
  expenses: PnLLineItem[];
  total_expenses: number;
  net_profit: number;
}

export async function fetchOverallPnL(params?: {
  date_from?: string;
  date_to?: string;
}): Promise<OverallPnLResponse> {
  const { data } = await api.get<OverallPnLResponse>("/reports/overall-pnl/", {
    params: params ?? {},
  });
  return (
    data ?? {
      revenue: [],
      total_revenue: 0,
      expenses: [],
      total_expenses: 0,
      net_profit: 0,
    }
  );
}

export interface BalanceSheetLineItem {
  code: string;
  name: string;
  amount: number;
}

export interface BalanceSheetResponse {
  as_of: string;
  assets: BalanceSheetLineItem[];
  total_assets: number;
  liabilities: BalanceSheetLineItem[];
  total_liabilities: number;
  equity: BalanceSheetLineItem[];
  total_equity: number;
  total_liabilities_and_equity: number;
}

export async function fetchBalanceSheet(params?: {
  as_of?: string;
}): Promise<BalanceSheetResponse> {
  const { data } = await api.get<BalanceSheetResponse>(
    "/reports/balance-sheet/",
    { params: params ?? {} }
  );
  return (
    data ?? {
      as_of: new Date().toISOString().slice(0, 10),
      assets: [],
      total_assets: 0,
      liabilities: [],
      total_liabilities: 0,
      equity: [],
      total_equity: 0,
      total_liabilities_and_equity: 0,
    }
  );
}
