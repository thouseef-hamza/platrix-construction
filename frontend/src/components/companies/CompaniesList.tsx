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
import type { Company } from "@/types/company";
import type { CompanyType } from "@/types/company";
import { useCompany } from "@/context/CompanyContext";
import {
  fetchCompanies,
  createCompany,
  companyTypeToBackend,
} from "@/lib/companiesApi";
import CompanyViewModal from "./CompanyViewModal";
import CompanyCreateModal from "./CompanyCreateModal";

const PAGE_SIZE = 5;
const COMPANIES_QUERY_KEY = "companies";

interface CompaniesListProps {
  title: string;
  type: CompanyType;
}

export default function CompaniesList({ title, type }: CompaniesListProps) {
  const { companyId } = useCompany();
  const queryClient = useQueryClient();
  const companyTypeInt = companyTypeToBackend(type);
  const { data: items = [], isLoading } = useQuery({
    queryKey: [COMPANIES_QUERY_KEY, companyId, companyTypeInt],
    queryFn: () => fetchCompanies(companyTypeInt),
    enabled: !!companyId,
  });
  const createMutation = useMutation({
    mutationFn: (payload: { name: string }) =>
      createCompany({
        name: payload.name,
        company_type: companyTypeInt,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [COMPANIES_QUERY_KEY, companyId, companyTypeInt],
      });
    },
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const filteredAndPaginated = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = q
      ? items.filter((c) => c.name.toLowerCase().includes(q))
      : items;
    const total = list.length;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const start = (currentPage - 1) * PAGE_SIZE;
    const pageItems = list.slice(start, start + PAGE_SIZE);
    return { pageItems, total, totalPages };
  }, [items, searchQuery, currentPage]);

  const { pageItems, total, totalPages } = filteredAndPaginated;

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) setCurrentPage(1);
  }, [totalPages, currentPage]);

  const handleCreate = (data: Omit<Company, "id">) => {
    createMutation.mutate(
      { name: data.name },
      { onSuccess: () => setIsCreateModalOpen(false) }
    );
  };

  const handleRowClick = (company: Company) => {
    setSelectedCompany(company);
    setIsViewModalOpen(true);
  };

  if (!companyId) return null;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <PageBreadcrumb pageTitle={title} />
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
          Add {title.slice(0, -1)}
        </button>
      </div>
      <div className="space-y-6">
        <ComponentCard>
          {isLoading && (
            <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
              Loading companies…
            </p>
          )}
          <div className="mb-6 space-y-4">
            <div className="max-w-xs">
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Search
              </label>
              <input
                type="text"
                placeholder="Search by company name..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Showing {pageItems.length} of {total} {title.toLowerCase()}
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
                      Company Name
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {pageItems.length === 0 ? (
                    <TableRow>
                      <td
                        colSpan={1}
                        className="px-5 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                      >
                        No companies match your search.
                      </td>
                    </TableRow>
                  ) : (
                    pageItems.map((company) => (
                      <tr
                        key={company.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => handleRowClick(company)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleRowClick(company);
                          }
                        }}
                        className="cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.03] divide-y divide-gray-100 dark:divide-white/[0.05]"
                      >
                        <TableCell className="px-5 py-4 text-start text-theme-sm font-medium text-gray-800 dark:text-white/90">
                          {company.name}
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

      <CompanyViewModal
        company={selectedCompany}
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedCompany(null);
        }}
        title={title}
        type={type}
      />
      <CompanyCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title={title}
        onCreate={handleCreate}
        isSubmitting={createMutation.isPending}
      />
    </div>
  );
}
