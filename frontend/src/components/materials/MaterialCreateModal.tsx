"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import Label from "@/components/form/Label";
import type { Material } from "@/types/material";

const inputClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800";

const UNIT_OPTIONS = [
  "m",
  "m²",
  "m³",
  "tonne",
  "kg",
  "L",
  "pcs",
  "1000 pcs",
  "roll",
  "box",
];

interface MaterialCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: Omit<Material, "id">) => void;
}

export default function MaterialCreateModal({
  isOpen,
  onClose,
  onCreate,
}: MaterialCreateModalProps) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [unit, setUnit] = useState("m");
  const [standardRate, setStandardRate] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rate = parseFloat(standardRate) || 0;
    onCreate({
      name: name.trim() || "Unnamed Material",
      code: code.trim() || "—",
      unit,
      standardRate: rate,
    });
    setName("");
    setCode("");
    setUnit("m");
    setStandardRate("");
    onClose();
  };

  const handleClose = () => {
    setName("");
    setCode("");
    setUnit("m");
    setStandardRate("");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-lg mx-4">
      <form onSubmit={handleSubmit} className="p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Add Material
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
              onChange={(e) => setUnit(e.target.value)}
            >
              {UNIT_OPTIONS.map((u) => (
                <option key={u} value={u}>
                  {u}
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
              value={standardRate}
              onChange={(e) => setStandardRate(e.target.value)}
              placeholder="0"
            />
          </div>
        </div>
        <div className="mt-8 flex justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
          >
            Create
          </button>
        </div>
      </form>
    </Modal>
  );
}
