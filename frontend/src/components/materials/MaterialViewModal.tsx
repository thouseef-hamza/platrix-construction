"use client";

import React from "react";
import { Modal } from "@/components/ui/modal";
import type { Material } from "@/types/material";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-QA", {
    style: "currency",
    currency: "QAR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

interface MaterialViewModalProps {
  material: Material | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (material: Material) => void;
}

export default function MaterialViewModal({
  material,
  isOpen,
  onClose,
  onEdit,
}: MaterialViewModalProps) {
  if (!material) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[95vw] w-full mx-4">
      <div className="p-6 sm:p-8">
        <div className="flex items-center justify-between gap-3 mb-6 pr-16 sm:pr-20">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Material Details
          </h2>
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(material)}
              className="inline-flex items-center gap-2 rounded-lg border border-brand-500 bg-transparent px-3 py-2 text-sm font-medium text-brand-600 hover:bg-brand-500/10 dark:border-brand-400 dark:text-brand-400 dark:hover:bg-brand-500/20"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Edit
            </button>
          )}
        </div>
        <dl className="space-y-4">
          <div>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Material Name
            </dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white">
              {material.name}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Code
            </dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white">
              {material.code}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Unit
            </dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white">
              {material.unitDisplay}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Standard Rate (QAR)
            </dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white tabular-nums">
              {formatCurrency(material.rate)}
            </dd>
          </div>
        </dl>
      </div>
    </Modal>
  );
}
