"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import Label from "@/components/form/Label";
import DatePicker from "@/components/form/date-picker";
import type { Employee } from "@/types/employee";

const inputClass =
  "h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800";

const ROLE_OPTIONS = [
  "Accountant",
  "Project Manager",
  "Site Engineer",
  "Foreman",
  "HR Manager",
  "Admin",
  "Operations",
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
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [position, setPosition] = useState("");
  // Personal (optional)
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [nationality, setNationality] = useState("");
  const [qatarDocuments, setQatarDocuments] = useState("");
  const [passportExpiry, setPassportExpiry] = useState("");
  const [visaExpiry, setVisaExpiry] = useState("");
  const [qidExpiry, setQidExpiry] = useState("");
  // Employment
  const [joinDate, setJoinDate] = useState("");
  const [salary, setSalary] = useState("");
  const [department, setDepartment] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [status, setStatus] = useState<"active" | "inactive">("active");

  const resetForm = () => {
    setEmail("");
    setName("");
    setPosition("");
    setDateOfBirth("");
    setPhone("");
    setAddress("");
    setNationality("");
    setQatarDocuments("");
    setPassportExpiry("");
    setVisaExpiry("");
    setQidExpiry("");
    setJoinDate("");
    setSalary("");
    setDepartment("");
    setBankAccount("");
    setStatus("active");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 8) return;
    if (!email.trim() || !position) return;
    const salaryNum = parseFloat(salary) || 0;
    onCreate({
      name: name.trim(),
      email: email.trim(),
      position: position.trim(),
      phone: phone.trim() || undefined,
      department: department.trim() || "—",
      joinDate: joinDate || new Date().toISOString().slice(0, 10),
      salary: salaryNum,
      currency: "QAR",
      bankAccount: bankAccount.trim() || undefined,
      status,
      dateOfBirth: dateOfBirth || undefined,
      address: address.trim() || undefined,
      nationality: nationality.trim() || undefined,
      qatarDocuments: qatarDocuments.trim() || undefined,
      passportExpiry: passportExpiry || undefined,
      visaExpiry: visaExpiry || undefined,
      qidExpiry: qidExpiry || undefined,
    });
    resetForm();
    onClose();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const nameError = name.length > 0 && name.trim().length < 8;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      className="max-w-xl mx-4 max-h-[90vh] overflow-y-auto"
    >
      <form onSubmit={handleSubmit} className="p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Add Employee
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Register a new employee with email, name, and role.
        </p>

        {/* Register */}
        <section className="mb-8">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
            Account
          </h3>
          <div className="space-y-4">
            <div>
              <Label>Email</Label>
              <input
                type="email"
                className={inputClass}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                required
              />
            </div>
            <div>
              <Label>Full name (min 8 characters)</Label>
              <input
                type="text"
                className={inputClass + (nameError ? " border-red-500" : "")}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                minLength={8}
                required
              />
              {nameError && (
                <p className="mt-1 text-xs text-red-500">Min 8 characters</p>
              )}
            </div>
            <div>
              <Label>Role</Label>
              <select
                className={inputClass}
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                required
              >
                <option value="">Select role</option>
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Personal - Optional */}
        <section className="mb-8">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Personal
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            Optional
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <DatePicker
                id="employee-dob"
                label="Date of birth"
                placeholder="Select date"
                value={dateOfBirth}
                onChange={(_, dateStr) => setDateOfBirth(dateStr ?? "")}
              />
            </div>
            <div>
              <Label>Phone</Label>
              <input
                type="text"
                className={inputClass}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Optional"
              />
            </div>
            <div className="sm:col-span-2">
              <Label>Address</Label>
              <input
                type="text"
                className={inputClass}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Optional"
              />
            </div>
            <div>
              <Label>Nationality</Label>
              <input
                type="text"
                className={inputClass}
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
                placeholder="Optional"
              />
            </div>
            <div>
              <Label>Qatar documents</Label>
              <input
                type="text"
                className={inputClass}
                value={qatarDocuments}
                onChange={(e) => setQatarDocuments(e.target.value)}
                placeholder="Optional"
              />
            </div>
            <div>
              <DatePicker
                id="employee-passport-expiry"
                label="Passport expiry"
                placeholder="Select date"
                value={passportExpiry}
                onChange={(_, dateStr) => setPassportExpiry(dateStr ?? "")}
              />
            </div>
            <div>
              <DatePicker
                id="employee-visa-expiry"
                label="Visa expiry"
                placeholder="Select date"
                value={visaExpiry}
                onChange={(_, dateStr) => setVisaExpiry(dateStr ?? "")}
              />
            </div>
            <div>
              <DatePicker
                id="employee-qid-expiry"
                label="QID expiry"
                placeholder="Select date"
                value={qidExpiry}
                onChange={(_, dateStr) => setQidExpiry(dateStr ?? "")}
              />
            </div>
          </div>
        </section>

        {/* Employment */}
        <section className="mb-8">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
            Employment
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <DatePicker
                id="employee-join-date"
                label="Join date"
                placeholder="Select date"
                value={joinDate}
                onChange={(_, dateStr) => setJoinDate(dateStr ?? "")}
              />
            </div>
            <div>
              <Label>Salary (QAR)</Label>
              <input
                type="number"
                min={0}
                step="0.01"
                className={inputClass}
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                placeholder="Optional"
              />
            </div>
            <div>
              <Label>Department</Label>
              <input
                type="text"
                className={inputClass}
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Optional"
              />
            </div>
            <div>
              <Label>Bank account</Label>
              <input
                type="text"
                className={inputClass}
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
                placeholder="Optional"
              />
            </div>
            <div className="sm:col-span-2">
              <Label>Status</Label>
              <select
                className={inputClass}
                value={status}
                onChange={(e) => setStatus(e.target.value as "active" | "inactive")}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </section>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={name.trim().length < 8 || !email.trim() || !position}
            className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600 disabled:opacity-50 disabled:pointer-events-none"
          >
            Register Employee
          </button>
        </div>
      </form>
    </Modal>
  );
}
