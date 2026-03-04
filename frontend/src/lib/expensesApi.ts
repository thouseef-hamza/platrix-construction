import type {
  Expense,
  ExpenseCategory,
  ExpenseStatus,
  LaborType,
  ProjectRef,
  EmployeeRef,
} from "@/types/expense";
import { api } from "./api";

// Backend: 0=General, 1=Project, 2=Outsourced labor, 3=Employee-paid
const CATEGORY_TO_BACKEND: Record<ExpenseCategory, number> = {
  general: 0,
  project: 1,
  outsourced_labor: 2,
  employee_paid: 3,
};
const BACKEND_TO_CATEGORY: Record<number, ExpenseCategory> = {
  0: "general",
  1: "project",
  2: "outsourced_labor",
  3: "employee_paid",
};

// Backend: 0=Draft, 1=Posted
const STATUS_TO_BACKEND: Record<ExpenseStatus, number> = {
  draft: 0,
  posted: 1,
};
const BACKEND_TO_STATUS: Record<number, ExpenseStatus> = {
  0: "draft",
  1: "posted",
};

// Backend: 0=Hourly, 1=Daily
const LABOR_TYPE_TO_BACKEND: Record<LaborType, number> = {
  hourly: 0,
  daily: 1,
};
const BACKEND_TO_LABOR_TYPE: Record<number, LaborType> = {
  0: "hourly",
  1: "daily",
};

// Backend: 0=Cash, 1=Bank
const PAYMENT_METHOD_TO_BACKEND: Record<"cash" | "bank", number> = {
  cash: 0,
  bank: 1,
};
const BACKEND_TO_PAYMENT_METHOD: Record<number, "cash" | "bank"> = {
  0: "cash",
  1: "bank",
};

export interface ApiExpensePayment {
  id: number;
  date: string;
  amount: string;
  reference: string;
  status: number;
  status_display?: string;
  created_at: string;
}

// Backend: 0=Draft, 1=Posted (payment ledger status)
const PAYMENT_LEDGER_TO_BACKEND: Record<"draft" | "posted", number> = {
  draft: 0,
  posted: 1,
};
const BACKEND_TO_PAYMENT_LEDGER: Record<number, "draft" | "posted"> = {
  0: "draft",
  1: "posted",
};

export interface ApiExpense {
  id: number;
  account: number;
  category: number;
  category_display?: string;
  description: string;
  payee_id: number | null;
  payee_name: string | null;
  project_id: number | null;
  project_name: string | null;
  reference: string;
  date: string;
  status: number;
  status_display?: string;
  labor_type: number | null;
  labor_type_display?: string | null;
  quantity: string | null;
  rate: string | null;
  employee_id: string;
  employee_name: string;
  payment_method: number;
  payment_method_display?: string;
  payment_status: number;
  payment_status_display?: string;
  amount: string;
  paid_amount: string;
  paid_at: string | null;
  payments?: ApiExpensePayment[];
  created_at: string;
  updated_at: string;
}

function apiExpenseToExpense(api: ApiExpense): Expense {
  const project: ProjectRef | undefined =
    api.project_id != null && api.project_name != null
      ? { id: String(api.project_id), name: api.project_name }
      : undefined;
  const employeeRef: EmployeeRef | undefined =
    api.employee_id || api.employee_name
      ? { id: api.employee_id, name: api.employee_name }
      : undefined;
  const payments =
    api.payments?.map((p) => ({
      id: String(p.id),
      date: p.date,
      amount: parseFloat(p.amount) || 0,
      reference: p.reference || undefined,
      status: BACKEND_TO_PAYMENT_LEDGER[p.status] ?? "draft",
    })) ?? undefined;
  return {
    id: String(api.id),
    category: BACKEND_TO_CATEGORY[api.category] ?? "general",
    description: api.description || "",
    amount: parseFloat(api.amount) || 0,
    date: api.date,
    project: project ?? null,
    laborType:
      api.labor_type != null ? BACKEND_TO_LABOR_TYPE[api.labor_type] ?? undefined : undefined,
    quantity: api.quantity != null ? parseFloat(api.quantity) || undefined : undefined,
    rate: api.rate != null ? parseFloat(api.rate) || undefined : undefined,
    employeeRef: employeeRef ?? null,
    paymentMethod: BACKEND_TO_PAYMENT_METHOD[api.payment_method] ?? "cash",
    paidAmount: parseFloat(api.paid_amount) || undefined,
    status: BACKEND_TO_STATUS[api.status] ?? "draft",
    payments,
  };
}

export async function fetchExpenses(): Promise<Expense[]> {
  const { data } = await api.get<ApiExpense[]>("/expenses/");
  return (data ?? []).map(apiExpenseToExpense);
}

export async function getExpense(id: number): Promise<Expense | null> {
  try {
    const { data } = await api.get<ApiExpense>(`/expenses/${id}/`);
    return apiExpenseToExpense(data);
  } catch {
    return null;
  }
}

export interface CreateExpensePayload {
  category: ExpenseCategory;
  description: string;
  amount: number;
  date: string;
  project?: number | null;
  labor_type?: number | null;
  quantity?: number | null;
  rate?: number | null;
  employee_id?: string;
  employee_name?: string;
  payment_method: number;
  paid_amount?: number;
  status: number;
  reference?: string;
}

export async function createExpense(payload: CreateExpensePayload): Promise<Expense> {
  const body: Record<string, unknown> = {
    category: CATEGORY_TO_BACKEND[payload.category] ?? 0,
    description: payload.description.trim() || "—",
    amount: String(payload.amount),
    date: payload.date,
    project: payload.project ?? null,
    payment_method: payload.payment_method,
    status: payload.status,
  };
  if (payload.reference != null) body.reference = payload.reference;
  if (payload.labor_type != null) body.labor_type = payload.labor_type;
  if (payload.quantity != null) body.quantity = String(payload.quantity);
  if (payload.rate != null) body.rate = String(payload.rate);
  if (payload.employee_id != null) body.employee_id = payload.employee_id;
  if (payload.employee_name != null) body.employee_name = payload.employee_name;
  if (payload.paid_amount != null && payload.paid_amount > 0) {
    body.paid_amount = String(payload.paid_amount);
  }
  const { data } = await api.post<ApiExpense>("/expenses/", body);
  return apiExpenseToExpense(data);
}

export interface UpdateExpensePayload {
  status?: ExpenseStatus;
  reference?: string;
  date?: string;
  category?: ExpenseCategory;
  description?: string;
  amount?: number;
  labor_type?: number | null;
  quantity?: number | null;
  rate?: number | null;
  employee_id?: string;
  employee_name?: string;
  payment_method?: "cash" | "bank";
  project?: number | null;
}

export async function updateExpense(
  id: number,
  payload: UpdateExpensePayload
): Promise<Expense> {
  const body: Record<string, unknown> = {};
  if (payload.status !== undefined) body.status = STATUS_TO_BACKEND[payload.status];
  if (payload.reference !== undefined) body.reference = payload.reference;
  if (payload.date !== undefined) body.date = payload.date;
  if (payload.category !== undefined) body.category = CATEGORY_TO_BACKEND[payload.category];
  if (payload.description !== undefined) body.description = payload.description;
  if (payload.amount !== undefined) body.amount = String(payload.amount);
  if (payload.labor_type !== undefined) body.labor_type = payload.labor_type;
  if (payload.quantity !== undefined) body.quantity = payload.quantity == null ? null : String(payload.quantity);
  if (payload.rate !== undefined) body.rate = payload.rate == null ? null : String(payload.rate);
  if (payload.employee_id !== undefined) body.employee_id = payload.employee_id;
  if (payload.employee_name !== undefined) body.employee_name = payload.employee_name;
  if (payload.payment_method !== undefined) body.payment_method = PAYMENT_METHOD_TO_BACKEND[payload.payment_method];
  if (payload.project !== undefined) body.project = payload.project;
  const { data } = await api.patch<ApiExpense>(`/expenses/${id}/`, body);
  return apiExpenseToExpense(data);
}

export interface AddExpensePaymentPayload {
  date: string;
  amount: number;
  reference?: string;
  status?: "draft" | "posted";
}

export async function addExpensePayment(
  expenseId: number,
  payload: AddExpensePaymentPayload
): Promise<void> {
  const body: Record<string, unknown> = {
    date: payload.date,
    amount: String(payload.amount),
    reference: payload.reference?.trim() ?? "",
  };
  if (payload.status !== undefined)
    body.status = PAYMENT_LEDGER_TO_BACKEND[payload.status];
  await api.post(`/expenses/${expenseId}/payments/`, body);
}

export async function patchExpensePayment(
  expenseId: number,
  paymentId: number,
  payload: { status?: "draft" | "posted" }
): Promise<void> {
  const body: Record<string, unknown> = {};
  if (payload.status !== undefined)
    body.status = PAYMENT_LEDGER_TO_BACKEND[payload.status];
  await api.patch(`/expenses/${expenseId}/payments/${paymentId}/`, body);
}
