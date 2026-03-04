export interface DocumentAttachment {
  name: string;
}

export interface ProjectRef {
  id: string;
  name: string;
}

export interface EmployeeRef {
  id: string;
  name: string;
}

export type ExpenseCategory =
  | "project"
  | "general"
  | "outsourced_labor"
  | "employee_paid";

export type LaborType = "hourly" | "daily";

export type ExpenseStatus = "draft" | "posted";

/** Ledger status for a single payment: draft (no ledger) or posted. */
export type PaymentLedgerStatus = "draft" | "posted";

export interface Expense {
  id: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  date: string;
  attachments?: DocumentAttachment[];
  /** For project-level and employee-paid expenses */
  project?: ProjectRef | null;
  /** For outsourced labor: hourly or daily */
  laborType?: LaborType;
  quantity?: number; // hours or days
  rate?: number; // per hour or per day
  /** For employee-paid expenses */
  employeeRef?: EmployeeRef | null;
  /** Payment method: cash or bank */
  paymentMethod?: "cash" | "bank";
  /** Amount paid against this expense */
  paidAmount?: number;
  /** draft or posted; optional for backward compatibility */
  status?: ExpenseStatus;
  /** List of payment transactions against this expense. */
  payments?: {
    id: string;
    date: string;
    amount: number;
    reference?: string;
    status?: PaymentLedgerStatus;
  }[];
}
