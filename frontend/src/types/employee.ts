/** Sponsorship type: 0 = Company, 1 = Family, 2 = Transfer */
export type SponsorshipType = 0 | 1 | 2;

/** Employment type: 0 = Permanent, 1 = Contract, 2 = Temporary */
export type EmploymentType = 0 | 1 | 2;

/** Employment status: 0 = Active, 1 = On Leave, 2 = Terminated */
export type EmploymentStatus = 0 | 1 | 2;

export type Gender = "male" | "female" | "other";
export type MaritalStatus = "single" | "married" | "divorced" | "widowed";

export interface Employee {
  id: string;

  // Basic Identity
  fullName: string;
  nationality?: string;
  gender?: Gender;
  dateOfBirth?: string;
  maritalStatus?: MaritalStatus;

  // Identification
  qidNumber?: string;
  qidExpiryDate?: string;
  passportNumber?: string;
  passportExpiryDate?: string;
  visaNumber?: string;
  visaExpiryDate?: string;
  sponsorshipType?: SponsorshipType;

  // Employment
  employeeId?: string; // internal ID
  joiningDate?: string;
  employmentType?: EmploymentType;
  jobTitle?: string;
  department?: string;
  employmentStatus?: EmploymentStatus;

  // Salary structure
  basicSalary?: number;
  housingAllowance?: number;
  transportationAllowance?: number;
  otherAllowances?: number;

  // Bank & WPS
  bankName?: string;
  iban?: string;

  // Medical & Insurance
  healthCardNumber?: string;
  healthInsurancePolicy?: string;
  insuranceExpiry?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;

  // Documents (list of attachment names or refs)
  documents?: { id: string; name: string }[];

  // From API: salary management entries
  salaryEntries?: EmployeeSalaryEntry[];
  // From API: company–employee transactions
  transactions?: EmployeeTransaction[];
}

export interface EmployeeSalaryEntry {
  id: number;
  date: string;
  amount: number;
  description: string;
  createdAt?: string;
}

export interface EmployeeTransaction {
  id: number;
  date: string;
  amount: number;
  description: string;
  transactionType: string;
  reference: string;
  createdAt?: string;
}

/** Labels for dropdowns / display */
export const SPONSORSHIP_LABELS: Record<SponsorshipType, string> = {
  0: "Company",
  1: "Family",
  2: "Transfer",
};

export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  0: "Permanent",
  1: "Contract",
  2: "Temporary",
};

export const EMPLOYMENT_STATUS_LABELS: Record<EmploymentStatus, string> = {
  0: "Active",
  1: "On Leave",
  2: "Terminated",
};
