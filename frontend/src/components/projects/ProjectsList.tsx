"use client";

import React, { useEffect, useMemo, useState } from "react";
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
import {
  PROJECT_TYPES,
  PROJECT_STATUSES,
  type Project,
  type ProjectStatus,
  type ProjectType,
} from "@/types/project";
import { MOCK_CLIENTS, MOCK_PROJECTS } from "@/data/mockProjects";
import ProjectViewModal from "./ProjectViewModal";
import ProjectCreateModal from "./ProjectCreateModal";

const PAGE_SIZE = 5;

function formatBudget(value: number): string {
  return new Intl.NumberFormat("en-QA", {
    style: "currency",
    currency: "QAR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function getStatusBadgeColor(status: ProjectStatus): "primary" | "success" | "error" | "warning" | "info" {
  switch (status) {
    case "active":
      return "success";
    case "planning":
      return "info";
    case "onhold":
      return "warning";
    case "completed":
      return "primary";
    case "cancelled":
      return "error";
    default:
      return "primary";
  }
}

function formatType(type: ProjectType): string {
  return PROJECT_TYPES.find((t) => t.value === type)?.label ?? type;
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "Z");
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default function ProjectsList() {
  const [projects, setProjects] = useState<Project[]>(() => [...MOCK_PROJECTS]);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [clientFilter, setClientFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);

  const filteredAndPaginated = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = projects.filter((p) => {
      if (q && !p.projectName.toLowerCase().includes(q) && !p.projectCode.toLowerCase().includes(q))
        return false;
      if (typeFilter && p.type !== typeFilter) return false;
      if (statusFilter && p.status !== statusFilter) return false;
      if (clientFilter && p.client.id !== clientFilter) return false;
      return true;
    });
    const total = list.length;
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const start = (currentPage - 1) * PAGE_SIZE;
    const pageItems = list.slice(start, start + PAGE_SIZE);
    return { pageItems, total, totalPages };
  }, [projects, searchQuery, typeFilter, statusFilter, clientFilter, currentPage]);

  const handleCreateProject = (data: Omit<Project, "id">) => {
    const id = String(Date.now());
    const createdActivity = {
      id: `pa-${id}`,
      type: "created" as const,
      description: "Project created",
      createdAt: new Date().toISOString(),
    };
    setProjects((prev) => [
      { ...data, id, activities: [createdActivity] },
      ...prev,
    ]);
  };

  const handleRowClick = (project: Project) => {
    setSelectedProject(project);
    setIsViewModalOpen(true);
  };

  const handleUpdateProject = (projectId: string, updates: Partial<Project>) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, ...updates } : p))
    );
    if (selectedProject?.id === projectId) {
      setSelectedProject((prev) => (prev ? { ...prev, ...updates } : null));
    }
  };

  const handleAddComment = (projectId: string, message: string) => {
    const userName = "Current User";
    const comment = {
      id: `pc-${Date.now()}`,
      userId: "current",
      userName,
      message,
      createdAt: new Date().toISOString(),
    };
    const activity = {
      id: `pa-${Date.now()}`,
      type: "comment" as const,
      description: `${userName} added a comment`,
      createdAt: new Date().toISOString(),
    };
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? {
              ...p,
              comments: [...(p.comments ?? []), comment],
              activities: [...(p.activities ?? []), activity],
            }
          : p
      )
    );
    if (selectedProject?.id === projectId) {
      setSelectedProject((prev) =>
        prev
          ? {
              ...prev,
              comments: [...(prev.comments ?? []), comment],
              activities: [...(prev.activities ?? []), activity],
            }
          : null
      );
    }
  };

  const { pageItems, total, totalPages } = filteredAndPaginated;

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) setCurrentPage(1);
  }, [totalPages, currentPage]);

  const selectClass =
    "h-11 rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 pr-10 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800";

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <PageBreadcrumb pageTitle="Projects" />
        <button
          type="button"
          onClick={() => {
            setProjectToEdit(null);
            setIsCreateModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Create Project
        </button>
      </div>
      <div className="space-y-6">
        <ComponentCard>
          {/* Search and filters */}
          <div className="mb-6 space-y-4">
            <div className="flex flex-wrap items-end gap-4">
              <div className="min-w-[220px] flex-1 sm:max-w-xs">
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Search
                </label>
                <input
                  type="text"
                  placeholder="Project name or code..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                />
              </div>
              <div className="w-full min-w-[140px] sm:w-40">
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Type
                </label>
                <select
                  className={selectClass}
                  value={typeFilter}
                  onChange={(e) => {
                    setTypeFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="">All types</option>
                  {PROJECT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-full min-w-[140px] sm:w-40">
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Status
                </label>
                <select
                  className={selectClass}
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="">All statuses</option>
                  {PROJECT_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-full min-w-[160px] sm:w-48">
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Client
                </label>
                <select
                  className={selectClass}
                  value={clientFilter}
                  onChange={(e) => {
                    setClientFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="">All clients</option>
                  {MOCK_CLIENTS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Showing {pageItems.length} of {total} project{total !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-white/[0.05]">
            <div className="max-w-full overflow-x-auto">
              <Table>
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                  <TableRow>
                    <TableCell
                      isHeader
                      className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                    >
                      Project Name
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                    >
                      Client
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                    >
                      Project Code
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                    >
                      Type
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                    >
                      Location
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                    >
                      Status
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 text-end text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                    >
                      Contract Value
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                    >
                      Start Date
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 text-start text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                    >
                      End Date
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 text-end text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                    >
                      Budget
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {pageItems.length === 0 ? (
                    <TableRow>
                      <td
                        colSpan={10}
                        className="px-5 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                      >
                        No projects match your filters.
                      </td>
                    </TableRow>
                  ) : (
                    pageItems.map((project: Project) => (
                      <tr
                        key={project.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => handleRowClick(project)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleRowClick(project);
                          }
                        }}
                        className="cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.03] divide-y divide-gray-100 dark:divide-white/[0.05]"
                      >
                        <TableCell className="px-5 py-4 text-start text-theme-sm font-medium text-gray-800 dark:text-white/90">
                          {project.projectName}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-600 dark:text-gray-400">
                          {project.client.name}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-600 dark:text-gray-400">
                          {project.projectCode}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-600 dark:text-gray-400">
                          {formatType(project.type)}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-600 dark:text-gray-400">
                          {project.location}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-start">
                          <Badge size="sm" color={getStatusBadgeColor(project.status)}>
                            {PROJECT_STATUSES.find((s) => s.value === project.status)?.label ?? project.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-5 py-4 text-end text-theme-sm text-gray-600 dark:text-gray-400 tabular-nums">
                          {project.contractValue != null ? formatBudget(project.contractValue) : "—"}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-600 dark:text-gray-400">
                          {formatDate(project.startDate)}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-600 dark:text-gray-400">
                          {formatDate(project.endDate)}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-end text-theme-sm text-gray-600 dark:text-gray-400 tabular-nums">
                          {formatBudget(project.budget)}
                        </TableCell>
                      </tr>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Pagination */}
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

      <ProjectViewModal
        project={selectedProject}
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedProject(null);
        }}
        onUpdateProject={handleUpdateProject}
        onAddComment={handleAddComment}
        onEdit={(project) => {
          setSelectedProject(null);
          setIsViewModalOpen(false);
          setProjectToEdit(project);
          setIsCreateModalOpen(true);
        }}
      />
      <ProjectCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setProjectToEdit(null);
        }}
        clients={MOCK_CLIENTS}
        onCreate={handleCreateProject}
        project={projectToEdit}
        onUpdate={handleUpdateProject}
      />
    </div>
  );
}
