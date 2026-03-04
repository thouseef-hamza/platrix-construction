export const PROJECT_TYPES = [
  { value: "residential", label: "Residential" },
  { value: "commercial", label: "Commercial" },
  { value: "infrastructure", label: "Infrastructure" },
  { value: "industrial", label: "Industrial" },
  { value: "renovation", label: "Renovation" },
] as const;

export const PROJECT_STATUSES = [
  { value: "planning", label: "Planning" },
  { value: "active", label: "Active" },
  { value: "onhold", label: "On Hold" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
] as const;

export type ProjectType = (typeof PROJECT_TYPES)[number]["value"];
export type ProjectStatus = (typeof PROJECT_STATUSES)[number]["value"];

export interface ClientOption {
  id: string;
  name: string;
}

export interface ProjectAttachment {
  name: string;
  /** Optional URL for document preview (e.g. from storage). */
  url?: string;
  /** Optional filename (e.g. "file.pdf") for type detection when name has no extension. */
  filename?: string;
  /** Optional: for direct download from preview (API download endpoint). */
  projectId?: number;
  documentId?: number;
}

export type ProjectActivityType =
  | "created"
  | "document_uploaded"
  | "status_changed"
  | "comment"
  | "updated";

export interface ProjectComment {
  id: string;
  userId: string;
  userName: string;
  message: string;
  createdAt: string;
}

export interface ProjectActivity {
  id: string;
  type: ProjectActivityType;
  description: string;
  createdAt: string;
  userName?: string;
}

export interface Project {
  id: string;
  projectName: string;
  client: ClientOption;
  projectCode: string;
  type: ProjectType;
  location: string;
  status: ProjectStatus;
  budget: number;
  contractValue?: number;
  startDate?: string;
  endDate?: string;
  attachments?: ProjectAttachment[];
  comments?: ProjectComment[];
  activities?: ProjectActivity[];
}
