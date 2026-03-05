import type {
  Employee,
  EmployeeSalaryEntry,
  EmployeeTransaction,
  Gender,
  MaritalStatus,
  SponsorshipType,
  EmploymentType,
  EmploymentStatus,
} from "@/types/employee";
import { api } from "./api";

/** Backend employee (snake_case) */
export interface ApiEmployee {
  id: number;
  account?: number;
  full_name: string;
  nationality: string;
  gender: string;
  date_of_birth: string | null;
  marital_status: string;
  qid_number: string;
  qid_expiry_date: string | null;
  passport_number: string;
  passport_expiry_date: string | null;
  visa_number: string;
  visa_expiry_date: string | null;
  sponsorship_type: number | null;
  employee_id: string;
  joining_date: string | null;
  employment_type: number | null;
  job_title: string;
  department: string;
  employment_status: number | null;
  basic_salary: string | null;
  housing_allowance: string | null;
  transportation_allowance: string | null;
  other_allowances: string | null;
  bank_name: string;
  iban: string;
  health_card_number: string;
  health_insurance_policy: string;
  insurance_expiry: string | null;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  created_at?: string;
  updated_at?: string;
  salary_entries?: ApiSalaryEntry[];
  transactions?: ApiTransaction[];
}

export interface ApiSalaryEntry {
  id: number;
  date: string;
  amount: string;
  description: string;
  payment_method?: number;
  payment_method_display?: string;
  status?: number;
  status_display?: string;
  created_at: string;
}

export interface ApiTransaction {
  id: number;
  date: string;
  amount: string;
  description: string;
  transaction_type: string;
  reference: string;
  created_at: string;
}

function parseNum(s: string | null | undefined): number | undefined {
  if (s == null || s === "") return undefined;
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : undefined;
}

function apiToEmployee(api: ApiEmployee): Employee {
  return {
    id: String(api.id),
    fullName: api.full_name || "",
    nationality: api.nationality || undefined,
    gender: (api.gender as Gender) || undefined,
    dateOfBirth: api.date_of_birth || undefined,
    maritalStatus: (api.marital_status as MaritalStatus) || undefined,
    qidNumber: api.qid_number || undefined,
    qidExpiryDate: api.qid_expiry_date || undefined,
    passportNumber: api.passport_number || undefined,
    passportExpiryDate: api.passport_expiry_date || undefined,
    visaNumber: api.visa_number || undefined,
    visaExpiryDate: api.visa_expiry_date || undefined,
    sponsorshipType: api.sponsorship_type != null ? (api.sponsorship_type as SponsorshipType) : undefined,
    employeeId: api.employee_id || undefined,
    joiningDate: api.joining_date || undefined,
    employmentType: api.employment_type != null ? (api.employment_type as EmploymentType) : undefined,
    jobTitle: api.job_title || undefined,
    department: api.department || undefined,
    employmentStatus: api.employment_status != null ? (api.employment_status as EmploymentStatus) : undefined,
    basicSalary: parseNum(api.basic_salary),
    housingAllowance: parseNum(api.housing_allowance),
    transportationAllowance: parseNum(api.transportation_allowance),
    otherAllowances: parseNum(api.other_allowances),
    bankName: api.bank_name || undefined,
    iban: api.iban || undefined,
    healthCardNumber: api.health_card_number || undefined,
    healthInsurancePolicy: api.health_insurance_policy || undefined,
    insuranceExpiry: api.insurance_expiry || undefined,
    emergencyContactName: api.emergency_contact_name || undefined,
    emergencyContactPhone: api.emergency_contact_phone || undefined,
    salaryEntries: api.salary_entries?.map(se => ({
      id: se.id,
      date: se.date,
      amount: parseFloat(se.amount) || 0,
      description: se.description || "",
      paymentMethod: (se.payment_method ?? 0) === 0 ? "cash" : "bank",
      paymentMethodDisplay: se.payment_method_display,
      status: (se.status ?? 0) === 1 ? "posted" : "draft",
      statusDisplay: se.status_display,
      createdAt: se.created_at,
    })),
    transactions: api.transactions?.map(t => ({
      id: t.id,
      date: t.date,
      amount: parseFloat(t.amount) || 0,
      description: t.description || "",
      transactionType: t.transaction_type || "",
      reference: t.reference || "",
      createdAt: t.created_at,
    })),
  };
}

export async function fetchEmployees(): Promise<Employee[]> {
  const { data } = await api.get<ApiEmployee[]>("/employees/");
  return (data ?? []).map(apiToEmployee);
}

export async function getEmployee(id: number): Promise<Employee | null> {
  try {
    const { data } = await api.get<ApiEmployee>(`/employees/${id}/`);
    return apiToEmployee(data);
  } catch {
    return null;
  }
}

export interface CreateEmployeePayload {
  full_name: string;
  nationality?: string;
  gender?: string;
  date_of_birth?: string | null;
  marital_status?: string | null;
}

export async function createEmployee(payload: CreateEmployeePayload): Promise<Employee> {
  const body: Record<string, unknown> = {
    full_name: payload.full_name.trim(),
    nationality: payload.nationality?.trim() ?? "",
    gender: payload.gender ?? "",
    date_of_birth: payload.date_of_birth || null,
    marital_status: payload.marital_status || null,
  };
  const { data } = await api.post<ApiEmployee>("/employees/", body);
  return apiToEmployee(data);
}

export interface UpdateEmployeePayload {
  full_name?: string;
  nationality?: string;
  gender?: string;
  date_of_birth?: string | null;
  marital_status?: string | null;
  qid_number?: string;
  qid_expiry_date?: string | null;
  passport_number?: string;
  passport_expiry_date?: string | null;
  visa_number?: string;
  visa_expiry_date?: string | null;
  sponsorship_type?: number | null;
  employee_id?: string;
  joining_date?: string | null;
  employment_type?: number | null;
  job_title?: string;
  department?: string;
  employment_status?: number | null;
  basic_salary?: number | null;
  housing_allowance?: number | null;
  transportation_allowance?: number | null;
  other_allowances?: number | null;
  bank_name?: string;
  iban?: string;
  health_card_number?: string;
  health_insurance_policy?: string;
  insurance_expiry?: string | null;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
}

function employeeToApiPayload(updates: Partial<Employee>): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  if (updates.fullName !== undefined) body.full_name = updates.fullName;
  if (updates.nationality !== undefined) body.nationality = updates.nationality ?? "";
  if (updates.gender !== undefined) body.gender = updates.gender ?? "";
  if (updates.dateOfBirth !== undefined) body.date_of_birth = updates.dateOfBirth ?? null;
  if (updates.maritalStatus !== undefined) body.marital_status = updates.maritalStatus ?? null;
  if (updates.qidNumber !== undefined) body.qid_number = updates.qidNumber ?? "";
  if (updates.qidExpiryDate !== undefined) body.qid_expiry_date = updates.qidExpiryDate ?? null;
  if (updates.passportNumber !== undefined) body.passport_number = updates.passportNumber ?? "";
  if (updates.passportExpiryDate !== undefined) body.passport_expiry_date = updates.passportExpiryDate ?? null;
  if (updates.visaNumber !== undefined) body.visa_number = updates.visaNumber ?? "";
  if (updates.visaExpiryDate !== undefined) body.visa_expiry_date = updates.visaExpiryDate ?? null;
  if (updates.sponsorshipType !== undefined) body.sponsorship_type = updates.sponsorshipType ?? null;
  if (updates.employeeId !== undefined) body.employee_id = updates.employeeId ?? "";
  if (updates.joiningDate !== undefined) body.joining_date = updates.joiningDate ?? null;
  if (updates.employmentType !== undefined) body.employment_type = updates.employmentType ?? null;
  if (updates.jobTitle !== undefined) body.job_title = updates.jobTitle ?? "";
  if (updates.department !== undefined) body.department = updates.department ?? "";
  if (updates.employmentStatus !== undefined) body.employment_status = updates.employmentStatus ?? null;
  if (updates.basicSalary !== undefined) body.basic_salary = updates.basicSalary == null ? null : String(updates.basicSalary);
  if (updates.housingAllowance !== undefined) body.housing_allowance = updates.housingAllowance == null ? null : String(updates.housingAllowance);
  if (updates.transportationAllowance !== undefined) body.transportation_allowance = updates.transportationAllowance == null ? null : String(updates.transportationAllowance);
  if (updates.otherAllowances !== undefined) body.other_allowances = updates.otherAllowances == null ? null : String(updates.otherAllowances);
  if (updates.bankName !== undefined) body.bank_name = updates.bankName ?? "";
  if (updates.iban !== undefined) body.iban = updates.iban ?? "";
  if (updates.healthCardNumber !== undefined) body.health_card_number = updates.healthCardNumber ?? "";
  if (updates.healthInsurancePolicy !== undefined) body.health_insurance_policy = updates.healthInsurancePolicy ?? "";
  if (updates.insuranceExpiry !== undefined) body.insurance_expiry = updates.insuranceExpiry ?? null;
  if (updates.emergencyContactName !== undefined) body.emergency_contact_name = updates.emergencyContactName ?? "";
  if (updates.emergencyContactPhone !== undefined) body.emergency_contact_phone = updates.emergencyContactPhone ?? "";
  return body;
}

export async function updateEmployee(id: number, payload: Partial<Employee>): Promise<Employee> {
  const body = employeeToApiPayload(payload);
  const { data } = await api.patch<ApiEmployee>(`/employees/${id}/`, body);
  return apiToEmployee(data);
}

const PAYMENT_METHOD_TO_BACKEND: Record<"cash" | "bank", number> = {
  cash: 0,
  bank: 1,
};

export interface AddSalaryPayload {
  date: string;
  amount: number;
  description?: string;
  payment_method?: "cash" | "bank";
  status?: "draft" | "posted";
}

export async function addEmployeeSalary(employeeId: number, payload: AddSalaryPayload): Promise<EmployeeSalaryEntry> {
  const { data } = await api.post<ApiSalaryEntry>(`/employees/${employeeId}/salaries/`, {
    date: payload.date,
    amount: String(payload.amount),
    description: payload.description?.trim() ?? "",
    payment_method: PAYMENT_METHOD_TO_BACKEND[payload.payment_method ?? "bank"],
    status: payload.status === "posted" ? 1 : 0,
  });
  return {
    id: data.id,
    date: data.date,
    amount: parseFloat(data.amount) || 0,
    description: data.description || "",
    paymentMethod: (data.payment_method ?? 0) === 0 ? "cash" : "bank",
    paymentMethodDisplay: data.payment_method_display,
    status: (data.status ?? 0) === 1 ? "posted" : "draft",
    statusDisplay: data.status_display,
    createdAt: data.created_at,
  };
}

export interface UpdateSalaryPayload {
  date?: string;
  amount?: number;
  description?: string;
  payment_method?: "cash" | "bank";
  status?: "draft" | "posted";
}

export async function updateEmployeeSalary(
  employeeId: number,
  entryId: number,
  payload: UpdateSalaryPayload
): Promise<EmployeeSalaryEntry> {
  const body: Record<string, unknown> = {};
  if (payload.date !== undefined) body.date = payload.date;
  if (payload.amount !== undefined) body.amount = String(payload.amount);
  if (payload.description !== undefined) body.description = payload.description?.trim() ?? "";
  if (payload.payment_method !== undefined)
    body.payment_method = PAYMENT_METHOD_TO_BACKEND[payload.payment_method];
  if (payload.status !== undefined) body.status = payload.status === "posted" ? 1 : 0;
  const { data } = await api.patch<ApiSalaryEntry>(
    `/employees/${employeeId}/salaries/${entryId}/`,
    body
  );
  return {
    id: data.id,
    date: data.date,
    amount: parseFloat(data.amount) || 0,
    description: data.description || "",
    paymentMethod: (data.payment_method ?? 0) === 0 ? "cash" : "bank",
    paymentMethodDisplay: data.payment_method_display,
    status: (data.status ?? 0) === 1 ? "posted" : "draft",
    statusDisplay: data.status_display,
    createdAt: data.created_at,
  };
}

export async function deleteEmployeeSalary(
  employeeId: number,
  entryId: number
): Promise<void> {
  await api.delete(`/employees/${employeeId}/salaries/${entryId}/`);
}

export async function fetchEmployeeSalaries(employeeId: number): Promise<EmployeeSalaryEntry[]> {
  const { data } = await api.get<ApiSalaryEntry[]>(`/employees/${employeeId}/salaries/`);
  return (data ?? []).map(se => ({
    id: se.id,
    date: se.date,
    amount: parseFloat(se.amount) || 0,
    description: se.description || "",
    paymentMethod: (se.payment_method ?? 0) === 0 ? "cash" : "bank",
    paymentMethodDisplay: se.payment_method_display,
    status: (se.status ?? 0) === 1 ? "posted" : "draft",
    statusDisplay: se.status_display,
    createdAt: se.created_at,
  }));
}

export interface AddTransactionPayload {
  date: string;
  amount: number;
  description?: string;
  transaction_type?: string;
  reference?: string;
}

export async function addEmployeeTransaction(employeeId: number, payload: AddTransactionPayload): Promise<EmployeeTransaction> {
  const { data } = await api.post<ApiTransaction>(`/employees/${employeeId}/transactions/`, {
    date: payload.date,
    amount: String(payload.amount),
    description: payload.description?.trim() ?? "",
    transaction_type: payload.transaction_type?.trim() ?? "",
    reference: payload.reference?.trim() ?? "",
  });
  return {
    id: data.id,
    date: data.date,
    amount: parseFloat(data.amount) || 0,
    description: data.description || "",
    transactionType: data.transaction_type || "",
    reference: data.reference || "",
    createdAt: data.created_at,
  };
}

export async function fetchEmployeeTransactions(employeeId: number): Promise<EmployeeTransaction[]> {
  const { data } = await api.get<ApiTransaction[]>(`/employees/${employeeId}/transactions/`);
  return (data ?? []).map(t => ({
    id: t.id,
    date: t.date,
    amount: parseFloat(t.amount) || 0,
    description: t.description || "",
    transactionType: t.transaction_type || "",
    reference: t.reference || "",
    createdAt: t.created_at,
  }));
}

// --- Employee documents (list, upload, download, delete) ---

export interface EmployeeDocument {
  id: number;
  name: string;
  filename: string;
  file_url: string | null;
  size: number | null;
  description: string;
  created_at: string;
}

export async function fetchEmployeeDocuments(
  employeeId: number
): Promise<EmployeeDocument[]> {
  const { data } = await api.get<EmployeeDocument[]>(
    `/employees/${employeeId}/documents/`
  );
  return data ?? [];
}

export async function uploadEmployeeDocument(
  employeeId: number,
  file: File,
  options?: { name?: string; description?: string }
): Promise<EmployeeDocument> {
  const form = new FormData();
  form.append("file", file);
  if (options?.name) form.append("name", options.name);
  if (options?.description) form.append("description", options.description ?? "");
  const { data } = await api.post<EmployeeDocument>(
    `/employees/${employeeId}/documents/`,
    form,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return data;
}

export async function deleteEmployeeDocument(
  employeeId: number,
  documentId: number
): Promise<void> {
  await api.delete(`/employees/${employeeId}/documents/${documentId}/`);
}

export async function downloadEmployeeDocument(
  employeeId: number,
  documentId: number,
  filename: string
): Promise<void> {
  const { data } = await api.get<Blob>(
    `/employees/${employeeId}/documents/${documentId}/download/`,
    { responseType: "blob" }
  );
  const url = URL.createObjectURL(data);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || "document";
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
