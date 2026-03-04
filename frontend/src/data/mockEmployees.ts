import type { Employee, SalaryEntry } from "@/types/employee";
import type { EmployeeRef } from "@/types/expense";

const salaryEntries: Record<string, SalaryEntry[]> = {
  emp1: [
    { id: "se1", effectiveDate: "2022-03-15", amount: 15000, type: "regular" },
    { id: "se2", effectiveDate: "2023-04-01", amount: 17000, type: "regular", notes: "Annual review" },
    { id: "se3", effectiveDate: "2024-04-01", amount: 18500, type: "regular", notes: "Promotion" },
  ],
  emp2: [
    { id: "se4", effectiveDate: "2021-08-01", amount: 10000, type: "regular" },
    { id: "se5", effectiveDate: "2023-08-01", amount: 12000, type: "regular" },
  ],
  emp3: [
    { id: "se6", effectiveDate: "2023-01-10", amount: 15000, type: "regular" },
  ],
  emp4: [
    { id: "se7", effectiveDate: "2020-05-20", amount: 12000, type: "regular" },
    { id: "se8", effectiveDate: "2022-06-01", amount: 14000, type: "regular" },
  ],
  emp5: [
    { id: "se9", effectiveDate: "2022-11-01", amount: 9500, type: "regular" },
  ],
};

export const MOCK_EMPLOYEES: Employee[] = [
  {
    id: "emp1",
    name: "Sarah Chen",
    email: "sarah.chen@company.com",
    phone: "+974 1234 5678",
    department: "Operations",
    position: "Project Manager",
    joinDate: "2022-03-15",
    salary: 18500,
    currency: "QAR",
    bankAccount: "QA12XXXX123456789",
    status: "active",
    salaryEntries: salaryEntries.emp1,
  },
  {
    id: "emp2",
    name: "Mike Roberts",
    email: "mike.roberts@company.com",
    phone: "+974 2345 6789",
    department: "Finance",
    position: "Accountant",
    joinDate: "2021-08-01",
    salary: 12000,
    currency: "QAR",
    bankAccount: "QA12XXXX987654321",
    status: "active",
    salaryEntries: salaryEntries.emp2,
  },
  {
    id: "emp3",
    name: "James Wilson",
    email: "james.wilson@company.com",
    department: "Site",
    position: "Site Engineer",
    joinDate: "2023-01-10",
    salary: 15000,
    currency: "QAR",
    status: "active",
    salaryEntries: salaryEntries.emp3,
  },
  {
    id: "emp4",
    name: "Emma Davis",
    email: "emma.davis@company.com",
    phone: "+974 3456 7890",
    department: "HR",
    position: "HR Manager",
    joinDate: "2020-05-20",
    salary: 14000,
    currency: "QAR",
    status: "active",
    salaryEntries: salaryEntries.emp4,
  },
  {
    id: "emp5",
    name: "Omar Hassan",
    email: "omar.hassan@company.com",
    department: "Operations",
    position: "Foreman",
    joinDate: "2022-11-01",
    salary: 9500,
    currency: "QAR",
    status: "active",
    salaryEntries: salaryEntries.emp5,
  },
];

/** For dropdowns (expense, etc.) - compatible with EmployeeRef */
export const MOCK_EMPLOYEE_REFS: EmployeeRef[] = MOCK_EMPLOYEES.map((e) => ({
  id: e.id,
  name: e.name,
}));
