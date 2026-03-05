import type { Purchase, PurchaseLineItem, SupplierRef } from "@/types/purchase";
import { MOCK_SUPPLIERS } from "./mockCompanies";

const suppliers: SupplierRef[] = MOCK_SUPPLIERS.map((c) => ({ id: String(c.id), name: c.name }));

const projectRefs = [
  { id: "1", name: "Downtown Office Tower" },
  { id: "2", name: "Harbor Bridge Repairs" },
  { id: "3", name: "Lakeside Residences Phase 2" },
];

function line(
  id: string,
  materialId: string,
  materialName: string,
  materialCode: string,
  unit: string,
  quantity: number,
  rate: number
): PurchaseLineItem {
  return {
    id,
    materialId,
    materialName,
    materialCode,
    unit,
    quantity,
    rate,
    amount: quantity * rate,
  };
}

const expenseAccount = { id: "a18", code: "5100", name: "Cost of Materials" };
const equipmentAccount = { id: "a7", code: "1210", name: "Equipment" };

export const MOCK_PURCHASES: Purchase[] = [
  {
    id: "pu1",
    purchaseType: "expense",
    account: expenseAccount,
    project: projectRefs[0]!,
    supplier: suppliers[0]!,
    reference: "PO-2024-001",
    date: "2024-10-01",
    status: "posted",
    paymentMethod: "bank",
    lineItems: [
      line("li1", "m2", "Steel Rebar 12mm", "MAT-002", "tonne", 10, 1200),
      line("li2", "m1", "Portland Cement", "MAT-001", "tonne", 20, 185),
    ],
    amount: 15700,
    description: "Steel rebar and mesh",
    attachments: [{ name: "po-001.pdf" }],
    paidAt: "2024-10-05T10:00:00Z",
    paidAmount: 15700,
    paymentStatus: "completed",
    payments: [
      { id: "pp-pu1-1", date: "2024-10-03", amount: 10000 },
      { id: "pp-pu1-2", date: "2024-10-05", amount: 5700 },
    ],
  },
  {
    id: "pu2",
    purchaseType: "expense",
    account: expenseAccount,
    project: projectRefs[1]!,
    supplier: suppliers[1]!,
    reference: "PO-2024-002",
    date: "2024-10-03",
    status: "draft",
    paymentMethod: "cash",
    lineItems: [
      line("li3", "m1", "Portland Cement", "MAT-001", "tonne", 50, 185),
    ],
    amount: 9250,
    description: "Cement delivery",
    paymentStatus: "not_completed",
  },
  {
    id: "pu3",
    purchaseType: "expense",
    account: expenseAccount,
    project: null,
    supplier: suppliers[2]!,
    reference: "PO-2024-003",
    date: "2024-10-07",
    status: "posted",
    paymentMethod: "bank",
    lineItems: [
      line("li4", "m10", "Timber 2x4", "MAT-010", "m", 200, 18),
      line("li5", "m5", "Bricks", "MAT-005", "1000 pcs", 10, 420),
    ],
    amount: 7800,
    description: "Lumber and hardware",
    attachments: [{ name: "invoice-po003.pdf" }],
    paidAt: null,
    paidAmount: 4000,
    paymentStatus: "partial",
    payments: [{ id: "pp-pu3-1", date: "2024-10-08", amount: 4000 }],
  },
  {
    id: "pu4",
    purchaseType: "expense",
    account: expenseAccount,
    project: projectRefs[0]!,
    supplier: suppliers[3]!,
    reference: "PO-2024-004",
    date: "2024-10-12",
    status: "posted",
    paymentMethod: "bank",
    lineItems: [
      line("li6", "m7", "Electrical Cable 2.5mm", "MAT-007", "m", 500, 4.5),
    ],
    amount: 2250,
    description: "Electrical cables",
    paymentStatus: "not_completed",
  },
  {
    id: "pu5",
    purchaseType: "asset",
    account: equipmentAccount,
    project: projectRefs[2]!,
    supplier: suppliers[4]!,
    reference: "PO-2024-005",
    date: "2024-10-18",
    status: "draft",
    paymentMethod: "bank",
    lineItems: [
      line("li7", "m9", "Tile Ceramic 60x60", "MAT-009", "m²", 100, 42),
    ],
    amount: 4200,
    description: "Tiles and adhesive",
    attachments: [{ name: "receipt.pdf" }],
    paymentStatus: "not_completed",
  },
  {
    id: "pu6",
    purchaseType: "expense",
    account: expenseAccount,
    project: projectRefs[0]!,
    supplier: suppliers[0]!,
    reference: "PO-2024-006",
    date: "2024-10-22",
    status: "draft",
    paymentMethod: "cash",
    lineItems: [
      line("li8", "m2", "Steel Rebar 12mm", "MAT-002", "tonne", 5, 1200),
    ],
    amount: 6000,
    description: "Additional steel order",
    paymentStatus: "not_completed",
  },
];
