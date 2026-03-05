"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import Pagination from "@/components/tables/Pagination";
import Badge from "@/components/ui/badge/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/utils/format";
import type { Invoice } from "@/types/invoice";
import { useCompany } from "@/context/CompanyContext";
import { fetchCompanies } from "@/lib/companiesApi";
import { fetchProjects } from "@/lib/projectsApi";
import {
  fetchInvoices,
  createInvoice,
  updateInvoice,
  INVOICES_QUERY_KEY,
} from "@/lib/invoicesApi";
import InvoiceViewModal from "@/components/invoice/InvoiceViewModal";
import InvoiceCreateModal from "@/components/invoice/InvoiceCreateModal";
import type { ProjectOption } from "@/components/invoice/InvoiceCreateModal";

const PAGE_SIZE = 5;
const INVOICE_TYPE_SUBCONTRACTOR = 1;

export default function BillsList() {
  const { companyId } = useCompany();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [invoiceToEdit, setInvoiceToEdit] = useState<Invoice | null>(null);

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: [INVOICES_QUERY_KEY, companyId, INVOICE_TYPE_SUBCONTRACTOR],
    queryFn: () => fetchInvoices(INVOICE_TYPE_SUBCONTRACTOR),
    enabled: !!companyId,
  });

  const { data: subcontractors = [] } = useQuery({
    queryKey: ["companies", companyId, 2],
    queryFn: () => fetchCompanies(2),
    enabled: !!companyId && createOpen,
  });

  const { data: projectsRaw = [] } = useQuery({
    queryKey: ["projects", companyId],
    queryFn: () => fetchProjects(),
    enabled: !!companyId,
  });

  const projectOptions: ProjectOption[] = useMemo(
    () => projectsRaw.map((p) => ({ id: String(p.id), name: p.name })),
    [projectsRaw]
  );

  const { pageItems, total, totalPages } = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = invoices;
    if (q) {
      list = list.filter(
        (inv) =>
          inv.partyName.toLowerCase().includes(q) ||
          (inv.reference ?? "").toLowerCase().includes(q) ||
          (inv.projectName ?? "").toLowerCase().includes(q)
      );
    }
    if (projectFilter) {
      list = list.filter(
        (inv) => inv.projectId != null && String(inv.projectId) === projectFilter
      );
    }
    const total = list.length;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const start = (currentPage - 1) * PAGE_SIZE;
    return {
      pageItems: list.slice(start, start + PAGE_SIZE),
      total,
      totalPages,
    };
  }, [invoices, searchQuery, projectFilter, currentPage]);

  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) setCurrentPage(1);
  }, [totalPages, currentPage]);

  const createMutation = useMutation({
    mutationFn: createInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [INVOICES_QUERY_KEY] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Parameters<typeof updateInvoice>[1] }) =>
      updateInvoice(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [INVOICES_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ["invoice", invoiceToEdit?.id] });
      setInvoiceToEdit(null);
      setCreateOpen(false);
    },
  });

  const handleCreate = (payload: Parameters<typeof createInvoice>[0]) => {
    createMutation.mutate(payload, {
      onSuccess: () => setCreateOpen(false),
    });
  };

  const handleUpdate = (
    id: number,
    payload: Parameters<typeof updateInvoice>[1]
  ) => {
    updateMutation.mutate({ id, payload });
  };

  const handleEditFromView = (invoice: Invoice) => {
    if (invoice.status !== "draft") return;
    setSelectedId(null);
    setViewOpen(false);
    setInvoiceToEdit(invoice);
    setCreateOpen(true);
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <PageBreadcrumb pageTitle="Subcontractor Invoice" />
        <button
          type="button"
          onClick={() => {
            setInvoiceToEdit(null);
            setCreateOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Create Subcontractor Invoice
        </button>
      </div>
      <div className="space-y-6">
        <ComponentCard>
          <div className="mb-6 space-y-4">
            <div className="flex flex-wrap items-end gap-4">
              <div className="min-w-[200px] flex-1 max-w-xs">
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Search
                </label>
                <input
                  type="text"
                  placeholder="Subcontractor, reference, or project..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                />
              </div>
              <div className="w-full min-w-[160px] sm:w-48">
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Project
                </label>
                <select
                  value={projectFilter}
                  onChange={(e) => {
                    setProjectFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 pr-10 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                >
                  <option value="">All projects</option>
                  {projectOptions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isLoading ? "Loading…" : `Showing ${pageItems.length} of ${total} subcontractor invoices`}
            </p>
          </div>
          <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-white/[0.05]">
            <div className="max-w-full overflow-x-auto">
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                  <TableRow>
                    <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">Project</TableCell>
                    <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">Subcontractor</TableCell>
                    <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">Reference</TableCell>
                    <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">Status</TableCell>
                    <TableCell isHeader className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400">Date</TableCell>
                    <TableCell isHeader className="px-5 py-3 text-end text-theme-xs font-medium text-gray-500 dark:text-gray-400">Amount (QAR)</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {pageItems.length === 0 ? (
                    <TableRow>
                      <td colSpan={6} className="px-5 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                        {isLoading ? "Loading…" : "No subcontractor invoices match your search."}
                      </td>
                    </TableRow>
                  ) : (
                    pageItems.map((inv) => (
                      <tr
                        key={inv.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          setSelectedId(Number(inv.id));
                          setViewOpen(true);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setSelectedId(Number(inv.id));
                            setViewOpen(true);
                          }
                        }}
                        className="cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                      >
                        <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">
                          {inv.projectName ?? "—"}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-start text-theme-sm font-medium text-gray-800 dark:text-white/90">
                          {inv.partyName}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-600 dark:text-gray-400">
                          {inv.reference ?? "—"}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-start">
                          <Badge size="sm" color={inv.status === "draft" ? "warning" : "success"}>
                            {inv.status === "draft" ? "Draft" : "Posted"}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-600 dark:text-gray-400">
                          {formatDate(inv.date)}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-end text-theme-sm text-gray-600 dark:text-gray-400 tabular-nums">
                          {formatCurrency(inv.amount)}
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
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </ComponentCard>
      </div>

      <InvoiceViewModal
        invoiceId={selectedId}
        isOpen={viewOpen}
        onClose={() => {
          setViewOpen(false);
          setSelectedId(null);
        }}
        title="Subcontractor Invoice"
        invoiceType={INVOICE_TYPE_SUBCONTRACTOR}
        onEdit={handleEditFromView}
      />

      <InvoiceCreateModal
        isOpen={createOpen}
        onClose={() => {
          setCreateOpen(false);
          setInvoiceToEdit(null);
        }}
        title="Subcontractor Invoice"
        invoiceType={INVOICE_TYPE_SUBCONTRACTOR}
        parties={subcontractors}
        projects={projectOptions}
        onCreate={handleCreate}
        invoiceToEdit={invoiceToEdit}
        onUpdate={handleUpdate}
      />
    </div>
  );
}
