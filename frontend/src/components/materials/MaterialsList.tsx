"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import Pagination from "@/components/tables/Pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Material } from "@/types/material";
import { useCompany } from "@/context/CompanyContext";
import { fetchMaterials, createMaterial, updateMaterial } from "@/lib/materialsApi";
import MaterialViewModal from "./MaterialViewModal";
import MaterialCreateModal from "./MaterialCreateModal";
import MaterialEditModal from "./MaterialEditModal";

const PAGE_SIZE = 5;
const MATERIALS_QUERY_KEY = "materials";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-QA", {
    style: "currency",
    currency: "QAR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

export default function MaterialsList() {
  const { companyId } = useCompany();
  const queryClient = useQueryClient();
  const { data: materials = [], isLoading } = useQuery({
    queryKey: [MATERIALS_QUERY_KEY, companyId],
    queryFn: () => fetchMaterials(),
    enabled: !!companyId,
  });
  const createMutation = useMutation({
    mutationFn: (payload: Omit<Material, "id">) =>
      createMaterial({
        name: payload.name,
        code: payload.code,
        unit: payload.unit,
        rate: payload.rate,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [MATERIALS_QUERY_KEY, companyId] });
    },
  });
  const updateMutation = useMutation({
    mutationFn: (updated: Material) =>
      updateMaterial(updated.id, {
        name: updated.name,
        code: updated.code,
        unit: updated.unit,
        rate: updated.rate,
      }),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: [MATERIALS_QUERY_KEY, companyId] });
      setSelectedMaterial(updated);
      setMaterialToEdit(null);
    },
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [materialToEdit, setMaterialToEdit] = useState<Material | null>(null);

  const filteredAndPaginated = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = q
      ? materials.filter(
          (m) =>
            m.name.toLowerCase().includes(q) ||
            m.code.toLowerCase().includes(q)
        )
      : materials;
    const total = list.length;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const start = (currentPage - 1) * PAGE_SIZE;
    const pageItems = list.slice(start, start + PAGE_SIZE);
    return { pageItems, total, totalPages };
  }, [materials, searchQuery, currentPage]);

  const { pageItems, total, totalPages } = filteredAndPaginated;

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) setCurrentPage(1);
  }, [totalPages, currentPage]);

  const handleCreate = (data: Omit<Material, "id">) => {
    createMutation.mutate(data, {
      onSuccess: () => setIsCreateModalOpen(false),
    });
  };

  const handleRowClick = (material: Material) => {
    setSelectedMaterial(material);
    setIsViewModalOpen(true);
  };

  const handleEdit = (material: Material) => {
    setIsViewModalOpen(false);
    setMaterialToEdit(material);
  };

  const handleUpdate = (updated: Material) => {
    updateMutation.mutate(updated);
  };

  if (!companyId) return null;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <PageBreadcrumb pageTitle="Materials" />
        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add Material
        </button>
      </div>
      <div className="space-y-6">
        <ComponentCard>
          {isLoading && (
            <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
              Loading materials…
            </p>
          )}
          <div className="mb-6 space-y-4">
            <div className="max-w-xs">
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Search
              </label>
              <input
                type="text"
                placeholder="Search by name or code..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Showing {pageItems.length} of {total} materials
            </p>
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-white/[0.05]">
            <div className="max-w-full overflow-x-auto">
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                  <TableRow>
                    <TableCell
                      isHeader
                      className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                    >
                      Name
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                    >
                      Code
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                    >
                      Unit
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 text-end text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                    >
                      Standard Rate (QAR)
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {pageItems.length === 0 ? (
                    <TableRow>
                      <td
                        colSpan={4}
                        className="px-5 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                      >
                        {materials.length === 0
                          ? "No materials yet. Add one to get started."
                          : "No materials match your search."}
                      </td>
                    </TableRow>
                  ) : (
                    pageItems.map((material) => (
                      <tr
                        key={material.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => handleRowClick(material)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleRowClick(material);
                          }
                        }}
                        className="cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.03] divide-y divide-gray-100 dark:divide-white/[0.05]"
                      >
                        <TableCell className="px-5 py-4 text-start text-theme-sm font-medium text-gray-800 dark:text-white/90">
                          {material.name}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-600 dark:text-gray-400">
                          {material.code}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-600 dark:text-gray-400">
                          {material.unitDisplay}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-end text-theme-sm text-gray-600 dark:text-gray-400 tabular-nums">
                          {formatCurrency(material.rate)}
                        </TableCell>
                      </tr>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-gray-200 pt-4 dark:border-gray-800">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Page {currentPage} of {totalPages}
              </p>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </ComponentCard>
      </div>

      <MaterialViewModal
        material={selectedMaterial}
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedMaterial(null);
        }}
        onEdit={handleEdit}
      />
      <MaterialEditModal
        material={materialToEdit}
        isOpen={!!materialToEdit}
        onClose={() => setMaterialToEdit(null)}
        onUpdate={handleUpdate}
        isSubmitting={updateMutation.isPending}
      />
      <MaterialCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreate}
        isSubmitting={createMutation.isPending}
      />
    </div>
  );
}
