import type { Payment } from "@/types/payment";
import { MOCK_CLIENTS } from "./mockCompanies";

const clients = MOCK_CLIENTS;

export const MOCK_PAYMENTS: Payment[] = [
  { id: "p1", client: clients[0]!, amount: 125000, date: "2024-10-01", reference: "INV-2024-001", status: "posted", paymentMethod: "bank", receivedAmount: 0, attachments: [{ name: "payment-voucher.pdf" }] },
  { id: "p1-pay1", client: clients[0]!, amount: 50000, date: "2024-10-02", reference: "INV-2024-001", invoiceId: "p1" },
  { id: "p2", client: clients[1]!, amount: 280000, date: "2024-10-05", reference: "INV-2024-002", status: "posted", paymentMethod: "bank", receivedAmount: 0 },
  { id: "p2-pay1", client: clients[1]!, amount: 280000, date: "2024-10-06", reference: "INV-2024-002", invoiceId: "p2" },
  { id: "p3", client: clients[2]!, amount: 45000, date: "2024-10-10", reference: "INV-2024-003", status: "draft", paymentMethod: "cash", receivedAmount: 10000, attachments: [{ name: "bank-transfer.pdf" }] },
  { id: "p4", client: clients[0]!, amount: 89000, date: "2024-10-15", reference: "INV-2024-004", status: "draft", paymentMethod: "bank", receivedAmount: 0 },
  { id: "p5", client: clients[3]!, amount: 156000, date: "2024-10-20", reference: "INV-2024-005", status: "posted", paymentMethod: "bank", receivedAmount: 0, attachments: [{ name: "receipt.pdf" }] },
];
