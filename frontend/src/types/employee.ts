export type SalaryEntryType = "regular" | "bonus" | "adjustment";

export interface SalaryEntry {
  id: string;
  effectiveDate: string;
  amount: number;
  type: SalaryEntryType;
  notes?: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone?: string;
  department: string;
  position: string; // role
  joinDate: string;
  salary: number;
  currency?: string;
  bankAccount?: string;
  status: "active" | "inactive";
  salaryEntries?: SalaryEntry[];
  // Personal (optional)
  dateOfBirth?: string;
  address?: string;
  nationality?: string;
  qatarDocuments?: string;
  passportExpiry?: string;
  visaExpiry?: string;
  qidExpiry?: string;
}
