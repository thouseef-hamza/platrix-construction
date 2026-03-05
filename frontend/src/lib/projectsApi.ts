import type {
  ClientOption,
  Project,
  ProjectStatus,
  ProjectType,
} from "@/types/project";
import { api } from "./api";

// Backend: 0=Residential, 1=Commercial, 2=Infrastructure, 3=Renovation, 4=Industrial
const PROJECT_TYPE_TO_BACKEND: Record<ProjectType, number> = {
  residential: 0,
  commercial: 1,
  infrastructure: 2,
  renovation: 3,
  industrial: 4,
};
const BACKEND_TO_PROJECT_TYPE: Record<number, ProjectType> = {
  0: "residential",
  1: "commercial",
  2: "infrastructure",
  3: "renovation",
  4: "industrial",
};

// Backend: 0=Planning, 1=Active, 2=On Hold, 3=Completed, 4=Cancelled
const PROJECT_STATUS_TO_BACKEND: Record<ProjectStatus, number> = {
  planning: 0,
  active: 1,
  onhold: 2,
  completed: 3,
  cancelled: 4,
};
const BACKEND_TO_PROJECT_STATUS: Record<number, ProjectStatus> = {
  0: "planning",
  1: "active",
  2: "onhold",
  3: "completed",
  4: "cancelled",
};

export interface ApiProject {
  id: number;
  account: number;
  name: string;
  code: string;
  client: number | null;
  client_name: string | null;
  project_type: number;
  project_type_display?: string;
  status: number;
  status_display?: string;
  location: string;
  contract_value: string;
  budget: string;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

function apiProjectToProject(api: ApiProject): Project {
  const client: ClientOption =
    api.client != null
      ? { id: String(api.client), name: api.client_name ?? "—" }
      : { id: "", name: api.client_name ?? "—" };
  return {
    id: String(api.id),
    projectName: api.name,
    projectCode: api.code,
    client,
    type: BACKEND_TO_PROJECT_TYPE[api.project_type] ?? "commercial",
    status: BACKEND_TO_PROJECT_STATUS[api.status] ?? "planning",
    location: api.location ?? "",
    budget: parseFloat(api.budget) || 0,
    contractValue:
      api.contract_value != null ? parseFloat(api.contract_value) : undefined,
    startDate: api.start_date ?? undefined,
    endDate: api.end_date ?? undefined,
  };
}

export async function fetchProjects(): Promise<Project[]> {
  const { data } = await api.get<ApiProject[]>("/projects/");
  return (data ?? []).map(apiProjectToProject);
}

export async function getProject(id: number): Promise<Project | null> {
  const { data } = await api.get<ApiProject>(`/projects/${id}/`);
  return data ? apiProjectToProject(data) : null;
}

export interface CreateProjectPayload {
  name: string;
  code: string;
  client: number | null;
  project_type: ProjectType;
  status: ProjectStatus;
  location: string;
  contract_value: number;
  budget: number;
  start_date: string | null;
  end_date: string | null;
}

export async function createProject(
  payload: CreateProjectPayload
): Promise<Project> {
  const { data } = await api.post<ApiProject>("/projects/", {
    name: payload.name.trim(),
    code: payload.code.trim(),
    client: payload.client ?? null,
    project_type: PROJECT_TYPE_TO_BACKEND[payload.project_type],
    status: PROJECT_STATUS_TO_BACKEND[payload.status],
    location: payload.location.trim(),
    contract_value: String(payload.contract_value),
    budget: String(payload.budget),
    start_date: payload.start_date || null,
    end_date: payload.end_date || null,
  });
  return apiProjectToProject(data);
}

export interface UpdateProjectPayload {
  name?: string;
  code?: string;
  client?: number | null;
  project_type?: ProjectType;
  status?: ProjectStatus;
  location?: string;
  contract_value?: number;
  budget?: number;
  start_date?: string | null;
  end_date?: string | null;
}

export async function updateProject(
  id: number,
  payload: UpdateProjectPayload
): Promise<Project> {
  const body: Record<string, unknown> = {};
  if (payload.name !== undefined) body.name = payload.name.trim();
  if (payload.code !== undefined) body.code = payload.code.trim();
  if (payload.client !== undefined) body.client = payload.client ?? null;
  if (payload.project_type !== undefined)
    body.project_type = PROJECT_TYPE_TO_BACKEND[payload.project_type];
  if (payload.status !== undefined)
    body.status = PROJECT_STATUS_TO_BACKEND[payload.status];
  if (payload.location !== undefined) body.location = payload.location.trim();
  if (payload.contract_value !== undefined)
    body.contract_value = String(payload.contract_value);
  if (payload.budget !== undefined) body.budget = String(payload.budget);
  if (payload.start_date !== undefined)
    body.start_date = payload.start_date || null;
  if (payload.end_date !== undefined) body.end_date = payload.end_date || null;

  const { data } = await api.patch<ApiProject>(`/projects/${id}/`, body);
  return apiProjectToProject(data);
}

// --- Project documents (list + upload) ---

export interface ProjectDocument {
  id: number;
  name: string;
  filename: string;
  file_url: string;
  size: number | null;
  description: string;
  created_at: string;
}

export async function fetchProjectDocuments(
  projectId: number
): Promise<ProjectDocument[]> {
  const { data } = await api.get<ProjectDocument[]>(
    `/projects/${projectId}/documents/`
  );
  return data ?? [];
}

export async function uploadProjectDocument(
  projectId: number,
  file: File,
  options?: { name?: string; description?: string }
): Promise<ProjectDocument> {
  const form = new FormData();
  form.append("file", file);
  if (options?.name?.trim()) form.append("name", options.name.trim());
  if (options?.description?.trim())
    form.append("description", options.description.trim());
  const { data } = await api.post<ProjectDocument>(
    `/projects/${projectId}/documents/`,
    form,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );
  return data;
}

export async function deleteProjectDocument(
  projectId: number,
  documentId: number
): Promise<void> {
  await api.delete(`/projects/${projectId}/documents/${documentId}/`);
}

// --- Project financial summary ---

export interface ProjectFinancialTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: "income" | "expense";
}

export interface ProjectFinancialSummary {
  income: number;
  expense: number;
  variation: number;
  transactions: ProjectFinancialTransaction[];
}

export async function fetchProjectFinancials(
  projectId: number
): Promise<ProjectFinancialSummary> {
  const { data } = await api.get<ProjectFinancialSummary>(
    `/projects/${projectId}/financial/`
  );
  return data ?? { income: 0, expense: 0, variation: 0, transactions: [] };
}

/** Download a project document as a file (no new tab). Uses API so auth is sent. */
export async function downloadProjectDocument(
  projectId: number,
  documentId: number,
  filename: string
): Promise<void> {
  const { data } = await api.get<Blob>(
    `/projects/${projectId}/documents/${documentId}/download/`,
    { responseType: "blob" }
  );
  const url = URL.createObjectURL(data);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || "document";
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
