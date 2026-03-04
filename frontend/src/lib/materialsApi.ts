import type { Material } from "@/types/material";
import { api } from "./api";

export interface ApiMaterial {
  id: number;
  account: number;
  name: string;
  code: string;
  unit: number;
  unit_display?: string;
  rate: string;
  created_at: string;
  updated_at: string;
}

function apiMaterialToMaterial(apiMaterial: ApiMaterial): Material {
  return {
    id: apiMaterial.id,
    name: apiMaterial.name,
    code: apiMaterial.code,
    unit: apiMaterial.unit,
    unitDisplay: apiMaterial.unit_display ?? "—",
    rate: parseFloat(apiMaterial.rate) || 0,
  };
}

export async function fetchMaterials(): Promise<Material[]> {
  const { data } = await api.get<ApiMaterial[]>("/inventory/materials/");
  return (data ?? []).map(apiMaterialToMaterial);
}

export async function createMaterial(payload: {
  name: string;
  code: string;
  unit: number;
  rate: number;
}): Promise<Material> {
  const { data } = await api.post<ApiMaterial>("/inventory/materials/", {
    name: payload.name.trim(),
    code: payload.code.trim(),
    unit: payload.unit,
    rate: String(payload.rate),
  });
  return apiMaterialToMaterial(data);
}

export async function updateMaterial(
  id: number,
  payload: { name: string; code: string; unit: number; rate: number }
): Promise<Material> {
  const { data } = await api.patch<ApiMaterial>(`/inventory/materials/${id}/`, {
    name: payload.name.trim(),
    code: payload.code.trim(),
    unit: payload.unit,
    rate: String(payload.rate),
  });
  return apiMaterialToMaterial(data);
}
