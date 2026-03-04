export interface DocumentAttachment {
  name: string;
}

export interface SubcontractorRef {
  id: string;
  name: string;
}

export interface ProjectRef {
  id: string;
  name: string;
}

export const BILL_STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "posted", label: "Posted" },
] as const;

export type BillStatus = (typeof BILL_STATUSES)[number]["value"];

export interface Bill {
  id: string;
  project: ProjectRef;
  subcontractor: SubcontractorRef;
  amount: number;
  date: string;
  reference: string;
  status: BillStatus;
  attachments?: DocumentAttachment[];
  /** Amount paid against this bill. */
  paidAmount?: number;
  /** List of payment transactions against this bill. */
  payments?: { id: string; date: string; amount: number }[];
}
