import type { Company } from "@/types/company";

export const MOCK_CLIENTS: Company[] = [
  { id: "c1", name: "Acme Corp" },
  { id: "c2", name: "Metro City Council" },
  { id: "c3", name: "Greenfield Developers" },
  { id: "c4", name: "Summit Construction Co" },
  { id: "c5", name: "Riverside Holdings" },
  { id: "c6", name: "Northern Builders Ltd" },
  { id: "c7", name: "Delta Properties" },
];

export const MOCK_SUPPLIERS: Company[] = [
  { id: "s1", name: "Gulf Steel Supplies" },
  { id: "s2", name: "Premier Cement Co" },
  { id: "s3", name: "National Lumber & Hardware" },
  { id: "s4", name: "Elite Electrical Wholesale" },
  { id: "s5", name: "Quality Tiles & Marble" },
  { id: "s6", name: "Fast Plumbing Supplies" },
];

export const MOCK_SUBCONTRACTS: Company[] = [
  { id: "sc1", name: "Alpha Electrical Contractors" },
  { id: "sc2", name: "Precision Plumbing Services" },
  { id: "sc3", name: "SafeGuard HVAC" },
  { id: "sc4", name: "Pro Paint & Finish" },
  { id: "sc5", name: "GroundWorks Excavation" },
  { id: "sc6", name: "SteelFrame Structures" },
  { id: "sc7", name: "City Glass & Glazing" },
];

const COMPANY_DATA = {
  clients: MOCK_CLIENTS,
  suppliers: MOCK_SUPPLIERS,
  subcontracts: MOCK_SUBCONTRACTS,
} as const;

export function getInitialCompanies(type: keyof typeof COMPANY_DATA): Company[] {
  return [...COMPANY_DATA[type]];
}
