"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import Label from "@/components/form/Label";
import DatePicker from "@/components/form/date-picker";
import {
  PROJECT_TYPES,
  PROJECT_STATUSES,
  type Project,
  type ProjectType,
  type ProjectStatus,
  type ClientOption,
} from "@/types/project";

const selectClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 pr-10 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800";
const inputClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800";

interface ProjectCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: ClientOption[];
  onCreate: (project: Omit<Project, "id">) => void;
  /** When provided, modal works in edit mode with prefilled data. */
  project?: Project | null;
  onUpdate?: (projectId: string, data: Partial<Project>) => void;
  isSubmitting?: boolean;
}

export default function ProjectCreateModal({
  isOpen,
  onClose,
  clients,
  onCreate,
  project: projectToEdit,
  onUpdate,
  isSubmitting = false,
}: ProjectCreateModalProps) {
  const [projectName, setProjectName] = useState("");
  const [projectCode, setProjectCode] = useState("");
  const [clientId, setClientId] = useState("");
  const [type, setType] = useState<ProjectType>("commercial");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("planning");
  const [budget, setBudget] = useState("");
  const [contractValue, setContractValue] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const isEditMode = Boolean(projectToEdit && onUpdate);

  useEffect(() => {
    if (!isOpen) return;
    if (projectToEdit) {
      setProjectName(projectToEdit.projectName);
      setProjectCode(projectToEdit.projectCode);
      setClientId(projectToEdit.client.id);
      setType(projectToEdit.type);
      setLocation(projectToEdit.location);
      setStatus(projectToEdit.status);
      setBudget(projectToEdit.budget > 0 ? String(projectToEdit.budget) : "");
      setContractValue(
        projectToEdit.contractValue != null && projectToEdit.contractValue > 0
          ? String(projectToEdit.contractValue)
          : ""
      );
      setStartDate(projectToEdit.startDate ?? "");
      setEndDate(projectToEdit.endDate ?? "");
    } else {
      setProjectName("");
      setProjectCode("");
      setClientId("");
      setType("commercial");
      setLocation("");
      setStatus("planning");
      setBudget("");
      setContractValue("");
      setStartDate("");
      setEndDate("");
    }
  }, [isOpen, projectToEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const client = clientId ? clients.find((c) => c.id === clientId) : null;
    if (!clientId && !isEditMode) return; // require client for create
    const budgetNum = parseFloat(budget) || 0;
    const contractValueNum = parseFloat(contractValue) || 0;
    const clientOption = client ?? { id: "", name: "—" };

    if (isEditMode && projectToEdit) {
      onUpdate!(projectToEdit.id, {
        projectName: projectName.trim() || "Unnamed Project",
        client: clientOption,
        projectCode: projectCode.trim() || "—",
        type,
        location: location.trim() || "—",
        status,
        budget: budgetNum,
        contractValue: contractValueNum || undefined,
        startDate: startDate.trim() || undefined,
        endDate: endDate.trim() || undefined,
      });
    } else {
      onCreate({
        projectName: projectName.trim() || "Unnamed Project",
        client: clientOption,
        projectCode: projectCode.trim() || "—",
        type,
        location: location.trim() || "—",
        status,
        budget: budgetNum,
        contractValue: contractValueNum || undefined,
        startDate: startDate.trim() || undefined,
        endDate: endDate.trim() || undefined,
      });
    }
    setProjectName("");
    setProjectCode("");
    setClientId("");
    setType("commercial");
    setLocation("");
    setStatus("planning");
    setBudget("");
    setContractValue("");
    setStartDate("");
    setEndDate("");
    onClose();
  };

  const handleClose = () => {
    setProjectName("");
    setProjectCode("");
    setClientId("");
    setType("commercial");
    setLocation("");
    setStatus("planning");
    setBudget("");
    setContractValue("");
    setStartDate("");
    setEndDate("");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-2xl mx-4">
      <form onSubmit={handleSubmit} className="p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          {isEditMode ? "Edit Project" : "Create Project"}
        </h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>Project Name</Label>
              <input
                type="text"
                className={inputClass}
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g. Downtown Office Tower"
              />
            </div>
            <div>
              <Label>Project Code</Label>
              <input
                type="text"
                className={inputClass}
                value={projectCode}
                onChange={(e) => setProjectCode(e.target.value)}
                placeholder="e.g. PRJ-2024-001"
              />
            </div>
          </div>
          <div>
            <Label>Client</Label>
            <select
              className={selectClass}
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              required={!isEditMode}
            >
              <option value="">Select client</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>Type</Label>
              <select
                className={selectClass}
                value={type}
                onChange={(e) => setType(e.target.value as ProjectType)}
              >
                {PROJECT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Status</Label>
              <select
                className={selectClass}
                value={status}
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
              >
                {PROJECT_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <Label>Location</Label>
            <input
              type="text"
              className={inputClass}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. New York, NY"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label>Contract Value (QAR)</Label>
              <input
                type="number"
                min={0}
                step={1000}
                className={inputClass}
                value={contractValue}
                onChange={(e) => setContractValue(e.target.value)}
                placeholder="0"
              />
            </div>
            <div>
              <Label>Budget (QAR)</Label>
              <input
                type="number"
                min={0}
                step={1000}
                className={inputClass}
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <DatePicker
                id="project-start-date"
                label="Start Date"
                placeholder="Select date"
                value={startDate}
                onChange={(_, dateStr) => setStartDate(dateStr ?? "")}
              />
            </div>
            <div>
              <DatePicker
                id="project-end-date"
                label="End Date"
                placeholder="Select date"
                value={endDate}
                onChange={(_, dateStr) => setEndDate(dateStr ?? "")}
              />
            </div>
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
            disabled={isSubmitting}
            className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 disabled:opacity-50 disabled:pointer-events-none"
          >
            {isSubmitting
              ? isEditMode
                ? "Saving…"
                : "Creating…"
              : isEditMode
                ? "Save"
                : "Create Project"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
