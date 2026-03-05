import type {
  Purchase,
  PurchaseLineItem,
  PurchasePaymentStatus,
  PurchaseStatus,
  PurchasePaymentMethod,
  ProjectRef,
  SupplierRef,
} from "@/types/purchase";
import { api } from "./api";

// Backend: 0=Draft, 1=Posted
const STATUS_TO_BACKEND: Record<PurchaseStatus, number> = {
  draft: 0,
  posted: 1,
};
const BACKEND_TO_STATUS: Record<number, PurchaseStatus> = {
  0: "draft",
  1: "posted",
};

// Backend: 0=Cash, 1=Bank
const PAYMENT_METHOD_TO_BACKEND: Record<PurchasePaymentMethod, number> = {
  cash: 0,
  bank: 1,
};
const BACKEND_TO_PAYMENT_METHOD: Record<number, PurchasePaymentMethod> = {
  0: "cash",
  1: "bank",
};

// Backend: 0=Not completed, 1=Completed, 2=Partial
const PAYMENT_STATUS_TO_BACKEND: Record<PurchasePaymentStatus, number> = {
  not_completed: 0,
  completed: 1,
  partial: 2,
};
const BACKEND_TO_PAYMENT_STATUS: Record<number, PurchasePaymentStatus> = {
  0: "not_completed",
  1: "completed",
  2: "partial",
};

export interface ApiPurchaseLineItem {
  id: number;
  material_id: number;
  material_name: string;
  material_code: string;
  unit: number;
  unit_display: string;
  quantity: string;
  rate: string;
  amount: string;
}

export interface ApiPurchasePayment {
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

export interface ApiPurchase {
  id: number;
  account: number;
  supplier_id: number;
  supplier_name: string;
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
  created_at: string;
  updated_at: string;
  line_items?: ApiPurchaseLineItem[];
  payments?: ApiPurchasePayment[];
}

function apiLineItemToLineItem(api: ApiPurchaseLineItem): PurchaseLineItem {
  return {
    id: String(api.id),
    materialId: String(api.material_id),
    materialName: api.material_name,
    materialCode: api.material_code,
    unit: api.unit_display ?? String(api.unit),
    quantity: parseFloat(api.quantity) || 0,
    rate: parseFloat(api.rate) || 0,
    amount: parseFloat(api.amount) || 0,
  };
}

function apiPurchaseToPurchase(api: ApiPurchase): Purchase {
  const supplier: SupplierRef = {
    id: String(api.supplier_id),
    name: api.supplier_name,
  };
  const project: ProjectRef | undefined =
    api.project_id != null && api.project_name != null
      ? { id: String(api.project_id), name: api.project_name }
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
    supplier,
    project: project ?? null,
    reference: api.reference,
    date: api.date,
    status: BACKEND_TO_STATUS[api.status] ?? "draft",
    paymentMethod: BACKEND_TO_PAYMENT_METHOD[api.payment_method] ?? "cash",
    lineItems:
      api.line_items?.map(apiLineItemToLineItem) ??
      [],
    amount: parseFloat(api.amount) || 0,
    description: api.description || undefined,
    paidAt: api.paid_at ?? undefined,
    paidAmount: api.paid_amount != null && api.paid_amount !== "" ? parseFloat(api.paid_amount) : undefined,
    paymentStatus: BACKEND_TO_PAYMENT_STATUS[api.payment_status] ?? "not_completed",
    payments,
  };
}

export async function fetchPurchases(): Promise<Purchase[]> {
  const { data } = await api.get<ApiPurchase[]>("/purchases/");
  return (data ?? []).map(apiPurchaseToPurchase);
}

export async function getPurchase(id: number): Promise<Purchase | null> {
  const { data } = await api.get<ApiPurchase>(`/purchases/${id}/`);
  return data ? apiPurchaseToPurchase(data) : null;
}

export interface CreatePurchasePayload {
  supplier: number;
  project: number | null;
  reference: string;
  date: string;
  status: PurchaseStatus;
  payment_method: PurchasePaymentMethod;
  line_items: { material: number; quantity: number; rate: number }[];
  description?: string;
  paid_amount?: number;
}

export async function createPurchase(
  payload: CreatePurchasePayload
): Promise<Purchase> {
  const body: Record<string, unknown> = {
    supplier: payload.supplier,
    project: payload.project ?? null,
    reference: payload.reference.trim(),
    date: payload.date,
    status: STATUS_TO_BACKEND[payload.status],
    payment_method: PAYMENT_METHOD_TO_BACKEND[payload.payment_method],
    line_items: payload.line_items.map((l) => ({
      material: l.material,
      quantity: String(l.quantity),
      rate: String(l.rate),
    })),
    description: payload.description?.trim() ?? "",
  };
  if (payload.paid_amount != null && payload.paid_amount > 0) {
    body.paid_amount = String(payload.paid_amount);
  }
  const { data } = await api.post<ApiPurchase>("/purchases/", body);
  return apiPurchaseToPurchase(data);
}

export interface UpdatePurchasePayload {
  reference?: string;
  date?: string;
  status?: PurchaseStatus;
  payment_method?: PurchasePaymentMethod;
  description?: string;
  project?: number | null;
  line_items?: { material: number; quantity: number; rate: number }[];
  /** When posting (status=posted), create a payment line for this amount. */
  paid_amount?: number;
}

export async function updatePurchase(
  id: number,
  payload: UpdatePurchasePayload
): Promise<Purchase> {
  const body: Record<string, unknown> = {};
  if (payload.reference !== undefined) body.reference = payload.reference.trim();
  if (payload.date !== undefined) body.date = payload.date;
  if (payload.status !== undefined)
    body.status = STATUS_TO_BACKEND[payload.status];
  if (payload.payment_method !== undefined)
    body.payment_method = PAYMENT_METHOD_TO_BACKEND[payload.payment_method];
  if (payload.description !== undefined)
    body.description = payload.description.trim();
  if (payload.line_items !== undefined)
    body.line_items = payload.line_items.map((l) => ({
      material: l.material,
      quantity: String(l.quantity),
      rate: String(l.rate),
    }));
  if (payload.paid_amount != null)
    body.paid_amount = String(payload.paid_amount);
  if (payload.project !== undefined)
    body.project = payload.project;
  const { data } = await api.patch<ApiPurchase>(`/purchases/${id}/`, body);
  return apiPurchaseToPurchase(data);
}

export async function deletePurchase(id: number): Promise<void> {
  await api.delete(`/purchases/${id}/`);
}

export interface AddPurchasePaymentPayload {
  date: string;
  amount: number;
  reference?: string;
  status?: "draft" | "posted";
}

export async function addPurchasePayment(
  purchaseId: number,
  payload: AddPurchasePaymentPayload
): Promise<void> {
  const body: Record<string, unknown> = {
    date: payload.date,
    amount: String(payload.amount),
    reference: payload.reference?.trim() ?? "",
  };
  if (payload.status !== undefined)
    body.status = PAYMENT_LEDGER_TO_BACKEND[payload.status];
  await api.post(`/purchases/${purchaseId}/payments/`, body);
}

export interface PatchPurchasePaymentPayload {
  status?: "draft" | "posted";
  date?: string;
  amount?: number;
  reference?: string;
}

export async function patchPurchasePayment(
  purchaseId: number,
  paymentId: number,
  payload: PatchPurchasePaymentPayload
): Promise<void> {
  const body: Record<string, unknown> = {};
  if (payload.status !== undefined)
    body.status = PAYMENT_LEDGER_TO_BACKEND[payload.status];
  if (payload.date !== undefined) body.date = payload.date;
  if (payload.amount !== undefined) body.amount = String(payload.amount);
  if (payload.reference !== undefined) body.reference = payload.reference?.trim() ?? "";
  await api.patch(`/purchases/${purchaseId}/payments/${paymentId}/`, body);
}

export async function deletePurchasePayment(
  purchaseId: number,
  paymentId: number
): Promise<void> {
  await api.delete(`/purchases/${purchaseId}/payments/${paymentId}/`);
}

// --- Purchase documents (list, upload, download, delete) ---

export interface PurchaseDocument {
  id: number;
  name: string;
  filename: string;
  file_url: string | null;
  size: number | null;
  description: string;
  created_at: string;
}

export async function fetchPurchaseDocuments(
  purchaseId: number
): Promise<PurchaseDocument[]> {
  const { data } = await api.get<PurchaseDocument[]>(
    `/purchases/${purchaseId}/documents/`
  );
  return data ?? [];
}

export async function uploadPurchaseDocument(
  purchaseId: number,
  file: File,
  options?: { name?: string; description?: string }
): Promise<PurchaseDocument> {
  const form = new FormData();
  form.append("file", file);
  if (options?.name) form.append("name", options.name);
  if (options?.description) form.append("description", options.description ?? "");
  const { data } = await api.post<PurchaseDocument>(
    `/purchases/${purchaseId}/documents/`,
    form,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return data;
}

export async function deletePurchaseDocument(
  purchaseId: number,
  documentId: number
): Promise<void> {
  await api.delete(`/purchases/${purchaseId}/documents/${documentId}/`);
}

export async function downloadPurchaseDocument(
  purchaseId: number,
  documentId: number,
  filename: string
): Promise<void> {
  const { data } = await api.get<Blob>(
    `/purchases/${purchaseId}/documents/${documentId}/download/`,
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
