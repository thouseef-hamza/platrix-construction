import type { Bill, ProjectRef, SubcontractorRef } from "@/types/bill";
import { MOCK_SUBCONTRACTS } from "./mockCompanies";
import { MOCK_PROJECTS } from "./mockProjects";

const subs: SubcontractorRef[] = MOCK_SUBCONTRACTS.map((c) => ({ id: String(c.id), name: c.name }));
const projectRefs: ProjectRef[] = MOCK_PROJECTS.map((p) => ({ id: p.id, name: p.projectName }));

export const MOCK_BILLS: Bill[] = [
  { id: "b1", project: projectRefs[0]!, subcontractor: subs[0]!, amount: 18500, date: "2024-10-02", reference: "BL-2024-001", status: "posted", attachments: [{ name: "electrical-invoice.pdf" }] },
  { id: "b2", project: projectRefs[0]!, subcontractor: subs[1]!, amount: 22000, date: "2024-10-06", reference: "BL-2024-002", status: "posted" },
  { id: "b3", project: projectRefs[1]!, subcontractor: subs[2]!, amount: 14200, date: "2024-10-11", reference: "BL-2024-003", status: "draft", attachments: [{ name: "hvac-bill.pdf" }] },
  { id: "b4", project: projectRefs[2]!, subcontractor: subs[0]!, amount: 9800, date: "2024-10-16", reference: "BL-2024-004", status: "draft" },
  { id: "b5", project: projectRefs[0]!, subcontractor: subs[3]!, amount: 11500, date: "2024-10-22", reference: "BL-2024-005", status: "posted", attachments: [{ name: "painting-invoice.pdf" }] },
];
