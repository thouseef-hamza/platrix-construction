"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import Label from "@/components/form/Label";
import DatePicker from "@/components/form/date-picker";
import type { Employee, Gender, MaritalStatus } from "@/types/employee";

const inputClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800";
const selectClass = inputClass;

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

const MARITAL_OPTIONS: { value: MaritalStatus; label: string }[] = [
  { value: "single", label: "Single" },
  { value: "married", label: "Married" },
  { value: "divorced", label: "Divorced" },
  { value: "widowed", label: "Widowed" },
];

interface EmployeeCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: Omit<Employee, "id">) => void;
}

export default function EmployeeCreateModal({
  isOpen,
  onClose,
  onCreate,
}: EmployeeCreateModalProps) {
  const [fullName, setFullName] = useState("");
  const [nationality, setNationality] = useState("");
  const [gender, setGender] = useState<Gender | "">("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [maritalStatus, setMaritalStatus] = useState<MaritalStatus | "">("");

  const resetForm = () => {
    setFullName("");
    setNationality("");
    setGender("");
    setDateOfBirth("");
    setMaritalStatus("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (fullName.trim().length < 2) return;
    onCreate({
      fullName: fullName.trim(),
      nationality: nationality.trim() || undefined,
      gender: gender || undefined,
      dateOfBirth: dateOfBirth || undefined,
      maritalStatus: maritalStatus || undefined,
    });
    resetForm();
    onClose();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const nameError = fullName.length > 0 && fullName.trim().length < 2;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      className="max-w-[95vw] w-full mx-4 max-h-[90vh] overflow-y-auto"
    >
      <form onSubmit={handleSubmit} className="p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Add Employee
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Create an employee with basic details. You can add identification, employment, salary, and more from the employee view.
        </p>

        <section>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
            Basic Identity
          </h3>
          <div className="space-y-4">
            <div>
              <Label>Full name <span className="text-error-500">*</span></Label>
              <input
                type="text"
                className={inputClass + (nameError ? " border-error-500" : "")}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Ahmed Mohammed Ali"
                required
                minLength={2}
              />
              {nameError && (
                <p className="mt-1 text-xs text-error-600 dark:text-error-400">
                  Enter at least 2 characters
                </p>
              )}
            </div>
            <div>
              <Label>Nationality (optional)</Label>
              <input
                type="text"
                className={inputClass}
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
                placeholder="e.g. Qatari"
              />
            </div>
            <div>
              <Label>Gender (optional)</Label>
              <select
                className={selectClass}
                value={gender}
                onChange={(e) => setGender(e.target.value as Gender | "")}
              >
                <option value="">Select</option>
                {GENDER_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <DatePicker
                id="employee-dob-create"
                label="Date of birth (optional)"
                placeholder="Select date"
                value={dateOfBirth}
                onChange={(_, dateStr) => setDateOfBirth(dateStr ?? "")}
              />
            </div>
            <div>
              <Label>Marital status (optional)</Label>
              <select
                className={selectClass}
                value={maritalStatus}
                onChange={(e) => setMaritalStatus(e.target.value as MaritalStatus | "")}
              >
                <option value="">Select</option>
                {MARITAL_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={fullName.trim().length < 2}
            className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 disabled:opacity-50 disabled:pointer-events-none"
          >
            Create Employee
          </button>
        </div>
      </form>
    </Modal>
  );
}
