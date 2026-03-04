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
  created_at: string;
}

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
    paidAmount: parseFloat(api.paid_amount) || undefined,
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
  line_items?: { material: number; quantity: number; rate: number }[];
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
  const { data } = await api.patch<ApiPurchase>(`/purchases/${id}/`, body);
  return apiPurchaseToPurchase(data);
}

export interface AddPurchasePaymentPayload {
  date: string;
  amount: number;
  reference?: string;
}

export async function addPurchasePayment(
  purchaseId: number,
  payload: AddPurchasePaymentPayload
): Promise<void> {
  await api.post(`/purchases/${purchaseId}/payments/`, {
    date: payload.date,
    amount: String(payload.amount),
    reference: payload.reference?.trim() ?? "",
  });
}
