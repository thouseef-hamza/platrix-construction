import type { Invoice, InvoicePayment, InvoiceDocument } from "@/types/invoice";
import { api } from "./api";

const INVOICES_QUERY_KEY = "invoices";

// Backend: 0=Client, 1=Subcontractor
const INVOICE_TYPE_CLIENT = 0;
const INVOICE_TYPE_SUBCONTRACTOR = 1;
const BACKEND_TO_INVOICE_TYPE = { 0: "client" as const, 1: "subcontractor" as const };

// Backend: 0=Draft, 1=Posted
const STATUS_TO_BACKEND = { draft: 0, posted: 1 };
const BACKEND_TO_STATUS = { 0: "draft" as const, 1: "posted" as const };

// Backend: 0=Cash, 1=Bank
const PAYMENT_METHOD_TO_BACKEND = { cash: 0, bank: 1 };
const BACKEND_TO_PAYMENT_METHOD = { 0: "cash" as const, 1: "bank" as const };

// Payment status
const BACKEND_TO_PAYMENT_STATUS = {
  0: "not_completed" as const,
  1: "completed" as const,
  2: "partial" as const,
};

// Payment ledger: 0=Draft, 1=Posted
const PAYMENT_LEDGER_TO_BACKEND = { draft: 0, posted: 1 };
const BACKEND_TO_PAYMENT_LEDGER = { 0: "draft" as const, 1: "posted" as const };

export { INVOICES_QUERY_KEY };

export interface ApiInvoice {
  id: number;
  account: number;
  invoice_type: number;
  invoice_type_display?: string;
  party_id: number;
  party_name: string;
  project_id: number | null;
  project_name: string | null;
  reference: string;
  date: string;
  status: number;
  status_display?: string;
  payment_method: number;
  payment_method_display?: string;
  payment_status: number;
  payment_status_display?: string;
  amount: string;
  paid_amount: string;
  description: string;
  paid_at: string | null;
  payments?: ApiInvoicePayment[];
  created_at: string;
  updated_at: string;
}

export interface ApiInvoicePayment {
  id: number;
  date: string;
  amount: string;
  reference: string;
  status: number;
  status_display?: string;
  created_at: string;
}

function apiInvoiceToInvoice(api: ApiInvoice): Invoice {
  return {
    id: api.id,
    account: api.account,
    invoiceType: BACKEND_TO_INVOICE_TYPE[api.invoice_type as 0 | 1] ?? "client",
    invoiceTypeDisplay: api.invoice_type_display,
    partyId: api.party_id,
    partyName: api.party_name,
    projectId: api.project_id ?? undefined,
    projectName: api.project_name ?? undefined,
    reference: api.reference,
    date: api.date,
    status: BACKEND_TO_STATUS[api.status as 0 | 1] ?? "draft",
    statusDisplay: api.status_display,
    paymentMethod: BACKEND_TO_PAYMENT_METHOD[api.payment_method as 0 | 1] ?? "cash",
    paymentMethodDisplay: api.payment_method_display,
    paymentStatus: BACKEND_TO_PAYMENT_STATUS[api.payment_status as 0 | 1 | 2] ?? "not_completed",
    paymentStatusDisplay: api.payment_status_display,
    amount: parseFloat(api.amount) || 0,
    paidAmount: parseFloat(api.paid_amount) || 0,
    description: api.description,
    paidAt: api.paid_at,
    payments: api.payments?.map((p) => ({
      id: p.id,
      date: p.date,
      amount: parseFloat(p.amount) || 0,
      reference: p.reference,
      status: BACKEND_TO_PAYMENT_LEDGER[p.status as 0 | 1] ?? "draft",
      statusDisplay: p.status_display,
      createdAt: p.created_at,
    })),
    createdAt: api.created_at,
    updatedAt: api.updated_at,
  };
}

export async function fetchInvoices(invoiceType?: 0 | 1): Promise<Invoice[]> {
  const params: Record<string, string> = {};
  if (invoiceType !== undefined) params.invoice_type = String(invoiceType);
  const { data } = await api.get<ApiInvoice[]>("/invoices/", { params });
  return (data ?? []).map(apiInvoiceToInvoice);
}

export async function getInvoice(id: number): Promise<Invoice | null> {
  const { data } = await api.get<ApiInvoice>(`/invoices/${id}/`);
  return data ? apiInvoiceToInvoice(data) : null;
}

export interface CreateInvoicePayload {
  party: number;
  invoice_type: 0 | 1;
  project?: number | null;
  reference?: string;
  date: string;
  status: "draft" | "posted";
  payment_method: "cash" | "bank";
  amount: number;
  paid_amount?: number;
  description?: string;
}

export async function createInvoice(payload: CreateInvoicePayload): Promise<Invoice> {
  const body = {
    party: payload.party,
    invoice_type: payload.invoice_type,
    project: payload.project ?? null,
    reference: payload.reference ?? "",
    date: payload.date,
    status: STATUS_TO_BACKEND[payload.status],
    payment_method: PAYMENT_METHOD_TO_BACKEND[payload.payment_method],
    amount: String(payload.amount),
    description: payload.description ?? "",
  };
  if (payload.paid_amount != null && payload.paid_amount > 0) {
    (body as Record<string, unknown>).paid_amount = String(payload.paid_amount);
  }
  const { data } = await api.post<ApiInvoice>("/invoices/", body);
  return apiInvoiceToInvoice(data);
}

export interface UpdateInvoicePayload {
  reference?: string;
  date?: string;
  status?: "draft" | "posted";
  payment_method?: "cash" | "bank";
  amount?: number;
  paid_amount?: number;
  description?: string;
  project?: number | null;
}

export async function updateInvoice(id: number, payload: UpdateInvoicePayload): Promise<Invoice> {
  const body: Record<string, unknown> = {};
  if (payload.reference !== undefined) body.reference = payload.reference;
  if (payload.date !== undefined) body.date = payload.date;
  if (payload.status !== undefined) body.status = STATUS_TO_BACKEND[payload.status];
  if (payload.payment_method !== undefined) body.payment_method = PAYMENT_METHOD_TO_BACKEND[payload.payment_method];
  if (payload.amount !== undefined) body.amount = String(payload.amount);
  if (payload.paid_amount !== undefined) body.paid_amount = payload.paid_amount == null ? null : String(payload.paid_amount);
  if (payload.description !== undefined) body.description = payload.description;
  if (payload.project !== undefined) body.project = payload.project;
  const { data } = await api.patch<ApiInvoice>(`/invoices/${id}/`, body);
  return apiInvoiceToInvoice(data);
}

export async function deleteInvoice(id: number): Promise<void> {
  await api.delete(`/invoices/${id}/`);
}

// Payments
export async function addInvoicePayment(
  invoiceId: number,
  payload: { date: string; amount: number; reference?: string; status?: "draft" | "posted" }
): Promise<void> {
  const body: Record<string, unknown> = {
    date: payload.date,
    amount: String(payload.amount),
    reference: payload.reference ?? "",
  };
  if (payload.status !== undefined) body.status = PAYMENT_LEDGER_TO_BACKEND[payload.status];
  await api.post(`/invoices/${invoiceId}/payments/`, body);
}

export async function patchInvoicePayment(
  invoiceId: number,
  paymentId: number,
  payload: { status?: "draft" | "posted"; date?: string; amount?: number; reference?: string }
): Promise<void> {
  const body: Record<string, unknown> = {};
  if (payload.status !== undefined) body.status = PAYMENT_LEDGER_TO_BACKEND[payload.status];
  if (payload.date !== undefined) body.date = payload.date;
  if (payload.amount !== undefined) body.amount = String(payload.amount);
  if (payload.reference !== undefined) body.reference = payload.reference ?? "";
  await api.patch(`/invoices/${invoiceId}/payments/${paymentId}/`, body);
}

export async function deleteInvoicePayment(invoiceId: number, paymentId: number): Promise<void> {
  await api.delete(`/invoices/${invoiceId}/payments/${paymentId}/`);
}

// Documents
export async function fetchInvoiceDocuments(invoiceId: number): Promise<InvoiceDocument[]> {
  const { data } = await api.get<InvoiceDocument[]>(`/invoices/${invoiceId}/documents/`);
  return data ?? [];
}

export async function uploadInvoiceDocument(
  invoiceId: number,
  file: File,
  options?: { name?: string; description?: string }
): Promise<InvoiceDocument> {
  const form = new FormData();
  form.append("file", file);
  if (options?.name) form.append("name", options.name);
  if (options?.description) form.append("description", options.description ?? "");
  const { data } = await api.post<InvoiceDocument>(`/invoices/${invoiceId}/documents/`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data!;
}

export async function downloadInvoiceDocument(
  invoiceId: number,
  documentId: number,
  filename: string
): Promise<Blob> {
  const { data } = await api.get<Blob>(`/invoices/${invoiceId}/documents/${documentId}/download/`, {
    responseType: "blob",
  });
  return data!;
}

export async function deleteInvoiceDocument(invoiceId: number, documentId: number): Promise<void> {
  await api.delete(`/invoices/${invoiceId}/documents/${documentId}/`);
}
