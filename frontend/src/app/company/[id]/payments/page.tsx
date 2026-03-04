import type { Metadata } from "next";
import PaymentsList from "@/components/payments/PaymentsList";

export const metadata: Metadata = {
  title: "Client Invoice | Construction Accounting",
  description: "Manage client invoices and payments from clients",
};

export default function PaymentsPage() {
  return <PaymentsList />;
}
