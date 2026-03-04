export interface DocumentAttachment {
  name: string;
}

export interface SupplierRef {
  id: string;
  name: string;
}

export interface ProjectRef {
  id: string;
  name: string;
}

export type PurchaseStatus = "draft" | "posted";
export type PurchasePaymentMethod = "cash" | "bank";
export type PurchasePaymentStatus = "not_completed" | "completed" | "partial";
/** Ledger status for a single payment: draft (no ledger) or posted. */
export type PaymentLedgerStatus = "draft" | "posted";

/** Expense = P&L expense account; Asset = balance sheet asset account. */
export type PurchaseType = "expense" | "asset";

export interface AccountRef {
  id: string;
  code: string;
  name: string;
}

export interface PurchaseLineItem {
  id: string;
  materialId: string;
  materialName: string;
  materialCode: string;
  unit: string;
  quantity: number;
  rate: number;
  amount: number; // quantity * rate
}

export interface Purchase {
  id: string;
  /** Whether this purchase is expensed (P&L) or capitalized as asset (optional, removed from form). */
  purchaseType?: PurchaseType;
  /** Ledger account to debit (optional, removed from form). */
  account?: AccountRef;
  project?: ProjectRef | null;
  supplier: SupplierRef;
  reference: string;
  date: string;
  status: PurchaseStatus;
  paymentMethod: PurchasePaymentMethod;
  lineItems: PurchaseLineItem[];
  amount: number; // total of line items
  description?: string;
  attachments?: DocumentAttachment[];
  paidAt?: string | null; // when marked as paid
  /** Amount paid against this purchase (e.g. advance or partial payment). */
  paidAmount?: number;
  /** Payment status: not_completed, completed, or partial. */
  paymentStatus?: PurchasePaymentStatus;
  /** List of payment transactions against this purchase. */
  payments?: {
    id: string;
    date: string;
    amount: number;
    reference?: string;
    status?: PaymentLedgerStatus;
  }[];
}
