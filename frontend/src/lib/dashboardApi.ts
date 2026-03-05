import { api } from "./api";
import { formatCurrency } from "@/utils/format";

export interface DashboardMetrics {
  active_projects: number;
  expenses_mtd: number;
  invoices_mtd: number;
  employees_count: number;
}

export interface DashboardCashFlow {
  months: string[];
  invoices: number[];
  expenses: number[];
}

export interface DashboardRecentProject {
  id: number;
  name: string;
  client_name: string;
  status: string;
}

export interface DashboardResponse {
  metrics: DashboardMetrics;
  cash_flow: DashboardCashFlow;
  recent_projects: DashboardRecentProject[];
}

export async function fetchDashboard(): Promise<DashboardResponse> {
  const { data } = await api.get<DashboardResponse>("/dashboard/");
  return (
    data ?? {
      metrics: {
        active_projects: 0,
        expenses_mtd: 0,
        invoices_mtd: 0,
        employees_count: 0,
      },
      cash_flow: {
        months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        invoices: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        expenses: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      },
      recent_projects: [],
    }
  );
}

/** Format large numbers for display (e.g. 420000 -> "QAR 420K") */
export function formatMetricCurrency(value: number): string {
  if (value >= 1_000_000) {
    return `QAR ${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `QAR ${(value / 1_000).toFixed(0)}K`;
  }
  return formatCurrency(value);
}
