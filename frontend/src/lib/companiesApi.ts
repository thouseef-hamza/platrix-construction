import type { QueryClient } from "@tanstack/react-query";
import type { Company } from "@/types/company";
import type { CompanyType } from "@/types/company";
import { api } from "./api";

/** Invalidate all company-related TanStack queries so lists/dropdowns refresh everywhere. */
export function invalidateCompanyQueries(queryClient: QueryClient): void {
  queryClient.invalidateQueries({ queryKey: ["companies"] });
  queryClient.invalidateQueries({ queryKey: ["companies-clients"] });
}

// Backend: 0=Client, 1=Supplier, 2=Subcontractor
const COMPANY_TYPE_CLIENT = 0;
const COMPANY_TYPE_SUPPLIER = 1;
const COMPANY_TYPE_SUBCONTRACTOR = 2;

export function companyTypeToBackend(type: CompanyType): number {
  switch (type) {
    case "clients":
      return COMPANY_TYPE_CLIENT;
    case "suppliers":
      return COMPANY_TYPE_SUPPLIER;
    case "subcontracts":
      return COMPANY_TYPE_SUBCONTRACTOR;
    default:
      return COMPANY_TYPE_CLIENT;
  }
}

export interface ApiCompany {
  id: number;
  account: number;
  name: string;
  company_type: number;
  company_type_display?: string;
  created_at: string;
  updated_at: string;
}

function apiCompanyToCompany(apiCompany: ApiCompany): Company {
  return {
    id: apiCompany.id,
    name: apiCompany.name,
  };
}

export async function fetchCompanies(companyType?: number): Promise<Company[]> {
  const params: Record<string, string> = {};
  if (companyType !== undefined) params.company_type = String(companyType);
  const { data } = await api.get<ApiCompany[]>("/companies/", { params });
  return (data ?? []).map(apiCompanyToCompany);
}

export async function createCompany(payload: {
  name: string;
  company_type: number;
}): Promise<Company> {
  const { data } = await api.post<ApiCompany>("/companies/", {
    name: payload.name.trim(),
    company_type: payload.company_type,
  });
  return apiCompanyToCompany(data);
}
