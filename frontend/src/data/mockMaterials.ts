import type { Material } from "@/types/material";

export const MOCK_MATERIALS: Material[] = [
  { id: "m1", name: "Portland Cement", code: "MAT-001", unit: "tonne", standardRate: 185 },
  { id: "m2", name: "Steel Rebar 12mm", code: "MAT-002", unit: "tonne", standardRate: 1200 },
  { id: "m3", name: "Aggregate 20mm", code: "MAT-003", unit: "m³", standardRate: 45 },
  { id: "m4", name: "Sand", code: "MAT-004", unit: "m³", standardRate: 35 },
  { id: "m5", name: "Bricks", code: "MAT-005", unit: "1000 pcs", standardRate: 420 },
  { id: "m6", name: "PVC Pipes 4 inch", code: "MAT-006", unit: "m", standardRate: 28 },
  { id: "m7", name: "Electrical Cable 2.5mm", code: "MAT-007", unit: "m", standardRate: 4.5 },
  { id: "m8", name: "Paint White", code: "MAT-008", unit: "L", standardRate: 55 },
  { id: "m9", name: "Tile Ceramic 60x60", code: "MAT-009", unit: "m²", standardRate: 42 },
  { id: "m10", name: "Timber 2x4", code: "MAT-010", unit: "m", standardRate: 18 },
  { id: "m11", name: "Gypsum Board", code: "MAT-011", unit: "m²", standardRate: 25 },
  { id: "m12", name: "Insulation Roll", code: "MAT-012", unit: "m²", standardRate: 32 },
];
