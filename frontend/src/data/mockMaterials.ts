import type { Material } from "@/types/material";

/** Mock materials for demos/tests. Use fetchMaterials() for real data. */
export const MOCK_MATERIALS: Material[] = [
  { id: 1, name: "Portland Cement", code: "MAT-001", unit: 1, unitDisplay: "Kg", rate: 185 },
  { id: 2, name: "Steel Rebar 12mm", code: "MAT-002", unit: 1, unitDisplay: "Kg", rate: 1200 },
  { id: 3, name: "Aggregate 20mm", code: "MAT-003", unit: 6, unitDisplay: "Cubic meter", rate: 45 },
  { id: 4, name: "Sand", code: "MAT-004", unit: 6, unitDisplay: "Cubic meter", rate: 35 },
  { id: 5, name: "Bricks", code: "MAT-005", unit: 0, unitDisplay: "Piece", rate: 0.42 },
  { id: 6, name: "PVC Pipes 4 inch", code: "MAT-006", unit: 2, unitDisplay: "Meter", rate: 28 },
  { id: 7, name: "Electrical Cable 2.5mm", code: "MAT-007", unit: 2, unitDisplay: "Meter", rate: 4.5 },
  { id: 8, name: "Paint White", code: "MAT-008", unit: 3, unitDisplay: "Liter", rate: 55 },
  { id: 9, name: "Tile Ceramic 60x60", code: "MAT-009", unit: 5, unitDisplay: "Sq. meter", rate: 42 },
  { id: 10, name: "Timber 2x4", code: "MAT-010", unit: 2, unitDisplay: "Meter", rate: 18 },
  { id: 11, name: "Gypsum Board", code: "MAT-011", unit: 5, unitDisplay: "Sq. meter", rate: 25 },
  { id: 12, name: "Insulation Roll", code: "MAT-012", unit: 7, unitDisplay: "Roll", rate: 32 },
];
