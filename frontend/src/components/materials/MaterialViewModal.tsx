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
}

export default function MaterialViewModal({
  material,
  isOpen,
  onClose,
}: MaterialViewModalProps) {
  if (!material) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg mx-4">
      <div className="p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Material Details
        </h2>
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
              {material.unit}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Standard Rate (QAR)
            </dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-white tabular-nums">
              {formatCurrency(material.standardRate)}
            </dd>
          </div>
        </dl>
      </div>
    </Modal>
  );
}
