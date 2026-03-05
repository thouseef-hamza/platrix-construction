export type InvoiceType = "client" | "subcontractor";
export type InvoiceStatus = "draft" | "posted";
export type InvoicePaymentStatus = "not_completed" | "completed" | "partial";

export interface InvoicePayment {
  id: number | string;
  date: string;
  amount: number;
  reference?: string;
  status: "draft" | "posted";
  statusDisplay?: string;
  createdAt?: string;
}

export interface Invoice {
  id: number | string;
  account: number;
  invoiceType: InvoiceType;
  invoiceTypeDisplay?: string;
  partyId: number;
  partyName: string;
  projectId?: number | null;
  projectName?: string | null;
  reference: string;
  date: string;
  status: InvoiceStatus;
  statusDisplay?: string;
  paymentMethod: "cash" | "bank";
  paymentMethodDisplay?: string;
  paymentStatus: InvoicePaymentStatus;
  paymentStatusDisplay?: string;
  amount: number;
  paidAmount: number;
  description?: string;
  paidAt?: string | null;
  payments?: InvoicePayment[];
  createdAt?: string;
  updatedAt?: string;
}

export interface InvoiceDocument {
  id: number;
  name: string;
  filename: string;
  file_url: string | null;
  size: number | null;
  description: string;
  created_at: string;
}
