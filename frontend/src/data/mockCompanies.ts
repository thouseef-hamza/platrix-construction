import type { Company } from "@/types/company";

export const MOCK_CLIENTS: Company[] = [
  { id: 1, name: "Acme Corp" },
  { id: 2, name: "Metro City Council" },
  { id: 3, name: "Greenfield Developers" },
  { id: 4, name: "Summit Construction Co" },
  { id: 5, name: "Riverside Holdings" },
  { id: 6, name: "Northern Builders Ltd" },
  { id: 7, name: "Delta Properties" },
];

export const MOCK_SUPPLIERS: Company[] = [
  { id: 11, name: "Gulf Steel Supplies" },
  { id: 12, name: "Premier Cement Co" },
  { id: 13, name: "National Lumber & Hardware" },
  { id: 14, name: "Elite Electrical Wholesale" },
  { id: 15, name: "Quality Tiles & Marble" },
  { id: 16, name: "Fast Plumbing Supplies" },
];

export const MOCK_SUBCONTRACTS: Company[] = [
  { id: 21, name: "Alpha Electrical Contractors" },
  { id: 22, name: "Precision Plumbing Services" },
  { id: 23, name: "SafeGuard HVAC" },
  { id: 24, name: "Pro Paint & Finish" },
  { id: 25, name: "GroundWorks Excavation" },
  { id: 26, name: "SteelFrame Structures" },
  { id: 27, name: "City Glass & Glazing" },
];

const COMPANY_DATA = {
  clients: MOCK_CLIENTS,
  suppliers: MOCK_SUPPLIERS,
  subcontracts: MOCK_SUBCONTRACTS,
} as const;

export function getInitialCompanies(type: keyof typeof COMPANY_DATA): Company[] {
  return [...COMPANY_DATA[type]];
}
