"use client";

import React, { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import Label from "@/components/form/Label";
import type { Material } from "@/types/material";

const inputClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800";

const UNIT_OPTIONS: { value: number; label: string }[] = [
  { value: 0, label: "Piece" },
  { value: 1, label: "Kg" },
  { value: 2, label: "Meter" },
  { value: 3, label: "Liter" },
  { value: 4, label: "Box" },
  { value: 5, label: "Sq. meter" },
  { value: 6, label: "Cubic meter" },
  { value: 7, label: "Roll" },
  { value: 8, label: "Set" },
  { value: 9, label: "Other" },
];

interface MaterialEditModalProps {
  material: Material | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updated: Material) => void;
  isSubmitting?: boolean;
}

export default function MaterialEditModal({
  material,
  isOpen,
  onClose,
  onUpdate,
  isSubmitting = false,
}: MaterialEditModalProps) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [unit, setUnit] = useState<number>(0);
  const [rate, setRate] = useState("");

  useEffect(() => {
    if (material && isOpen) {
      setName(material.name);
      setCode(material.code);
      setUnit(material.unit);
      setRate(String(material.rate));
    }
  }, [material, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!material) return;
    const rateNum = parseFloat(rate) || 0;
    onUpdate({
      ...material,
      name: name.trim() || "Unnamed Material",
      code: code.trim() || "—",
      unit,
      rate: rateNum,
    });
    onClose();
  };

  if (!material) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg mx-4">
      <form onSubmit={handleSubmit} className="p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Edit Material
        </h2>
        <div className="space-y-4">
          <div>
            <Label>Material Name</Label>
            <input
              type="text"
              className={inputClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Portland Cement"
              required
            />
          </div>
          <div>
            <Label>Code</Label>
            <input
              type="text"
              className={inputClass}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. MAT-001"
            />
          </div>
          <div>
            <Label>Unit</Label>
            <select
              className={inputClass}
              value={unit}
              onChange={(e) => setUnit(Number(e.target.value))}
            >
              {UNIT_OPTIONS.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Standard Rate (QAR)</Label>
            <input
              type="number"
              min={0}
              step="0.01"
              className={inputClass}
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              placeholder="0"
            />
          </div>
        </div>
        <div className="mt-8 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 disabled:opacity-50 disabled:pointer-events-none"
          >
            {isSubmitting ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
