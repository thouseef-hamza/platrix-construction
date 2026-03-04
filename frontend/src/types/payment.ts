export interface DocumentAttachment {
  name: string;
}

export interface ClientRef {
  id: string;
  name: string;
}

export const LEDGER_STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "posted", label: "Posted" },
] as const;

export type LedgerStatus = (typeof LEDGER_STATUSES)[number]["value"];

export type PaymentMethod = "cash" | "bank";

export interface Payment {
  id: string;
  client: ClientRef;
  amount: number;
  date: string;
  reference: string;
  attachments?: DocumentAttachment[];
  /** When set, this record is a payment toward the invoice with this id. When absent, this is an invoice. */
  invoiceId?: string;
  /** Ledger status for invoices only (draft can be edited, posted cannot). */
  status?: LedgerStatus;
  /** For invoices: how payment is received (cash/bank). */
  paymentMethod?: PaymentMethod;
  /** For invoices: amount already received at creation (e.g. advance). Receipts add to total received. */
  receivedAmount?: number;
}

export type PaymentStatus = "credit" | "partial" | "completed";
